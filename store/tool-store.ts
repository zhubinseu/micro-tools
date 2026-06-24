'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 最近使用的工具记录
 * 用于在首页和导航中展示常用工具，持久化到 localStorage
 */
interface RecentTool {
  slug: string;
  name: string;
  lastUsed: number;
}

interface ToolStore {
  /** 最近使用的工具列表（按时间倒序） */
  recent: RecentTool[];
  /** 收藏的工具 slug */
  favorites: string[];

  /** 记录一次工具使用 */
  recordUse: (slug: string, name: string) => void;
  /** 收藏 / 取消收藏 */
  toggleFavorite: (slug: string) => void;
  /** 判断是否已收藏 */
  isFavorite: (slug: string) => boolean;
  /** 清空最近使用记录 */
  clearRecent: () => void;
}

export const useToolStore = create<ToolStore>()(
  persist(
    (set, get) => ({
      recent: [],
      favorites: [],

      recordUse: (slug, name) => {
        const now = Date.now();
        set((state) => {
          // 移除已存在的同名记录，再插入到最前
          const filtered = state.recent.filter((t) => t.slug !== slug);
          return {
            recent: [{ slug, name, lastUsed: now }, ...filtered].slice(0, 8),
          };
        });
      },

      toggleFavorite: (slug) => {
        set((state) => {
          const exists = state.favorites.includes(slug);
          return {
            favorites: exists
              ? state.favorites.filter((s) => s !== slug)
              : [...state.favorites, slug],
          };
        });
      },

      isFavorite: (slug) => get().favorites.includes(slug),

      clearRecent: () => set({ recent: [] }),
    }),
    {
      name: 'micro-tools-storage',
      storage: createJSONStorage(() => localStorage),
      // 只持久化数据，不持久化方法
      partialize: (state) => ({
        recent: state.recent,
        favorites: state.favorites,
      }),
    }
  )
);
