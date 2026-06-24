import {
  Hash,
  ArrowLeftRight,
  Binary,
  FileJson,
  type LucideIcon,
} from 'lucide-react';

export type ToolCategory =
  | 'crypto'
  | 'converter'
  | 'encoder'
  | 'formatter'
  | 'generator';

export interface ToolMeta {
  /** URL slug，例如 'hash-generator' */
  slug: string;
  /** 工具名称 */
  name: string;
  /** 一句话描述 */
  description: string;
  /** 分类 */
  category: ToolCategory;
  /** 图标 */
  icon: LucideIcon;
  /** 是否需要 Web Worker / WASM 重度计算 */
  heavy?: boolean;
  /** 是否已上线（用于占位注册） */
  available: boolean;
}

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

/**
 * 工具注册表
 * 新增工具时在此处登记，首页与 /tools 列表页会自动渲染
 */
export const TOOLS: ToolMeta[] = [
  {
    slug: 'hash-generator',
    name: '哈希生成器',
    description: '使用 Web Worker 计算 SHA-1/256/384/512 等哈希值',
    category: 'crypto',
    icon: Hash,
    heavy: true,
    available: true,
  },
  {
    slug: 'base-converter',
    name: '进制转换器',
    description: '二进制 / 八进制 / 十进制 / 十六进制互转',
    category: 'converter',
    icon: Binary,
    available: true,
  },
  {
    slug: 'unit-converter',
    name: '单位转换器',
    description: '长度、重量、温度等常用单位换算',
    category: 'converter',
    icon: ArrowLeftRight,
    available: false,
  },
  {
    slug: 'json-formatter',
    name: 'JSON 格式化',
    description: '美化、压缩、校验 JSON 数据',
    category: 'formatter',
    icon: FileJson,
    available: false,
  },
];

/** 按 slug 获取单个工具 */
export function getTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

/** 获取所有可用工具 */
export function getAvailableTools(): ToolMeta[] {
  return TOOLS.filter((t) => t.available);
}

/** 按分类分组 */
export function getToolsByCategory(): Record<ToolCategory, ToolMeta[]> {
  const grouped = {} as Record<ToolCategory, ToolMeta[]>;
  for (const key of Object.keys(TOOL_CATEGORIES) as ToolCategory[]) {
    grouped[key] = TOOLS.filter((t) => t.category === key);
  }
  return grouped;
}
