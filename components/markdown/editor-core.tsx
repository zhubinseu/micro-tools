'use client';

import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView, keymap } from '@codemirror/view';
import { EditorSelection, Prec } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { useTheme } from 'next-themes';

import { useMarkdownStore } from '@/store/markdown-store';
import { exportCurrentDoc } from '@/lib/markdown-actions';

// ---------------------------------------------------------------------------
// 编辑操作（供快捷键与潜在的工具栏按钮复用）
// ---------------------------------------------------------------------------

/** 用 before/after 包裹选区（加粗 **、斜体 * 等） */
function wrapSelection(view: EditorView, before: string, after: string): boolean {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    const selected = state.sliceDoc(range.from, range.to);
    const insert = before + selected + after;
    const anchor = range.from + before.length;
    return {
      changes: { from: range.from, to: range.to, insert },
      range: EditorSelection.range(anchor, anchor + selected.length),
    };
  });
  view.dispatch(changes);
  view.focus();
  return true;
}

/** 插入链接，光标落在 URL 占位处便于直接输入 */
function insertLink(view: EditorView): boolean {
  const { state } = view;
  const range = state.selection.main;
  const selected = state.sliceDoc(range.from, range.to);
  const text = selected || '链接文字';
  const urlPlaceholder = 'https://';
  const insert = `[${text}](${urlPlaceholder})`;
  const cursor = range.from + `[${text}](${urlPlaceholder}`.length;
  view.dispatch({
    changes: { from: range.from, to: range.to, insert },
    selection: { anchor: cursor },
  });
  view.focus();
  return true;
}

/** 设置当前行为指定级别标题（H1-H6） */
function setHeading(view: EditorView, level: number): boolean {
  const { state } = view;
  const range = state.selection.main;
  const line = state.doc.lineAt(range.from);
  const stripped = line.text.replace(/^#{1,6}\s+/, '');
  const insert = '#'.repeat(level) + ' ' + stripped;
  view.dispatch({
    changes: { from: line.from, to: line.to, insert },
    selection: { anchor: line.from + insert.length },
  });
  view.focus();
  return true;
}

// ---------------------------------------------------------------------------
// 编辑器组件
// ---------------------------------------------------------------------------

/**
 * CodeMirror 6 Markdown 编辑器内核。
 * basicSetup 提供行号/历史/搜索(Ctrl-F)/括号匹配等；此处追加：
 * markdown 语言高亮、自动换行、自定义快捷键、主题跟随 next-themes。
 */
export function MarkdownEditorCore() {
  const content = useMarkdownStore((s) => s.content);
  const setContent = useMarkdownStore((s) => s.setContent);
  const { resolvedTheme } = useTheme();

  const extensions = useMemo(
    () => [
      Prec.highest(
        keymap.of([
          { key: 'Mod-s', run: () => { exportCurrentDoc(); return true; } },
          { key: 'Mod-b', run: (v) => wrapSelection(v, '**', '**') },
          { key: 'Mod-i', run: (v) => wrapSelection(v, '*', '*') },
          { key: 'Mod-k', run: (v) => insertLink(v) },
          { key: 'Mod-1', run: (v) => setHeading(v, 1) },
          { key: 'Mod-2', run: (v) => setHeading(v, 2) },
          { key: 'Mod-3', run: (v) => setHeading(v, 3) },
        ])
      ),
      markdown(),
      EditorView.lineWrapping,
      keymap.of([indentWithTab]),
    ],
    []
  );

  return (
    <CodeMirror
      value={content}
      onChange={(v) => setContent(v)}
      extensions={extensions}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      height="100%"
      className="h-full text-sm"
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        autocompletion: false,
      }}
      placeholder="开始输入 Markdown..."
    />
  );
}
