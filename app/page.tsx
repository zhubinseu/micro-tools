import Link from 'next/link';
import { ArrowRight, Zap, Shield, Cpu } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAvailableTools, getToolsByCategory, TOOL_CATEGORIES } from '@/lib/tools';

export default function HomePage() {
  const tools = getAvailableTools();
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
            <Link href="/tools/hash-generator">试用哈希生成器</Link>
          </Button>
        </div>
      </section>

      {/* 特性 */}
      <section className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
        <FeatureCard
          icon={Zap}
          title="边缘加速"
          desc="静态资源由 Cloudflare Pages 全球 CDN 分发，毫秒级加载"
        />
        <FeatureCard
          icon={Shield}
          title="本地计算"
          desc="数据永不离开浏览器，哈希、转换等运算均在客户端完成"
        />
        <FeatureCard
          icon={Cpu}
          title="WASM 加速"
          desc="重度计算任务通过 WebAssembly / Web Workers 并行执行"
        />
      </section>

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
            const Icon = tool.icon;
            return (
              <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{tool.name}</CardTitle>
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

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
