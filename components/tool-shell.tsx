import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import { resolveIcon } from '@/components/icon-resolver';
import { type ToolMeta } from '@/lib/registry';

interface ToolShellProps {
  tool: ToolMeta;
  children: React.ReactNode;
}

/**
 * 单个工具页面的通用外壳：返回链接 + 图标 + 标题 + 描述 + 内容区
 *
 * 由动态路由 app/tools/[slug]/page.tsx 调用，
 * 所有工具共享此布局，工具组件只负责渲染交互 UI。
 */
export function ToolShell({ tool, children }: ToolShellProps) {
  const Icon = resolveIcon(tool.icon);

  return (
    <div className="container max-w-6xl py-10">
      <Link
        href="/tools"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        返回工具列表
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
          <p className="mt-1 text-muted-foreground">{tool.description}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {tool.runtime === 'edge' ? 'Edge API' : '客户端计算'}
            </span>
            {tool.keywords.slice(0, 3).map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-xs text-muted-foreground"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Separator className="mb-8" />

      <div className="space-y-6">{children}</div>
    </div>
  );
}
