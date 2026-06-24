/// <reference lib="webworker" />

import type { HashRequest, HashResponse } from '@/lib/worker-types';

/**
 * 哈希计算 Web Worker
 *
 * 在后台线程执行 SubtleCrypto 哈希运算，避免阻塞 UI。
 * 对于大文件或批量计算时尤其重要。
 *
 * 消息协议：
 *   入: { id: string; algorithm: string; data: ArrayBuffer }
 *   出: { id: string; hash: string } | { id: string; error: string }
 */

self.addEventListener('message', async (event: MessageEvent<HashRequest>) => {
  const { id, algorithm, data } = event.data;

  try {
    // SubtleCrypto 在 Worker 中同样可用，且不阻塞主线程
    const digest = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(digest));
    const hash = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const response: HashResponse = { id, hash };
    (self as DedicatedWorkerGlobalScope).postMessage(response);
  } catch (err) {
    const response: HashResponse = {
      id,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
    (self as DedicatedWorkerGlobalScope).postMessage(response);
  }
});
