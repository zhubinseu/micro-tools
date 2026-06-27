import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { resolveIcon } from '@/components/icon-resolver';
import { getAllTools, getToolsByCategory, TOOL_CATEGORIES } from '@/lib/registry';

export default function HomePage() {
  const tools = getAllTools();
  const grouped = getToolsByCategory();

  return (
    <div className="container py-12">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          微型工具，<span className="text-primary">边缘运行</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          一组轻量级在线工具，全部在你的浏览器本地完成计算。
          基于 Next.js 静态导出 + Cloudflare 边缘分发 + WebAssembly 重度计算。
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/tools">
              浏览全部工具
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/tools/mbti-test">试用 MBTI 测试</Link>
          </Button>
        </div>
      </section>

      {/* 特性卡片已隐藏 */}

      {/* 工具预览 */}
      <section className="mt-20">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">可用工具</h2>
          <Link
            href="/tools"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            查看全部 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = resolveIcon(tool.icon);
            return (
              <Link key={tool.id} href={`/tools/${tool.id}`}>
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{tool.name}</CardTitle>
                        <span className="text-xs text-muted-foreground">
                          {tool.runtime === 'edge' ? 'Edge' : '客户端'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 分类总览 */}
      <section className="mt-20">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">工具分类</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(TOOL_CATEGORIES).map(([key, cat]) => {
            const count = grouped[key as keyof typeof grouped].length;
            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-base">{cat.label}</CardTitle>
                  <CardDescription>{cat.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {count} 个工具
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// 特性卡片组件（已隐藏，保留以备后续恢复）
// function FeatureCard({ ... }) { ... }
