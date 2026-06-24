/**
 * 配置驱动的工具注册表
 *
 * 这是整个 Micro-Tools 的元数据中心。每个工具只需在此处登记一条
 * ToolMeta 记录，即可被以下系统自动消费：
 *   - 首页工具卡片        (app/page.tsx)
 *   - 工具列表页          (app/tools/page.tsx)
 *   - 动态路由预渲染      (app/tools/[slug]/page.tsx → generateStaticParams)
 *   - 动态组件懒加载      (components/tool-loader.tsx)
 *
 * 新增工具步骤：
 *   1. 在此文件 TOOL_REGISTRY 数组中添加一条 ToolMeta
 *   2. 在 components/tools/ 下创建同名组件文件
 *   3. 在 components/tool-loader.tsx 的 TOOL_COMPONENTS 中注册动态导入
 *   4. 构建——Next.js 会自动预渲染该工具页面
 */

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/**
 * 工具运行时类型
 * - 'client'：纯浏览器端计算（WASM / Web Workers / 原生 API）
 * - 'edge'：依赖 Cloudflare Workers 边缘 API（functions/ 目录下的端点）
 */
export type ToolRuntime = 'client' | 'edge';

/**
 * 工具分类
 */
export type ToolCategory =
  | 'crypto' // 加密与哈希
  | 'converter' // 转换器
  | 'encoder' // 编解码
  | 'formatter' // 格式化
  | 'generator'; // 生成器

/**
 * 工具元数据接口
 *
 * 每个字段都是可序列化的纯数据，确保注册表不依赖任何 React 运行时。
 * 图标使用字符串名称而非组件引用，由 components/icon-resolver.tsx 解析。
 */
export interface ToolMeta {
  /** URL slug（唯一标识符），例如 'base64-codec' */
  id: string;
  /** 工具显示名称 */
  name: string;
  /** 一句话描述 */
  description: string;
  /** 分类，用于列表页分组 */
  category: ToolCategory;
  /** 搜索关键词，用于未来搜索功能 */
  keywords: string[];
  /** 图标名称（lucide-react 图标的字符串名，由 icon-resolver 解析） */
  icon: string;
  /** 组件路径（文档参考；实际加载由 tool-loader.tsx 的动态导入映射处理） */
  componentPath: string;
  /** 运行时：'client' = 浏览器端，'edge' = Cloudflare Workers 边缘 API */
  runtime: ToolRuntime;
}

// ---------------------------------------------------------------------------
// 分类配置
// ---------------------------------------------------------------------------

export const TOOL_CATEGORIES: Record<
  ToolCategory,
  { label: string; description: string }
> = {
  crypto: {
    label: '加密与哈希',
    description: '哈希计算、摘要生成等密码学相关工具',
  },
  converter: {
    label: '转换器',
    description: '单位、进制、时间等数值与格式转换',
  },
  encoder: {
    label: '编解码',
    description: 'Base64、URL、Hex 等编解码工具',
  },
  formatter: {
    label: '格式化',
    description: 'JSON、XML、SQL 等代码格式化工具',
  },
  generator: {
    label: '生成器',
    description: 'UUID、密码、Lorem 等内容生成工具',
  },
};

// ---------------------------------------------------------------------------
// 工具注册表
// ---------------------------------------------------------------------------

export const TOOL_REGISTRY: ToolMeta[] = [
  // --- 编解码类 --------------------------------------------------------------
  {
    id: 'base64-codec',
    name: 'Base64 编解码',
    description: '文本与 Base64 之间的双向编解码，支持 UTF-8',
    category: 'encoder',
    keywords: ['base64', 'encode', 'decode', '编码', '解码', 'atob', 'btoa'],
    icon: 'Binary',
    componentPath: '@/components/tools/base64-codec',
    runtime: 'client',
  },
  {
    id: 'url-encoder',
    name: 'URL 编解码',
    description: 'URL 编码与解码，支持 encodeURIComponent / encodeURI 两种模式',
    category: 'encoder',
    keywords: ['url', 'uri', 'encode', 'decode', 'percent', '编码', '解码', '百分号编码'],
    icon: 'Link2',
    componentPath: '@/components/tools/url-encoder',
    runtime: 'client',
  },

  // --- 转换器类 --------------------------------------------------------------
  {
    id: 'word-counter',
    name: '字数统计器',
    description: '实时统计字符数、单词数、行数、句子数及预计阅读时间',
    category: 'converter',
    keywords: ['word', 'count', 'character', 'letter', '字数', '统计', '阅读时间'],
    icon: 'Type',
    componentPath: '@/components/tools/word-counter',
    runtime: 'client',
  },
  {
    id: 'base-converter',
    name: '进制转换器',
    description: '二进制 / 八进制 / 十进制 / 十六进制互转，支持 BigInt 超大整数',
    category: 'converter',
    keywords: ['base', 'binary', 'octal', 'decimal', 'hex', '进制', '二进制', '十六进制', 'bigint'],
    icon: 'ArrowLeftRight',
    componentPath: '@/components/tools/base-converter',
    runtime: 'client',
  },

  // --- 加密与哈希类 ----------------------------------------------------------
  {
    id: 'hash-generator',
    name: '哈希生成器',
    description: '使用 Web Worker 计算 SHA-1/256/384/512 哈希值，不阻塞 UI',
    category: 'crypto',
    keywords: ['hash', 'sha', 'sha256', 'sha512', 'digest', '哈希', '摘要', 'crypto'],
    icon: 'Hash',
    componentPath: '@/components/tools/hash-generator',
    runtime: 'client',
  },

  // --- 演示与基准 ------------------------------------------------------------
  {
    id: 'heavy-compute-demo',
    name: 'Web Worker 计算演示',
    description: '将大数组求和/排序/统计等重型计算卸载到后台 Worker，UI 保持流畅',
    category: 'converter',
    keywords: ['worker', 'web worker', 'wasm', 'compute', 'heavy', 'background', '计算', '后台', 'worker demo'],
    icon: 'Cpu',
    componentPath: '@/components/tools/heavy-compute-demo',
    runtime: 'client',
  },
];

// ---------------------------------------------------------------------------
// 查询辅助函数
// ---------------------------------------------------------------------------

/** 按 id (slug) 获取单个工具元数据 */
export function getToolById(id: string): ToolMeta | undefined {
  return TOOL_REGISTRY.find((t) => t.id === id);
}

/** 获取所有已注册工具 */
export function getAllTools(): ToolMeta[] {
  return TOOL_REGISTRY;
}

/** 按分类分组 */
export function getToolsByCategory(): Record<ToolCategory, ToolMeta[]> {
  const grouped = {} as Record<ToolCategory, ToolMeta[]>;
  for (const key of Object.keys(TOOL_CATEGORIES) as ToolCategory[]) {
    grouped[key] = TOOL_REGISTRY.filter((t) => t.category === key);
  }
  return grouped;
}

/** 按关键词搜索工具（匹配 id / name / keywords，不区分大小写） */
export function searchTools(query: string): ToolMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOL_REGISTRY;
  return TOOL_REGISTRY.filter((t) => {
    return (
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });
}
