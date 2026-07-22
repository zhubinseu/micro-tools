/**
 * Markdown 渲染与解析工具
 *
 * 本地优先：全部在浏览器端完成。
 * - renderMarkdown：marked 解析 → 标题注入锚点 id → 代码高亮 → DOMPurify 消毒
 * - extractHeadings：提取标题列表供 TOC（slug 与渲染层锚点一致）
 * - deriveFileName：从首个 H1 推导导出文件名
 */

import { Marked, lexer, type Token, type Tokens } from 'marked';
import DOMPurify from 'dompurify';
import GithubSlugger from 'github-slugger';
import hljs from 'highlight.js';

/** marked 解析配置（渲染与词法分析保持一致） */
const MARKED_OPTIONS = { gfm: true, breaks: false } as const;

/**
 * 从 inline token 列表提取纯文本（去掉 markdown 语法，用于生成锚点 slug）。
 * 渲染层与 TOC 共用同一提取逻辑，保证 slug 一致。
 */
function inlineText(tokens: Token[] | undefined): string {
  if (!tokens) return '';
  let out = '';
  for (const t of tokens) {
    const node = t as Token & { text?: string; tokens?: Token[] };
    if (node.type === 'image') {
      out += node.text ?? '';
    } else if (Array.isArray(node.tokens)) {
      out += inlineText(node.tokens);
    } else if (typeof node.text === 'string') {
      out += node.text;
    }
  }
  return out;
}

/** 代码块渲染：highlight.js 高亮，未知语言回退 plaintext */
function renderCode(text: string, lang: string | undefined): string {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  let highlighted: string;
  try {
    highlighted = hljs.highlight(text, { language }).value;
  } catch {
    highlighted = hljs.highlight(text, { language: 'plaintext' }).value;
  }
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>\n`;
}

/**
 * 创建一个配置好的 Marked 实例。
 * 每次渲染新建实例 → slugger 随之重置，确保同一文档多次渲染锚点稳定。
 */
function createMarked(): Marked {
  const slugger = new GithubSlugger();
  const m = new Marked({ ...MARKED_OPTIONS });
  m.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = inlineText(tokens);
        const id = slugger.slug(text);
        const html = this.parser.parseInline(tokens);
        return `<h${depth} id="${id}">${html}</h${depth}>\n`;
      },
      code({ text, lang }) {
        return renderCode(text, lang);
      },
    },
  });
  return m;
}

/**
 * 把 Markdown 渲染为安全的 HTML 字符串。
 * DOMPurify 消毒，保留标题 id、代码高亮 class、任务列表 checkbox。
 */
export function renderMarkdown(src: string): string {
  if (!src || !src.trim()) return '';
  const m = createMarked();
  const raw = m.parse(src, { async: false }) as string;
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['input'],
    ADD_ATTR: ['checked', 'disabled', 'type', 'id', 'class'],
  });
}

export interface HeadingItem {
  depth: number;
  text: string;
  slug: string;
}

/**
 * 提取文档中的标题列表（H1-H6），供目录导航。
 * 使用与渲染层相同的 slug 规则与顺序，保证目录锚点与正文 id 一一对应。
 */
export function extractHeadings(src: string): HeadingItem[] {
  if (!src || !src.trim()) return [];
  const slugger = new GithubSlugger();
  const tokens = lexer(src, { ...MARKED_OPTIONS });
  const out: HeadingItem[] = [];
  for (const t of tokens) {
    if (t.type === 'heading') {
      const h = t as Tokens.Heading;
      const text = inlineText(h.tokens);
      if (!text) continue;
      out.push({ depth: h.depth, text, slug: slugger.slug(text) });
    }
  }
  return out;
}

/**
 * 推导导出文件名：取首个 H1 的 slug，fallback untitled.md。
 */
export function deriveFileName(src: string): string {
  const headings = extractHeadings(src);
  const h1 = headings.find((h) => h.depth === 1);
  const base = h1 && h1.slug ? h1.slug : 'untitled';
  return `${base}.md`;
}
