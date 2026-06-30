/**
 * 图标解析器
 *
 * 将 ToolMeta.icon 字符串映射到 lucide-react 图标组件。
 * 这样注册表 (lib/registry.ts) 保持纯数据，不依赖任何 React 运行时。
 *
 * 新增工具时，如果使用了新图标，在 ICON_MAP 中添加映射即可。
 */
import {
  Hash,
  Binary,
  ArrowLeftRight,
  FileJson,
  Link2,
  Type,
  Cpu,
  Images,
  Atom,
  Braces,
  Brain,
  Drama,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Hash,
  Binary,
  ArrowLeftRight,
  FileJson,
  Link2,
  Type,
  Cpu,
  Images,
  Atom,
  Braces,
  Brain,
  Drama,
};

/** 默认回退图标 */
const FALLBACK_ICON: LucideIcon = Binary;

/**
 * 根据图标名称字符串解析对应的 lucide-react 图标组件
 * @param name - ToolMeta.icon 字段值
 * @returns lucide-react 图标组件
 */
export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? FALLBACK_ICON;
}
