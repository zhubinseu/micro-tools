import type { MetadataRoute } from 'next';

import { SITE_URL, SITE_GITHUB_URL } from '@/lib/seo';

/**
 * robots.txt 生成
 *
 * Next.js App Router Metadata Route：
 *   - 构建时自动生成 /robots.txt
 *   - 兼容 output: 'export'（静态导出）
 *
 * 规则：
 *   - 允许所有爬虫抓取所有路径
 *   - 指向 sitemap.xml 位置
 *   - 禁止抓取 /api/ 边缘函数端点（非内容页面）
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
