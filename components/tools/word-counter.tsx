'use client';

import { useState, useMemo, useCallback } from 'react';
import { Copy, Check, Clock, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToolStore } from '@/store';
import { getToolById } from '@/lib/registry';

export default function WordCounter() {
  const tool = getToolById('word-counter')!;
  const recordUse = useToolStore((s) => s.recordUse);

  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const words = trimmed ? trimmed.split(/\s+/).length : 0;

    // 中日韩字符按单字计数
    const cjkChars = (text.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
    const totalWords = words + cjkChars;

    const lines = text ? text.split('\n').length : 0;
    const sentences = trimmed
      ? (trimmed.match(/[^.!?。！？]+[.!?。！？]+/g) || [trimmed]).length
      : 0;
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0;

    // 阅读时间：中文 ~300 字/分钟，英文 ~200 词/分钟
    const readingMinutes = Math.max(
      0,
      Math.ceil(Math.max(cjkChars / 300, words / 200)),
    );

    return {
      chars,
      charsNoSpaces,
      words: totalWords,
      wordsEn: words,
      cjkChars,
      lines,
      sentences,
      paragraphs,
      readingMinutes,
    };
  }, [text]);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    recordUse(tool.id, tool.name);
  }, [text, recordUse, tool]);

  const statCards = [
    { label: '字符数', value: stats.chars, hint: '含空格' },
    { label: '字符数', value: stats.charsNoSpaces, hint: '不含空格' },
    { label: '词数', value: stats.words, hint: `英文 ${stats.wordsEn} · CJK ${stats.cjkChars}` },
    { label: '行数', value: stats.lines, hint: '' },
    { label: '句子数', value: stats.sentences, hint: '' },
    { label: '段落数', value: stats.paragraphs, hint: '' },
  ];

  return (
    <div className="space-y-4">
      {/* 统计卡片网格 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.label + s.hint}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground">
                {s.label}
                {s.hint && <span className="ml-1 opacity-70">({s.hint})</span>}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 阅读时间 */}
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>
          预计阅读时间：
          <span className="font-semibold">
            {stats.readingMinutes === 0 ? '< 1' : stats.readingMinutes} 分钟
          </span>
        </span>
      </div>

      {/* 文本输入 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">输入文本</CardTitle>
              <CardDescription>
                统计结果会随输入实时更新
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              disabled={!text}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="在此输入或粘贴文本，统计数据将实时更新..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* 说明 */}
      <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div>
          <p className="font-medium text-foreground">统计规则</p>
          <ul className="mt-1 space-y-0.5">
            <li>• 词数 = 英文单词数 + 中日韩字符数（CJK 字符逐字计数）</li>
            <li>• 句子以 . ! ? 。 ！ ？ 等标点分隔</li>
            <li>• 段落以空行分隔</li>
            <li>• 阅读速度：中文 300 字/分钟，英文 200 词/分钟</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
