'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * useToolHistory - 每工具本地历史记录 Hook
 *
 * 使用 localStorage 持久化每个工具最近 N 次操作。
 * 历史按工具 id (slug) 隔离，互不干扰。
 *
 * 存储格式：
 *   key:   `micro-tools:history:<toolId>`
 *   value: HistoryEntry[] (JSON, 最新在前)
 *
 * 默认保留 5 条，可通过 maxItems 参数调整。
 */

export interface HistoryEntry {
  /** 操作时间戳 (ms) */
  timestamp: number;
  /** 输入内容快照 */
  input: string;
  /** 输出内容快照 */
  output: string;
  /** 可选的操作标签（如 "encode" / "decode"） */
  label?: string;
}

interface UseToolHistoryOptions {
  /** 最多保留多少条历史，默认 5 */
  maxItems?: number;
}

interface UseToolHistoryResult {
  /** 历史记录列表（最新在前） */
  history: HistoryEntry[];
  /** 添加一条历史记录。自动去重（相同 input+label 只保留最新）并截断到 maxItems */
  addEntry: (entry: Omit<HistoryEntry, 'timestamp'>) => void;
  /** 清空该工具的所有历史 */
  clear: () => void;
  /** 删除指定时间戳的记录 */
  remove: (timestamp: number) => void;
  /** 该工具是否已有历史 */
  hasHistory: boolean;
}

const STORAGE_PREFIX = 'micro-tools:history:';
const DEFAULT_MAX = 5;

function getStorageKey(toolId: string): string {
  return `${STORAGE_PREFIX}${toolId}`;
}

/**
 * 安全读取 localStorage（SSR / 隐私模式下返回空数组）
 */
function readHistory(toolId: string): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey(toolId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
}

/**
 * 安全写入 localStorage
 */
function writeHistory(toolId: string, entries: HistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getStorageKey(toolId),
      JSON.stringify(entries),
    );
  } catch {
    // 配额超限或隐私模式，静默失败
  }
}

function isValidEntry(v: unknown): v is HistoryEntry {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.timestamp === 'number' &&
    typeof e.input === 'string' &&
    typeof e.output === 'string'
  );
}

/**
 * @param toolId - 工具 id（对应 ToolMeta.id / slug）
 * @param options - 可选配置
 */
export function useToolHistory(
  toolId: string,
  options: UseToolHistoryOptions = {},
): UseToolHistoryResult {
  const maxItems = options.maxItems ?? DEFAULT_MAX;
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // 初始化：从 localStorage 读取
  useEffect(() => {
    setHistory(readHistory(toolId));
  }, [toolId]);

  // 跨标签页同步：监听 storage 事件
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === getStorageKey(toolId)) {
        setHistory(readHistory(toolId));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [toolId]);

  const addEntry = useCallback(
    (entry: Omit<HistoryEntry, 'timestamp'>) => {
      setHistory((prev) => {
        const newEntry: HistoryEntry = {
          ...entry,
          timestamp: Date.now(),
        };

        // 去重：相同 input + label 的记录只保留最新一条
        const deduped = prev.filter(
          (e) =>
            !(e.input === newEntry.input && e.label === newEntry.label),
        );

        // 插入到最前并截断
        const next = [newEntry, ...deduped].slice(0, maxItems);

        writeHistory(toolId, next);
        return next;
      });
    },
    [toolId, maxItems],
  );

  const clear = useCallback(() => {
    setHistory([]);
    writeHistory(toolId, []);
  }, [toolId]);

  const remove = useCallback(
    (timestamp: number) => {
      setHistory((prev) => {
        const next = prev.filter((e) => e.timestamp !== timestamp);
        writeHistory(toolId, next);
        return next;
      });
    },
    [toolId],
  );

  return {
    history,
    addEntry,
    clear,
    remove,
    hasHistory: history.length > 0,
  };
}
