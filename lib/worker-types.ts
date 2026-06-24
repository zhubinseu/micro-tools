/**
 * Web Worker 共享类型定义
 *
 * 将 Worker 与 Hook 之间通信的消息类型放在此独立文件，
 * 使 workers/ 目录下的脚本可以被 tsconfig 排除（避免 webworker 全局类型冲突），
 * 同时前端代码仍可安全导入这些类型。
 */

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
