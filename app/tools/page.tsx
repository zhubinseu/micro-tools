import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getToolsByCategory, TOOL_CATEGORIES, type ToolCategory } from '@/lib/tools';

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
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.slug}
                    href={tool.available ? `/tools/${tool.slug}` : '#'}
                    aria-disabled={!tool.available}
                    className={
                      tool.available
                        ? ''
                        : 'pointer-events-none opacity-50'
                    }
                  >
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
                            {tool.heavy && (
                              <span className="text-xs text-muted-foreground">
                                WASM · Worker
                              </span>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{tool.description}</CardDescription>
                        {!tool.available && (
                          <span className="mt-2 inline-block text-xs text-muted-foreground">
                            即将上线
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
