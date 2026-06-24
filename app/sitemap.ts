import type { MetadataRoute } from 'next';

import { TOOL_REGISTRY, TOOL_CATEGORIES } from '@/lib/registry';
import { SITE_URL } from '@/lib/seo';

/**
 * 动态 sitemap.xml 生成
 *
 * Next.js App Router 的 Metadata Routes 机制：
 *   - 本文件导出的 default 函数在构建时自动生成 /sitemap.xml
 *   - 兼容 output: 'export'（静态导出），生成静态 sitemap.xml 文件
 *
 * 生成策略：
 *   1. 根页面（首页、工具集列表页）—— 高优先级、weekly 更新
 *   2. 工具详情页（遍历 TOOL_REGISTRY）—— 中优先级、monthly 更新
 *
 * 合规性：
 *   - 遵循 sitemaps.org 协议（https://www.sitemaps.org/protocol.html）
 *   - 每条 URL 包含 loc / lastModified / changeFrequency / priority
 *   - 所有 URL 为绝对路径（以 SITE_URL 开头）
 *
 * SEO 最佳实践：
 *   - 首页 priority 1.0，工具列表 0.9，工具详情 0.7~0.8
 *   - changeFrequency 反映内容更新频率（首页可能更新→weekly，工具页稳定→monthly）
 *   - lastModified 使用构建时间，搜索引擎据此判断内容新鲜度
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // 构建时间作为 lastModified（所有页面统一）
  const lastModified = new Date();

  // ---- 根页面 ----
  const rootPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // ---- 工具详情页（遍历注册表） ----
  const toolPages: MetadataRoute.Sitemap = TOOL_REGISTRY.map((tool, index) => {
    const categoryLabel = TOOL_CATEGORIES[tool.category]?.label ?? '工具';

    return {
      url: `${SITE_URL}/tools/${tool.id}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      // 第一个工具略高优先级（通常是最常用的）
      priority: index === 0 ? 0.8 : 0.7,
      // 附加信息（非标准 sitemap 字段，但部分搜索引擎会读取）
      // Next.js 会忽略无法识别的字段
    };
  });

  // 合并：根页面在前，工具页在后
  return [...rootPages, ...toolPages];
}
