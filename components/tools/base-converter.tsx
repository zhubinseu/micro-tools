'use client';

import { useState, useCallback } from 'react';
import { ArrowRight, Copy, Check } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToolStore } from '@/store';
import { getToolById } from '@/lib/registry';

const BASES = [
  { label: '二进制 (BIN)', base: 2, prefix: '0b' },
  { label: '八进制 (OCT)', base: 8, prefix: '0o' },
  { label: '十进制 (DEC)', base: 10, prefix: '' },
  { label: '十六进制 (HEX)', base: 16, prefix: '0x' },
] as const;

export default function BaseConverter() {
  const tool = getToolById('base-converter')!;
  const recordUse = useToolStore((s) => s.recordUse);

  const [values, setValues] = useState<Record<number, string>>({
    2: '',
    8: '',
    10: '',
    16: '',
  });
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateFromBase = useCallback(
    (fromBase: number, value: string) => {
      setError(null);

      if (!value.trim()) {
        setValues({ 2: '', 8: '', 10: '', 16: '' });
        return;
      }

      try {
        const num = BigInt(value);
        setValues({
          2: num.toString(2),
          8: num.toString(8),
          10: num.toString(10),
          16: num.toString(16).toUpperCase(),
        });
        recordUse(tool.id, tool.name);
      } catch {
        setError(`无法解析为有效的 ${fromBase} 进制数字`);
        setValues((prev) => ({ ...prev, [fromBase]: value }));
      }
    },
    [recordUse, tool],
  );

  const handleCopy = async (base: number) => {
    await navigator.clipboard.writeText(values[base]);
    setCopied(base);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {BASES.map(({ label, base, prefix }) => (
          <Card key={base}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {prefix && (
                  <span className="text-sm text-muted-foreground">{prefix}</span>
                )}
                <Input
                  value={values[base]}
                  onChange={(e) => updateFromBase(base, e.target.value)}
                  placeholder="输入数字..."
                  className="font-mono"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleCopy(base)}
                  disabled={!values[base]}
                >
                  {copied === base ? (
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

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">使用说明</p>
        <ul className="mt-2 space-y-1">
          <li>• 在任意进制输入框中输入数字，其他进制会自动同步</li>
          <li>• 十六进制输入不区分大小写，输出统一为大写</li>
          <li>• 支持负数（以 - 开头）</li>
          <li>• 支持任意长度整数（基于 BigInt）</li>
        </ul>
      </div>
    </div>
  );
}
