/**
 * Web Worker 共享类型定义
 *
 * 将 Worker 与 Hook 之间通信的消息类型放在此独立文件，
 * 使 workers/ 目录下的脚本可以被 tsconfig 排除（避免 webworker 全局类型冲突），
 * 同时前端代码仍可安全导入这些类型。
 */

// ---------------------------------------------------------------------------
// 通用消息协议（供 useWorker<TReq, TRes> 使用）
// ---------------------------------------------------------------------------

/**
 * 通用请求包装：带 id 用于关联响应
 */
export interface WorkerRequest<TPayload = unknown> {
  /** 请求 id，由 useWorker 生成，用于关联请求与响应 */
  id: string;
  /** 业务负载 */
  payload: TPayload;
}

/**
 * 通用响应（联合类型：成功 | 进度 | 错误）
 */
export type WorkerResponse<TResult = unknown> =
  | { id: string; type: 'result'; result: TResult }
  | { id: string; type: 'progress'; progress: number } // progress: 0~1
  | { id: string; type: 'error'; error: string };

// ---------------------------------------------------------------------------
// 哈希计算 Worker（已实现，参考用）
// ---------------------------------------------------------------------------

export interface HashRequest {
  id: string;
  /** 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' */
  algorithm: string;
  /** 接受 ArrayBuffer 或 ArrayBufferView（如 Uint8Array），crypto.subtle.digest 原生支持 */
  data: BufferSource;
}

export interface HashResponse {
  id: string;
  hash?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// 重型计算 Worker（boilerplate 示例）
// ---------------------------------------------------------------------------

/**
 * 重型计算任务类型
 * 每种 task 对应 Worker 内的一个计算函数
 */
export type HeavyComputeTask =
  | 'sum'            // 大数组求和
  | 'sort'           // 大数组排序
  | 'statistics'     // 统计（均值/方差/中位数）
  | 'mock-busy';     // 模拟延迟（纯演示，不做实际计算）

/**
 * 重型计算请求 payload
 */
export interface HeavyComputePayload {
  /** 计算任务类型 */
  task: HeavyComputeTask;
  /** 输入数据（数字数组） */
  data: number[];
  /** 可选参数（如排序顺序、统计分位数等） */
  options?: {
    order?: 'asc' | 'desc';
    /** 是否上报进度（大任务建议开启） */
    reportProgress?: boolean;
    /** 模拟延迟毫秒数（仅 mock-busy 使用） */
    delayMs?: number;
  };
}

/**
 * 重型计算结果
 */
export interface HeavyComputeResult {
  /** 任务类型，回显请求 */
  task: HeavyComputeTask;
  /** 求和结果（task=sum 时有效） */
  sum?: number;
  /** 排序后数组（task=sort 时有效） */
  sorted?: number[];
  /** 统计结果（task=statistics 时有效） */
  stats?: {
    count: number;
    mean: number;
    variance: number;
    stdDev: number;
    min: number;
    max: number;
    median: number;
  };
  /** 实际计算耗时（毫秒） */
  durationMs: number;
  /** 处理的数据量 */
  dataSize: number;
}

/**
 * 便捷别名：重型计算 Worker 的请求/响应类型
 */
export type HeavyComputeRequest = WorkerRequest<HeavyComputePayload>;
export type HeavyComputeResponse = WorkerResponse<HeavyComputeResult>;
