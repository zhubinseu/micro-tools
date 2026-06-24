/**
 * SEO 配置与结构化数据生成
 *
 * 集中管理站点级 SEO 常量（URL、名称、描述），
 * 并提供 JSON-LD 结构化数据生成函数，供工具详情页注入。
 *
 * 相关文件：
 *   - app/tools/[slug]/page.tsx（generateMetadata + JSON-LD 注入）
 *   - app/sitemap.ts（动态 sitemap.xml）
 *   - app/robots.ts（robots.txt）
 */

import type { ToolMeta, ToolCategory } from '@/lib/registry';
import { TOOL_CATEGORIES } from '@/lib/registry';

// ---------------------------------------------------------------------------
// 站点级常量
// ---------------------------------------------------------------------------

/**
 * 站点生产 URL（用于 canonical、OpenGraph、sitemap、JSON-LD）
 *
 * 部署到自定义域名后，更新此常量即可，
 * 所有 SEO 标签和结构化数据会自动同步。
 */
export const SITE_URL = 'https://micro-tools.pages.dev';

/** 站点名称 */
export const SITE_NAME = 'Micro-Tools';

/** 站点简称（用于 OpenGraph site_name） */
export const SITE_SHORT_NAME = 'Micro-Tools';

/** 站点默认描述 */
export const SITE_DESCRIPTION =
  '一组运行在 Cloudflare 边缘的微型在线工具：哈希、编码、转换、计算、物理模拟，全部在浏览器本地完成，无需上传。';

/** 站点默认关键词 */
export const SITE_KEYWORDS = [
  'micro-tools',
  '在线工具',
  'edge',
  'wasm',
  'cloudflare',
  '浏览器工具',
  '本地计算',
  '零上传',
  '隐私优先',
];

/** 站点语言 */
export const SITE_LOCALE = 'zh_CN';

/** 联系邮箱（用于 JSON-LD author） */
export const SITE_AUTHOR_EMAIL = 'zhubinseu@gmail.com';

/** GitHub 仓库地址 */
export const SITE_GITHUB_URL = 'https://github.com/zhubinseu/micro-tools';

// ---------------------------------------------------------------------------
// 分类 → applicationCategory 映射（JSON-LD SoftwareApplication）
// ---------------------------------------------------------------------------

const CATEGORY_TO_SCHEMA: Record<ToolCategory, string> = {
  crypto: 'SecurityApplication',
  converter: 'UtilitiesApplication',
  encoder: 'DeveloperApplication',
  formatter: 'DeveloperApplication',
  generator: 'UtilitiesApplication',
  media: 'MultimediaApplication',
  physics: 'EducationalApplication',
};

// ---------------------------------------------------------------------------
// URL 辅助
// ---------------------------------------------------------------------------

/** 拼接站点完整 URL */
export function absoluteUrl(path: string = '/'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/** 获取工具详情页完整 URL */
export function toolUrl(toolId: string): string {
  return absoluteUrl(`/tools/${toolId}`);
}

// ---------------------------------------------------------------------------
// JSON-LD 结构化数据生成
// ---------------------------------------------------------------------------

/**
 * 生成工具详情页的 SoftwareApplication JSON-LD
 *
 * 符合 schema.org/SoftwareApplication 规范，
 * 用于 Google Rich Snippets 展示（应用名称、描述、分类、免费标记）。
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/software-app
 */
export function buildSoftwareApplicationJsonLd(tool: ToolMeta): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: toolUrl(tool.id),
    applicationCategory: CATEGORY_TO_SCHEMA[tool.category] ?? 'UtilitiesApplication',
    operatingSystem: 'Web (浏览器)',
    browserRequirements: '需要支持 JavaScript 的现代浏览器',
    // 免费工具
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
    // 关键词
    keywords: tool.keywords.join(', '),
    // 作者
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    // 发布者
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    // 运行环境特征
    featureList: [
      '100% 浏览器本地计算，零上传',
      '支持桌面端和移动端',
      '无需注册，即开即用',
    ],
    // 软件版本
    softwareVersion: '1.0.0',
    // 日期（使用构建时常量）
    datePublished: '2024-01-01',
    inLanguage: 'zh-CN',
  };
}

/**
 * 生成面包屑导航 JSON-LD
 *
 * 首页 → 工具集 → 工具名称
 * 用于 Google 搜索结果显示面包屑路径。
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */
export function buildBreadcrumbJsonLd(tool: ToolMeta): Record<string, unknown> {
  const categoryLabel = TOOL_CATEGORIES[tool.category]?.label ?? '工具';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '首页',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '工具集',
        item: absoluteUrl('/tools'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryLabel,
        item: absoluteUrl('/tools'),
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: tool.name,
        item: toolUrl(tool.id),
      },
    ],
  };
}

/**
 * 生成 WebSite JSON-LD（站点级，注入到 layout.tsx）
 *
 * 配合 Google Sitelinks Search Box 使用。
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox
 */
export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'zh-CN',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/tools?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * 将 JSON-LD 对象序列化为可直接注入 <script> 标签的字符串
 */
export function toJsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data, null, 0);
}
