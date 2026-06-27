'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun, Wrench, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCommandPalette } from '@/components/command-palette';

export function SiteHeader() {
  const { setTheme } = useTheme();
  const { setOpen: setPaletteOpen } = useCommandPalette();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">Micro-Tools</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className="text-foreground/60 transition-colors hover:text-foreground"
          >
            首页
          </Link>
          <Link
            href="/tools"
            className="text-foreground/60 transition-colors hover:text-foreground"
          >
            工具集
          </Link>
          <a
            href="https://game.bayaba.top"
            target="_blank"
            rel="noreferrer"
            className="text-foreground/60 transition-colors hover:text-foreground"
          >
            游戏
          </a>
          <Link
            href="/tools/mbti-test"
            className="text-foreground/60 transition-colors hover:text-foreground"
          >
            MBTI 测试
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* Command Palette 触发按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-9 gap-2 px-3 text-xs text-muted-foreground sm:flex"
            aria-label="打开命令面板"
          >
            <Search className="h-3.5 w-3.5" />
            <span>搜索工具</span>
            <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          {/* 移动端仅显示图标 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPaletteOpen(true)}
            className="h-9 w-9 sm:hidden"
            aria-label="打开命令面板"
          >
            <Search className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">切换主题</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                浅色
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                深色
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                跟随系统
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
