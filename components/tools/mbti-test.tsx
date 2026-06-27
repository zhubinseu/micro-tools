'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Zap,
  Target,
  ChevronLeft,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Share2,
  TrendingUp,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToolStore } from '@/store';
import { getToolById } from '@/lib/registry';
import {
  type TestMode,
  type TestStage,
  type DimensionScore,
  getQuestions,
  calculateScores,
  buildMbtiCode,
  PERSONALITY_TYPES,
  DIMENSIONS,
  GROUP_LABELS,
} from '@/lib/mbti-data';

// ---------------------------------------------------------------------------
// 模式配置
// ---------------------------------------------------------------------------

const MODE_CONFIG: Record<
  TestMode,
  { name: string; count: number; duration: string; icon: typeof Zap; desc: string; accent: string }
> = {
  express: {
    name: '极速版',
    count: 20,
    duration: '约 2 分钟',
    icon: Zap,
    desc: '20 道精选题，每维度 5 题。适合快速娱乐与社交分享。',
    accent: 'from-amber-500/10 to-orange-500/10 border-amber-500/30',
  },
  precision: {
    name: '精准版',
    count: 60,
    duration: '约 6 分钟',
    icon: Target,
    desc: '60 道深度题，每维度 15 题。采用标准量表算法，结果更准确。',
    accent: 'from-violet-500/10 to-indigo-500/10 border-violet-500/30',
  },
};

