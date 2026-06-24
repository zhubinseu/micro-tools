'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  WorkerRequest,
  WorkerResponse,
} from '@/lib/worker-types';

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/**
 * Worker 构造器函数类型
 * 接受 `() => new Worker(new URL('./xxx.worker.ts', import.meta.url))` 的工厂函数
 */
export type WorkerFactory<TWorker extends Worker = Worker> = () => TWorker;

/**
 * useWorker 配置项
 */
export interface UseWorkerOptions<TPayload, TResult> {
  /**
   * Worker 不可用时是否回退到主线程执行
   * 需要提供 fallback 函数，否则将抛错
   */
  fallback?: (payload: TPayload) => Promise<TResult> | TResult;
  /** 是否在组件挂载时立即创建 Worker（默认 true）。设为 false 则懒创建 */
  immediate?: boolean;
  /** 进度回调，Worker 上报 progress 时触发 */
  onProgress?: (progress: number) => void;
}

/**
 * useWorker 返回值
 */
export interface UseWorkerReturn<TPayload, TResult> {
  /**
   * 提交一次计算任务到 Worker
   * 返回 Promise，resolve 时拿到结果
   * 同一时刻可有多个 in-flight 请求（按 id 关联）
   */
  run: (payload: TPayload, transfer?: Transferable[]) => Promise<TResult>;
  /** 是否正在计算（任意一个请求 in-flight 即为 true） */
  isComputing: boolean;
  /** Worker 是否可用（浏览器支持 + 已创建） */
  isSupported: boolean;
  /** 最新一次进度（0~1），无进度上报时为 null */
  progress: number | null;
  /** 上次错误 */
  error: string | null;
  /** 中止所有 in-flight 请求并重建 Worker（用于卡死恢复） */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// 内部辅助
// ---------------------------------------------------------------------------

/** 生成短随机 id，用于关联请求与响应 */
function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * in-flight 请求记录
 */
interface PendingRequest<TResult> {
  resolve: (result: TResult) => void;
  reject: (error: Error) => void;
  payload: unknown;
}

// ---------------------------------------------------------------------------
// 主 Hook
// ---------------------------------------------------------------------------

/**
 * useWorker — 通用 Web Worker Hook
 *
 * 封装 Worker 的完整生命周期：创建、消息通信、错误处理、进度上报、中止重建。
 * 泛型参数让调用方精确约束 payload 和 result 类型，获得端到端类型安全。
 *
 * 使用示例：
 * ```tsx
 * const worker = useWorker<HeavyComputePayload, HeavyComputeResult>({
 *   factory: () => new Worker(new URL('../workers/heavy-compute.worker.ts', import.meta.url)),
 *   onProgress: (p) => setProgress(p),
 * });
 *
 * const result = await worker.run({ task: 'sum', data: largeArray });
 * ```
 *
 * 架构说明：
 *   - Worker 通过 `new URL(...)` 语法创建，Next.js 14 (webpack 5) 自动编译为独立 chunk
 *   - 多个并发请求通过 id 关联，互不干扰
 *   - transfer 数组支持 ArrayBuffer 等可转移对象的零拷贝传递
 *   - reset() 终止 Worker 并重新创建，清理所有 pending 请求
 */
export function useWorker<TPayload, TResult>(
  factory: WorkerFactory,
  options: UseWorkerOptions<TPayload, TResult> = {},
): UseWorkerReturn<TPayload, TResult> {
  const { fallback, immediate = true, onProgress } = options;

  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest<TResult>>>(new Map());
  const factoryRef = useRef(factory);
  const onProgressRef = useRef(onProgress);

  // 保持最新引用，避免 stale closure
  useEffect(() => {
    factoryRef.current = factory;
    onProgressRef.current = onProgress;
  });

  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== 'undefined' && 'Worker' in window;

  // ----------------------------------------------------------------------
  // 消息处理
  // ----------------------------------------------------------------------
  const handleMessage = useCallback((event: MessageEvent<WorkerResponse<TResult>>) => {
    const res = event.data;
    if (!res || typeof res.id !== 'string') return;

    const pending = pendingRef.current.get(res.id);
    if (!pending) return; // 可能已被 reset 清理

    switch (res.type) {
      case 'progress': {
        setProgress(res.progress);
        onProgressRef.current?.(res.progress);
        break;
      }
      case 'result': {
        pendingRef.current.delete(res.id);
        setIsComputing(pendingRef.current.size > 0);
        setProgress(null);
        pending.resolve(res.result);
        break;
      }
      case 'error': {
        pendingRef.current.delete(res.id);
        setIsComputing(pendingRef.current.size > 0);
        setProgress(null);
        setError(res.error);
        pending.reject(new Error(res.error));
        break;
      }
    }
  }, []);

  // ----------------------------------------------------------------------
  // Worker 生命周期
  // ----------------------------------------------------------------------
  const createWorker = useCallback((): Worker | null => {
    if (!isSupported) return null;
    try {
      const w = factoryRef.current();
      w.addEventListener('message', handleMessage);
      w.addEventListener('error', (err) => {
        setError(err.message || 'Worker 发生错误');
        // Worker 错误后通常需要重建
        setIsComputing(false);
      });
      return w;
    } catch {
      setError('Worker 创建失败');
      return null;
    }
  }, [isSupported, handleMessage]);

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.removeEventListener('message', handleMessage);
      workerRef.current.terminate();
      workerRef.current = null;
    }
    // 拒绝所有 pending 请求
    pendingRef.current.forEach((p) => {
      p.reject(new Error('Worker 已终止'));
    });
    pendingRef.current.clear();
    setIsComputing(false);
    setProgress(null);
  }, [handleMessage]);

  // 挂载时创建 / 卸载时清理
  useEffect(() => {
    if (immediate && isSupported) {
      workerRef.current = createWorker();
    }
    return () => {
      terminateWorker();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, immediate]);

  // ----------------------------------------------------------------------
  // run: 提交任务
  // ----------------------------------------------------------------------
  const run = useCallback(
    async (payload: TPayload, transfer?: Transferable[]): Promise<TResult> => {
      setError(null);

      // Worker 不可用 → 回退主线程
      if (!workerRef.current || !isSupported) {
        if (!fallback) {
          throw new Error('Web Worker 不可用且未提供 fallback');
        }
        setIsComputing(true);
        try {
          return await fallback(payload);
        } finally {
          setIsComputing(false);
        }
      }

      const id = generateId();
      const request: WorkerRequest<TPayload> = { id, payload };

      return new Promise<TResult>((resolve, reject) => {
        pendingRef.current.set(id, {
          resolve,
          reject,
          payload,
        });
        setIsComputing(true);

        try {
          workerRef.current!.postMessage(
            request,
            transfer ?? [],
          );
        } catch (err) {
          pendingRef.current.delete(id);
          setIsComputing(pendingRef.current.size > 0);
          reject(
            err instanceof Error
              ? err
              : new Error('postMessage 失败'),
          );
        }
      });
    },
    [isSupported, fallback],
  );

  // ----------------------------------------------------------------------
  // reset: 中止并重建
  // ----------------------------------------------------------------------
  const reset = useCallback(() => {
    terminateWorker();
    setError(null);
    if (isSupported) {
      workerRef.current = createWorker();
    }
  }, [terminateWorker, createWorker, isSupported]);

  return {
    run,
    isComputing,
    isSupported,
    progress,
    error,
    reset,
  };
}
