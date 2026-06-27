'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Progress 进度条组件
 *
 * 采用纯 CSS 实现而非 @radix-ui/react-progress，符合 Micro-Tools
 * "无外部依赖、轻量优先" 的理念。API 与 shadcn/ui 官方版本保持一致，
 * 使用方式：<Progress value={66} />
 */
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 当前进度值 0-100 */
  value?: number;
  /** 最大值，默认 100 */
  max?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
          className
        )}
        {...props}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
