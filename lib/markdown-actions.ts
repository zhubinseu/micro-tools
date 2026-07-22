'use client';

/**
 * Markdown 编辑器的动作（工具栏按钮与编辑器快捷键共用）。
 * 直接读写全局 store，避免层层透传。
 */

import { useMarkdownStore } from '@/store/markdown-store';
import { deriveFileName } from '@/lib/markdown';
import { downloadTextFile } from '@/lib/download';

/**
 * 导出当前文档为 .md 文件。
 * 文件名：优先沿用已打开/已命名的文件；仍是默认 untitled 时从首个 H1 推导。
 * 导出后把当前内容记为磁盘基线（dirty → clean）。
 */
export function exportCurrentDoc(): void {
  const { content, fileName, markExported } = useMarkdownStore.getState();
  const name = fileName && fileName !== 'untitled.md' ? fileName : deriveFileName(content);
  downloadTextFile(name, content);
  markExported(content, name);
}

/** 新建空白文档 */
export function newDoc(): void {
  useMarkdownStore.getState().newDoc();
}

/**
 * 通过文件选择器打开一个 .md 文件并读入编辑器。
 * 使用动态创建 input，读完后由 store.openDoc 置为干净状态。
 */
export function openDocFromPicker(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.md,.markdown,.mdown,.mkd,.txt,text/markdown,text/plain';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      useMarkdownStore.getState().openDoc(text, file.name);
    };
    reader.readAsText(file);
  };
  input.click();
}
