import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { TOOL_REGISTRY, getToolById, TOOL_CATEGORIES } from '@/lib/registry';
import { ToolShell } from '@/components/tool-shell';
import { ToolLoader } from '@/components/tool-loader';
import {
  SITE_URL,
  SITE_NAME,
  toolUrl,
  buildSoftwareApplicationJsonLd,
  buildBreadcrumbJsonLd,
  toJsonLdScript,
} from '@/lib/seo';

/**
 * 动态路由页面：/tools/[slug]
 *
 * 配置驱动架构的核心——所有工具页面由这一个文件处理：
 *   1. generateStaticParams() 从注册表生成所有工具的静态参数
 *      → Next.js 在构建时为每个工具预渲染独立的 HTML 页面
 *   2. generateMetadata() 为每个工具页面生成完整 SEO 元数据
 *      （TDK + OpenGraph + Twitter Card + canonical + robots）
 *   3. JSON-LD 结构化数据注入（SoftwareApplication + BreadcrumbList）
 *      → 最大化 Google Rich Snippets 展示
 *   4. notFound() 处理注册表中不存在的 slug → 404 页面
 *   5. ToolLoader 使用 next/dynamic 懒加载对应工具组件
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
// SEO 元数据（TDK + OpenGraph + Twitter Card + canonical）
// ---------------------------------------------------------------------------

/**
 * 异步生成工具页面元数据
 *
 * 从 registry 读取工具信息，动态映射：
 *   - Title：工具名称（配合 layout.tsx 的 template 自动追加站点名）
 *   - Description：工具描述
 *   - Keywords：工具关键词
 *   - OpenGraph：title / description / url / siteName / type / locale
 *   - Twitter Card：summary_large_image
 *   - canonical URL：防止重复内容
 *   - robots：index, follow（确保收录）
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tool = getToolById(params.slug);

  if (!tool) {
    return {
      title: '工具未找到',
      description: '您访问的工具不存在或已下线。',
      robots: { index: false, follow: false },
    };
  }

  const url = toolUrl(tool.id);
  const categoryLabel = TOOL_CATEGORIES[tool.category]?.label ?? '工具';

  // 完整标题：工具名 + 分类标签（丰富搜索结果展示）
  const ogTitle = `${tool.name} · ${categoryLabel} | ${SITE_NAME}`;
  const ogDescription = tool.description;

  return {
    title: tool.name,
    description: tool.description,
    keywords: tool.keywords,

    // canonical URL——防止多路径重复内容
    alternates: {
      canonical: url,
    },

    // robots：允许索引和跟踪链接
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },

    // OpenGraph 标签（Facebook / 微信 / 钉钉等社交分享卡片）
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'zh_CN',
      images: [
        {
          url: `${SITE_URL}/og-default.png`,
          width: 1200,
          height: 630,
          alt: tool.name,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [`${SITE_URL}/og-default.png`],
    },

    // 其他搜索引擎兼容
    other: {
      'application-name': SITE_NAME,
      'tool-category': categoryLabel,
      'tool-runtime': tool.runtime,
    },
  };
}

// ---------------------------------------------------------------------------
// JSON-LD 结构化数据组件
// ---------------------------------------------------------------------------

/**
 * JSON-LD 脚本注入
 *
 * 在每个工具详情页注入两段结构化数据：
 *   1. SoftwareApplication——应用信息（名称、描述、分类、免费）
 *   2. BreadcrumbList——面包屑导航（首页 → 工具集 → 分类 → 工具）
 *
 * Google 抓取后会用于 Rich Snippets 展示，
 * 提升搜索结果点击率（CTR）。
 */
function StructuredData({ tool }: { tool: NonNullable<ReturnType<typeof getToolById>> }) {
  const softwareAppLd = buildSoftwareApplicationJsonLd(tool);
  const breadcrumbLd = buildBreadcrumbJsonLd(tool);

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD 内容由 buildXxxJsonLd 生成，数据来自受信任的 registry，无 XSS 风险
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(softwareAppLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbLd) }}
      />
    </>
  );
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
    <>
      {/* JSON-LD 结构化数据——提升 Google Rich Snippets 展示 */}
      <StructuredData tool={tool} />

      <ToolShell tool={tool}>
        {/* 客户端动态加载工具组件（next/dynamic 代码分割） */}
        <ToolLoader id={tool.id} />
      </ToolShell>
    </>
  );
}
