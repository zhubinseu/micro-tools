'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  X,
  Download,
  Loader2,
  ImageDown,
  AlertCircle,
  Lock,
  Unlock,
  Images,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Workspace, type WorkspaceController } from '@/components/workspace';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

type OutputFormat = 'image/jpeg' | 'image/webp' | 'image/png' | 'original';

interface SourceImage {
  id: string;
  file: File;
  name: string;
  originalType: string;
  originalSize: number;
  width: number;
  height: number;
  url: string; // object URL
}

interface ProcessedItem {
  sourceId: string;
  name: string;
  blob: Blob;
  size: number;
  width: number;
  height: number;
  url: string;
  type: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
}

interface CompressOptions {
  format: OutputFormat;
  quality: number;
  targetWidth: number | null;
  targetHeight: number | null;
  maintainAspect: boolean;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILES = 20;

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

export default function ImageCompressor() {
  const [sources, setSources] = useState<SourceImage[]>([]);
  const [results, setResults] = useState<ProcessedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 压缩参数
  const [format, setFormat] = useState<OutputFormat>('image/jpeg');
  const [quality, setQuality] = useState(0.8);
  const [targetWidth, setTargetWidth] = useState<number | ''>('');
  const [targetHeight, setTargetHeight] = useState<number | ''>('');
  const [maintainAspect, setMaintainAspect] = useState(true);

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);

  // 捕获 Workspace controller（在 children 渲染函数中设置）
  // 用于在 useEffect / 事件处理器中调用 setOutput / commitHistory
  const controllerRef = useRef<WorkspaceController | null>(null);

