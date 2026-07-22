'use client';

import { useMemo } from 'react';

import { useMarkdownStore } from '@/store/markdown-store';
import { renderMarkdown } from '@/lib/markdown';
// 代码高亮浅色主题；暗色主题在 globals.css 中以 .dark 覆盖
import 'highlight.js/styles/github.css';

/**
 * 实时预览：对 content 做 Markdown 渲染（marked + DOMPurify + 代码高亮）。
 * 标题带锚点 id，供目录点击 scrollIntoView。
 */
export function MarkdownPreview() {
  const content = useMarkdownStore((s) => s.content);
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div
      className="markdown-body h-full overflow-auto rounded-md border bg-background p-5"
      // html 已经 DOMPurify 消毒，可安全渲染
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
