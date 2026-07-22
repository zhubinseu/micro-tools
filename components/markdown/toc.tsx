'use client';

import { useMemo } from 'react';

import { useMarkdownStore } from '@/store/markdown-store';
import { extractHeadings } from '@/lib/markdown';
import { cn } from '@/lib/utils';

/**
 * 标题目录导航：提取文档标题生成目录树，点击平滑滚动到预览区对应锚点。
 * 缩进以文档最小标题层级为基准，避免 H2 开头的文档过度缩进。
 */
export function MarkdownToc() {
  const content = useMarkdownStore((s) => s.content);
  const headings = useMemo(() => extractHeadings(content), [content]);

  if (headings.length === 0) {
    return (
      <p className="px-1 text-xs text-muted-foreground">
        文档暂无标题，添加 <code className="rounded bg-muted px-1">#</code> 标题后可在此导航。
      </p>
    );
  }

  const minDepth = Math.min(...headings.map((h) => h.depth));

  const scrollTo = (slug: string) => {
    const el = document.getElementById(slug);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav aria-label="目录" className="h-full overflow-auto rounded-md border bg-background p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        目录
      </p>
      <ul className="space-y-0.5">
        {headings.map((h, i) => (
          <li key={`${h.slug}-${i}`}>
            <button
              type="button"
              onClick={() => scrollTo(h.slug)}
              title={h.text}
              className={cn(
                'block w-full truncate rounded px-1.5 py-1 text-left text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                h.depth === minDepth ? 'text-sm font-medium' : 'text-xs'
              )}
              style={{ paddingLeft: `${(h.depth - minDepth) * 14 + 6}px` }}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