  // ---- 文件处理 ----
  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) =>
      ACCEPTED_TYPES.includes(f.type),
    );
    if (files.length === 0) {
      setError('请选择 PNG、JPEG 或 WebP 格式的图片');
      return;
    }
    setError(null);

    const toAdd: SourceImage[] = [];
    for (const file of files.slice(0, MAX_FILES)) {
      try {
        const { width, height, url } = await loadImage(file);
        toAdd.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          name: file.name,
          originalType: file.type,
          originalSize: file.size,
          width,
          height,
          url,
        });
      } catch {
        // 单个文件加载失败，跳过
      }
    }
    if (toAdd.length > 0) setSources((prev) => [...prev, ...toAdd]);
  }, []);

  const removeSource = useCallback((id: string) => {
    setSources((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setSources((prev) => {
      prev.forEach((s) => URL.revokeObjectURL(s.url));
      return [];
    });
    setResults((prev) => {
      prev.forEach((r) => URL.revokeObjectURL(r.url));
      return [];
    });
  }, []);

  // ---- 压缩参数 memo ----
  const options: CompressOptions = useMemo(
    () => ({
      format,
      quality,
      targetWidth: targetWidth === '' ? null : targetWidth,
      targetHeight: targetHeight === '' ? null : targetHeight,
      maintainAspect,
    }),
    [format, quality, targetWidth, targetHeight, maintainAspect],
  );

  // ---- 压缩处理（防抖 250ms）----
  useEffect(() => {
    if (sources.length === 0) {
      setResults((prev) => {
        prev.forEach((r) => URL.revokeObjectURL(r.url));
        return [];
      });
      return;
    }
    setIsProcessing(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      // 撤销旧的 result URLs
      setResults((prev) => {
        prev.forEach((r) => URL.revokeObjectURL(r.url));
        return [];
      });

      const out: ProcessedItem[] = [];
      for (const src of sources) {
        if (cancelled) return;
        try {
          const processed = await compressImage(src, options);
          if (cancelled) {
            URL.revokeObjectURL(processed.url);
            return;
          }
          out.push({
            sourceId: src.id,
            name: buildOutputName(src.name, options.format),
            blob: processed.blob,
            size: processed.size,
            width: processed.width,
            height: processed.height,
            url: processed.url,
            type: processed.type,
            originalSize: src.originalSize,
            originalWidth: src.width,
            originalHeight: src.height,
          });
        } catch {
          // 单个压缩失败，跳过
        }
      }
      if (!cancelled) {
        setResults(out);
        setIsProcessing(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sources, options]);

  // ---- 下载 ----
  const handleDownload = useCallback((item: ProcessedItem) => {
    downloadBlob(item.blob, item.name);
  }, []);

  const handleDownloadAll = useCallback(() => {
    results.forEach((item, idx) => {
      setTimeout(() => downloadBlob(item.blob, item.name), idx * 250);
    });
  }, [results]);

  // ---- 记录到历史 ----
  const handleCommitHistory = useCallback(() => {
    const summary = outputSummaryFor(results);
    if (summary) {
      controllerRef.current?.commitHistory({
        input: `${results.length} 张图片`,
        output: summary,
        label: 'compress',
      });
    }
  }, [results]);

  // ---- 同步压缩结果摘要到 Workspace output（使工具栏"复制输出"可用）----
  const outputSummary = useMemo(() => outputSummaryFor(results), [results]);

  useEffect(() => {
    controllerRef.current?.setOutput(outputSummary);
  }, [outputSummary]);

  // ---- 卸载时清理 object URLs ----
  useEffect(() => {
    return () => {
      // 组件卸载时无法访问最新 state，这里用闭包外的 ref 兜底
      // 实际清理主要靠 removeSource / clearAll / reprocess 中的撤销
    };
  }, []);

  // ---- Workspace 渲染函数 ----
  const renderInput = useCallback(() => {
    return (
      <Dropzone
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        onFiles={addFiles}
        sources={sources}
        onRemove={removeSource}
        error={error}
      />
    );
  }, [isDragging, addFiles, sources, removeSource, error]);

  const renderOutput = useCallback(() => {
    return (
      <ResultsPanel
        results={results}
        isProcessing={isProcessing}
        onDownload={handleDownload}
        onDownloadAll={handleDownloadAll}
      />
    );
  }, [results, isProcessing, handleDownload, handleDownloadAll]);

  const renderChildren = useCallback(
    (controller: WorkspaceController) => {
      // 捕获 controller 供 useEffect / 事件处理器使用
      controllerRef.current = controller;
      return (
        <ControlsDock
          format={format}
          setFormat={setFormat}
          quality={quality}
          setQuality={setQuality}
          targetWidth={targetWidth}
          setTargetWidth={setTargetWidth}
          targetHeight={targetHeight}
          setTargetHeight={setTargetHeight}
          maintainAspect={maintainAspect}
          setMaintainAspect={setMaintainAspect}
          hasSources={sources.length > 0}
          onClear={clearAll}
          onCommitHistory={handleCommitHistory}
          canCommit={outputSummary.length > 0}
        />
      );
    },
    [
      format,
      quality,
      targetWidth,
      targetHeight,
      maintainAspect,
      sources.length,
      clearAll,
      handleCommitHistory,
      outputSummary,
    ],
  );

  return (
    <Workspace
      toolId="image-compressor"
      inputTitle="源图片"
      outputTitle="压缩结果"
      splitView={true}
      renderInput={renderInput}
      renderOutput={renderOutput}
    >
      {renderChildren}
    </Workspace>
  );
}

// ---------------------------------------------------------------------------
// 拖拽区 + 源图片列表
// ---------------------------------------------------------------------------

interface DropzoneProps {
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  onFiles: (files: FileList | File[]) => void;
  sources: SourceImage[];
  onRemove: (id: string) => void;
  error: string | null;
}

function Dropzone({
  isDragging,
  setIsDragging,
  onFiles,
  sources,
  onRemove,
  error,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {/* 拖拽区 */}
      <div
        role="button"
        tabIndex={0}
        aria-label="拖拽图片到此处或点击选择文件，支持 PNG、JPEG、WebP"
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30',
        )}
      >
        <Upload
          className={cn(
            'h-8 w-8 transition-colors',
            isDragging ? 'text-primary' : 'text-muted-foreground',
          )}
        />
        <div>
          <p className="text-sm font-medium">拖拽图片到此处，或点击选择</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            支持 PNG / JPEG / WebP，最多 {MAX_FILES} 张
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onFiles(e.target.files);
            e.target.value = ''; // 允许重复选择同一文件
          }}
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          role="alert"
          className="flex animate-fade-in items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* 源图片列表 */}
      {sources.length > 0 && (
        <ul
          className="flex-1 space-y-2 overflow-auto"
          aria-label="源图片列表"
        >
          {sources.map((src) => (
            <li
              key={src.id}
              className="flex items-center gap-3 rounded-md border bg-card p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src.url}
                alt={src.name}
                className="h-12 w-12 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium" title={src.name}>
                  {src.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {src.width}×{src.height} · {formatBytes(src.originalSize)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onRemove(src.id)}
                aria-label={`移除 ${src.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 控制台（滑块 + 格式 + 操作）
// ---------------------------------------------------------------------------

interface ControlsDockProps {
  format: OutputFormat;
  setFormat: (f: OutputFormat) => void;
  quality: number;
  setQuality: (q: number) => void;
  targetWidth: number | '';
  setTargetWidth: (v: number | '') => void;
  targetHeight: number | '';
  setTargetHeight: (v: number | '') => void;
  maintainAspect: boolean;
  setMaintainAspect: (v: boolean) => void;
  hasSources: boolean;
  onClear: () => void;
  onCommitHistory: () => void;
  canCommit: boolean;
}

function ControlsDock({
  format,
  setFormat,
  quality,
  setQuality,
  targetWidth,
  setTargetWidth,
  targetHeight,
  setTargetHeight,
  maintainAspect,
  setMaintainAspect,
  hasSources,
  onClear,
  onCommitHistory,
  canCommit,
}: ControlsDockProps) {
  const qualityDisabled = format === 'image/png';

  const formatOptions: { value: OutputFormat; label: string; hint: string }[] = [
    { value: 'image/jpeg', label: 'JPEG', hint: '有损·体积小' },
    { value: 'image/webp', label: 'WebP', hint: '有损·更优压缩' },
    { value: 'image/png', label: 'PNG', hint: '无损·质量不可调' },
    { value: 'original', label: '保留原格式', hint: '按源格式输出' },
  ];

  return (
    <div
      role="group"
      aria-label="压缩参数设置"
      className="space-y-4 rounded-lg border bg-card p-4"
    >
      {/* 格式选择 */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          输出格式
        </label>
        <div
          className="flex flex-wrap gap-1.5"
          role="radiogroup"
          aria-label="输出格式"
        >
          {formatOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={format === opt.value}
              onClick={() => setFormat(opt.value)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs transition-colors',
                format === opt.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-muted',
              )}
            >
              <span className="font-medium">{opt.label}</span>
              <span className="ml-1.5 text-[10px] opacity-70">{opt.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 质量滑块 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="quality-slider"
            className="text-xs font-semibold text-muted-foreground"
          >
            压缩质量
          </label>
          <span className="font-mono text-xs tabular-nums">
            {qualityDisabled ? '— (PNG 无损)' : quality.toFixed(2)}
          </span>
        </div>
        <input
          id="quality-slider"
          type="range"
          min={0.1}
          max={1.0}
          step={0.05}
          value={quality}
          disabled={qualityDisabled}
          onChange={(e) => setQuality(parseFloat(e.target.value))}
          aria-label="压缩质量，范围 0.1 到 1.0"
          aria-valuemin={0.1}
          aria-valuemax={1.0}
          aria-valuenow={quality}
          className={cn(
            'h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary',
            qualityDisabled && 'cursor-not-allowed opacity-50',
          )}
        />
      </div>

      {/* 目标尺寸 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground">
            目标尺寸（留空保持原尺寸）
          </label>
          <button
            type="button"
            onClick={() => setMaintainAspect(!maintainAspect)}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-pressed={maintainAspect}
            aria-label={maintainAspect ? '关闭锁定纵横比' : '开启锁定纵横比'}
          >
            {maintainAspect ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Unlock className="h-3 w-3" />
            )}
            {maintainAspect ? '锁定比例' : '自由比例'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label htmlFor="width-input" className="sr-only">
              目标宽度（像素）
            </label>
            <input
              id="width-input"
              type="number"
              min={1}
              placeholder="宽"
              value={targetWidth}
              onChange={(e) =>
                setTargetWidth(
                  e.target.value === ''
                    ? ''
                    : Math.max(1, parseInt(e.target.value) || 1),
                )
              }
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <span className="text-xs text-muted-foreground">×</span>
          <div className="flex-1">
            <label htmlFor="height-input" className="sr-only">
              目标高度（像素）
            </label>
            <input
              id="height-input"
              type="number"
              min={1}
              placeholder="高"
              value={targetHeight}
              onChange={(e) =>
                setTargetHeight(
                  e.target.value === ''
                    ? ''
                    : Math.max(1, parseInt(e.target.value) || 1),
                )
              }
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <span className="text-[11px] text-muted-foreground">px</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          disabled={!hasSources}
          aria-label="清空所有图片"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          清空全部
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canCommit}
          onClick={onCommitHistory}
          aria-label="保存当前压缩结果到历史记录"
        >
          <ImageDown className="mr-1.5 h-3.5 w-3.5" />
          记录结果
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        所有处理在浏览器本地完成，图片不会上传到任何服务器。
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 结果面板
// ---------------------------------------------------------------------------

interface ResultsPanelProps {
  results: ProcessedItem[];
  isProcessing: boolean;
  onDownload: (item: ProcessedItem) => void;
  onDownloadAll: () => void;
}

function ResultsPanel({
  results,
  isProcessing,
  onDownload,
  onDownloadAll,
}: ResultsPanelProps) {
  if (isProcessing && results.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">正在压缩...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
        <Images className="h-10 w-10 opacity-40" />
        <span className="text-sm">添加图片后，压缩结果将在此显示</span>
      </div>
    );
  }

  const totalBefore = results.reduce((s, r) => s + r.originalSize, 0);
  const totalAfter = results.reduce((s, r) => s + r.size, 0);
  const totalSaved = totalBefore - totalAfter;
  const savedPercent =
    totalBefore > 0 ? Math.round((totalSaved / totalBefore) * 100) : 0;

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {/* 汇总栏 */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground">总计</span>
          <span className="font-mono text-sm font-semibold tabular-nums">
            {formatBytes(totalBefore)}
          </span>
          <span className="text-xs text-muted-foreground">→</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">
            {formatBytes(totalAfter)}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-medium',
              totalSaved >= 0
                ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                : 'bg-red-500/15 text-red-600 dark:text-red-400',
            )}
          >
            {totalSaved >= 0 ? `省 ${savedPercent}%` : `大 ${Math.abs(savedPercent)}%`}
          </span>
        </div>
        <Button
          size="sm"
          onClick={onDownloadAll}
          className="ml-auto"
          aria-label="下载所有压缩后的图片"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          全部下载
        </Button>
      </div>

      {/* 结果列表 */}
      <ul
        className="flex-1 space-y-2 overflow-auto"
        aria-label="压缩结果列表"
      >
        {results.map((item) => {
          const ratio =
            item.originalSize > 0 ? item.size / item.originalSize : 1;
          const itemSaved = item.originalSize - item.size;
          const itemSavedPct =
            item.originalSize > 0
              ? Math.round((itemSaved / item.originalSize) * 100)
              : 0;
          const dimsChanged =
            item.width !== item.originalWidth ||
            item.height !== item.originalHeight;

          return (
            <li
              key={item.sourceId}
              className="flex items-center gap-3 rounded-md border bg-card p-2.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.name}
                className="h-14 w-14 shrink-0 rounded border object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium" title={item.name}>
                  {item.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {dimsChanged ? (
                    <>
                      {item.originalWidth}×{item.originalHeight}
                      <span className="mx-1">→</span>
                      {item.width}×{item.height}
                    </>
                  ) : (
                    <>{item.width}×{item.height}</>
                  )}
                  <span className="mx-1.5">·</span>
                  <span className="font-mono">
                    {item.type.split('/')[1].toUpperCase()}
                  </span>
                </p>
                {/* 大小对比条 */}
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {formatBytes(item.originalSize)}
                  </span>
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`压缩后体积为原来的 ${Math.round(ratio * 100)}%`}
                  >
                    <div
                      className={cn(
                        'h-full rounded-full',
                        itemSaved >= 0 ? 'bg-green-500' : 'bg-red-500',
                      )}
                      style={{ width: `${Math.min(100, ratio * 100)}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      'font-mono text-[11px] font-semibold tabular-nums',
                      itemSaved >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {formatBytes(item.size)}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
                      itemSaved >= 0
                        ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400',
                    )}
                  >
                    {itemSaved >= 0
                      ? `-${itemSavedPct}%`
                      : `+${Math.abs(itemSavedPct)}%`}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(item)}
                className="shrink-0"
                aria-label={`下载 ${item.name}`}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 格式化字节数为人类可读字符串 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** 根据结果列表生成摘要字符串 */
function outputSummaryFor(results: ProcessedItem[]): string {
  if (results.length === 0) return '';
  const totalBefore = results.reduce((s, r) => s + r.originalSize, 0);
  const totalAfter = results.reduce((s, r) => s + r.size, 0);
  const saved =
    totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0;
  return `已压缩 ${results.length} 张图片：${formatBytes(totalBefore)} → ${formatBytes(totalAfter)}（节省 ${saved}%）`;
}

/** 加载图片并获取尺寸 */
function loadImage(
  file: File,
): Promise<{ width: number; height: number; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        url,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };
    img.src = url;
  });
}

/** 计算目标尺寸 */
function calcDimensions(
  origW: number,
  origH: number,
  targetW: number | null,
  targetH: number | null,
  maintainAspect: boolean,
): { w: number; h: number } {
  if (!targetW && !targetH) return { w: origW, h: origH };

  if (maintainAspect) {
    // 等比缩放，适配目标框（contain）
    const scaleX = targetW ? targetW / origW : Infinity;
    const scaleY = targetH ? targetH / origH : Infinity;
    const scale = Math.min(scaleX, scaleY);
    if (!isFinite(scale)) {
      // 只有一个维度，按该维度缩放
      const s = isFinite(scaleX) ? scaleX : scaleY;
      return {
        w: Math.max(1, Math.round(origW * s)),
        h: Math.max(1, Math.round(origH * s)),
      };
    }
    return {
      w: Math.max(1, Math.round(origW * scale)),
      h: Math.max(1, Math.round(origH * scale)),
    };
  }

  // 自由比例
  return {
    w: targetW ?? origW,
    h: targetH ?? origH,
  };
}

/** 使用 Canvas 压缩图片 */
async function compressImage(
  source: SourceImage,
  opts: CompressOptions,
): Promise<{
  blob: Blob;
  size: number;
  width: number;
  height: number;
  url: string;
  type: string;
}> {
  const img = new Image();
  img.src = source.url;
  await img.decode();

  const { w, h } = calcDimensions(
    img.naturalWidth,
    img.naturalHeight,
    opts.targetWidth,
    opts.targetHeight,
    opts.maintainAspect,
  );

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法获取 Canvas 2D 上下文');

  // JPEG 不支持透明，填充白色背景
  const outType = opts.format === 'original' ? source.originalType : opts.format;
  if (outType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.drawImage(img, 0, 0, w, h);

  // PNG 为无损格式，quality 参数无效
  const effectiveQuality =
    outType === 'image/png' ? undefined : opts.quality;

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outType, effectiveQuality);
  });

  if (!blob) throw new Error('压缩失败：浏览器可能不支持该格式导出');

  return {
    blob,
    size: blob.size,
    width: w,
    height: h,
    url: URL.createObjectURL(blob),
    type: outType,
  };
}

/** 构建输出文件名 */
function buildOutputName(
  originalName: string,
  format: OutputFormat,
): string {
  const dotIdx = originalName.lastIndexOf('.');
  const base = dotIdx > 0 ? originalName.slice(0, dotIdx) : originalName;
  if (format === 'original') return originalName;
  const ext = format.split('/')[1];
  return `${base}.${ext}`;
}

/** 触发文件下载 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 延迟撤销，确保下载已触发
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
