/**
 * WASM 模块加载工具
 *
 * 由于 Next.js 静态导出，WASM 文件作为静态资源输出到 _next/static/wasm/。
 * 使用 fetch + WebAssembly.instantiateStreaming 在浏览器中加载。
 *
 * 实际项目中，将 Rust / AssemblyScript / Zig 编译为 .wasm 后，
 * 把产物放到 public/wasm/ 目录，通过此工具动态加载。
 */

interface WasmModule {
  [key: string]: unknown;
}

const loadedModules = new Map<string, WebAssembly.Instance>();

/**
 * 加载并实例化一个 WASM 模块
 * @param url wasm 文件路径（相对站点根目录，如 '/wasm/calculator.wasm'）
 * @param imports 导入给 WASM 的函数对象
 */
export async function loadWasm(
  url: string,
  imports?: WebAssembly.Imports
): Promise<WebAssembly.Instance> {
  // 缓存已加载的实例，避免重复实例化
  if (loadedModules.has(url)) {
    return loadedModules.get(url)!;
  }

  const fullUrl = url.startsWith('http')
    ? url
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`;

  // 流式实例化性能更优，但要求正确的 MIME 类型
  if (WebAssembly.instantiateStreaming) {
    try {
      const response = await fetch(fullUrl);
      const { instance } = await WebAssembly.instantiateStreaming(
        response,
        imports
      );
      loadedModules.set(url, instance);
      return instance;
    } catch {
      // 回退到非流式加载
    }
  }

  const response = await fetch(fullUrl);
  const bytes = await response.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, imports);
  loadedModules.set(url, instance);
  return instance;
}

/**
 * 调用 WASM 模块的导出函数
 */
export function callWasm<T = unknown>(
  instance: WebAssembly.Instance,
  funcName: string,
  ...args: unknown[]
): T {
  const exports = instance.exports as unknown as WasmModule;
  const func = exports[funcName];
  if (typeof func !== 'function') {
    throw new Error(`WASM 导出函数 "${funcName}" 不存在`);
  }
  return (func as (...a: unknown[]) => T)(...args);
}
