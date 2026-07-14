/**
 * 图标提取核心算法
 *
 * 纯浏览器端、零第三方依赖的图标分离算法，分四步：
 *   1. 从源图裁出选区，取得像素数据
 *   2. 采样选区四角作为背景色，从边缘做洪水填充标记背景（仅移除与边缘连通的背景，保留图标内部同色区域）
 *   3. 对前景做 4-连通域标记，每个连通域 = 一个独立图标
 *   4. 计算各连通域包围盒，加 padding 后裁出透明 PNG
 *
 * 全部基于 Canvas 2D 与 TypedArray，适用于静态导出、无后端场景。
 */

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/** 选区，坐标基于源图原始像素 */
export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 提取参数 */
export interface ExtractOptions {
  /** 背景颜色距离阈值（RGB 欧氏距离，0-150）。越大越激进地去背景 */
  threshold: number;
  /** 单个图标最小前景像素数，小于此值视为噪点丢弃 */
  minArea: number;
  /** 每个图标裁剪框的外边距（像素） */
  padding: number;
}

/** 提取出的单个图标 */
export interface ExtractedIcon {
  /** 已去背景的画布，可直接 toBlob 导出透明 PNG */
  canvas: HTMLCanvasElement;
  /** 图标在源选区内的左上角 x（含 padding 后） */
  x: number;
  /** 图标在源选区内的左上角 y（含 padding 后） */
  y: number;
  /** 输出画布宽度 */
  width: number;
  /** 输出画布高度 */
  height: number;
  /** 前景像素数（用于排序/展示） */
  area: number;
  /** 序号（按从上到下、从左到右排序） */
  index: number;
}

/** 默认参数 */
export const DEFAULT_OPTIONS: ExtractOptions = {
  threshold: 32,
  minArea: 80,
  padding: 4,
};

// ---------------------------------------------------------------------------
// 主入口
// ---------------------------------------------------------------------------

/**
 * 从源图的指定选区中提取所有独立图标
 *
 * @param source 源图（HTMLImageElement 或 HTMLCanvasElement）
 * @param region 选区（基于源图原始像素坐标）
 * @param options 提取参数
 * @returns 图标列表，按从上到下、从左到右排序
 */
export function extractIcons(
  source: CanvasImageSource & { width: number; height: number },
  region: Region,
  options: ExtractOptions = DEFAULT_OPTIONS,
): ExtractedIcon[] {
  const rw = Math.max(1, Math.floor(region.width));
  const rh = Math.max(1, Math.floor(region.height));

  // 1. 取选区像素
  const { data, width: W, height: H } = cropImageData(source, region, rw, rh);
  const N = W * H;

  // 2. 采样背景色（四角各取一小块求平均）
  const bg = sampleBackground(data, W, H);

  // 3. 洪水填充：从边缘出发，标记与背景色相近且与边缘连通的像素为背景
  //    mask: 0 = 前景（保留），1 = 背景（透明）
  const mask = floodFillBackground(data, W, H, N, bg, options.threshold);

  // 4. 连通域标记：对前景分组成独立图标
  const components = labelComponents(mask, W, H, N, options.minArea);

  if (components.length === 0) return [];

  // 5. 按位置排序（先按中心点 y，再按 x）
  components.sort((a, b) => {
    const ay = (a.minY + a.maxY) / 2;
    const by = (b.minY + b.maxY) / 2;
    if (Math.abs(ay - by) > Math.max(a.maxY - a.minY, b.maxY - b.minY) * 0.5) {
      return ay - by;
    }
    return (a.minX + a.maxX) / 2 - (b.minX + b.maxX) / 2;
  });

  // 6. 为每个连通域生成透明背景画布
  const pad = Math.max(0, Math.floor(options.padding));
  const result: ExtractedIcon[] = [];
  components.forEach((comp, i) => {
    const icon = renderIcon(data, mask, W, H, comp, pad, i);
    result.push(icon);
  });

  return result;
}

// ---------------------------------------------------------------------------
// 内部实现
// ---------------------------------------------------------------------------

interface BgColor {
  r: number;
  g: number;
  b: number;
}

interface Component {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  count: number;
}

/** 将源图指定区域绘制到临时画布并取出 ImageData */
function cropImageData(
  source: CanvasImageSource & { width: number; height: number },
  region: Region,
  rw: number,
  rh: number,
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = rw;
  canvas.height = rh;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('无法获取 Canvas 2D 上下文');
  ctx.drawImage(
    source,
    Math.floor(region.x),
    Math.floor(region.y),
    rw,
    rh,
    0,
    0,
    rw,
    rh,
  );
  return ctx.getImageData(0, 0, rw, rh);
}

/** 采样选区四角各一小块（patch×patch）求平均，作为背景色 */
function sampleBackground(data: Uint8ClampedArray, W: number, H: number): BgColor {
  const patch = Math.min(4, Math.floor(Math.min(W, H) / 4) || 1);
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  const corners = [
    [0, 0],
    [W - patch, 0],
    [0, H - patch],
    [W - patch, H - patch],
  ];

  for (const [ox, oy] of corners) {
    for (let dy = 0; dy < patch; dy++) {
      for (let dx = 0; dx < patch; dx++) {
        const idx = ((oy + dy) * W + (ox + dx)) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count++;
      }
    }
  }

  count = Math.max(1, count);
  return { r: r / count, g: g / count, b: b / count };
}

