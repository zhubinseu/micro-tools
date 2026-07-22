/**
 * 浏览器端触发文本文件下载（纯本地，无网络请求）。
 */
export function downloadTextFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 延迟释放，确保下载已开始
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
