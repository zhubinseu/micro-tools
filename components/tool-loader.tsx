'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * 工具组件动态加载器
 *
 * 使用 next/dynamic 将每个工具组件打包为独立 chunk，
 * 仅在访问对应工具页面时按需加载，减小首屏 JS 体积。
 *
 * 新增工具时：
 *   1. 在 lib/registry.ts 的 TOOL_REGISTRY 中添加元数据
 *   2. 在此处的 TOOL_COMPONENTS 中添加一行动态导入
 *
 * 每个 dynamic() 调用会生成独立 chunk（代码分割），
 * loading 状态在组件加载期间显示骨架 UI。
 */

// 加载占位组件
function ToolLoading() {
  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      <span className="text-sm">加载工具中...</span>
    </div>
  );
}

/**
 * slug → 动态组件的映射表
 *
 * key 必须与 ToolMeta.id 一致。
 * next/dynamic 的 import() 表达式必须是静态字符串，
 * 以便 webpack 在构建时进行代码分割分析。
 */
const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  'base64-codec': dynamic(() => import('@/components/tools/base64-codec'), {
    loading: ToolLoading,
    ssr: false,
  }),
  'url-encoder': dynamic(() => import('@/components/tools/url-encoder'), {
    loading: ToolLoading,
    ssr: false,
  }),
  'word-counter': dynamic(() => import('@/components/tools/word-counter'), {
    loading: ToolLoading,
    ssr: false,
  }),
  'base-converter': dynamic(() => import('@/components/tools/base-converter'), {
    loading: ToolLoading,
    ssr: false,
  }),
  'hash-generator': dynamic(() => import('@/components/tools/hash-generator'), {
    loading: ToolLoading,
    ssr: false,
  }),
  'heavy-compute-demo': dynamic(() => import('@/components/tools/heavy-compute-demo'), {
    loading: ToolLoading,
    ssr: false,
  }),
  'image-compressor': dynamic(() => import('@/components/tools/image-compressor'), {
    loading: ToolLoading,
    ssr: false,
  }),
  'physics-configurator': dynamic(() => import('@/components/tools/physics-configurator'), {
    loading: ToolLoading,
    ssr: false,
  }),
  'json-formatter': dynamic(() => import('@/components/tools/json-formatter'), {
    loading: ToolLoading,
    ssr: false,
  }),
};

interface ToolLoaderProps {
  /** 工具 id (slug)，对应 ToolMeta.id */
  id: string;
}

/**
 * 根据 id 渲染对应的工具组件
 * 如果 id 未在映射表中注册，渲染空占位（理论上不会发生——动态路由已做 notFound 兜底）
 */
export function ToolLoader({ id }: ToolLoaderProps) {
  const Component = TOOL_COMPONENTS[id];
  if (!Component) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        工具组件未注册：{id}
      </div>
    );
  }
  return <Component />;
}
