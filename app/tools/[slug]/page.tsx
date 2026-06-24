import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { TOOL_REGISTRY, getToolById } from '@/lib/registry';
import { ToolShell } from '@/components/tool-shell';
import { ToolLoader } from '@/components/tool-loader';

/**
 * 动态路由页面：/tools/[slug]
 *
 * 配置驱动架构的核心——所有工具页面由这一个文件处理：
 *   1. generateStaticParams() 从注册表生成所有工具的静态参数
 *      → Next.js 在构建时为每个工具预渲染独立的 HTML 页面
 *   2. generateMetadata() 为每个工具页面生成 SEO 元数据
 *   3. notFound() 处理注册表中不存在的 slug → 404 页面
 *   4. ToolLoader 使用 next/dynamic 懒加载对应工具组件
 *
 * 与 output: 'export' 兼容：generateStaticParams 返回非空数组时，
 * Next.js 会为每个 slug 生成静态 HTML（/tools/base64-codec/index.html 等）。
 */

// ---------------------------------------------------------------------------
// 静态参数生成（构建时预渲染所有工具页面）
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return TOOL_REGISTRY.map((tool) => ({
    slug: tool.id,
  }));
}

// ---------------------------------------------------------------------------
// SEO 元数据
// ---------------------------------------------------------------------------

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const tool = getToolById(params.slug);
  if (!tool) {
    return {
      title: '工具未找到',
    };
  }
  return {
    title: tool.name,
    description: tool.description,
    keywords: tool.keywords,
  };
}

// ---------------------------------------------------------------------------
// 页面渲染
// ---------------------------------------------------------------------------

export default function ToolPage({
  params,
}: {
  params: { slug: string };
}) {
  const tool = getToolById(params.slug);

  // slug 不在注册表中 → 触发 404 页面
  if (!tool) {
    notFound();
  }

  return (
    <ToolShell tool={tool}>
      {/* 客户端动态加载工具组件（next/dynamic 代码分割） */}
      <ToolLoader id={tool.id} />
    </ToolShell>
  );
}
