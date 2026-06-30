'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  Drama,
  Share2,
  TrendingUp,
  AlertTriangle,
  Wine,
  Sparkles,
  Info,
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
  type SbtiStage,
  type SbtiDimensionScore,
  type SbtiMatchResult,
  SBTI_QUESTIONS,
  SBTI_DIMENSIONS,
  SBTI_MODULE_LABELS,
  SBTI_GROUP_LABELS,
  SBTI_GROUP_COLORS,
  DRINK_QUESTION,
  calculateSbtiScores,
  matchSbtiPersonality,
} from '@/lib/sbti-data';

// ---------------------------------------------------------------------------
// 模块配色（用于答题时显示当前模块标签）
// ---------------------------------------------------------------------------

const MODULE_ACCENT: Record<string, string> = {
  S: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  E: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  A: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Ac: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  So: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

const LEVEL_LABEL: Record<string, string> = {
  low: '低倾向',
  mid: '中等',
  high: '高倾向',
};

const LEVEL_COLOR: Record<string, string> = {
  low: 'bg-slate-400',
  mid: 'bg-amber-400',
  high: 'bg-rose-500',
};

/** 分组徽章配色（静态映射，避免 Tailwind purge 动态类名） */
const GROUP_BADGE_CLASS: Record<string, string> = {
  self: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  care: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rebel: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  driver: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  thinker: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  slacker: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  mask: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
  chill: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  hidden: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

export default function SbtiTest() {
  const tool = getToolById('sbti-test')!;
  const recordUse = useToolStore((s) => s.recordUse);

  // --- 状态机 ---
  const [stage, setStage] = useState<SbtiStage>('start');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<'A' | 'B' | 'C' | null>>([]);
  const [drinkAnswer, setDrinkAnswer] = useState<'A' | 'B' | 'C' | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [copied, setCopied] = useState(false);

  // --- 开始测试 ---
  const handleStart = useCallback(() => {
    setAnswers(new Array(SBTI_QUESTIONS.length).fill(null));
    setCurrentIndex(0);
    setDrinkAnswer(null);
    setAnimKey((k) => k + 1);
    setStage('quiz');
  }, []);

  // --- 选择答案（三选一，150ms 后自动前进）---
  const handleAnswer = useCallback(
    (choice: 'A' | 'B' | 'C') => {
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = choice;
        return next;
      });

      const isLast = currentIndex === SBTI_QUESTIONS.length - 1;
      if (isLast) {
        // 进入饮酒题分支
        window.setTimeout(() => {
          setStage('drink');
          setAnimKey((k) => k + 1);
        }, 200);
      } else {
        window.setTimeout(() => {
          setAnimKey((k) => k + 1);
          setCurrentIndex((i) => i + 1);
        }, 150);
      }
    },
    [currentIndex]
  );

  // --- 饮酒题作答 → 计算结果 ---
  const handleDrinkAnswer = useCallback(
    (choice: 'A' | 'B' | 'C') => {
      setDrinkAnswer(choice);
      setStage('calculating');
      window.setTimeout(() => {
        setStage('result');
        recordUse(tool.id, tool.name);
      }, 900);
    },
    [recordUse, tool]
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
    setCurrentIndex(0);
    setAnswers([]);
    setDrinkAnswer(null);
    setCopied(false);
  }, []);

  // --- 计算结果 ---
  const result = useMemo<SbtiMatchResult | null>(() => {
    if (stage !== 'result') return null;
    const scores = calculateSbtiScores(answers);
    return matchSbtiPersonality(scores, drinkAnswer);
  }, [stage, answers, drinkAnswer]);

  const scores = useMemo<SbtiDimensionScore[]>(() => {
    if (stage !== 'result') return [];
    return calculateSbtiScores(answers);
  }, [stage, answers]);

  // --- 复制报告 ---
  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = formatReport(result, scores);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [result, scores]);

  // ===========================================================================
  // 渲染：开始屏
  // ===========================================================================
  if (stage === 'start') {
    return <StartScreen onStart={handleStart} />;
  }

  // ===========================================================================
  // 渲染：饮酒题分支
  // ===========================================================================
  if (stage === 'drink') {
    return (
      <DrinkScreen
        onAnswer={handleDrinkAnswer}
        onSkip={() => handleDrinkAnswer('C')}
      />
    );
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
            <Drama className="h-9 w-9 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-lg font-medium">正在解码你的娱乐人格...</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>分析 15 个维度的得分分布</span>
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
        result={result}
        scores={scores}
        copied={copied}
        onCopy={handleCopy}
        onRestart={handleRestart}
      />
    );
  }

  // ===========================================================================
  // 渲染：答题向导（三选一）
  // ===========================================================================
  const currentQuestion = SBTI_QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / SBTI_QUESTIONS.length) * 100;
  const currentAnswer = answers[currentIndex];
  const moduleLabel = SBTI_MODULE_LABELS[currentQuestion.module];
  const moduleAccent = MODULE_ACCENT[currentQuestion.module];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Sticky 顶部进度区 */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 bg-background/80 px-4 py-3 backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            第{' '}
            <span className="tabular-nums text-primary">{currentIndex + 1}</span>{' '}
            <span className="text-muted-foreground">/ {SBTI_QUESTIONS.length}</span> 题
          </span>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs', moduleAccent)}>
            {moduleLabel}
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* 题目卡片（带切换动画）*/}
      <div key={animKey} className="animate-slide-in-down">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-semibold leading-relaxed sm:text-2xl">
            {currentQuestion.text}
          </h2>
        </div>

        {/* 选项：三选一卡片 */}
        <div className="space-y-3">
          {(['A', 'B', 'C'] as const).map((letter) => {
            const text =
              letter === 'A'
                ? currentQuestion.optionA
                : letter === 'B'
                ? currentQuestion.optionB
                : currentQuestion.optionC;
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
                <span className="flex-1 text-base leading-relaxed">{text}</span>
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
      </div>
    </div>
  );
}

// ===========================================================================
// 子组件：开始屏（娱乐向免责声明）
// ===========================================================================

interface StartScreenProps {
  onStart: () => void;
}

function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="mx-auto max-w-3xl">
      {/* 标题区 */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Drama className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          SBTI 娱乐人格测试
        </h1>
        <p className="mt-2 text-muted-foreground">
          30 道题测出你的网络人格代号，纯浏览器本地运算，数据不上传
        </p>
      </div>

      {/* 免责声明 */}
      <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex gap-3 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">娱乐向测试声明</p>
            <p className="leading-relaxed">
              本测试为网友原创娱乐向内容，无任何心理学学术背书，仅用于社交玩梗、自我调侃。
              不可作为心理诊断、择偶、职场评判依据。认真你就输了。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 测试结构说明 */}
      <Card className="mb-6 border-dashed bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <span className="font-medium text-foreground">30 道</span> 三选一核心题
            </div>
            <div>
              <span className="font-medium text-foreground">15 个</span> 维度 · 5 大模块
            </div>
            <div>
              <span className="font-medium text-foreground">27 种</span> 人格（含 2 隐藏）
            </div>
          </div>
          <p className="mt-2 leading-relaxed">
            每题 A=3 分、B=2 分、C=1 分；每维度 2 题总分 2~6，
            分为低/中/高三级倾向，匹配最贴近你的网络人格代号。
          </p>
        </CardContent>
      </Card>

      {/* 开始按钮 */}
      <div className="text-center">
        <Button size="lg" onClick={onStart} className="px-8">
          <Sparkles className="mr-2 h-4 w-4" />
          开始测试
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">约需 3~5 分钟，建议凭第一直觉作答</p>
      </div>

      {/* 五大模块预览 */}
      <div className="mt-8">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          测试覆盖 5 大模块：
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
          {Object.entries(SBTI_MODULE_LABELS).map(([key, label]) => (
            <div
              key={key}
              className={cn(
                'rounded-lg border bg-card p-3 text-center',
                MODULE_ACCENT[key] && 'border-transparent'
              )}
            >
              <span
                className={cn(
                  'mb-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold',
                  MODULE_ACCENT[key]
                )}
              >
                {key}
              </span>
              <p className="font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 子组件：饮酒题分支
// ===========================================================================

interface DrinkScreenProps {
  onAnswer: (choice: 'A' | 'B' | 'C') => void;
  onSkip: () => void;
}

function DrinkScreen({ onAnswer, onSkip }: DrinkScreenProps) {
  return (
    <div className="mx-auto max-w-2xl animate-scale-in">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
          <Wine className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        </div>
        <p className="mb-1 text-sm text-muted-foreground">附加题 · 隐藏人格触发</p>
        <h2 className="text-xl font-semibold leading-relaxed sm:text-2xl">
          {DRINK_QUESTION.text}
        </h2>
      </div>

      <Card className="mb-6 border-orange-500/20 bg-orange-500/5">
        <CardContent className="p-4 text-xs text-muted-foreground">
          <p className="leading-relaxed">
            此题不计入 30 题核心计分，但可能触发隐藏人格分支。选 A/B 将解锁特殊人格代号。
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {(['A', 'B', 'C'] as const).map((letter) => {
          const text =
            letter === 'A'
              ? DRINK_QUESTION.optionA
              : letter === 'B'
              ? DRINK_QUESTION.optionB
              : DRINK_QUESTION.optionC;
          return (
            <button
              key={letter}
              onClick={() => onAnswer(letter)}
              className={cn(
                'group flex w-full items-start gap-4 rounded-xl border-2 p-5 text-left transition-all duration-200',
                'hover:border-primary hover:bg-primary/5 hover:shadow-md',
                'border-border bg-card'
              )}
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-border text-sm font-bold text-muted-foreground group-hover:border-primary group-hover:text-primary">
                {letter}
              </span>
              <span className="flex-1 text-base leading-relaxed">{text}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <Button variant="ghost" size="sm" onClick={onSkip}>
          跳过此题
        </Button>
      </div>
    </div>
  );
}

// ===========================================================================
// 子组件：结果屏
// ===========================================================================

interface ResultScreenProps {
  result: SbtiMatchResult;
  scores: SbtiDimensionScore[];
  copied: boolean;
  onCopy: () => void;
  onRestart: () => void;
}

function ResultScreen({
  result,
  scores,
  copied,
  onCopy,
  onRestart,
}: ResultScreenProps) {
  const { personality, matchRate, isHidden, reason, topCandidates } = result;
  const groupLabel = SBTI_GROUP_LABELS[personality.group];
  const groupBadgeClass = GROUP_BADGE_CLASS[personality.group] ?? GROUP_BADGE_CLASS.hidden;

  return (
    <div className="mx-auto max-w-2xl animate-scale-in">
      {/* 人格代号大字展示 */}
      <div className="mb-8 text-center">
        <p className="mb-2 text-sm text-muted-foreground">
          你的 SBTI 娱乐人格代号是
        </p>
        <h1
          className={cn(
            'bg-gradient-to-r bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl',
            isHidden
              ? 'from-orange-500 to-amber-500'
              : 'from-primary to-primary/60'
          )}
        >
          {personality.code}
        </h1>
        <p className="mt-2 text-lg font-semibold">
          {personality.nickname}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {personality.alias}
          </span>
        </p>
        {personality.avatar && (
          <div className="mt-4 flex justify-center">
            <img
              src={personality.avatar}
              alt={`${personality.nickname} 头像`}
              className="h-48 w-auto rounded-lg object-contain shadow-sm"
            />
          </div>
        )}
        <div className="mt-2 flex items-center justify-center gap-2">
          <span
            className={cn(
              'inline-block rounded-full px-2.5 py-0.5 text-xs',
              groupBadgeClass
            )}
          >
            {groupLabel}
          </span>
          {isHidden && (
            <span className="inline-block rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs text-orange-600 dark:text-orange-400">
              隐藏人格
            </span>
          )}
          {!isHidden && reason === 'matched' && (
            <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              匹配度 {Math.round(matchRate * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* 标语 */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-5 text-center">
          <p className="text-base font-medium italic leading-relaxed">
            “{personality.tagline}”
          </p>
        </CardContent>
      </Card>

      {/* 隐藏人格触发说明 */}
      {isHidden && reason !== 'matched' && (
        <Card className="mb-6 border-orange-500/30 bg-orange-500/5">
          <CardContent className="flex gap-3 p-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
            <div className="text-sm">
              <p className="mb-1 font-medium text-foreground">
                {reason === 'drink' ? '🍷 饮酒题触发' : '🎲 兜底人格触发'}
              </p>
              <p className="leading-relaxed text-muted-foreground">
                {reason === 'drink'
                  ? '你在附加饮酒题选择了 A/B，强制解锁了隐藏人格 DRUNK。'
                  : '你的维度分布过于均衡，无突出高分倾向，系统自动分配兜底隐藏人格 HHHH。'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 维度得分可视化（15 维度，按模块分组）*/}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            15 维度倾向分布
          </CardTitle>
          <CardDescription>每维度总分 2~6，分为低/中/高三级</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(['S', 'E', 'A', 'Ac', 'So'] as const).map((modKey) => {
            const modDims = scores.filter(
              (s) => SBTI_DIMENSIONS.find((d) => d.key === s.dimension)?.module === modKey
            );
            if (modDims.length === 0) return null;
            return (
              <div key={modKey}>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {SBTI_MODULE_LABELS[modKey]}
                </p>
                <div className="space-y-2">
                  {modDims.map((score) => {
                    const dim = SBTI_DIMENSIONS.find((d) => d.key === score.dimension)!;
                    const pct = (score.total / 6) * 100;
                    return (
                      <div key={score.dimension} className="flex items-center gap-3 text-sm">
                        <span className="w-24 shrink-0 text-xs text-muted-foreground">
                          {dim.label}
                        </span>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-700 ease-out',
                              LEVEL_COLOR[score.level]
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                          {score.total}/6
                        </span>
                        <span className="w-14 shrink-0 text-right text-xs">
                          {LEVEL_LABEL[score.level]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 核心倾向 + 人格描述 */}
      <div className="mb-6 grid gap-3">
        <AnalysisCard
          icon={<AlertTriangle className="h-4 w-4" />}
          title="核心倾向"
          color="amber"
          text={personality.tendency}
        />
      </div>

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

      {/* 候选人格（仅匹配模式）*/}
      {!isHidden && topCandidates && topCandidates.length > 1 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">其他高匹配人格</CardTitle>
            <CardDescription>除了主人格，这几位也很像你</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topCandidates.slice(1).map(({ personality: p, matchRate: mr }) => (
              <div
                key={p.code}
                className="flex items-center justify-between rounded-lg border bg-card p-3"
              >
                <div>
                  <span className="font-mono text-sm font-bold">{p.code}</span>
                  <span className="ml-2 text-sm">{p.nickname}</span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {Math.round(mr * 100)}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
              复制报告分享
            </>
          )}
        </Button>
        <Button onClick={onRestart} variant="outline" className="flex-1">
          <RotateCcw className="mr-2 h-4 w-4" />
          重新测试
        </Button>
      </div>

      {/* 底部免责 */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        本测试纯属娱乐，认真你就输了 · 来自 Micro-Tools
      </p>
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
  color: 'amber' | 'sky' | 'emerald';
}

function AnalysisCard({ icon, title, text, color }: AnalysisCardProps) {
  const colorMap = {
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400',
    sky: 'border-sky-500/20 bg-sky-500/5 text-sky-600 dark:text-sky-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
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

function formatReport(result: SbtiMatchResult, scores: SbtiDimensionScore[]): string {
  const { personality, matchRate, isHidden, reason } = result;
  const matchText = isHidden
    ? reason === 'drink'
      ? '饮酒题触发'
      : '兜底人格'
    : `匹配度 ${Math.round(matchRate * 100)}%`;

  const dimLines = scores
    .map((s) => {
      const dim = SBTI_DIMENSIONS.find((d) => d.key === s.dimension)!;
      return `${s.dimension} ${dim.label}：${s.total}/6（${LEVEL_LABEL[s.level]}）`;
    })
    .join('\n');

  return [
    `═════════════════════════════════`,
    `  SBTI 娱乐人格测试报告`,
    `═════════════════════════════════`,
    ``,
    `  代号：${personality.code} · ${personality.nickname}（${personality.alias}）`,
    `  标语：${personality.tagline}`,
    `  分组：${SBTI_GROUP_LABELS[personality.group]}`,
    `  匹配：${matchText}`,
    ``,
    `── 核心倾向 ──────────────────────`,
    personality.tendency,
    ``,
    `── 15 维度得分 ───────────────────`,
    dimLines,
    ``,
    `── 人格画像 ──────────────────────`,
    personality.description,
    ``,
    `═════════════════════════════════`,
    `  纯属娱乐，认真你就输了`,
    `  测试来自 Micro-Tools · 边缘微型工具箱`,
    `═════════════════════════════════`,
  ].join('\n');
}
