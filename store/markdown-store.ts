'use client';

import { create } from 'zustand';

/**
 * Markdown 编辑器状态管理
 *
 * 本地优先：内容自动保存到 localStorage，全程不上传服务器。
 *
 * 脏状态语义（"未保存提示"）：
 *   dirty = content !== fileContent
 *   - fileContent：最近一次「打开文件」或「导出 .md」时的内容（磁盘基线）
 *   - 只要当前内容偏离了这个基线，就视为「尚未导出/保存为文件」
 *   - 自动保存（localStorage）是透明的后台行为，保证刷新不丢数据
 */

export type EditorMode = 'edit' | 'preview' | 'split';

export const DOC_STORAGE_KEY = 'markdown-editor:doc';
export const META_STORAGE_KEY = 'markdown-editor:meta';

interface MetaPersist {
  fileName: string;
  fileContent: string;
  mode: EditorMode;
}

/** 首次打开时的示例文档，便于展示渲染效果 */
export const DEFAULT_CONTENT = `# Markdown 编辑器

本地优先、纯前端的 Markdown 工作台，内容**不会上传到服务器**。

## 功能一览

- 编辑 / 预览 / 分屏 三种模式
- 实时渲染 Markdown（GFM）
- 自动保存到浏览器，刷新不丢
- 导入 / 导出 \`.md\` 文件
- 常用快捷键、明暗主题、标题目录导航

## 快捷键

| 功能 | Windows / Linux | macOS |
| ---- | --------------- | ----- |
| 导出 .md | Ctrl + S | ⌘ + S |
| 加粗 | Ctrl + B | ⌘ + B |
| 斜体 | Ctrl + I | ⌘ + I |
| 插入链接 | Ctrl + K | ⌘ + K |
| 搜索 | Ctrl + F | ⌘ + F |

## 代码块

\`\`\`js
function hello(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

> 提示：从「打开」导入一个 \`.md\` 文件，或直接开始编辑。
`;

interface MarkdownStore {
  /** 当前编辑内容 */
  content: string;
  /** 磁盘基线内容（最近打开/导出时），用于计算 dirty */
  fileContent: string;
  /** 文件名（导出下载时使用） */
  fileName: string;
  /** 视图模式 */
  mode: EditorMode;
  /** 是否已从 localStorage 恢复（防止恢复前把默认值覆盖写回） */
  hydrated: boolean;

  setContent: (v: string) => void;
  setMode: (m: EditorMode) => void;
  /** 新建空白文档 */
  newDoc: () => void;
  /** 打开文件：内容与基线一致，视为干净 */
  openDoc: (content: string, fileName: string) => void;
  /** 导出后调用：把当前内容记为磁盘基线（干净） */
  markExported: (content: string, fileName: string) => void;
  /** 从 localStorage 恢复 */
  hydrate: () => void;
}

export const useMarkdownStore = create<MarkdownStore>()((set) => ({
  content: DEFAULT_CONTENT,
  fileContent: DEFAULT_CONTENT,
  fileName: 'untitled.md',
  mode: 'split',
  hydrated: false,

  setContent: (v) => set({ content: v }),
  setMode: (m) => set({ mode: m }),

  newDoc: () =>
    set({ content: '', fileContent: '', fileName: 'untitled.md' }),

  openDoc: (content, fileName) =>
    set({ content, fileContent: content, fileName }),

  markExported: (content, fileName) =>
    set({ fileContent: content, fileName }),

  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const doc = window.localStorage.getItem(DOC_STORAGE_KEY);
      const metaRaw = window.localStorage.getItem(META_STORAGE_KEY);
      let meta: MetaPersist | null = null;
      if (metaRaw) {
        try {
          meta = JSON.parse(metaRaw) as MetaPersist;
        } catch {
          meta = null;
        }
      }
      const content = doc ?? DEFAULT_CONTENT;
      set({
        content,
        fileContent: meta?.fileContent ?? content,
        fileName: meta?.fileName ?? 'untitled.md',
        mode: meta?.mode ?? 'split',
        hydrated: true,
      });
    } catch {
      set({ content: DEFAULT_CONTENT, fileContent: DEFAULT_CONTENT, hydrated: true });
    }
  },
}));

// ---------------------------------------------------------------------------
// 自动保存（防抖 800ms 写 localStorage）
// ---------------------------------------------------------------------------

/**
 * 订阅 store，任何状态变化后防抖写入 localStorage。
 * 仅在浏览器端执行；hydrated 之前不写，避免把恢复前的默认值覆盖掉存档。
 */
if (typeof window !== 'undefined') {
  let timer: ReturnType<typeof setTimeout> | null = null;
  useMarkdownStore.subscribe(() => {
    const state = useMarkdownStore.getState();
    if (!state.hydrated) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const { content, fileContent, fileName, mode } = useMarkdownStore.getState();
      try {
        window.localStorage.setItem(DOC_STORAGE_KEY, content);
        window.localStorage.setItem(
          META_STORAGE_KEY,
          JSON.stringify({ fileContent, fileName, mode } satisfies MetaPersist)
        );
      } catch {
        // localStorage 配额满等异常：忽略，不影响编辑
      }
    }, 800);
  });
}

/** 派生：是否为「未保存（未导出为文件）」状态 */
export function selectDirty(s: Pick<MarkdownStore, 'content' | 'fileContent'>): boolean {
  return s.content !== s.fileContent;
}
