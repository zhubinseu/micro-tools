'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Braces,
  Minimize2,
  Maximize2,
  Wand2,
  ClipboardPaste,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Workspace } from '@/components/workspace';
import { cn } from '@/lib/utils';

type IndentMode = 2 | 4 | 'tab';
type FormatAction = 'beautify' | 'minify' | 'validate';

const DEFAULT_INPUT = `{"name":"Micro-Tools","version":"1.0.0","features":["zero-upload","edge-first","wasm"],"author":{"name":"bin","email":"zhubinseu@gmail.com"}}`;

export default function JsonFormatter() {
  const [mode, setMode] = useState<FormatAction>('beautify');
  const [indent, setIndent] = useState<IndentMode>(2);

  return (
    <Workspace
      toolId="json-formatter"
      modeLabel={mode}
      inputTitle="JSON 输入"
      outputTitle="格式化结果"
      inputPlaceholder={DEFAULT_INPUT}
    >
      {({ input, setInput, output, setOutput, commitHistory }) => (
        <JsonInner
          mode={mode}
          setMode={setMode}
          indent={indent}
          setIndent={setIndent}
          input={input}
          setInput={setInput}
          output={output}
          setOutput={setOutput}
          commitHistory={commitHistory}
        />
      )}
    </Workspace>
  );
}

// ---------------------------------------------------------------------------
// 内部组件
// ---------------------------------------------------------------------------

interface InnerProps {
  mode: FormatAction;
  setMode: (m: FormatAction) => void;
  indent: IndentMode;
  setIndent: (i: IndentMode) => void;
  input: string;
  setInput: (v: string) => void;
  output: string;
  setOutput: (v: string) => void;
  commitHistory: (e: { input: string; output: string; label?: string }) => void;
}

function JsonInner({
  mode,
  setMode,
  indent,
  setIndent,
  input,
  setInput,
  output,
  setOutput,
  commitHistory,
}: InnerProps) {
  const [error, setError] = useState<string | null>(null);

  // 读取 URL hash 中的预填内容（从命令面板"Format JSON with JSON Tool"跳转）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash) return;
    try {
      const params = new URLSearchParams(hash.slice(1));
      const preset = params.get('json');
      if (preset) {
        setInput(preset);
        // 清除 hash 避免下次进入时重复触发
        history.replaceState(null, '', window.location.pathname);
      }
    } catch {
      // 忽略 hash 解析错误
    }
  }, [setInput]);

  // 缩进数值
  const indentValue = indent === 'tab' ? '\t' : ' '.repeat(indent);

  // 实时格式化
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      let result: string;
      if (mode === 'minify') {
        result = JSON.stringify(parsed);
      } else {
        result = JSON.stringify(parsed, null, indentValue);
      }
      setOutput(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      // 保留上次的有效输出，不清空
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, mode, indent]);

  // 提交历史（仅在有输出时）
  const handleCommitHistory = useCallback(() => {
    if (output) {
      commitHistory({ input, output, label: mode });
    }
  }, [input, output, commitHistory, mode]);

  // 切换模式时提交一次
  useEffect(() => {
    handleCommitHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, indent]);

  // 从剪贴板粘贴
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInput(text);
    } catch {
      // 剪贴板权限拒绝
    }
  }, [setInput]);

  // 统计信息
  const stats = useMemo(() => {
    if (!output) return null;
    let lines = 0;
    let bytes = 0;
    for (const ch of output) {
      if (ch === '\n') lines++;
      bytes += ch.charCodeAt(0) > 127 ? 3 : 1; // UTF-8 字节估算
    }
    return { lines: lines + 1, bytes };
  }, [output]);

  return (
    <div className="flex flex-col gap-3">
      {/* 模式选择工具条 */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Braces className="h-4 w-4" />
          操作模式
        </div>
        <div className="flex gap-1">
          <ModeButton
            active={mode === 'beautify'}
            onClick={() => setMode('beautify')}
            icon={<Maximize2 className="h-3.5 w-3.5" />}
            label="美化"
          />
          <ModeButton
            active={mode === 'minify'}
            onClick={() => setMode('minify')}
            icon={<Minimize2 className="h-3.5 w-3.5" />}
            label="压缩"
          />
          <ModeButton
            active={mode === 'validate'}
            onClick={() => setMode('validate')}
            icon={<Wand2 className="h-3.5 w-3.5" />}
            label="校验"
          />
        </div>

        <div className="mx-2 h-5 w-px bg-border" />

        {/* 缩进选择（仅 beautify 模式） */}
        <div
          className={cn(
            'flex items-center gap-2 transition-opacity',
            mode !== 'beautify' && 'pointer-events-none opacity-40',
          )}
        >
          <Label className="text-xs text-muted-foreground">缩进</Label>
          <div className="flex gap-1">
            {([2, 4, 'tab'] as IndentMode[]).map((v) => (
              <ModeButton
                key={String(v)}
                active={indent === v}
                onClick={() => setIndent(v)}
                label={v === 'tab' ? 'Tab' : `${v} 空格`}
                size="xs"
              />
            ))}
          </div>
        </div>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handlePaste}
          className="gap-1.5 text-xs"
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          粘贴
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">JSON 解析失败</p>
            <p className="mt-0.5 break-all text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      {stats && mode !== 'validate' && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {stats.lines} 行 · {stats.bytes} 字节
          </span>
          {input.length > 0 && (
            <span>
              压缩率{' '}
              <span
                className={cn(
                  'font-mono font-medium',
                  output.length < input.length
                    ? 'text-green-600'
                    : 'text-red-600',
                )}
              >
                {((1 - output.length / input.length) * 100).toFixed(1)}%
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 辅助组件
// ---------------------------------------------------------------------------

interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  size?: 'sm' | 'xs';
}

function ModeButton({ active, onClick, icon, label, size = 'sm' }: ModeButtonProps) {
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size={size === 'xs' ? 'sm' : 'sm'}
      onClick={onClick}
      className={cn(
        'gap-1.5',
        size === 'xs' ? 'h-7 px-2 text-[11px]' : 'h-8 px-3 text-xs',
      )}
    >
      {icon}
      {label}
    </Button>
  );
}
