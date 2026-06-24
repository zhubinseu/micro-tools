'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import {
  Trash2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Star,
  History,
  X,
  Clock,
  ArrowUpLeft,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WorkspacePanel } from '@/components/workspace-panel';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { useToolHistory, type HistoryEntry } from '@/hooks/use-tool-history';
import { useToolStore } from '@/store';
import { getToolById, type ToolMeta } from '@/lib/registry';

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

export interface WorkspaceController {
  /** 当前输入值（受控） */
  input: string;
  /** 设置输入值 */
  setInput: (v: string) => void;
  /** 当前输出值 */
  output: string;
  /** 设置输出值 */
  setOutput: (v: string) => void;
  /** 清空输入 */
  clearInput: () => void;
  /** 清空输出 */
  clearOutput: () => void;
  /** 提交一次操作到历史记录 */
  commitHistory: (entry: { input: string; output: string; label?: string }) => void;
}

interface WorkspaceProps {
  /** 工具 id（对应 ToolMeta.id） */
  toolId: string;
  /**
   * 子节点可以是：
   *   1. 渲染函数：(controller) => ReactNode —— 推荐，可调用清空/提交历史等 API
   *   2. 普通 ReactNode —— 兼容模式，Workspace 仅提供外壳
   */
  children:
    | React.ReactNode
    | ((controller: WorkspaceController) => React.ReactNode);
  /** 输入面板标题，默认 "输入" */
  inputTitle?: string;
  /** 输出面板标题，默认 "输出" */
  outputTitle?: string;
  /** 输入面板占位提示（无输入时显示） */
  inputPlaceholder?: string;
  /** 输出面板占位提示（无输出时显示） */
  outputPlaceholder?: string;
  /** 是否启用分栏布局。默认 true；设为 false 则单列堆叠 */
  splitView?: boolean;
  /** 输入区是否使用 monospace 字体 */
  inputMono?: boolean;
  /** 输出区是否使用 monospace 字体 */
  outputMono?: boolean;
  /** 自定义输入渲染（覆盖默认 textarea） */
  renderInput?: (controller: WorkspaceController) => React.ReactNode;
  /** 自定义输出渲染（覆盖默认 pre 展示） */
  renderOutput?: (controller: WorkspaceController) => React.ReactNode;
  /** 当前操作模式标签，用于历史记录区分（如 "encode" / "decode"） */
  modeLabel?: string;
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

/**
 * Workspace - 统一工具工作区
 *
 * 提供所有工具共享的交互外壳：
 *   - 响应式两栏布局（桌面左右分栏，移动端上下堆叠）
 *   - 全局工具栏：清空输入 / 复制输出 / 切换全屏 / 收藏
 *   - 本地历史记录抽屉（localStorage 持久化，最近 5 条）
 *   - 无障碍：ARIA 标签、键盘可达、role 语义
 *   - 流畅过渡：Tailwind 动画
 *
 * 使用方式（推荐）：
 * ```tsx
 * <Workspace toolId="base64-codec" modeLabel="encode">
 *   {({ input, setInput, output, setOutput, commitHistory }) => (
 *     <>
 *       <textarea value={input} onChange={(e) => setInput(e.target.value)} />
 *       <button onClick={() => { const out = encode(input); setOutput(out); commitHistory({ input, output: out }); }}>
 *         编码
 *       </button>
 *       <output>{output}</output>
 *     </>
 *   )}
 * </Workspace>
 * ```
 */
export function Workspace({
  toolId,
  children,
  inputTitle = '输入',
  outputTitle = '输出',
  inputPlaceholder = '在此输入内容...',
  outputPlaceholder = '结果将在此显示...',
  splitView = true,
  inputMono = true,
  outputMono = true,
  renderInput,
  renderOutput,
  modeLabel,
}: WorkspaceProps) {
  const tool: ToolMeta | undefined = getToolById(toolId);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 状态
  const [input, setInputState] = React.useState('');
  const [output, setOutputState] = React.useState('');
  const [copied, setCopied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // 外部 hooks
  const { isFullscreen, isSupported: fsSupported, toggle: toggleFullscreen } =
    useFullscreen();
  const { history, addEntry, clear: clearHistory, hasHistory } =
    useToolHistory(toolId);
  const favorites = useToolStore((s) => s.favorites);
  const toggleFavorite = useToolStore((s) => s.toggleFavorite);
  const isFavorite = favorites.includes(toolId);

  // Controller：暴露给子组件的 API
  const controller = React.useMemo<WorkspaceController>(
    () => ({
      input,
      setInput: setInputState,
      output,
      setOutput: setOutputState,
      clearInput: () => setInputState(''),
      clearOutput: () => setOutputState(''),
      commitHistory: (entry) =>
        addEntry({ ...entry, label: modeLabel ?? entry.label }),
    }),
    [input, output, addEntry, modeLabel],
  );

  // ---- 工具栏动作 ----
  const handleClearInput = useCallback(() => {
    setInputState('');
    // 聚焦回输入区，提升键盘体验
    const textarea = containerRef.current?.querySelector<HTMLTextAreaElement>(
      '[data-workspace-input="true"]',
    );
    textarea?.focus();
  }, []);

  const handleCopyOutput = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板权限拒绝，静默
    }
  }, [output]);

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite(toolId);
  }, [toolId, toggleFavorite]);

  const handleToggleFullscreen = useCallback(() => {
    toggleFullscreen(containerRef.current);
  }, [toggleFullscreen]);

  const handleRestoreHistory = useCallback((entry: HistoryEntry) => {
    setInputState(entry.input);
    setOutputState(entry.output);
    setHistoryOpen(false);
  }, []);

  // ---- 布局类名 ----
  // 桌面端：splitView 为 true 时左右分栏，否则单列
  // 移动端：始终上下堆叠
  const layoutClass = splitView
    ? 'grid grid-cols-1 lg:grid-cols-2 lg:gap-4'
    : 'flex flex-col gap-4';

  // 全屏时撑满视口
  const containerClass = cn(
    'flex flex-col gap-3',
    isFullscreen && 'fixed inset-0 z-50 bg-background p-4 animate-scale-in',
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div ref={containerRef} className={containerClass}>
        {/* ---------------- 全局工具栏 ---------------- */}
        <Toolbar
          toolName={tool?.name ?? toolId}
          copied={copied}
          hasOutput={!!output}
          hasInput={!!input}
          isFavorite={isFavorite}
          isFullscreen={isFullscreen}
          fsSupported={fsSupported}
          historyCount={history.length}
          onClearInput={handleClearInput}
          onCopyOutput={handleCopyOutput}
          onToggleFavorite={handleToggleFavorite}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleHistory={() => setHistoryOpen((v) => !v)}
        />

        {/* ---------------- 历史记录抽屉 ---------------- */}
        {historyOpen && (
          <HistoryDrawer
            history={history}
            toolName={tool?.name ?? toolId}
            onRestore={handleRestoreHistory}
            onClear={clearHistory}
            onClose={() => setHistoryOpen(false)}
          />
        )}

        {/* ---------------- 分栏工作区 ---------------- */}
        <div className={cn('min-h-0 flex-1', layoutClass)}>
          {/* 输入面板 */}
          <WorkspacePanel
            title={inputTitle}
            role="input"
            className="min-h-[200px] lg:min-h-0"
          >
            {renderInput ? (
              renderInput(controller)
            ) : (
              <textarea
                data-workspace-input="true"
                value={input}
                onChange={(e) => setInputState(e.target.value)}
                placeholder={inputPlaceholder}
                aria-label={inputTitle}
                className={cn(
                  'h-full min-h-[200px] w-full resize-none border-0 bg-transparent p-4 text-sm outline-none',
                  'placeholder:text-muted-foreground/60 focus:outline-none',
                  inputMono && 'font-mono',
                )}
              />
            )}
          </WorkspacePanel>

          {/* 输出面板 */}
          <WorkspacePanel
            title={outputTitle}
            role="output"
            className="min-h-[200px] lg:min-h-0"
          >
            {renderOutput ? (
              renderOutput(controller)
            ) : (
              <div
                role="output"
                aria-live="polite"
                aria-label={outputTitle}
                className="h-full min-h-[200px] p-4"
              >
                {output ? (
                  <pre
                    className={cn(
                      'whitespace-pre-wrap break-all text-sm',
                      outputMono && 'font-mono',
                    )}
                  >
                    {output}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground/60">
                    {outputPlaceholder}
                  </p>
                )}
              </div>
            )}
          </WorkspacePanel>
        </div>

        {/* ---------------- 子内容（工具特有 UI） ---------------- */}
        {typeof children === 'function' ? children(controller) : children}
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// 工具栏子组件
// ---------------------------------------------------------------------------

interface ToolbarProps {
  toolName: string;
  copied: boolean;
  hasOutput: boolean;
  hasInput: boolean;
  isFavorite: boolean;
  isFullscreen: boolean;
  fsSupported: boolean;
  historyCount: number;
  onClearInput: () => void;
  onCopyOutput: () => void;
  onToggleFavorite: () => void;
  onToggleFullscreen: () => void;
  onToggleHistory: () => void;
}

function Toolbar({
  toolName,
  copied,
  hasOutput,
  hasInput,
  isFavorite,
  isFullscreen,
  fsSupported,
  historyCount,
  onClearInput,
  onCopyOutput,
  onToggleFavorite,
  onToggleFullscreen,
  onToggleHistory,
}: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={`${toolName} 操作工具栏`}
      className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 p-1.5"
    >
      {/* 清空输入 */}
      <ToolbarButton
        label="清空输入"
        icon={<Trash2 className="h-4 w-4" />}
        onClick={onClearInput}
        disabled={!hasInput}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* 复制输出 */}
      <ToolbarButton
        label={copied ? '已复制' : '复制输出'}
        icon={
          copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )
        }
        onClick={onCopyOutput}
        disabled={!hasOutput}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* 历史记录 */}
      <ToolbarButton
        label={`历史记录 (${historyCount})`}
        icon={<History className="h-4 w-4" />}
        onClick={onToggleHistory}
        badge={historyCount > 0 ? historyCount : undefined}
      />

      {/* 右侧弹性间距 */}
      <div className="flex-1" />

      {/* 收藏 */}
      <ToolbarButton
        label={isFavorite ? '取消收藏' : '添加到收藏'}
        icon={
          <Star
            className={cn(
              'h-4 w-4',
              isFavorite && 'fill-amber-400 text-amber-400',
            )}
          />
        }
        onClick={onToggleFavorite}
        active={isFavorite}
      />

      {/* 全屏切换 */}
      {fsSupported && (
        <ToolbarButton
          label={isFullscreen ? '退出全屏' : '全屏'}
          icon={
            isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )
          }
          onClick={onToggleFullscreen}
          active={isFullscreen}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 工具栏按钮
// ---------------------------------------------------------------------------

interface ToolbarButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  badge?: number;
}

