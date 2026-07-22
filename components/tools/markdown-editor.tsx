'use client';

import { useEffect } from 'react';

import { useMarkdownStore, selectDirty } from '@/store/markdown-store';
import { MarkdownToolbar } from '@/components/markdown/toolbar';
import { MarkdownEditorCore } from '@/components/markdown/editor-core';
import { MarkdownPreview } from '@/components/markdown/preview';
import { MarkdownToc } from '@/components/markdown/toc';

/**
 * Markdown 编辑器（本地优先、纯前端）
 *
 * 布局：顶部工具栏 + 主体（目录侧栏 + 编辑区 + 预览区）。
 * 三种模式：edit 仅编辑 / preview 仅预览 / split 左右分屏（移动端上下堆叠）。
 * 目录仅在含预览时展示（edit 模式下面板不渲染预览，锚点不可滚动）。
 */
export default function MarkdownEditor() {
  const mode = useMarkdownStore((s) => s.mode);
  const hydrate = useMarkdownStore((s) => s.hydrate);
  const dirty = useMarkdownStore((s) => selectDirty(s));

  // 挂载时从 localStorage 恢复上次内容与状态
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // 有未导出修改时，离开/刷新页面前提示
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const showEditor = mode === 'edit' || mode === 'split';
  const showPreview = mode === 'preview' || mode === 'split';

  return (
    <div className="flex flex-col gap-4">
      <MarkdownToolbar />

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* 目录侧栏：仅在含预览的模式下展示 */}
        {showPreview && (
          <aside className="order-last lg:order-first lg:w-60 lg:shrink-0">
            <div className="lg:h-[72vh]">
              <MarkdownToc />
            </div>
          </aside>
        )}

        {/* 编辑区 */}
        {showEditor && (
          <div className="min-w-0 flex-1">
            <div className="h-[72vh] overflow-hidden rounded-md border">
              <MarkdownEditorCore />
            </div>
          </div>
        )}

        {/* 预览区 */}
        {showPreview && (
          <div className="min-w-0 flex-1">
            <div className="h-[72vh]">
              <MarkdownPreview />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
