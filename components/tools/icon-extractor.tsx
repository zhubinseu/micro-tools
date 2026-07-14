'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  Scissors,
  Download,
  Loader2,
  AlertCircle,
  Images,
  RefreshCw,
  Crop,
  Plus,
  Minus,
  Maximize,
  Maximize2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  extractIcons,
  loadImageElement,
  canvasToPngBlob,
  downloadBlob,
  DEFAULT_OPTIONS,
  type Region,
  type ExtractOptions,
  type ExtractedIcon,
} from '@/lib/icon-extract';

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
/**
 * 渲染画布长边上限，超过则等比缩小。
 * 取 3000 兼顾缩放清晰度与提取性能：放大后仍能保留原始细节，
 * 同时避免超大画布导致连通域算法耗时过长。
 */
const MAX_RENDER_SIDE = 3000;
/** 缩放上下限（1 = 适应容器宽度） */
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
/** 预览画布内部分辨率上限（按图片宽高比拟合） */
const PREVIEW_MAX_W = 720;
const PREVIEW_MAX_H = 405;

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

interface LoadedImage {
  img: HTMLImageElement;
  width: number;
  height: number;
  url: string;
}

export default function IconExtractor() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 选区（source 画布坐标，即渲染分辨率坐标）
  const [selection, setSelection] = useState<Region | null>(null);

  // 提取参数
  const [threshold, setThreshold] = useState(DEFAULT_OPTIONS.threshold);
  const [minArea, setMinArea] = useState(DEFAULT_OPTIONS.minArea);
  const [padding, setPadding] = useState(DEFAULT_OPTIONS.padding);

  // 提取结果
  const [icons, setIcons] = useState<ExtractedIcon[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 缩放（1 = 适应容器宽度，>1 放大查看细节）
  const [zoom, setZoom] = useState(1);
  // 选区弹窗开关
  const [dialogOpen, setDialogOpen] = useState(false);

  // 离屏 source 画布：始终持有渲染分辨率的原图，作为提取数据源，
  // 不依赖任何可见画布（弹窗开关都不影响提取）。
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  // 弹窗内的交互式画布（显示 + 框选）
  const interactiveCanvasRef = useRef<HTMLCanvasElement>(null);
  // 弹窗内可滚动容器（缩放后平移）
  const scrollRef = useRef<HTMLDivElement>(null);
  // 原始图区域的预览画布（只读，点击弹出大画布）
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  // 拖拽画框状态
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);

  // ---- 文件上传 ----
  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const file = Array.from(fileList).find((f) => ACCEPTED_TYPES.includes(f.type));
    if (!file) {
      setError('请选择 PNG、JPEG 或 WebP 格式的图片');
      return;
    }
    setError(null);
    try {
      const loaded = await loadImageElement(file);
      setImage((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return loaded;
      });
      setSelection(null);
      setIcons([]);
      setZoom(1);
    } catch {
      setError('图片加载失败，请重试');
    }
  }, []);

  // ---- 渲染离屏 source 画布（图片变化时）----
  useEffect(() => {
    if (!image) return;
    const src = sourceCanvasRef.current;
    if (!src) return;
    const scale = Math.min(
      1,
      MAX_RENDER_SIDE / Math.max(image.width, image.height),
    );
    const w = Math.max(1, Math.round(image.width * scale));
    const h = Math.max(1, Math.round(image.height * scale));
    src.width = w;
    src.height = h;
    const sctx = src.getContext('2d');
    if (sctx) {
      sctx.clearRect(0, 0, w, h);
      sctx.drawImage(image.img, 0, 0, w, h);
    }
  }, [image]);

  // ---- 绘制弹窗内交互画布（图片/选区/弹窗开关变化时）----
  useEffect(() => {
    if (!dialogOpen) return;
    const target = interactiveCanvasRef.current;
    const src = sourceCanvasRef.current;
    if (!target || !src) return;
    // 交互画布内部分辨率对齐 source，使选区坐标 = source 坐标
    if (target.width !== src.width) target.width = src.width;
    if (target.height !== src.height) target.height = src.height;
    paintCanvas(target, src, selection);
  }, [image, selection, dialogOpen]);

  // ---- 绘制原始图区域预览（图片/选区变化时）----
  useEffect(() => {
    if (!image) return;
    const target = previewCanvasRef.current;
    const src = sourceCanvasRef.current;
    if (!target || !src || src.width === 0) return;
    // 预览内部分辨率：按图片宽高比拟合到 PREVIEW_MAX_W × PREVIEW_MAX_H
    const ratio = Math.min(PREVIEW_MAX_W / src.width, PREVIEW_MAX_H / src.height);
    const pw = Math.max(1, Math.round(src.width * ratio));
    const ph = Math.max(1, Math.round(src.height * ratio));
    if (target.width !== pw || target.height !== ph) {
      target.width = pw;
      target.height = ph;
    }
    paintCanvas(target, src, selection);
  }, [image, selection]);

  // ---- 鼠标拖拽画选区（作用于弹窗内交互画布）----
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = interactiveCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY)),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = getCanvasCoords(e);
    dragRef.current = { startX: x, startY: y };
    setSelection({ x, y, width: 0, height: 0 });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const { startX, startY } = dragRef.current;
    setSelection({
      x: Math.min(startX, x),
      y: Math.min(startY, y),
      width: Math.abs(x - startX),
      height: Math.abs(y - startY),
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 忽略
    }
    dragRef.current = null;
    setSelection((prev) => {
      if (prev && (prev.width < 5 || prev.height < 5)) return null;
      return prev;
    });
  };

  // ---- 执行提取（防抖 280ms，数据源为离屏 source 画布）----
  const options: ExtractOptions = useMemo(
    () => ({ threshold, minArea, padding }),
    [threshold, minArea, padding],
  );

  useEffect(() => {
    if (!image || !selection || selection.width < 5 || selection.height < 5) {
      setIcons([]);
      return;
    }
    const src = sourceCanvasRef.current;
    if (!src) return;

    setIsProcessing(true);
    let cancelled = false;
    const timer = setTimeout(() => {
      try {
        const result = extractIcons(src, selection, options);
        if (!cancelled) {
          setIcons(result);
          setIsProcessing(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '提取失败');
          setIcons([]);
          setIsProcessing(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [image, selection, options]);

  // ---- 缩放（保持视口中心稳定）----
  const applyZoom = useCallback(
    (nextZoom: number) => {
      const container = scrollRef.current;
      const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
      if (!container || clamped === zoom) {
        setZoom(clamped);
        return;
      }
      const cx = container.scrollLeft + container.clientWidth / 2;
      const cy = container.scrollTop + container.clientHeight / 2;
      const ratio = clamped / zoom;
      setZoom(clamped);
      requestAnimationFrame(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollLeft = cx * ratio - scrollRef.current.clientWidth / 2;
        scrollRef.current.scrollTop = cy * ratio - scrollRef.current.clientHeight / 2;
      });
    },
    [zoom],
  );

  // ---- 下载 ----
  const handleDownloadOne = useCallback(async (icon: ExtractedIcon) => {
    const blob = await canvasToPngBlob(icon.canvas);
    downloadBlob(blob, `icon-${icon.index + 1}.png`);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    for (let i = 0; i < icons.length; i++) {
      const blob = await canvasToPngBlob(icons[i].canvas);
      downloadBlob(blob, `icon-${icons[i].index + 1}.png`);
      await new Promise((r) => setTimeout(r, 150));
    }
  }, [icons]);

  const handleReset = useCallback(() => {
    if (image) URL.revokeObjectURL(image.url);
    setImage(null);
    setSelection(null);
    setIcons([]);
    setZoom(1);
    setError(null);
  }, [image]);

  // ---- 渲染 ----
  if (!image) {
    return (
      <>
        <Dropzone
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          onFiles={handleFiles}
          error={error}
        />
        {/* 离屏 source 画布，始终挂载 */}
        <canvas ref={sourceCanvasRef} className="hidden" aria-hidden />
      </>
    );
  }

  const hasValidSelection = !!selection && selection.width >= 5 && selection.height >= 5;

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* 左侧：原始图预览 + 控制 */}
        <div className="flex flex-1 flex-col gap-3">
          {/* 可点击的预览卡片：点击弹出大画布框选 */}
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            aria-label="点击放大图片进行框选"
            className="group relative block w-full overflow-hidden rounded-lg border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#ffffff_0%_50%)] bg-[length:20px_20px] transition-colors hover:border-primary/50 dark:bg-[repeating-conic-gradient(#2a2a2a_0%_25%,#1a1a1a_0%_50%)]"
          >
            <canvas
              ref={previewCanvasRef}
              className="mx-auto block max-h-72 max-w-full"
            />
            {/* 悬浮遮罩提示 */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
              <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-4 w-4" />
                点击放大框选
              </span>
            </div>
            {/* 选区尺寸标签 */}
            {hasValidSelection && (
              <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 font-mono text-[11px] text-white">
                选区 {Math.round(selection!.width)}×{Math.round(selection!.height)}
              </span>
            )}
          </button>

          {/* 控制台 */}
          <ControlsDock
            threshold={threshold}
            setThreshold={setThreshold}
            minArea={minArea}
            setMinArea={setMinArea}
            padding={padding}
            setPadding={setPadding}
            hasSelection={hasValidSelection}
            onOpenDialog={() => setDialogOpen(true)}
            onClearSelection={() => setSelection(null)}
            onReset={handleReset}
          />
        </div>

        {/* 右侧：结果面板 */}
        <div className="flex w-full flex-col gap-3 lg:w-80 xl:w-96">
          <ResultsPanel
            icons={icons}
            isProcessing={isProcessing}
            hasSelection={hasValidSelection}
            onDownloadOne={handleDownloadOne}
            onDownloadAll={handleDownloadAll}
          />
        </div>
      </div>

      {/* 离屏 source 画布，始终挂载 */}
      <canvas ref={sourceCanvasRef} className="hidden" aria-hidden />

      {/* 选区弹窗：近全屏大画布，放大后精准框选 */}
      <SelectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        zoom={zoom}
        applyZoom={applyZoom}
        interactiveCanvasRef={interactiveCanvasRef}
        scrollRef={scrollRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        hasSelection={hasValidSelection}
        iconCount={icons.length}
        isProcessing={isProcessing}
        selection={selection}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// 共享绘制函数（模块级，纯函数，避免闭包陈旧问题）
// ---------------------------------------------------------------------------

/**
 * 将 source 画布内容 + 选区叠加层绘制到目标画布。
 * 选区坐标按 target/source 的比例缩放，兼容任意目标分辨率。
 */
function paintCanvas(
  target: HTMLCanvasElement,
  src: HTMLCanvasElement,
  selection: Region | null,
): void {
  const ctx = target.getContext('2d');
  if (!ctx) return;
  const W = target.width;
  const H = target.height;
  ctx.clearRect(0, 0, W, H);
  if (src.width === 0 || src.height === 0) return;
  ctx.drawImage(src, 0, 0, W, H);

  if (!selection || selection.width < 1 || selection.height < 1) return;

  const sx = W / src.width;
  const sy = H / src.height;
  const x = selection.x * sx;
  const y = selection.y * sy;
  const sw = selection.width * sx;
  const sh = selection.height * sy;

  // 选区外半透明遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, W, y);
  ctx.fillRect(0, y, x, sh);
  ctx.fillRect(x + sw, y, W - x - sw, sh);
  ctx.fillRect(0, y + sh, W, H - y - sh);

  // 选区虚线边框
  const lw = Math.max(1, 2 * Math.min(sx, sy));
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = lw;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x + lw / 2, y + lw / 2, Math.max(0, sw - lw), Math.max(0, sh - lw));
  ctx.setLineDash([]);

  // 四角标记
  const corner = Math.max(6, 10 * Math.min(sx, sy));
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = lw * 1.5;
  ctx.beginPath();
  // 左上
  ctx.moveTo(x, y + corner); ctx.lineTo(x, y); ctx.lineTo(x + corner, y);
  // 右上
  ctx.moveTo(x + sw - corner, y); ctx.lineTo(x + sw, y); ctx.lineTo(x + sw, y + corner);
  // 左下
  ctx.moveTo(x, y + sh - corner); ctx.lineTo(x, y + sh); ctx.lineTo(x + corner, y + sh);
  // 右下
  ctx.moveTo(x + sw - corner, y + sh); ctx.lineTo(x + sw, y + sh); ctx.lineTo(x + sw, y + sh - corner);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// 选区弹窗
// ---------------------------------------------------------------------------

interface SelectionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  zoom: number;
  applyZoom: (v: number) => void;
  interactiveCanvasRef: React.RefObject<HTMLCanvasElement>;
  scrollRef: React.RefObject<HTMLDivElement>;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  hasSelection: boolean;
  iconCount: number;
  isProcessing: boolean;
  selection: Region | null;
}

function SelectionDialog({
  open,
  onOpenChange,
  zoom,
  applyZoom,
  interactiveCanvasRef,
  scrollRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  hasSelection,
  iconCount,
  isProcessing,
  selection,
}: SelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] w-[96vw] max-w-[96vw] flex-col gap-3 p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5 text-primary" />
            框选图标区域
          </DialogTitle>
          <DialogDescription>
            在图片上拖拽鼠标框选包含图标的区域，可放大后精准框选小图标
          </DialogDescription>
        </DialogHeader>

        {/* 画布滚动区 */}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#ffffff_0%_50%)] bg-[length:20px_20px] dark:bg-[repeating-conic-gradient(#2a2a2a_0%_25%,#1a1a1a_0%_50%)]">
          <div ref={scrollRef} className="h-full w-full overflow-auto">
            <canvas
              ref={interactiveCanvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              style={{ width: `${zoom * 100}%`, height: 'auto' }}
              className="block touch-none select-none cursor-crosshair"
              aria-label="图片选区画布，拖拽鼠标框选要提取图标的区域"
            />
          </div>

          {/* 缩放工具条 */}
          <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-md border bg-background/90 p-1 shadow-sm backdrop-blur">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => applyZoom(zoom / 1.4)}
              disabled={zoom <= MIN_ZOOM}
              aria-label="缩小图片"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="min-w-[3rem] text-center font-mono text-xs tabular-nums text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => applyZoom(zoom * 1.4)}
              disabled={zoom >= MAX_ZOOM}
              aria-label="放大图片"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => applyZoom(1)}
              disabled={zoom === 1}
              aria-label="重置为适应宽度"
            >
              <Maximize className="h-3.5 w-3.5" />
              适应
            </Button>
          </div>

          {/* 无选区时的操作提示 */}
          {!hasSelection && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
              <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur">
                在图片上拖拽鼠标，框选包含图标的区域
              </span>
            </div>
          )}
        </div>

        {/* 底部状态 + 完成 */}
        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                识别中...
              </>
            ) : hasSelection ? (
              <>
                <Scissors className="h-3.5 w-3.5 text-primary" />
                已识别 <span className="font-mono tabular-nums text-primary">{iconCount}</span> 个图标
                {selection && (
                  <span className="ml-2 font-mono">
                    · 选区 {Math.round(selection.width)}×{Math.round(selection.height)}
                  </span>
                )}
              </>
            ) : (
              <span>尚未框选区域</span>
            )}
          </div>
          <Button onClick={() => onOpenChange(false)} disabled={!hasSelection}>
            完成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// 拖拽上传区
// ---------------------------------------------------------------------------

interface DropzoneProps {
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  onFiles: (files: FileList | File[]) => void;
  error: string | null;
}

function Dropzone({ isDragging, setIsDragging, onFiles, error }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
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
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30',
        )}
      >
        <Upload
          className={cn(
            'h-10 w-10 transition-colors',
            isDragging ? 'text-primary' : 'text-muted-foreground',
          )}
        />
        <div>
          <p className="text-sm font-medium">拖拽图片到此处，或点击选择</p>
          <p className="mt-1 text-xs text-muted-foreground">
            支持 PNG / JPEG / WebP，适合软件截图、图标列表页等白底图片
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex animate-fade-in items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-2 max-w-md rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="mb-2 font-semibold text-foreground">使用说明</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>上传一张包含多个图标的图片（推荐白底截图）</li>
          <li>点击原始图区域，弹出大画布</li>
          <li>在图片上拖拽鼠标框选区域，可放大后精准框选</li>
          <li>工具自动识别区域内的独立图标并去背景</li>
          <li>调节阈值/最小面积，实时预览效果</li>
          <li>单个下载或批量导出为透明 PNG</li>
        </ol>
        <p className="mt-2 text-[11px]">
          所有处理在浏览器本地完成，图片不会上传到任何服务器。
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 控制台
// ---------------------------------------------------------------------------

interface ControlsDockProps {
  threshold: number;
  setThreshold: (v: number) => void;
  minArea: number;
  setMinArea: (v: number) => void;
  padding: number;
  setPadding: (v: number) => void;
  hasSelection: boolean;
  onOpenDialog: () => void;
  onClearSelection: () => void;
  onReset: () => void;
}

function ControlsDock({
  threshold,
  setThreshold,
  minArea,
  setMinArea,
  padding,
  setPadding,
  hasSelection,
  onOpenDialog,
  onClearSelection,
  onReset,
}: ControlsDockProps) {
  return (
    <div
      role="group"
      aria-label="提取参数设置"
      className="space-y-4 rounded-lg border bg-card p-4"
    >
      {/* 阈值 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="threshold-slider" className="text-xs font-semibold text-muted-foreground">
            背景阈值
          </label>
          <span className="font-mono text-xs tabular-nums">{threshold}</span>
        </div>
        <Slider
          id="threshold-slider"
          value={[threshold]}
          min={5}
          max={120}
          step={1}
          onValueChange={(v) => setThreshold(v[0])}
          aria-label="背景颜色距离阈值，越大越激进地去背景"
        />
        <p className="text-[11px] text-muted-foreground">
          与背景色的颜色差异小于此值的像素视为背景。值越大去除越多，但可能误删图标边缘。
        </p>
      </div>

      {/* 最小面积 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="area-slider" className="text-xs font-semibold text-muted-foreground">
            最小图标面积
          </label>
          <span className="font-mono text-xs tabular-nums">{minArea} px</span>
        </div>
        <Slider
          id="area-slider"
          value={[minArea]}
          min={10}
          max={2000}
          step={10}
          onValueChange={(v) => setMinArea(v[0])}
          aria-label="图标最小前景像素数，小于此值视为噪点丢弃"
        />
        <p className="text-[11px] text-muted-foreground">
          面积小于此值的色块视为噪点丢弃。调大可过滤杂点，调小可保留小图标。
        </p>
      </div>

      {/* 边距 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="padding-slider" className="text-xs font-semibold text-muted-foreground">
            图标边距
          </label>
          <span className="font-mono text-xs tabular-nums">{padding} px</span>
        </div>
        <Slider
          id="padding-slider"
          value={[padding]}
          min={0}
          max={32}
          step={1}
          onValueChange={(v) => setPadding(v[0])}
          aria-label="每个图标裁剪框的外边距"
        />
        <p className="text-[11px] text-muted-foreground">
          每个图标四周保留的透明边距，避免图标被裁切。
        </p>
      </div>

      {/* 操作 */}
      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <Button
          variant="default"
          size="sm"
          onClick={onOpenDialog}
          aria-label="打开大画布框选区域"
        >
          <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
          {hasSelection ? '重新框选' : '放大框选'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          disabled={!hasSelection}
          aria-label="清除当前选区"
        >
          <Crop className="mr-1.5 h-3.5 w-3.5" />
          清除选区
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          aria-label="重新上传图片"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          换张图片
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 结果面板
// ---------------------------------------------------------------------------

interface ResultsPanelProps {
  icons: ExtractedIcon[];
  isProcessing: boolean;
  hasSelection: boolean;
  onDownloadOne: (icon: ExtractedIcon) => void;
  onDownloadAll: () => void;
}

function ResultsPanel({
  icons,
  isProcessing,
  hasSelection,
  onDownloadOne,
  onDownloadAll,
}: ResultsPanelProps) {
  if (isProcessing && icons.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border bg-card text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">正在识别图标...</span>
      </div>
    );
  }

  if (!hasSelection) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border bg-card text-muted-foreground">
        <Images className="h-10 w-10 opacity-40" />
        <span className="text-sm">框选区域后，识别出的图标将在此显示</span>
      </div>
    );
  }

  if (icons.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border bg-card text-muted-foreground">
        <Scissors className="h-10 w-10 opacity-40" />
        <span className="text-sm">未识别到图标</span>
        <span className="max-w-xs text-center text-[11px]">
          尝试调整背景阈值（调大）或减小最小图标面积，或重新框选区域
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 汇总栏 */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <Scissors className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          识别到 <span className="font-mono tabular-nums text-primary">{icons.length}</span> 个图标
        </span>
        <Button
          size="sm"
          onClick={onDownloadAll}
          className="ml-auto"
          aria-label="下载所有图标为 PNG"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          全部下载
        </Button>
      </div>

      {/* 图标网格 */}
      <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-auto p-1 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {icons.map((icon) => (
          <IconCard key={icon.index} icon={icon} onDownload={() => onDownloadOne(icon)} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 单个图标卡片
// ---------------------------------------------------------------------------

interface IconCardProps {
  icon: ExtractedIcon;
  onDownload: () => void;
}

function IconCard({ icon, onDownload }: IconCardProps) {
  const previewRef = useRef<HTMLCanvasElement>(null);

  // 将图标画布位图绘制到预览画布。
  // 注意：canvas.cloneNode() 只复制 DOM 节点、不会复制位图像素，
  // 因此必须用 drawImage 把原图标的像素真正画过来，否则预览是空白。
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const ctx = preview.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, icon.width, icon.height);
    ctx.drawImage(icon.canvas, 0, 0);
  }, [icon]);

  // 预览显示尺寸（限制最长边 96px，保持比例）
  const maxSide = 96;
  const scale = Math.min(1, maxSide / Math.max(icon.width, icon.height));

  return (
    <div className="group flex flex-col gap-2 rounded-lg border bg-card p-2">
      <div
        className="flex h-24 items-center justify-center rounded-md bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#ffffff_0%_50%)] bg-[length:14px_14px] dark:bg-[repeating-conic-gradient(#2a2a2a_0%_25%,#1a1a1a_0%_50%)]"
        role="img"
        aria-label={`图标 ${icon.index + 1}，尺寸 ${icon.width}×${icon.height}`}
      >
        <canvas
          ref={previewRef}
          width={icon.width}
          height={icon.height}
          style={{
            width: `${Math.round(icon.width * scale)}px`,
            height: `${Math.round(icon.height * scale)}px`,
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[11px] text-muted-foreground">
          {icon.width}×{icon.height}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onDownload}
          aria-label={`下载图标 ${icon.index + 1}`}
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
