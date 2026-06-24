'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface WorkspacePanelProps {
  /** 面板标题 */
  title?: string;
  /** 面板角色标识，用于 ARIA */
  role?: 'input' | 'output';
  /** 标题区右侧的自定义操作按钮 */
  actions?: React.ReactNode;
  /** 面板内容 */
  children: React.ReactNode;
  /** 额外类名 */
  className?: string;
  /** 面板是否可折叠（暂未启用，预留） */
  collapsible?: boolean;
}

/**
 * WorkspacePanel - Workspace 的单个面板容器
 *
 * 提供统一的标题栏 + 内容区结构，
 * 用作 Workspace 左侧输入面板和右侧输出面板。
 *
 * 无障碍：
 *   - role="region" + aria-label 标识面板用途
 *   - 标题用 h3 语义标签
 */
export function WorkspacePanel({
  title,
  role,
  actions,
  children,
  className,
}: WorkspacePanelProps) {
  const ariaLabel = role
    ? role === 'input'
      ? '输入面板'
      : '输出面板'
    : title;

  return (
    <section
      role="region"
      aria-label={ariaLabel}
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card',
        'animate-in fade-in-50 duration-300',
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex h-11 shrink-0 items-center justify-between border-b bg-muted/40 px-4">
          {title && (
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </h3>
          )}
          {actions && (
            <div className="flex items-center gap-1">{actions}</div>
          )}
        </header>
      )}
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}
