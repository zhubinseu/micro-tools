import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] max-w-2xl flex-col items-center justify-center py-20 text-center">
      <Compass className="mb-6 h-16 w-16 text-muted-foreground" />
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">
        页面不存在，或者该工具尚未上线。
      </p>
      <Button asChild className="mt-8">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Link>
      </Button>
    </div>
  );
}
