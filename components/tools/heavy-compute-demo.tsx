'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Play, RotateCcw, Activity, Zap, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useWorker } from '@/hooks/use-worker';
import { useToolStore } from '@/store';
import { getToolById } from '@/lib/registry';
import type {
  HeavyComputePayload,
  HeavyComputeResult,
  HeavyComputeTask,
} from '@/lib/worker-types';

// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------

const TASK_OPTIONS: { value: HeavyComputeTask; label: string; description: string }[] = [
  { value: 'sum', label: '数组求和', description: '对大数组累加求和' },
  { value: 'sort', label: '数组排序', description: 'Timsort O(n log n)' },
  { value: 'statistics', label: '统计计算', description: '均值/方差/中位数/极值' },
  { value: 'mock-busy', label: '模拟延迟', description: '占用线程 3 秒（不做实际计算）' },
];

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

export default function HeavyComputeDemo() {
  const tool = getToolById('heavy-compute-demo')!;
  const recordUse = useToolStore((s) => s.recordUse);

  const [task, setTask] = useState<HeavyComputeTask>('sum');
  const [dataSize, setDataSize] = useState(1_000_000);
  const [result, setResult] = useState<HeavyComputeResult | null>(null);

  // Worker Hook —— 核心调用
  const worker = useWorker<HeavyComputePayload, HeavyComputeResult>(
    () => new Worker(new URL('../../workers/heavy-compute.worker.ts', import.meta.url)),
    {
      onProgress: () => {}, // 进度由 worker.progress 状态驱动 UI
    },
  );

  // 生成测试数据（纯函数，避免每次渲染重建）
  const data = useMemo(() => generateTestData(dataSize), [dataSize]);

  // 执行计算
  const handleRun = useCallback(async () => {
    setResult(null);
    const payload: HeavyComputePayload = {
      task,
      data,
      options: {
        reportProgress: true,
        order: 'asc',
        delayMs: 3000,
      },
    };
    try {
      const res = await worker.run(payload);
      setResult(res);
      recordUse(tool.id, tool.name);
    } catch {
      // 错误已由 worker.error 暴露
    }
  }, [task, data, worker, recordUse, tool]);

  const handleReset = useCallback(() => {
    worker.reset();
    setResult(null);
  }, [worker]);

  return (
    <div className="space-y-6">
      {/* ─── Worker 状态指示 ─── */}
      <WorkerStatusBar
        isSupported={worker.isSupported}
        isComputing={worker.isComputing}
        progress={worker.progress}
        error={worker.error}
      />

      {/* ─── 任务配置 ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">任务配置</CardTitle>
          <CardDescription>
            选择计算任务并配置数据量。计算在后台 Worker 线程执行，UI 保持流畅。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 任务类型 */}
          <div className="space-y-2">
            <Label>计算任务</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TASK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTask(opt.value)}
                  disabled={worker.isComputing}
                  aria-pressed={task === opt.value}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    task === opt.value
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="mt-0.5 text-xs opacity-70">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 数据量 */}
          <div className="space-y-2">
            <Label htmlFor="data-size">数据量（数组长度）</Label>
            <Input
              id="data-size"
              type="number"
              min={1000}
              max={10_000_000}
              step={1000}
              value={dataSize}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v) && v >= 1000) setDataSize(v);
              }}
              disabled={worker.isComputing}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              范围 1,000 ~ 10,000,000。数据在主线程生成后通过 postMessage 传给 Worker。
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button onClick={handleRun} disabled={worker.isComputing || !worker.isSupported}>
              {worker.isComputing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  计算中...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  执行计算
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={worker.isComputing}>
              <RotateCcw className="mr-2 h-4 w-4" />
              重置 Worker
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── UI 流畅性对比演示 ─── */}
      <FluidityDemo isComputing={worker.isComputing} />

      {/* ─── 结果展示 ─── */}
      {result && <ResultCard result={result} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Worker 状态指示条
// ---------------------------------------------------------------------------

interface WorkerStatusBarProps {
  isSupported: boolean;
  isComputing: boolean;
  progress: number | null;
  error: string | null;
}

function WorkerStatusBar({ isSupported, isComputing, progress, error }: WorkerStatusBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
      <span
        className={`inline-flex h-2 w-2 rounded-full ${
          !isSupported
            ? 'bg-amber-500'
            : isComputing
              ? 'bg-blue-500 animate-pulse'
              : 'bg-green-500'
        }`}
        aria-hidden="true"
      />
      <span className="font-medium">
        {!isSupported
          ? 'Worker 不可用'
          : isComputing
            ? 'Worker 计算中'
            : 'Worker 空闲'}
      </span>

      {progress !== null && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-blue-500 transition-all duration-150"
              style={{ width: `${Math.round(progress * 100)}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {Math.round(progress * 100)}%
          </span>
        </div>
      )}

      {error && (
        <span className="flex items-center gap-1 text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UI 流畅性对比演示
// ---------------------------------------------------------------------------

/**
 * 一个持续旋转的动画。如果在主线程计算，动画会卡顿；
 * 在 Worker 中计算时，动画保持流畅——直观对比 Worker 的价值。
 */
function FluidityDemo({ isComputing }: { isComputing: boolean }) {
  const [angle, setAngle] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      setAngle((a) => (a + 2) % 360);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Activity className="h-4 w-4 text-primary" />
          UI 流畅性指示器
        </CardTitle>
        <CardDescription>
          旋转动画由 requestAnimationFrame 驱动。Worker 计算时此动画应保持流畅；
          若改为在主线程计算，动画会明显卡顿。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/30"
            style={{
              transform: `rotate(${angle}deg)`,
              transition: 'none',
            }}
            aria-hidden="true"
          >
            <div className="h-2 w-2 rounded-full bg-primary" style={{ transform: 'translateY(-24px)' }} />
          </div>
          <div className="text-sm">
            <p className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-green-500" />
              <span className={isComputing ? 'text-green-600' : 'text-muted-foreground'}>
                {isComputing ? '动画流畅 = Worker 正在工作，主线程未阻塞' : 'Worker 空闲'}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 结果展示
// ---------------------------------------------------------------------------

function ResultCard({ result }: { result: HeavyComputeResult }) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-base">计算结果</CardTitle>
        <CardDescription>
          任务: {result.task} · 数据量: {result.dataSize.toLocaleString()} · 耗时: {result.durationMs}ms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.sum !== undefined && (
          <ResultRow label="求和结果" value={result.sum.toLocaleString()} />
        )}

        {result.sorted && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">排序结果（前 20 项）</p>
            <pre className="overflow-auto rounded bg-muted p-3 text-xs font-mono">
              [{result.sorted.slice(0, 20).join(', ')}
              {result.sorted.length > 20 ? ', ...' : ''}]
            </pre>
          </div>
        )}

        {result.stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="数量" value={result.stats.count.toLocaleString()} />
            <StatBox label="均值" value={result.stats.mean.toFixed(4)} />
            <StatBox label="方差" value={result.stats.variance.toFixed(4)} />
            <StatBox label="标准差" value={result.stats.stdDev.toFixed(4)} />
            <StatBox label="最小值" value={result.stats.min.toLocaleString()} />
            <StatBox label="最大值" value={result.stats.max.toLocaleString()} />
            <StatBox label="中位数" value={result.stats.median.toFixed(4)} />
          </div>
        )}

        {result.task === 'mock-busy' && (
          <p className="text-sm text-muted-foreground">
            模拟延迟任务已完成。Worker 占用了 {result.durationMs}ms 线程时间，但 UI 动画保持流畅。
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <code className="rounded bg-muted px-2 py-1 text-sm font-mono">{value}</code>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 生成测试数据（随机浮点数数组） */
function generateTestData(size: number): number[] {
  // 使用普通循环生成，比 Array.from + map 快
  const arr = new Array<number>(size);
  for (let i = 0; i < size; i++) {
    arr[i] = Math.random() * 1000;
  }
  return arr;
}