/**
 * 从选区四边向内做洪水填充，标记与背景色相近且与边缘连通的像素。
 * 仅移除「连通到边缘」的背景，图标内部的同色区域会被保留。
 *
 * 使用显式栈 DFS（比 shift 队列快），TypedArray 存储。
 */
function floodFillBackground(
  data: Uint8ClampedArray,
  W: number,
  H: number,
  N: number,
  bg: BgColor,
  threshold: number,
): Uint8Array {
  const mask = new Uint8Array(N); // 0 = 前景，1 = 背景
  const stack: number[] = [];
  const thrSq = threshold * threshold;

  const isBg = (idx: number): boolean => {
    const o = idx * 4;
    const dr = data[o] - bg.r;
    const dg = data[o + 1] - bg.g;
    const db = data[o + 2] - bg.b;
    return dr * dr + dg * dg + db * db < thrSq;
  };

  const push = (idx: number) => {
    if (mask[idx] === 0 && isBg(idx)) {
      mask[idx] = 1;
      stack.push(idx);
    }
  };

  // 种子：四条边上的所有像素
  for (let x = 0; x < W; x++) {
    push(x);
    push((H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    push(y * W);
    push(y * W + (W - 1));
  }

  while (stack.length > 0) {
    const idx = stack.pop() as number;
    const x = idx % W;
    const y = (idx / W) | 0;
    // 4 邻接
    if (x > 0) push(idx - 1);
    if (x < W - 1) push(idx + 1);
    if (y > 0) push(idx - W);
    if (y < H - 1) push(idx + W);
  }

  return mask;
}

/**
 * 对前景（mask===0）做 4-连通域标记，返回面积 >= minArea 的连通域及其包围盒。
 * 使用两遍扫描的简化版（单遍 BFS + 标签数组）。
 */
function labelComponents(
  mask: Uint8Array,
  W: number,
  H: number,
  N: number,
  minArea: number,
): Component[] {
  const labels = new Int32Array(N); // 0 = 未标记
  const components: Component[] = [];
  const stack: number[] = [];

  for (let start = 0; start < N; start++) {
    if (mask[start] !== 0 || labels[start] !== 0) continue;

    const comp: Component = {
      minX: W,
      minY: H,
      maxX: 0,
      maxY: 0,
      count: 0,
    };
    stack.length = 0;
    stack.push(start);
    labels[start] = 1; // 临时标记，防止重复入栈

    while (stack.length > 0) {
      const idx = stack.pop() as number;
      const x = idx % W;
      const y = (idx / W) | 0;

      if (x < comp.minX) comp.minX = x;
      if (x > comp.maxX) comp.maxX = x;
      if (y < comp.minY) comp.minY = y;
      if (y > comp.maxY) comp.maxY = y;
      comp.count++;

      // 4 邻接
      if (x > 0) {
        const n = idx - 1;
        if (mask[n] === 0 && labels[n] === 0) {
          labels[n] = 1;
          stack.push(n);
        }
      }
      if (x < W - 1) {
        const n = idx + 1;
        if (mask[n] === 0 && labels[n] === 0) {
          labels[n] = 1;
          stack.push(n);
        }
      }
      if (y > 0) {
        const n = idx - W;
        if (mask[n] === 0 && labels[n] === 0) {
          labels[n] = 1;
          stack.push(n);
        }
      }
      if (y < H - 1) {
        const n = idx + W;
        if (mask[n] === 0 && labels[n] === 0) {
          labels[n] = 1;
          stack.push(n);
        }
      }
    }

    if (comp.count >= minArea) {
      components.push(comp);
    }
  }

  return components;
}

/**
 * 根据连通域包围盒生成透明背景画布：
 * 前景像素保留原色（alpha=255），背景像素置透明（alpha=0）。
 */
function renderIcon(
  data: Uint8ClampedArray,
  mask: Uint8Array,
  W: number,
  H: number,
  comp: Component,
  pad: number,
  index: number,
): ExtractedIcon {
  // 含 padding 并裁剪到选区范围内
  const minX = Math.max(0, comp.minX - pad);
  const minY = Math.max(0, comp.minY - pad);
  const maxX = Math.min(W - 1, comp.maxX + pad);
  const maxY = Math.min(H - 1, comp.maxY + pad);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法获取 Canvas 2D 上下文');

  const out = ctx.createImageData(w, h);
  const outData = out.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = (minY + y) * W + (minX + x);
      const dstIdx = (y * w + x) * 4;
      if (mask[srcIdx] === 0) {
        // 前景：保留原色
        const o = srcIdx * 4;
        outData[dstIdx] = data[o];
        outData[dstIdx + 1] = data[o + 1];
        outData[dstIdx + 2] = data[o + 2];
        outData[dstIdx + 3] = 255;
      } else {
        // 背景：透明
        outData[dstIdx + 3] = 0;
      }
    }
  }

  ctx.putImageData(out, 0, 0);

  return {
    canvas,
    x: minX,
    y: minY,
    width: w,
    height: h,
    area: comp.count,
    index,
  };
}

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 加载 File 为 HTMLImageElement，返回元素与原始尺寸 */
export function loadImageElement(
  file: File,
): Promise<{ img: HTMLImageElement; width: number; height: number; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        img,
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

/** 将画布导出为 PNG Blob */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG 导出失败'));
    }, 'image/png');
  });
}

/** 触发文件下载 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
