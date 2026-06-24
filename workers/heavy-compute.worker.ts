/// <reference lib="webworker" />

/**
 * 重型计算 Web Worker（boilerplate 示例）
 *
 * 演示如何将 CPU 密集型任务从主线程卸载到后台 Worker，保持 UI 流畅。
 *
 * 支持的任务：
 *   - sum:         大数组求和（演示纯计算）
 *   - sort:        大数组排序（演示 O(n log n) 计算）
 *   - statistics:  统计计算（均值/方差/中位数，演示多步骤计算 + 进度上报）
 *   - mock-busy:   模拟延迟（不做实际计算，仅占用线程，用于对比演示）
 *
 * 消息协议（见 lib/worker-types.ts）：
 *   入: HeavyComputeRequest = { id, payload: { task, data, options } }
 *   出: HeavyComputeResponse =
 *        | { id, type: 'progress', progress }
 *        | { id, type: 'result', result }
 *        | { id, type: 'error', error }
 *
 * 关键设计：
 *   1. 进度上报：长任务分批处理，每批完成后 postMessage({ type: 'progress' })
 *   2. 错误隔离：所有计算包在 try/catch 中，错误通过 type:'error' 返回，不崩溃 Worker
 *   3. 可中止：主线程可随时 terminate() Worker，无需 Worker 配合
 *   4. 纯函数：Worker 无副作用，相同输入产生相同输出
 */

import type {
  HeavyComputeRequest,
  HeavyComputeResponse,
  HeavyComputePayload,
  HeavyComputeResult,
} from '@/lib/worker-types';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/**
 * 生成进度上报函数
 * 返回一个闭包，调用时会 postMessage({ type: 'progress', progress })
 */
function createProgressReporter(id: string, enabled: boolean) {
  if (!enabled) return () => {};
  return (progress: number) => {
    const msg: HeavyComputeResponse = {
      id,
      type: 'progress',
      progress: Math.max(0, Math.min(1, progress)),
    };
    ctx.postMessage(msg);
  };
}

/**
 * 分批处理大数组，避免单次同步计算过久（即使是 Worker 内也分批，便于上报进度）
 */
function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[], batchIndex: number) => R,
  onProgress?: (progress: number) => void,
): R[] {
  const results: R[] = [];
  const total = items.length;
  for (let i = 0; i < total; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(processor(batch, i / batchSize));
    if (onProgress) {
      onProgress((i + batch.length) / total);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// 任务实现
// ---------------------------------------------------------------------------

/** 大数组求和 */
function computeSum(data: number[], onProgress?: (p: number) => void): number {
  // 分批求和，演示进度上报（实际求和可直接 reduce，这里为演示分批）
  const batchSize = Math.max(1, Math.floor(data.length / 10));
  const partialSums = processInBatches(
    data,
    batchSize,
    (batch) => batch.reduce((a, b) => a + b, 0),
    onProgress,
  );
  return partialSums.reduce((a, b) => a + b, 0);
}

/** 大数组排序 */
function computeSort(
  data: number[],
  order: 'asc' | 'desc',
  onProgress?: (p: number) => void,
): number[] {
  // 复制原数组，避免修改输入
  const arr = [...data];
  // 使用原生 sort（V8 使用 Timsort，O(n log n)）
  arr.sort((a, b) => (order === 'asc' ? a - b : b - a));
  // 上报一次完成进度
  if (onProgress) onProgress(1);
  return arr;
}

/** 统计计算：均值/方差/标准差/中位数/极值 */
function computeStatistics(
  data: number[],
  onProgress?: (p: number) => void,
): HeavyComputeResult['stats'] {
  const n = data.length;
  if (n === 0) {
    return {
      count: 0, mean: 0, variance: 0, stdDev: 0,
      min: 0, max: 0, median: 0,
    };
  }

  // 第一遍：求和 + 极值
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  const batchSize = Math.max(1, Math.floor(n / 5));
  processInBatches(
    data,
    batchSize,
    (batch) => {
      for (const v of batch) {
        sum += v;
        if (v < min) min = v;
        if (v > max) max = v;
      }
    },
    (p) => onProgress?.(p * 0.5), // 第一阶段占 50% 进度
  );

  const mean = sum / n;

  // 第二遍：方差
  let sqSum = 0;
  processInBatches(
    data,
    batchSize,
    (batch) => {
      for (const v of batch) {
        sqSum += (v - mean) ** 2;
      }
    },
    (p) => onProgress?.(0.5 + p * 0.3), // 第二阶段占 30%
  );

  const variance = sqSum / n;
  const stdDev = Math.sqrt(variance);

  // 第三遍：中位数（需要排序，复制避免影响原数组）
  const sorted = [...data].sort((a, b) => a - b);
  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

  if (onProgress) onProgress(1);

  return {
    count: n,
    mean,
    variance,
    stdDev,
    min,
    max,
    median,
  };
}

/** 模拟延迟（纯演示，占用线程但不做实际计算） */
function mockBusy(delayMs: number, onProgress?: (p: number) => void): void {
  const start = Date.now();
  const interval = 100; // 每 100ms 上报一次进度
  while (Date.now() - start < delayMs) {
    // 上报进度
    if (onProgress) {
      const elapsed = Date.now() - start;
      onProgress(Math.min(1, elapsed / delayMs));
      // 间歇性上报，避免消息过载
      const wait = Math.min(interval, delayMs - elapsed);
      if (wait > 0) {
        // 使用同步循环消耗时间（模拟 CPU 占用）
        const blockEnd = Date.now() + wait;
        while (Date.now() < blockEnd) {
          // 空转
        }
      }
    } else {
      // 无进度上报时，整段空转
      const blockEnd = Date.now() + delayMs;
      while (Date.now() < blockEnd) {
        // 空转
      }
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// 消息处理（主入口）
// ---------------------------------------------------------------------------

ctx.addEventListener('message', async (event: MessageEvent<HeavyComputeRequest>) => {
  const { id, payload } = event.data;
  const startTime = Date.now();

  const reportProgress = createProgressReporter(
    id,
    payload.options?.reportProgress ?? false,
  );

  try {
    const result = await executeTask(payload, reportProgress);
    const durationMs = Date.now() - startTime;

    const response: HeavyComputeResponse = {
      id,
      type: 'result',
      result: {
        ...result,
        durationMs,
        dataSize: payload.data.length,
      },
    };
    ctx.postMessage(response);
  } catch (err) {
    const response: HeavyComputeResponse = {
      id,
      type: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
    ctx.postMessage(response);
  }
});

/**
 * 根据 task 类型分发到具体计算函数
 */
function executeTask(
  payload: HeavyComputePayload,
  onProgress: (p: number) => void,
): Omit<HeavyComputeResult, 'durationMs' | 'dataSize'> {
  const { task, data, options } = payload;

  switch (task) {
    case 'sum': {
      const sum = computeSum(data, onProgress);
      return { task, sum };
    }

    case 'sort': {
      const sorted = computeSort(
        data,
        options?.order ?? 'asc',
        onProgress,
      );
      return { task, sorted };
    }

    case 'statistics': {
      const stats = computeStatistics(data, onProgress);
      return { task, stats };
    }

    case 'mock-busy': {
      mockBusy(options?.delayMs ?? 2000, onProgress);
      return { task };
    }

    default: {
      // 编译期穷尽性检查：如果新增 task 类型但未处理，TS 会在此报错
      const _exhaustive: never = task;
      throw new Error(`未知任务类型: ${_exhaustive}`);
    }
  }
}
