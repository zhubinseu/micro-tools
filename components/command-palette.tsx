'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Home,
  Wrench,
  Github,
  Moon,
  Sun,
  Monitor,
  Braces,
  Sparkles,
  CornerDownRight,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import { TOOL_REGISTRY, TOOL_CATEGORIES, type ToolMeta } from '@/lib/registry';
import { resolveIcon } from '@/components/icon-resolver';
import { trackCommandPaletteUsed, trackThemeToggled } from '@/lib/analytics';

// ---------------------------------------------------------------------------
// 轻量模糊匹配（无需第三方库）
// ---------------------------------------------------------------------------

/**
 * 子序列匹配 + 单词边界评分
 * - 查询字符按顺序出现在目标中即视为匹配
 * - 出现在单词边界（开头、空格、连字符后）得分更高
 */
function fuzzyScore(query: string, target: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // 完全匹配最高分
  if (t === q) return 1000;
  // 开头匹配
  if (t.startsWith(q)) return 500;
  // 包含完整子串
  const includeIdx = t.indexOf(q);
  if (includeIdx >= 0) {
    return 200 - includeIdx;
  }

  // 子序列匹配 + 边界加分
  let qi = 0;
  let score = 0;
  let prevChar = ' ';
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // 边界加分：前一字符是空格/连字符/驼峰边界
      if (prevChar === ' ' || prevChar === '-' || prevChar === '_') {
        score += 10;
      } else {
        score += 1;
      }
      qi++;
    }
    prevChar = t[ti];
  }
  // 全部 query 字符都匹配上了
  return qi === q.length ? score : -1;
}

interface ScoredTool {
  tool: ToolMeta;
  score: number;
}

function searchToolsFuzzy(query: string): ScoredTool[] {
  if (!query.trim()) {
    return TOOL_REGISTRY.map((tool) => ({ tool, score: 1 }));
  }
  const results: ScoredTool[] = [];
  for (const tool of TOOL_REGISTRY) {
    // 组合可搜索文本：name + id + description + keywords + 分类标签
    const haystack = [
      tool.name,
      tool.id,
      tool.description,
      tool.keywords.join(' '),
      TOOL_CATEGORIES[tool.category].label,
    ].join(' ');

    const score = fuzzyScore(query, haystack);
    if (score >= 0) {
      results.push({ tool, score });
    }
  }
  // 按分数降序
  results.sort((a, b) => b.score - a.score);
  return results;
}

// ---------------------------------------------------------------------------
// JSON 检测（Smart Paste 识别）
// ---------------------------------------------------------------------------

