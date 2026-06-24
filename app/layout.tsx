import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

// 使用系统字体栈，避免构建时依赖 Google Fonts CDN
// 符合 Micro-Tools 的"本地优先、无外部依赖"理念

export const metadata: Metadata = {
  title: {
    default: 'Micro-Tools · 边缘微型工具箱',
    template: '%s · Micro-Tools',
  },
  description:
    '一组运行在 Cloudflare 边缘的微型在线工具：哈希、编码、转换、计算，全部在浏览器本地完成，无需上传。',
  keywords: ['micro-tools', '在线工具', 'edge', 'wasm', 'cloudflare'],
  authors: [{ name: 'Micro-Tools' }],
  openGraph: {
    title: 'Micro-Tools · 边缘微型工具箱',
    description: '浏览器本地完成的微型在线工具集合',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
