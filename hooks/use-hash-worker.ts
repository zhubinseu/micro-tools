'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { HashRequest, HashResponse } from '@/lib/worker-types';

interface UseHashWorkerOptions {
  /** Worker 不可用时是否回退到主线程计算 */
  fallbackToMainThread?: boolean;
}

interface UseHashWorkerReturn {
  /** 计算哈希，返回 hex 字符串 */
  hash: (algorithm: string, data: BufferSource) => Promise<string>;
  /** 是否正在计算 */
  isComputing: boolean;
  /** Worker 是否可用 */
  isSupported: boolean;
  /** 上次错误 */
  error: string | null;
}

/**
 * 哈希计算 Worker Hook
 *
 * 封装 Worker 的实例化、消息通信与错误处理。
 * 使用 new Worker(new URL(...)) 原生语法，Next.js 14 (webpack 5) 会自动
 * 将 Worker 脚本编译为独立 chunk，兼容 output: 'export' 静态导出。
 */
export function useHashWorker(
  options: UseHashWorkerOptions = {}
): UseHashWorkerReturn {
  const { fallbackToMainThread = true } = options;
  const workerRef = useRef<Worker | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== 'undefined' && 'Worker' in window;

  useEffect(() => {
    if (!isSupported) return;

    // 使用 new URL 语法，Next.js 会将其作为独立 chunk 输出
    workerRef.current = new Worker(
      new URL('../workers/hash.worker.ts', import.meta.url)
    );

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [isSupported]);

  const hashMainThread = useCallback(
    async (algorithm: string, data: BufferSource): Promise<string> => {
      const digest = await crypto.subtle.digest(algorithm, data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    },
    []
  );

  const hash = useCallback(
    async (algorithm: string, data: BufferSource): Promise<string> => {
      setError(null);

      // Worker 不可用时回退到主线程
      if (!workerRef.current || !isSupported) {
        if (!fallbackToMainThread) {
          throw new Error('Web Worker 不可用');
        }
        setIsComputing(true);
        try {
          return await hashMainThread(algorithm, data);
        } finally {
          setIsComputing(false);
        }
      }

      return new Promise<string>((resolve, reject) => {
        const id = Math.random().toString(36).slice(2);
        setIsComputing(true);

        const handler = (event: MessageEvent<HashResponse>) => {
          const res = event.data;
          if (res.id !== id) return;

          workerRef.current?.removeEventListener('message', handler);
          setIsComputing(false);

          if (res.error) {
            setError(res.error);
            reject(new Error(res.error));
          } else {
            resolve(res.hash ?? '');
          }
        };

        workerRef.current!.addEventListener('message', handler);

        // 只有 ArrayBuffer 可以被 transfer；Uint8Array 等视图需拷贝
        const transfer: Transferable[] =
          data instanceof ArrayBuffer ? [data] : [];
        const request: HashRequest = { id, algorithm, data };
        workerRef.current!.postMessage(request, transfer);
      });
    },
    [isSupported, fallbackToMainThread, hashMainThread]
  );

  return { hash, isComputing, isSupported, error };
}
