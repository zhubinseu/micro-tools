import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { resolveIcon } from '@/components/icon-resolver';
import { TrackableLink } from '@/components/trackable-link';
import {
  getToolsByCategory,
  TOOL_CATEGORIES,
  type ToolCategory,
} from '@/lib/registry';

export const metadata = {
  title: '所有工具',
  description: '浏览 Micro-Tools 提供的全部在线工具',
};

export default function ToolsPage() {
  const grouped = getToolsByCategory();

  return (
    <div className="container py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">所有工具</h1>
        <p className="mt-2 text-muted-foreground">
          点击任意工具即可在浏览器中本地运行，无需上传数据。
        </p>
      </div>

      {Object.entries(grouped).map(([key, tools]) => {
        if (tools.length === 0) return null;
        const category = TOOL_CATEGORIES[key as ToolCategory];
        return (
          <section key={key} className="mb-12">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{category.label}</h2>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </div>
            <Separator className="mb-6" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => {
                const Icon = resolveIcon(tool.icon);
                return (
                  <TrackableLink key={tool.id} href={`/tools/${tool.id}`} toolId={tool.id} category={tool.category}>
                    <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {tool.name}
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">
                              {tool.runtime === 'edge' ? 'Edge API' : '客户端计算'}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{tool.description}</CardDescription>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {tool.keywords.slice(0, 3).map((kw) => (
                            <span
                              key={kw}
                              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TrackableLink>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
