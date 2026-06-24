'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Matter from 'matter-js';
import {
  Play,
  Pause,
  RotateCcw,
  Box,
  Circle,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Settings2,
  Download,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { WorkspacePanel } from '@/components/workspace-panel';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

interface PhysicsConfig {
  /** 摩擦系数 (0 = 冰面，1 = 橡胶) */
  friction: number;
  /** 弹性恢复系数 (0 = 完全非弹性，1 = 完全弹性) */
  restitution: number;
  /** 密度 (kg/m²)，值越大越重 */
  density: number;
  /** 重力 y 分量 (向下为正) */
  gravityY: number;
  /** 重力 x 分量 (向右为正) */
  gravityX: number;
}

type ShapeKind = 'box' | 'circle';

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: PhysicsConfig = {
  friction: 0.1,
  restitution: 0.6,
  density: 0.001,
  gravityY: 1,
  gravityX: 0,
};

const MAX_BODIES = 60;

// 物体配色（柔和的现代色板）
const SHAPE_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

/**
 * Matter.js 物理材质可视化配置器
 *
 * 功能：
 *   - 在 HTML5 Canvas 中运行 Matter.js 2D 物理引擎
 *   - 通过滑块实时调整：摩擦系数、弹性恢复、密度、重力
 *   - 持续生成方块/圆形，直观感受参数对物理行为的影响
 *   - 生成 JSON 配置片段，一键复制到剪贴板
 */
export default function PhysicsConfigurator() {
  // 物理参数（受控）
  const [config, setConfig] = useState<PhysicsConfig>(DEFAULT_CONFIG);

  // 运行状态
  const [isRunning, setIsRunning] = useState(true);
  const [bodyCount, setBodyCount] = useState(0);
  const [selectedShape, setSelectedShape] = useState<ShapeKind>('box');

  // JSON 复制反馈
  const [copied, setCopied] = useState(false);

  // 引用
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const configRef = useRef<PhysicsConfig>(config);

  // 保持 configRef 与 state 同步（供 spawn 回调读取最新值）
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // ---- JSON 配置输出 ----
  const configJson = useMemo(() => {
    const snippet = {
      friction: Number(config.friction.toFixed(4)),
      restitution: Number(config.restitution.toFixed(4)),
      density: Number(config.density.toFixed(6)),
      gravity: {
        x: Number(config.gravityX.toFixed(2)),
        y: Number(config.gravityY.toFixed(2)),
      },
      // Matter.js Body.create() 可直接使用的选项
      bodyOptions: {
        friction: Number(config.friction.toFixed(4)),
        restitution: Number(config.restitution.toFixed(4)),
        density: Number(config.density.toFixed(6)),
      },
      engineOptions: {
        gravity: {
          x: Number(config.gravityX.toFixed(2)),
          y: Number(config.gravityY.toFixed(2)),
          scale: 0.001,
        },
      },
    };
    return JSON.stringify(snippet, null, 2);
  }, [config]);

  // ---- 复制 JSON ----
  const handleCopyConfig = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(configJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板权限拒绝，静默
    }
  }, [configJson]);

  // ---- 生成单个物体 ----
  const spawnBody = useCallback((kind: ShapeKind, overrideConfig?: PhysicsConfig) => {
    const engine = engineRef.current;
    const container = canvasContainerRef.current;
    if (!engine || !container) return;

    const bodies = Matter.Composite.allBodies(engine.world);
    if (bodies.length >= MAX_BODIES) return;

    const cfg = overrideConfig ?? configRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 从顶部随机 x 位置生成
    const x = 40 + Math.random() * Math.max(80, width - 80);
    const y = 30;
    const size = 18 + Math.random() * 22;
    const color = SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)];

    const options: Matter.IChamferableBodyDefinition = {
      friction: cfg.friction,
      restitution: cfg.restitution,
      density: cfg.density,
      render: {
        fillStyle: color,
        strokeStyle: 'rgba(255,255,255,0.3)',
        lineWidth: 1.5,
      },
    };

    let body: Matter.Body;
    if (kind === 'circle') {
      body = Matter.Bodies.circle(x, y, size / 2, options);
    } else {
      body = Matter.Bodies.rectangle(x, y, size, size, options);
    }

    // 轻微初始角速度，增加趣味
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.15);

    Matter.Composite.add(engine.world, body);
    setBodyCount(Matter.Composite.allBodies(engine.world).length);
  }, []);

  // ---- 清除所有动态物体（保留边界墙） ----
  const clearBodies = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    // 收集所有非静态物体（墙是 isStatic = true）
    const dynamicBodies = Matter.Composite.allBodies(engine.world).filter(
      (b) => !b.isStatic,
    );
    Matter.Composite.remove(engine.world, dynamicBodies);
    setBodyCount(Matter.Composite.allBodies(engine.world).length);
  }, []);

  // ---- 重置参数到默认 ----
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  // ---- 初始化 Matter.js 引擎（仅一次） ----
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    // 创建引擎
    const engine = Matter.Engine.create({
      gravity: {
        x: DEFAULT_CONFIG.gravityX,
        y: DEFAULT_CONFIG.gravityY,
        scale: 0.001,
      },
    });
    engineRef.current = engine;

    // 创建渲染器
    const render = Matter.Render.create({
      engine,
      element: container,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
        showSleeping: false,
        pixelRatio: window.devicePixelRatio || 1,
      },
    });
    renderRef.current = render;

    // 创建边界墙（静态）
    const wallThickness = 40;
    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      friction: 0.5,
      restitution: 0.3,
      render: {
        fillStyle: 'rgba(148, 163, 184, 0.25)',
        strokeStyle: 'rgba(148, 163, 184, 0.4)',
        lineWidth: 1,
      },
    };
    const walls = [
      // 底
      Matter.Bodies.rectangle(
        width / 2,
        height + wallThickness / 2,
        width + wallThickness * 2,
        wallThickness,
        wallOptions,
      ),
      // 左
      Matter.Bodies.rectangle(
        -wallThickness / 2,
        height / 2,
        wallThickness,
        height + wallThickness * 2,
        wallOptions,
      ),
      // 右
      Matter.Bodies.rectangle(
        width + wallThickness / 2,
        height / 2,
        wallThickness,
        height + wallThickness * 2,
        wallOptions,
      ),
    ];
    Matter.Composite.add(engine.world, walls);

    // 鼠标交互（可拖拽物体）
    const mouse = Matter.Mouse.create(container);
    // 修正鼠标坐标（pixelRatio + canvas 偏移）
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    Matter.Composite.add(engine.world, mouseConstraint);
    // 让渲染器忽略鼠标约束的渲染线
    render.mouse = mouse;

    // 启动渲染器 + runner
    Matter.Render.run(render);
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    // 清理函数
    return () => {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
        runnerRef.current = null;
      }
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        renderRef.current.canvas?.remove();
        renderRef.current = null;
      }
      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
        engineRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 重力变化时同步到引擎 ----
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.gravity.x = config.gravityX;
    engine.gravity.y = config.gravityY;
  }, [config.gravityX, config.gravityY]);

  // ---- 响应式：监听容器尺寸变化，调整 canvas ----
  useEffect(() => {
    const container = canvasContainerRef.current;
    const render = renderRef.current;
    const engine = engineRef.current;
    if (!container || !render || !engine) return;

    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width > 0 && height > 0) {
        render.canvas.width = width * (window.devicePixelRatio || 1);
        render.canvas.height = height * (window.devicePixelRatio || 1);
        render.canvas.style.width = `${width}px`;
        render.canvas.style.height = `${height}px`;
        render.options.width = width;
        render.options.height = height;
      }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // ---- 持续生成物体 ----
  useEffect(() => {
    if (!isRunning) {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
      return;
    }

    // 立即生成几个，让场景不空
    spawnBody(selectedShape);
    spawnBody(selectedShape);

    // 定时生成
    spawnTimerRef.current = setInterval(() => {
      spawnBody(selectedShape);
    }, 800);

    return () => {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
    };
  }, [isRunning, selectedShape, spawnBody]);

  // ---- 暂停/恢复 runner ----
  useEffect(() => {
    const runner = runnerRef.current;
    if (!runner) return;
    if (isRunning) {
      runner.enabled = true;
    } else {
      runner.enabled = false;
    }
  }, [isRunning]);

  // ---- 更新已有动态物体的物理属性 ----
  // 当 friction / restitution / density 变化时，同步到已有物体
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const bodies = Matter.Composite.allBodies(engine.world).filter(
      (b) => !b.isStatic,
    );
    for (const body of bodies) {
      body.friction = config.friction;
      body.restitution = config.restitution;
      // density 变化需要重新计算质量
      Matter.Body.setDensity(body, config.density);
    }
  }, [config.friction, config.restitution, config.density]);

  // ---- 参数更新辅助 ----
  const updateConfig = useCallback(<K extends keyof PhysicsConfig>(
    key: K,
    value: PhysicsConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* ---------------- 主区域：左控制面板 + 右物理画布 ---------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* ===== 左侧：控制面板 ===== */}
        <WorkspacePanel
          title="物理参数"
          role="input"
          className="min-h-[400px] lg:min-h-[500px]"
        >
          <div className="flex flex-col gap-5 p-4">
            {/* 参数控制组标题 */}
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Settings2 className="h-4 w-4 text-primary" />
              材质属性
            </div>

            {/* 摩擦系数 */}
            <ParamSlider
              label="摩擦系数"
              hint="Friction"
              description="0 = 冰面无摩擦，1 = 橡胶高摩擦"
              value={config.friction}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => updateConfig('friction', v)}
            />

            {/* 弹性恢复 */}
            <ParamSlider
              label="弹性恢复"
              hint="Restitution"
              description="0 = 落地不弹，1 = 完全弹性碰撞"
              value={config.restitution}
              min={0}
              max={1}
              step={0.01}
              accentColor="#22c55e"
              onChange={(v) => updateConfig('restitution', v)}
            />

            {/* 密度 */}
            <ParamSlider
              label="密度"
              hint="Density"
              description="值越大物体越重，下落越快（相同重力）"
              value={config.density}
              min={0.0001}
              max={0.01}
              step={0.0001}
              formatValue={(v) => v.toFixed(4)}
              accentColor="#8b5cf6"
              onChange={(v) => updateConfig('density', v)}
            />

            <Separator className="my-1" />

            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              重力场
            </div>

            {/* 重力 Y */}
            <ParamSlider
              label="重力 Y"
              hint="Gravity Y"
              description="正值向下，负值向上（反重力）"
              value={config.gravityY}
              min={-2}
              max={2}
              step={0.05}
              formatValue={(v) => v.toFixed(2)}
              accentColor="#f97316"
              onChange={(v) => updateConfig('gravityY', v)}
            />

            {/* 重力 X */}
            <ParamSlider
              label="重力 X"
              hint="Gravity X"
              description="正值向右，负值向左（侧向风）"
              value={config.gravityX}
              min={-2}
              max={2}
              step={0.05}
              formatValue={(v) => v.toFixed(2)}
              accentColor="#06b6d4"
              onChange={(v) => updateConfig('gravityX', v)}
            />

            <Separator className="my-1" />

            {/* ===== 形状选择 + 生成控制 ===== */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold">生成形状</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedShape === 'box' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedShape('box')}
                  className="gap-1.5"
                >
                  <Box className="h-4 w-4" />
                  方块
                </Button>
                <Button
                  variant={selectedShape === 'circle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedShape('circle')}
                  className="gap-1.5"
                >
                  <Circle className="h-4 w-4" />
                  圆形
                </Button>
              </div>
            </div>

            {/* 运行控制 */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold">运行控制</Label>
              <div className="flex gap-2">
                <Button
                  variant={isRunning ? 'secondary' : 'default'}
                  size="sm"
                  onClick={() => setIsRunning((v) => !v)}
                  className="flex-1 gap-1.5"
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4" />
                      暂停
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      播放
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearBodies}
                  className="gap-1.5"
                  aria-label="清空所有物体"
                >
                  <Trash2 className="h-4 w-4" />
                  清空
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetConfig}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重置参数
              </Button>
            </div>

            <Separator className="my-1" />

            {/* 物体计数 */}
            <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-xs">
              <span className="text-muted-foreground">当前物体数</span>
              <span className="font-mono font-semibold text-foreground">
                {bodyCount} / {MAX_BODIES}
              </span>
            </div>
          </div>
        </WorkspacePanel>

        {/* ===== 右侧：Matter.js 物理画布 ===== */}
        <WorkspacePanel
          title="物理模拟"
          role="output"
          actions={
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  isRunning ? 'animate-pulse bg-green-500' : 'bg-muted-foreground',
                )}
              />
              {isRunning ? '运行中' : '已暂停'}
            </span>
          }
          className="min-h-[400px] lg:min-h-[500px]"
        >
          <div
            ref={canvasContainerRef}
            className="relative h-full min-h-[400px] w-full overflow-hidden rounded-b-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
            style={{ touchAction: 'none' }}
          >
            {/* Matter.js canvas 将被注入到这里 */}
          </div>
        </WorkspacePanel>
      </div>

      {/* ---------------- JSON 配置输出面板 ---------------- */}
      <WorkspacePanel
        title="生成配置 (JSON)"
        actions={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyConfig}
              className="h-7 gap-1.5 px-2 text-xs"
              aria-label="复制 JSON 配置到剪贴板"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  复制
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              onClick={() => {
                const blob = new Blob([configJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'physics-config.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              aria-label="下载 JSON 配置文件"
            >
              <Download className="h-3.5 w-3.5" />
              下载
            </Button>
          </div>
        }
      >
        <div className="p-4">
          <pre className="max-h-64 overflow-auto rounded-md border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground">
            {configJson}
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">
            此配置可直接用于{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
              Matter.Body.create()
            </code>{' '}
            和{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
              Matter.Engine.create()
            </code>
            。复制后粘贴到你的项目中即可复现当前物理效果。
          </p>
        </div>
      </WorkspacePanel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 参数滑块子组件
// ---------------------------------------------------------------------------

interface ParamSliderProps {
  label: string;
  hint?: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue?: (v: number) => string;
  accentColor?: string;
  onChange: (v: number) => void;
}

function ParamSlider({
  label,
  hint,
  description,
  value,
  min,
  max,
  step,
  formatValue,
  accentColor,
  onChange,
}: ParamSliderProps) {
  const displayValue = formatValue ? formatValue(value) : value.toFixed(2);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{label}</Label>
          {hint && (
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {hint}
            </span>
          )}
        </div>
        <span
          className="font-mono text-xs font-semibold tabular-nums"
          style={accentColor ? { color: accentColor } : undefined}
        >
          {displayValue}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => onChange(vals[0])}
        aria-label={label}
      />
      {description && (
        <p className="text-[11px] leading-tight text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
