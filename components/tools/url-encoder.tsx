'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Workspace } from '@/components/workspace';

type Mode = 'encode' | 'decode';
type Method = 'component' | 'uri';

export default function UrlEncoder() {
  const [mode, setMode] = useState<Mode>('encode');
  const [method, setMethod] = useState<Method>('component');

  return (
    <Workspace
      toolId="url-encoder"
      modeLabel={mode}
      inputTitle={mode === 'encode' ? '原始文本' : '编码文本'}
      outputTitle={mode === 'encode' ? '编码结果' : '解码结果'}
      inputPlaceholder={
        mode === 'encode'
          ? 'https://example.com/搜索?q=hello world'
          : 'https%3A%2F%2Fexample.com%2F%E6%90%9C%E7%B4%A2'
      }
    >
      {({ input, setInput, output, setOutput, commitHistory }) => (
        <UrlInner
          mode={mode}
          setMode={setMode}
          method={method}
          setMethod={setMethod}
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

interface InnerProps {
  mode: Mode;
  setMode: (m: Mode) => void;
  method: Method;
  setMethod: (m: Method) => void;
  input: string;
  setInput: (v: string) => void;
  output: string;
  setOutput: (v: string) => void;
  commitHistory: (e: { input: string; output: string; label?: string }) => void;
}

function UrlInner({
  mode,
  setMode,
  method,
  setMethod,
  input,
  setInput,
  setOutput,
  commitHistory,
}: InnerProps) {
  const { computed, error } = useMemo(() => {
    if (!input) return { computed: '', error: null as string | null };

    try {
      if (mode === 'encode') {
        return {
          computed:
            method === 'component'
              ? encodeURIComponent(input)
              : encodeURI(input),
          error: null,
        };
      } else {
        return {
          computed:
            method === 'component'
              ? decodeURIComponent(input)
              : decodeURI(input),
          error: null,
        };
      }
    } catch {
      return {
        computed: '',
        error: '解码失败：输入包含无效的百分号编码序列',
      };
    }
  }, [input, mode, method]);

  // 同步计算结果到 Workspace
  useEffect(() => {
    setOutput(computed);
  }, [computed, setOutput]);

  const handleSwap = () => {
    if (computed) {
      commitHistory({ input, output: computed, label: mode });
      setInput(computed);
    }
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  return (
    <div className="space-y-3">
      {/* 模式 + 方法切换 */}
      <div
        role="group"
        aria-label="编解码设置"
        className="flex flex-wrap items-center gap-2"
      >
        <Button
          variant={mode === 'encode' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('encode')}
          aria-pressed={mode === 'encode'}
        >
          编码
        </Button>
        <Button
          variant={mode === 'decode' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('decode')}
          aria-pressed={mode === 'decode'}
        >
          解码
        </Button>

        <div className="mx-2 h-5 w-px bg-border" />

        <Button
          variant={method === 'component' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setMethod('component')}
          aria-pressed={method === 'component'}
          className="font-mono text-xs"
        >
          encodeURIComponent
        </Button>
        <Button
          variant={method === 'uri' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setMethod('uri')}
          aria-pressed={method === 'uri'}
          className="font-mono text-xs"
        >
          encodeURI
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

      {/* 方法说明 */}
      <p className="text-xs text-muted-foreground">
        {method === 'component'
          ? 'encodeURIComponent：编码所有特殊字符（包括 / ? : @ & = + $ #），适合编码 URL 参数值'
          : 'encodeURI：保留 URL 保留字符（/ ? : @ & = + $ #），适合编码完整 URL'}
      </p>

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
    </div>
  );
}
