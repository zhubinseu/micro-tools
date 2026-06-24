'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Workspace } from '@/components/workspace';

type Mode = 'encode' | 'decode';

export default function Base64Codec() {
  const [mode, setMode] = useState<Mode>('encode');

  return (
    <Workspace
      toolId="base64-codec"
      modeLabel={mode}
      inputTitle={mode === 'encode' ? '明文输入' : 'Base64 输入'}
      outputTitle={mode === 'encode' ? 'Base64 输出' : '解码结果'}
      inputPlaceholder={
        mode === 'encode'
          ? 'Hello, Micro-Tools!'
          : 'SGVsbG8sIE1pY3JvLVRvb2xzIQ=='
      }
    >
      {({ input, setInput, output, setOutput, commitHistory }) => (
        <Base64Inner
          mode={mode}
          setMode={setMode}
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
// 内部组件：处理编解码逻辑
// ---------------------------------------------------------------------------

interface InnerProps {
  mode: Mode;
  setMode: (m: Mode) => void;
  input: string;
  setInput: (v: string) => void;
  output: string;
  setOutput: (v: string) => void;
  commitHistory: (e: { input: string; output: string; label?: string }) => void;
}

function Base64Inner({
  mode,
  setMode,
  input,
  setInput,
  setOutput,
  commitHistory,
}: InnerProps) {
  // 实时计算输出
  const { computed, error } = useMemo(() => {
    if (!input) return { computed: '', error: null as string | null };

    try {
      if (mode === 'encode') {
        const bytes = new TextEncoder().encode(input);
        let binary = '';
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        return { computed: btoa(binary), error: null };
      } else {
        const binary = atob(input.trim());
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        return { computed: new TextDecoder().decode(bytes), error: null };
      }
    } catch {
      return {
        computed: '',
        error: mode === 'decode' ? '无效的 Base64 输入' : '编码失败',
      };
    }
  }, [input, mode]);

  // 同步计算结果到 Workspace（使工具栏 "复制输出" 可用）
  useEffect(() => {
    setOutput(computed);
  }, [computed, setOutput]);

  // 模式切换时提交一次历史记录
  const handleSwap = () => {
    if (computed) {
      commitHistory({ input, output: computed, label: mode });
      setInput(computed);
    }
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  return (
    <div className="space-y-3">
      {/* 模式切换 */}
      <div
        role="group"
        aria-label="编解码模式"
        className="flex flex-wrap items-center gap-2"
      >
        <Button
          variant={mode === 'encode' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('encode')}
          aria-pressed={mode === 'encode'}
        >
          编码 Encode
        </Button>
        <Button
          variant={mode === 'decode' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('decode')}
          aria-pressed={mode === 'decode'}
        >
          解码 Decode
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSwap}
          disabled={!computed}
          className="ml-auto"
          aria-label="将输出填入输入并切换模式"
        >
          <ArrowRight className="mr-1 h-3.5 w-3.5" />
          反转
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          role="alert"
          className="flex animate-fade-in items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 说明 */}
      <p className="text-xs text-muted-foreground">
        支持 UTF-8 全字符集（含中文、Emoji）。实时编解码，输入即转换。
      </p>
    </div>
  );
}
