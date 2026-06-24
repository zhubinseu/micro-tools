'use client';

import { useState, useCallback } from 'react';
import { Loader2, Copy, Check } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useHashWorker } from '@/hooks/use-hash-worker';
import { useToolStore } from '@/store';
import { getTool } from '@/lib/tools';

const ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
type Algorithm = (typeof ALGORITHMS)[number];

export default function HashGeneratorPage() {
  const tool = getTool('hash-generator')!;
  const { hash, isComputing, isSupported, error } = useHashWorker();
  const recordUse = useToolStore((s) => s.recordUse);

  const [input, setInput] = useState('');
  const [results, setResults] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const compute = useCallback(async () => {
    const data = new TextEncoder().encode(input);
    const newResults: Record<string, string> = {};

    for (const algo of ALGORITHMS) {
      newResults[algo] = await hash(algo, data);
    }

    setResults(newResults);
    recordUse(tool.slug, tool.name);
  }, [input, hash, recordUse, tool]);

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
        <p className="mt-1 text-muted-foreground">{tool.description}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              isSupported ? 'bg-green-500' : 'bg-amber-500'
            }`}
          />
          {isSupported ? 'Web Worker 已启用' : '回退到主线程计算'}
        </div>
      </div>

      <Separator className="mb-8" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">输入文本</CardTitle>
          <CardDescription>输入任意文本，将计算多种哈希值</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hash-input">待哈希内容</Label>
            <textarea
              id="hash-input"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Hello, Micro-Tools!"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <Button
            onClick={compute}
            disabled={!input || isComputing}
          >
            {isComputing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                计算中...
              </>
            ) : (
              '计算哈希'
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          计算出错：{error}
        </div>
      )}

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">计算结果</h2>
          {ALGORITHMS.map((algo) => (
            <Card key={algo}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{algo}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <code className="flex-1 break-all rounded bg-muted px-3 py-2 text-xs">
                    {results[algo]}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopy(results[algo])}
                  >
                    {copied === results[algo] ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