function tryParseJson(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  // 快速首尾字符检查
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  const isObjectLike =
    (first === '{' && last === '}') || (first === '[' && last === ']');
  if (!isObjectLike) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [search, setSearch] = React.useState('');

  // 打开时清空搜索
  React.useEffect(() => {
    if (open) setSearch('');
  }, [open]);

  // ---- 导航辅助 ----
  const navigate = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  // ---- 带 JSON 预填跳转到 JSON 格式化工具 ----
  const navigateToJsonWithContent = React.useCallback(
    (jsonContent: string) => {
      onOpenChange(false);
      // 用 hash 携带内容，JSON 工具会读取并预填
      router.push(`/tools/json-formatter#json=${encodeURIComponent(jsonContent)}`);
    },
    [onOpenChange, router],
  );

  // ---- 搜索结果 ----
  const scoredResults = React.useMemo(
    () => searchToolsFuzzy(search),
    [search],
  );

  // 按分类分组
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, ToolMeta[]> = {};
    for (const { tool } of scoredResults) {
      if (!groups[tool.category]) groups[tool.category] = [];
      groups[tool.category].push(tool);
    }
    return groups;
  }, [scoredResults]);

  // ---- Smart Paste JSON 识别 ----
  const isJsonDetected = React.useMemo(
    () => tryParseJson(search),
    [search],
  );

  // ---- 处理选中项 ----
  const handleSelect = React.useCallback(
    (value: string) => {
      if (value.startsWith('navigate:')) {
        navigate(value.slice('navigate:'.length));
        return;
      }
      if (value.startsWith('theme:')) {
        const themeName = value.slice('theme:'.length);
        setTheme(themeName);
        trackThemeToggled(themeName);
        onOpenChange(false);
        return;
      }
      if (value.startsWith('json-format:')) {
        const content = value.slice('json-format:'.length);
        navigateToJsonWithContent(content);
        return;
      }
      if (value.startsWith('tool:')) {
        const toolId = value.slice('tool:'.length);
        trackCommandPaletteUsed(toolId);
        navigate(`/tools/${toolId}`);
        return;
      }
    },
    [navigate, navigateToJsonWithContent, onOpenChange, setTheme],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="搜索工具、页面，或粘贴 JSON 自动识别..."
      />
      <CommandList>
        <CommandEmpty>
          {search ? `未找到与"${search}"匹配的结果` : '开始输入以搜索...'}
        </CommandEmpty>

        {/* ===== Smart Paste: JSON 识别 ===== */}
        {isJsonDetected && (
          <CommandGroup heading="智能识别">
            <CommandItem
              value={`json-format:${search}`}
              onSelect={handleSelect}
              className="gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
                <Braces className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">
                  使用 JSON 格式化工具处理
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  <Sparkles className="mr-1 inline h-3 w-3 text-amber-500" />
                  检测到有效 JSON（{search.trim().length} 字符）
                </span>
              </div>
              <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground" />
            </CommandItem>
          </CommandGroup>
        )}

        {/* ===== 工具搜索结果（按分类分组） ===== */}
        {Object.keys(groupedResults).length > 0 && (
          <>
            {isJsonDetected && <CommandSeparator />}
            {Object.entries(groupedResults).map(([category, tools]) => {
              const cat = TOOL_CATEGORIES[category as keyof typeof TOOL_CATEGORIES];
              const Icon = tools[0] ? resolveIcon(tools[0].icon) : null;
              return (
                <CommandGroup
                  key={category}
                  heading={cat?.label ?? category}
                >
                  {tools.map((tool) => {
                    const ToolIcon = resolveIcon(tool.icon);
                    return (
                      <CommandItem
                        key={tool.id}
                        value={`tool:${tool.id}`}
                        onSelect={handleSelect}
                        className="gap-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <ToolIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">
                            {tool.name}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {tool.description}
                          </span>
                        </div>
                        <CommandShortcut>↵</CommandShortcut>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </>
        )}

        {/* ===== 页面导航（仅无搜索或搜索词很短时显示） ===== */}
        {(!search || search.length <= 1) && (
          <>
            <CommandSeparator />
            <CommandGroup heading="页面导航">
              <CommandItem
                value="navigate:/"
                onSelect={handleSelect}
                className="gap-3"
              >
                <Home className="h-4 w-4 text-muted-foreground" />
                <span>首页</span>
                <CommandShortcut>Home</CommandShortcut>
              </CommandItem>
              <CommandItem
                value="navigate:/tools"
                onSelect={handleSelect}
                className="gap-3"
              >
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span>工具集</span>
                <CommandShortcut>Tools</CommandShortcut>
              </CommandItem>
              <CommandItem
                value="navigate:https://github.com/zhubinseu/micro-tools"
                onSelect={(v) => {
                  onOpenChange(false);
                  window.open(
                    'https://github.com/zhubinseu/micro-tools',
                    '_blank',
                    'noopener,noreferrer',
                  );
                }}
                className="gap-3"
              >
                <Github className="h-4 w-4 text-muted-foreground" />
                <span>GitHub 仓库</span>
                <CommandShortcut>↗</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            {/* ===== 主题切换 ===== */}
            <CommandGroup heading="主题">
              <CommandItem
                value="theme:light"
                onSelect={handleSelect}
                className="gap-3"
              >
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span>切换到浅色主题</span>
              </CommandItem>
              <CommandItem
                value="theme:dark"
                onSelect={handleSelect}
                className="gap-3"
              >
                <Moon className="h-4 w-4 text-muted-foreground" />
                <span>切换到深色主题</span>
              </CommandItem>
              <CommandItem
                value="theme:system"
                onSelect={handleSelect}
                className="gap-3"
              >
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span>跟随系统主题</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// ---------------------------------------------------------------------------
// 全局键盘快捷键监听 Hook
// ---------------------------------------------------------------------------

/**
 * 监听 Cmd+K / Ctrl+K 切换命令面板
 */
export function useCommandPaletteShortcut(
  open: boolean,
  setOpen: (v: boolean) => void,
) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K (macOS) 或 Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(!open);
      }
      // Escape 关闭（cmdk 自身已处理，这里做兜底）
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [open, setOpen]);
}

// ---------------------------------------------------------------------------
// 顶层 Provider 组件：管理状态 + 绑定快捷键
// ---------------------------------------------------------------------------

/**
 * CommandPaletteProvider
 *
 * 放置在 layout.tsx 中，全局监听 Cmd+K / Ctrl+K 唤起命令面板。
 * 暴露 context 供其它组件（如 header 按钮）控制面板开关。
 */
const CommandPaletteContext = React.createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
} | null>(null);

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const toggle = React.useCallback(() => setOpen((v) => !v), []);

  useCommandPaletteShortcut(open, setOpen);

  const ctx = React.useMemo(
    () => ({ open, setOpen, toggle }),
    [open, toggle],
  );

  return (
    <CommandPaletteContext.Provider value={ctx}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </CommandPaletteContext.Provider>
  );
}

/**
 * 获取命令面板控制权（用于在 Header 中放一个触发按钮）
 */
export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error(
      'useCommandPalette 必须在 CommandPaletteProvider 内部使用',
    );
  }
  return ctx;
}
