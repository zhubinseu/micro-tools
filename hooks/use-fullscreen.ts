'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * useFullscreen - 全屏切换 Hook
 *
 * 使用 Fullscreen API 将指定元素切换到全屏模式。
 * 优雅降级：不支持时 isFullscreen 恒为 false，toggle 无副作用。
 */

interface UseFullscreenResult {
  /** 当前是否处于全屏状态 */
  isFullscreen: boolean;
  /** 是否支持 Fullscreen API */
  isSupported: boolean;
  /** 切换全屏。传入 ref 则全屏该元素，否则全屏 document.documentElement */
  toggle: (element?: HTMLElement | null) => Promise<void>;
  /** 进入全屏 */
  enter: (element?: HTMLElement | null) => Promise<void>;
  /** 退出全屏 */
  exit: () => Promise<void>;
}

export function useFullscreen(): UseFullscreenResult {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // 检测支持性 + 监听全屏变化
  useEffect(() => {
    const supported =
      typeof document !== 'undefined' &&
      ('fullscreenEnabled' in document ||
        'webkitFullscreenEnabled' in document);

    setIsSupported(!!supported);

    const handleChange = () => {
      const fsElement =
        document.fullscreenElement ||
        (document as Document & { webkitFullscreenElement?: Element })
          .webkitFullscreenElement;
      setIsFullscreen(!!fsElement);
    };

    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
    };
  }, []);

  const enter = useCallback(
    async (element?: HTMLElement | null) => {
      const el = element ?? document.documentElement;
      const elWithVendor = el as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      };

      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (elWithVendor.webkitRequestFullscreen) {
          await elWithVendor.webkitRequestFullscreen();
        }
      } catch {
        // 用户拒绝或权限不足，静默处理
      }
    },
    [],
  );

  const exit = useCallback(async () => {
    const docWithVendor = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
    };
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (docWithVendor.webkitExitFullscreen) {
        await docWithVendor.webkitExitFullscreen();
      }
    } catch {
      // 静默处理
    }
  }, []);

  const toggle = useCallback(
    async (element?: HTMLElement | null) => {
      if (isFullscreen) {
        await exit();
      } else {
        await enter(element);
      }
    },
    [isFullscreen, enter, exit],
  );

  return { isFullscreen, isSupported, toggle, enter, exit };
}