function ToolbarButton({
  label,
  icon,
  onClick,
  disabled,
  active,
  badge,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={active}
          className="relative h-8 gap-1.5 px-2.5 text-xs"
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span
              className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground"
              aria-hidden="true"
            >
              {badge}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// 历史记录抽屉
// ---------------------------------------------------------------------------

interface HistoryDrawerProps {
  history: HistoryEntry[];
  toolName: string;
  onRestore: (entry: HistoryEntry) => void;
  onClear: () => void;
  onClose: () => void;
}

function HistoryDrawer({
  history,
  toolName,
  onRestore,
  onClear,
  onClose,
}: HistoryDrawerProps) {
  return (
    <div
      role="region"
      aria-label={`${toolName} 历史记录`}
      className="animate-slide-in-down rounded-lg border bg-card shadow-sm"
    >
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">历史记录</h3>
          <span className="text-xs text-muted-foreground">
            最近 {history.length} 条
          </span>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              aria-label="清空所有历史记录"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              清空
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="关闭历史记录"
            className="h-7 w-7"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          暂无历史记录。执行操作后会自动保存最近 5 条。
        </div>
      ) : (
        <ul className="max-h-64 divide-y overflow-auto">
          {history.map((entry) => (
            <li
              key={entry.timestamp}
              className="group flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {entry.label && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {entry.label}
                    </span>
                  )}
                  <time
                    className="text-[11px] text-muted-foreground"
                    dateTime={new Date(entry.timestamp).toISOString()}
                  >
                    {formatRelativeTime(entry.timestamp)}
                  </time>
                </div>
                <p className="mt-1 truncate font-mono text-xs text-foreground/80">
                  {entry.input || '(空输入)'}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  → {entry.output || '(空输出)'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestore(entry)}
                aria-label="恢复此历史记录到输入框"
                className="h-7 shrink-0 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
              >
                <ArrowUpLeft className="mr-1 h-3 w-3" />
                恢复
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}
