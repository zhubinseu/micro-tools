/**
 * Zustand 状态管理统一出口
 *
 * 当前包含：
 * - useToolStore: 最近使用 / 收藏工具记录（持久化）
 * - useComputeStore: 通用计算状态（用于 Worker / WASM 工具）
 *
 * 新增 store 时在此处 re-export，保持导入路径统一为 `@/store`
 */
export { useToolStore } from './tool-store';
export { useComputeStore } from './compute-store';
export type { ComputeStatus } from './compute-store';
