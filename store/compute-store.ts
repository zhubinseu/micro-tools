'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ComputeStatus = 'idle' | 'computing' | 'done' | 'error';

/**
 * 通用计算状态 store
 * 供需要 Web Worker / WASM 重度计算的工具复用
 * 跟踪计算状态、耗时、错误信息
 */
interface ComputeStore {
  status: ComputeStatus;
  /** 上次计算耗时（毫秒） */
  duration: number;
  /** 错误信息 */
  error: string | null;
  /** 是否使用 Worker 加速 */
  useWorker: boolean;

  setStatus: (status: ComputeStatus) => void;
  setDuration: (ms: number) => void;
  setError: (error: string | null) => void;
  setUseWorker: (enabled: boolean) => void;
  reset: () => void;
}

export const useComputeStore = create<ComputeStore>()(
  persist(
    (set) => ({
      status: 'idle',
      duration: 0,
      error: null,
      useWorker: true,

      setStatus: (status) => set({ status }),
      setDuration: (duration) => set({ duration }),
      setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
      setUseWorker: (useWorker) => set({ useWorker }),
      reset: () =>
        set({ status: 'idle', duration: 0, error: null }),
    }),
    {
      name: 'micro-tools-compute',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ useWorker: state.useWorker }),
    }
  )
);
