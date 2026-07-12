/**
 * 统一埋点封装 — 双发方案（GA4 + 百度统计）
 *
 * 一次调用，同时发送到 Google Analytics 4 和百度统计。
 * 两个平台互为补充：GA4 适合海外/深度分析，百度统计适合国内访问。
 *
 * 用法：
 *   import { track } from '@/lib/analytics';
 *   track('tool_used', { category: 'quiz', label: 'sbti-test' });
 *
 * 事件命名规范：snake_case，动词过去式（used / completed / shared / toggled）
 */

// ---------------------------------------------------------------------------
// 类型声明 — 扩展 window 对象，让 TypeScript 识别 gtag 和 _hmt
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    _hmt?: unknown[];
  }
}

// ---------------------------------------------------------------------------
// 核心埋点函数
// ---------------------------------------------------------------------------

/**
 * 发送自定义事件到 GA4 + 百度统计
 *
 * @param eventName 事件名（snake_case，如 'tool_used'）
 * @param params    事件参数
 *   - category: 事件类别（如 'quiz' / 'crypto' / 'converter'）
 *   - label:    事件标签（如工具 ID 'sbti-test'）
 *   - value:    数值（如得分、时长，可选）
 *   - 其他自定义参数会一并传给 GA4
 */
export function track(
  eventName: string,
  params?: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: string | number | undefined;
  }
): void {
  if (typeof window === 'undefined') return;

  // ---- GA4 自定义事件 ----
  // gtag('event', 'event_name', { param1: 'value1', ... })
  // 参考: https://developers.google.com/analytics/devguides/collection/ga4/events
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params ?? {});
  }

  // ---- 百度统计事件追踪 ----
  // _hmt.push(['_trackEvent', category, action, label, value])
  // 参考: https://tongji.baidu.com/holmes/event-tracking-manual
  if (Array.isArray(window._hmt)) {
    window._hmt.push([
      '_trackEvent',
      params?.category ?? 'default', // category: 事件类别
      eventName,                     // action: 事件操作
      params?.label ?? '',           // label: 事件标签
      params?.value ?? 0,            // value: 事件数值
    ]);
  }
}

// ---------------------------------------------------------------------------
// 便捷方法 — 针对项目常用场景的语义化封装
// ---------------------------------------------------------------------------

/**
 * 工具使用埋点 — 用户点击工具卡片进入工具页
 */
export function trackToolUsed(toolId: string, category: string): void {
  track('tool_used', {
    category,
    label: toolId,
  });
}

/**
 * 工具完成埋点 — 用户完成工具操作（如测试出结果）
 */
export function trackToolCompleted(
  toolId: string,
  category: string,
  resultType?: string
): void {
  track('tool_completed', {
    category,
    label: toolId,
    result_type: resultType,
  });
}

/**
 * 结果分享埋点 — 用户点击复制报告 / 分享按钮
 */
export function trackResultShared(
  toolId: string,
  shareMethod: string = 'copy'
): void {
  track('result_shared', {
    category: 'engagement',
    label: toolId,
    share_method: shareMethod,
  });
}

/**
 * 重新测试埋点 — 用户点击"重新开始"
 */
export function trackToolRestarted(toolId: string): void {
  track('tool_restarted', {
    category: 'engagement',
    label: toolId,
  });
}

/**
 * 命令面板使用埋点 — 用户通过 Cmd+K 选择工具
 */
export function trackCommandPaletteUsed(toolId: string): void {
  track('command_palette_used', {
    category: 'navigation',
    label: toolId,
  });
}

/**
 * 主题切换埋点 — 用户切换深色/浅色模式
 */
export function trackThemeToggled(theme: string): void {
  track('theme_toggled', {
    category: 'ui',
    label: theme,
  });
}
