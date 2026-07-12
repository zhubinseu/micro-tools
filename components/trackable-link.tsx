'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, type ReactNode, type MouseEvent } from 'react';
import { trackToolUsed } from '@/lib/analytics';

/**
 * 可埋点的 Link 包装组件
 *
 * 在点击时先发送埋点事件，再进行导航。
 * 用于服务端组件页面（如首页、工具列表页）中的工具卡片点击追踪。
 *
 * 用法：
 *   <TrackableLink href="/tools/sbti-test" toolId="sbti-test" category="quiz">
 *     <Card>...</Card>
 *   </TrackableLink>
 */
interface TrackableLinkProps {
  href: string;
  toolId: string;
  category: string;
  children: ReactNode;
  className?: string;
}

export function TrackableLink({
  href,
  toolId,
  category,
  children,
  className,
}: TrackableLinkProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      // 发送埋点（fire-and-forget，不阻塞导航）
      trackToolUsed(toolId, category);

      // 如果是普通左键点击（无修饰键），用客户端导航更流畅
      // 如果带有修饰键（Ctrl/Cmd 点击新标签等），让浏览器原生处理
      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        router.push(href);
      }
    },
    [toolId, category, href, router],
  );

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