export default function MbtiTest() {
  const tool = getToolById('mbti-test')!;
  const recordUse = useToolStore((s) => s.recordUse);

  // --- 状态机 ---
  const [stage, setStage] = useState<TestStage>('start');
  const [mode, setMode] = useState<TestMode | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<'A' | 'B' | null>>([]);
  // 用于触发题目切换淡入动画的 key
  const [animKey, setAnimKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const questions = useMemo(() => (mode ? getQuestions(mode) : []), [mode]);

  // --- 开始测试 ---
  const handleStart = useCallback((selectedMode: TestMode) => {
    setMode(selectedMode);
    const qs = getQuestions(selectedMode);
    setAnswers(new Array(qs.length).fill(null));
    setCurrentIndex(0);
    setAnimKey((k) => k + 1);
    setStage('quiz');
  }, []);

  // --- 选择答案（150ms 延迟后自动前进）---
  const handleAnswer = useCallback(
    (choice: 'A' | 'B') => {
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = choice;
        return next;
      });

      const isLast = currentIndex === questions.length - 1;
      if (isLast) {
        // 进入计算阶段
        window.setTimeout(() => {
          setStage('calculating');
          // 800ms 计算动画后展示结果
          window.setTimeout(() => {
            setStage('result');
            recordUse(tool.id, tool.name);
          }, 800);
        }, 200);
      } else {
        // 150ms 后前进到下一题
        window.setTimeout(() => {
          setAnimKey((k) => k + 1);
          setCurrentIndex((i) => i + 1);
        }, 150);
      }
    },
    [currentIndex, questions.length, recordUse, tool]
  );

  // --- 上一题 ---
  const handlePrev = useCallback(() => {
    if (currentIndex === 0) return;
    setAnimKey((k) => k + 1);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, [currentIndex]);

  // --- 重新开始 ---
  const handleRestart = useCallback(() => {
    setStage('start');
    setMode(null);
    setCurrentIndex(0);
    setAnswers([]);
    setCopied(false);
  }, []);

  // --- 计算结果 ---
  const result = useMemo(() => {
    if (stage !== 'result' || !mode) return null;
    const scores = calculateScores(questions, answers);
    const code = buildMbtiCode(scores);
    const personality = PERSONALITY_TYPES[code];
    return { scores, code, personality };
  }, [stage, mode, questions, answers]);

  // --- 复制报告 ---
  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = formatReport(result.code, result.personality, result.scores, mode!);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 不可用时降级
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [result, mode]);

  // ===========================================================================
  // 渲染：开始屏
  // ===========================================================================
  if (stage === 'start') {
    return <StartScreen onSelect={handleStart} />;
  }

  // ===========================================================================
  // 渲染：计算中
  // ===========================================================================
  if (stage === 'calculating') {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-9 w-9 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-lg font-medium">正在通过边缘算法计算你的人格特征...</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>分析 4 个维度的得分分布</span>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 渲染：结果屏
  // ===========================================================================
  if (stage === 'result' && result) {
    return (
      <ResultScreen
        code={result.code}
        personality={result.personality}
        scores={result.scores}
        mode={mode!}
        copied={copied}
        onCopy={handleCopy}
        onRestart={handleRestart}
      />
    );
  }

  // ===========================================================================
  // 渲染：答题向导
  // ===========================================================================
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const modeCfg = MODE_CONFIG[mode!];
  const currentAnswer = answers[currentIndex];
  const isAnswered = currentAnswer !== null;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Sticky 顶部进度区 */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 bg-background/80 px-4 py-3 backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            第{' '}
            <span className="tabular-nums text-primary">{currentIndex + 1}</span>{' '}
            <span className="text-muted-foreground">/ {questions.length}</span> 题
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {modeCfg.name}
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* 题目卡片（带切换动画）*/}
      <div key={animKey} className="animate-slide-in-down">
        <div className="mb-8 text-center">
          <span className="mb-3 inline-block rounded-full bg-primary/5 px-3 py-1 text-xs text-muted-foreground">
            {DIMENSIONS.find((d) => d.key === currentQuestion.dimension)?.label}
          </span>
          <h2 className="text-xl font-semibold leading-relaxed sm:text-2xl">
            {currentQuestion.text}
          </h2>
        </div>

        {/* 选项：大触摸卡片 */}
        <div className="space-y-3">
          {(['A', 'B'] as const).map((letter) => {
            const opt =
              letter === 'A' ? currentQuestion.optionA : currentQuestion.optionB;
            const selected = currentAnswer === letter;
            return (
              <button
                key={letter}
                onClick={() => handleAnswer(letter)}
                className={cn(
                  'group flex w-full items-start gap-4 rounded-xl border-2 p-5 text-left transition-all duration-200',
                  'hover:border-primary hover:bg-primary/5 hover:shadow-md',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  selected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-card'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground group-hover:border-primary group-hover:text-primary'
                  )}
                >
                  {letter}
                </span>
                <span className="flex-1 text-base leading-relaxed">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* 底部操作栏 */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            上一题
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRestart}>
            <RotateCcw className="mr-1 h-4 w-4" />
            重新开始
          </Button>
        </div>

        {/* 进度小提示 */}
        {isAnswered && currentIndex < questions.length - 1 && (
          <p className="mt-4 text-center text-xs text-muted-foreground animate-fade-in">
            正在进入下一题...
          </p>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// 子组件：开始屏
// ===========================================================================

interface StartScreenProps {
  onSelect: (mode: TestMode) => void;
}

function StartScreen({ onSelect }: StartScreenProps) {
  return (
    <div className="mx-auto max-w-3xl">
      {/* 标题区 */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          MBTI 人格测试
        </h1>
        <p className="mt-2 text-muted-foreground">
          基于 Myers-Briggs 类型指标，纯浏览器本地运算，数据不上传
        </p>
      </div>

      {/* 说明 */}
      <Card className="mb-6 border-dashed bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p className="leading-relaxed">
            <span className="font-medium text-foreground">极速版</span>
            适合快速娱乐分享，
            <span className="font-medium text-foreground">精准版</span>
            采用标准量表算法，测验结果更准确。
          </p>
        </CardContent>
      </Card>

      {/* 模式选择卡片 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(MODE_CONFIG) as TestMode[]).map((modeKey) => {
          const cfg = MODE_CONFIG[modeKey];
          const Icon = cfg.icon;
          return (
            <button
              key={modeKey}
              onClick={() => onSelect(modeKey)}
              className={cn(
                'group relative overflow-hidden rounded-xl border-2 bg-gradient-to-br p-6 text-left transition-all duration-200',
                'hover:shadow-lg hover:-translate-y-0.5',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                cfg.accent
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background/60">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-background/60 px-2.5 py-0.5 text-xs font-medium">
                  {cfg.duration}
                </span>
              </div>
              <h3 className="mb-1 text-xl font-bold">{cfg.name}</h3>
              <p className="mb-3 text-2xl font-bold tabular-nums">
                {cfg.count}
                <span className="ml-1 text-sm font-normal text-muted-foreground">题</span>
              </p>
              <p className="text-sm text-muted-foreground">{cfg.desc}</p>
              <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                开始测试
                <ChevronLeft className="ml-1 h-4 w-4 rotate-180" />
              </div>
            </button>
          );
        })}
      </div>

      {/* 四维度说明 */}
      <div className="mt-8">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          测试覆盖 4 个心理维度：
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {DIMENSIONS.map((d) => (
            <div
              key={d.key}
              className="rounded-lg border bg-card p-3 text-center"
            >
              <p className="font-mono text-sm font-bold">
                {d.poleA.letter} / {d.poleB.letter}
              </p>
              <p className="mt-0.5 text-muted-foreground">{d.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 子组件：结果屏
// ===========================================================================

interface ResultScreenProps {
  code: string;
  personality: (typeof PERSONALITY_TYPES)[string];
  scores: DimensionScore[];
  mode: TestMode;
  copied: boolean;
  onCopy: () => void;
  onRestart: () => void;
}

function ResultScreen({
  code,
  personality,
  scores,
  mode,
  copied,
  onCopy,
  onRestart,
}: ResultScreenProps) {
  return (
    <div className="mx-auto max-w-2xl animate-scale-in">
      {/* MBTI 代码大字展示 */}
      <div className="mb-8 text-center">
        <p className="mb-2 text-sm text-muted-foreground">
          你的 MBTI 人格类型是
        </p>
        <div className="mb-2 flex items-center justify-center gap-2">
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl">
            {code}
          </h1>
        </div>
        <p className="text-lg font-semibold">
          {personality.nickname}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {personality.alias}
          </span>
        </p>
        <p className="mt-1 inline-block rounded-full bg-primary/5 px-3 py-0.5 text-xs text-muted-foreground">
          {GROUP_LABELS[personality.group]} · {MODE_CONFIG[mode].name}
        </p>
      </div>

      {/* 标语 */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-5 text-center">
          <p className="text-base font-medium italic leading-relaxed">
            "{personality.tagline}"
          </p>
        </CardContent>
      </Card>

      {/* 维度得分可视化 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            维度得分
          </CardTitle>
          <CardDescription>4 个维度的偏好强度分布</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {scores.map((score) => {
            const dim = DIMENSIONS.find((d) => d.key === score.dimension)!;
            const firstPct =
              score.first + score.second === 0
                ? 50
                : Math.round((score.first / (score.first + score.second)) * 100);
            const secondPct = 100 - firstPct;
            const firstPole = dim.poleA;
            const secondPole = dim.poleB;
            const firstDominant = score.dominant === firstPole.letter;
            return (
              <div key={score.dimension}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span
                    className={cn(
                      'font-medium',
                      firstDominant ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {firstPole.letter} · {firstPole.name}
                    <span className="ml-1 text-xs tabular-nums">{firstPct}%</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{dim.label}</span>
                  <span
                    className={cn(
                      'font-medium',
                      !firstDominant ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    <span className="mr-1 text-xs tabular-nums">{secondPct}%</span>
                    {secondPole.name} · {secondPole.letter}
                  </span>
                </div>
                {/* 双向进度条 */}
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'absolute left-0 top-0 h-full rounded-l-full transition-all duration-700 ease-out',
                      firstDominant ? 'bg-primary' : 'bg-primary/40'
                    )}
                    style={{ width: `${firstPct}%` }}
                  />
                  <div
                    className={cn(
                      'absolute right-0 top-0 h-full rounded-r-full transition-all duration-700 ease-out',
                      !firstDominant ? 'bg-primary' : 'bg-primary/40'
                    )}
                    style={{ width: `${secondPct}%` }}
                  />
                  {/* 中线 */}
                  <div className="absolute left-1/2 top-0 h-full w-px bg-background" />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 三段式分析 */}
      <div className="mb-6 grid gap-3">
        <AnalysisCard
          icon={<TrendingUp className="h-4 w-4" />}
          title="核心优势"
          color="emerald"
          text={personality.strengths}
        />
        <AnalysisCard
          icon={<AlertTriangle className="h-4 w-4" />}
          title="主要弱点"
          color="amber"
          text={personality.weaknesses}
        />
        <AnalysisCard
          icon={<Briefcase className="h-4 w-4" />}
          title="职业方向"
          color="sky"
          text={personality.careers}
        />
      </div>

      {/* 综合描述 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">人格画像</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {personality.description}
          </p>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={onCopy} className="flex-1" variant="default">
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              已复制到剪贴板
            </>
          ) : (
            <>
              <Share2 className="mr-2 h-4 w-4" />
              复制报告到剪贴板
            </>
          )}
        </Button>
        <Button onClick={onRestart} variant="outline" className="flex-1">
          <RotateCcw className="mr-2 h-4 w-4" />
          重新测试
        </Button>
      </div>
    </div>
  );
}

// ===========================================================================
// 子组件：分析卡片
// ===========================================================================

interface AnalysisCardProps {
  icon: React.ReactNode;
  title: string;
  text: string;
  color: 'emerald' | 'amber' | 'sky';
}

function AnalysisCard({ icon, title, text, color }: AnalysisCardProps) {
  const colorMap = {
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400',
    sky: 'border-sky-500/20 bg-sky-500/5 text-sky-600 dark:text-sky-400',
  };
  return (
    <Card className={cn('border', colorMap[color])}>
      <CardContent className="flex gap-3 p-4">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div>
          <p className="mb-1 text-sm font-semibold">{title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// 工具函数：格式化复制报告
// ===========================================================================

function formatReport(
  code: string,
  personality: (typeof PERSONALITY_TYPES)[string],
  scores: DimensionScore[],
  mode: TestMode
): string {
  const modeName = mode === 'express' ? '极速版' : '精准版';
  const dimLines = scores
    .map((s) => {
      const dim = DIMENSIONS.find((d) => d.key === s.dimension)!;
      const total = s.first + s.second;
      const firstPct = total === 0 ? 50 : Math.round((s.first / total) * 100);
      const secondPct = 100 - firstPct;
      return `${dim.poleA.letter} ${firstPct}%  |  ${secondPct}% ${dim.poleB.letter}  （${dim.label}）`;
    })
    .join('\n');

  return [
    `═════════════════════════════════`,
    `  MBTI 人格测试报告 · ${modeName}`,
    `═════════════════════════════════`,
    ``,
    `  类型：${code} · ${personality.nickname}（${personality.alias}）`,
    `  标语：${personality.tagline}`,
    `  气质：${GROUP_LABELS[personality.group]}`,
    ``,
    `── 维度得分 ──────────────────────`,
    dimLines,
    ``,
    `── 核心优势 ──────────────────────`,
    personality.strengths,
    ``,
    `── 主要弱点 ──────────────────────`,
    personality.weaknesses,
    ``,
    `── 职业方向 ──────────────────────`,
    personality.careers,
    ``,
    `── 人格画像 ──────────────────────`,
    personality.description,
    ``,
    `═════════════════════════════════`,
    `  测试来自 Micro-Tools · 边缘微型工具箱`,
    `═════════════════════════════════`,
  ].join('\n');
}
