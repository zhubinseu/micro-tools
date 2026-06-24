import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t py-6">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} Micro-Tools · 运行于 Cloudflare 边缘</p>
        <div className="flex items-center gap-4">
          <Link href="/tools" className="hover:text-foreground">
            所有工具
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
