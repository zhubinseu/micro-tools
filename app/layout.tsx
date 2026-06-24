import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CommandPaletteProvider } from '@/components/command-palette';
import { buildWebSiteJsonLd, toJsonLdScript, SITE_URL, SITE_DESCRIPTION, SITE_KEYWORDS } from '@/lib/seo';

// 使用系统字体栈，避免构建时依赖 Google Fonts CDN
// 符合 Micro-Tools 的"本地优先、无外部依赖"理念

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Micro-Tools · 边缘微型工具箱',
    template: '%s · Micro-Tools',
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: 'Micro-Tools' }],
  creator: 'Micro-Tools',
  publisher: 'Micro-Tools',
  openGraph: {
    title: 'Micro-Tools · 边缘微型工具箱',
    description: '浏览器本地完成的微型在线工具集合',
    type: 'website',
    locale: 'zh_CN',
    url: SITE_URL,
    siteName: 'Micro-Tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Micro-Tools · 边缘微型工具箱',
    description: '浏览器本地完成的微型在线工具集合',
  },
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
  alternates: {
    canonical: SITE_URL,
  },
};

// 站点级 JSON-LD（WebSite schema + Sitelinks Search Box）
const websiteJsonLd = buildWebSiteJsonLd();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 站点级结构化数据：WebSite schema + Sitelinks Search Box */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLdScript(websiteJsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CommandPaletteProvider>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </CommandPaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
