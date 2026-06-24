/**
 * 向后兼容的 re-export 层
 *
 * 工具注册表已迁移到 lib/registry.ts。
 * 此文件保留 re-export，确保已有导入 '@/lib/tools' 的代码继续工作。
 *
 * 新代码请直接从 '@/lib/registry' 导入。
 */

export {
  type ToolMeta,
  type ToolCategory,
  type ToolRuntime,
  TOOL_CATEGORIES,
  TOOL_REGISTRY as TOOLS,
  getToolById as getTool,
  getAllTools as getAvailableTools,
  getToolsByCategory,
  searchTools,
} from '@/lib/registry';
