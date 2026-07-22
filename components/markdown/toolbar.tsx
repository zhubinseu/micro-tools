'use client';

import { FilePlus2, FolderOpen, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMarkdownStore, selectDirty, type EditorMode } from '@/store/markdown-store';
import { newDoc, openDocFromPicker, exportCurrentDoc } from '@/lib/markdown-actions';

const MODES: { key: EditorMode; label: string }[] = [
  { key: 'edit', label: '编辑' },
  { key: 'preview', label: '预览' },
  { key: 'split', label: '分屏' },
];

/**
 * Markdown 编辑器顶部工具栏：
 * 文件操作（新建/打开/导出）+ 文件名与未保存提示 + 三种视图模式切换。
 */
export function MarkdownToolbar() {
  const mode = useMarkdownStore((s) => s.mode);
  const setMode = useMarkdownStore((s) => s.setMode);
  const fileName = useMarkdownStore((s) => s.fileName);
  const dirty = useMarkdownStore((s) => selectDirty(s));

  /** 有未导出修改时先确认，避免误丢内容 */
  const guardDiscard = () => {
    if (!dirty) return true;
    return window.confirm('当前文档有尚未导出的修改，继续操作将丢失这些修改。确定继续吗？');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 文件操作 */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => guardDiscard() && newDoc()}
          aria-label="新建文档"
        >
          <FilePlus2 className="mr-1.5 h-4 w-4" />
          新建
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => guardDiscard() && openDocFromPicker()}
          aria-label="打开 Markdown 文件"
        >
          <FolderOpen className="mr-1.5 h-4 w-4" />
          打开
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => exportCurrentDoc()}
          aria-label="导出为 .md 文件"
          title="导出 (Ctrl/⌘ + S)"
        >
          <Download className="mr-1.5 h-4 w-4" />
          导出
        </Button>
      </div>

      {/* 文件名 + 未保存提示 */}
      <div className="ml-1 flex min-w-0 items-center gap-2 text-sm">
        <span className="truncate text-muted-foreground" title={fileName}>
          {fileName}
        </span>
        {dirty ? (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden />
            未导出
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            已保存
          </span>
        )}
      </div>

      {/* 模式切换 */}
      <div
        role="group"
        aria-label="视图模式"
        className="ml-auto flex items-center gap-1 rounded-md border p-1"
      >
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            aria-pressed={mode === m.key}
            className={cn(
              'rounded px-3 py-1 text-sm transition-colors',
              mode === m.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
