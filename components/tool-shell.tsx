import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import { type ToolMeta } from '@/lib/tools';

interface ToolShellProps {
  tool: ToolMeta;
  children: React.ReactNode;
}

/**
 * 单个工具页面的通用外壳：返回链接 + 标题 + 描述 + 内容区
 */
export function ToolShell({ tool, children }: ToolShellProps) {
  const Icon = tool.icon;

  return (
    <div className="container max-w-4xl py-10">
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
        </div>
      </div>

      <Separator className="mb-8" />

      <div className="space-y-6">{children}</div>
    </div>
  );
}
