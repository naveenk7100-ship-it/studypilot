import React, { useState } from 'react';
import katex from 'katex';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Sanitize potentially harmful executable HTML tags
  const sanitizedContent = content
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/javascript:[^\s"'>]+/gi, '');

  // Process LaTeX math formulas
  const renderMathAndText = (text: string) => {
    // 1. Display math: $$...$$
    const displayMathRegex = /\$\$([\s\S]+?)\$\$/g;
    let parts: (string | { type: 'math'; value: string; display: boolean })[] = [];
    let lastIndex = 0;
    let match;

    while ((match = displayMathRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push({ type: 'math', value: match[1], display: true });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    // 2. Inline math: $...$
    const finalParts: (string | { type: 'math'; value: string; display: boolean })[] = [];
    const inlineMathRegex = /\$([^\$\n]+?)\$/g;

    for (const part of parts) {
      if (typeof part === 'string') {
        let subLast = 0;
        let subMatch;
        while ((subMatch = inlineMathRegex.exec(part)) !== null) {
          if (subMatch.index > subLast) {
            finalParts.push(part.slice(subLast, subMatch.index));
          }
          finalParts.push({ type: 'math', value: subMatch[1], display: false });
          subLast = subMatch.index + subMatch[0].length;
        }
        if (subLast < part.length) {
          finalParts.push(part.slice(subLast));
        }
      } else {
        finalParts.push(part);
      }
    }

    return finalParts.map((item, idx) => {
      if (typeof item === 'object' && item.type === 'math') {
        try {
          const html = katex.renderToString(item.value, {
            displayMode: item.display,
            throwOnError: false
          });
          return (
            <span
              key={idx}
              dangerouslySetInnerHTML={{ __html: html }}
              className={item.display ? 'block my-3 text-center overflow-x-auto py-1' : 'inline px-1 font-mono'}
            />
          );
        } catch {
          return <code key={idx} className="font-mono text-blue-600 dark:text-blue-400">${item.value}$</code>;
        }
      }

      return <InlineFormattedText key={idx} text={typeof item === 'string' ? item : item.value} />;
    });
  };

  // Split into blocks: code blocks vs regular paragraphs/headings/lists
  const blocks = splitContentBlocks(sanitizedContent);

  return (
    <div className={`prose-academic space-y-3 leading-relaxed text-slate-800 dark:text-slate-200 ${className}`}>
      {blocks.map((block: any, idx: number) => {
        if (block.type === 'code') {
          return <CodeBlock key={idx} code={block.content} language={block.language} />;
        }
        if (block.type === 'heading') {
          return (
            <div key={idx} className="pt-2">
              <HeadingBlock level={block.level} text={block.content} renderMathAndText={renderMathAndText} />
            </div>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={idx} className="list-disc list-inside space-y-1.5 my-2 pl-2">
              {block.items.map((it: string, iIdx: number) => (
                <li key={iIdx} className="text-slate-700 dark:text-slate-300">
                  {renderMathAndText(it)}
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'checklist') {
          return (
            <div key={idx} className="space-y-1.5 my-2">
              {block.items.map((it: { text: string; checked: boolean }, iIdx: number) => (
                <div key={iIdx} className="flex items-start gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={it.checked}
                    readOnly
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{renderMathAndText(it.text)}</span>
                </div>
              ))}
            </div>
          );
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={idx} className="border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 pl-4 py-2 my-2 rounded-r-lg text-slate-700 dark:text-slate-300">
              {renderMathAndText(block.content)}
            </blockquote>
          );
        }
        if (block.type === 'divider') {
          return <hr key={idx} className="my-4 border-slate-200 dark:border-slate-800" />;
        }

        // Paragraph
        return (
          <p key={idx} className="text-slate-700 dark:text-slate-300">
            {renderMathAndText(block.content)}
          </p>
        );
      })}
    </div>
  );
};

const InlineFormattedText: React.FC<{ text: string }> = ({ text }) => {
  // Simple inline bold, italic, code
  const segments: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  let last = 0;
  let m;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      segments.push(text.slice(last, m.index));
    }
    const token = m[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      segments.push(<strong key={m.index} className="font-semibold text-slate-900 dark:text-white">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      segments.push(<em key={m.index}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      segments.push(
        <code key={m.index} className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded font-mono">
          {token.slice(1, -1)}
        </code>
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) {
    segments.push(text.slice(last));
  }

  return <>{segments.length ? segments : text}</>;
};

const HeadingBlock: React.FC<{ level: number; text: string; renderMathAndText: (t: string) => React.ReactNode }> = ({
  level,
  text,
  renderMathAndText
}) => {
  if (level === 1) {
    return <h1 className="text-2xl font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-200 dark:border-slate-800">{renderMathAndText(text)}</h1>;
  }
  if (level === 2) {
    return <h2 className="text-xl font-bold text-slate-900 dark:text-white">{renderMathAndText(text)}</h2>;
  }
  if (level === 3) {
    return <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{renderMathAndText(text)}</h3>;
  }
  return <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">{renderMathAndText(text)}</h4>;
};

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = 'text' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden bg-slate-900 text-slate-100 border border-slate-800 shadow-sm text-sm">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-xs text-slate-400">
        <span className="font-mono lowercase">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-xs md:text-sm text-slate-200 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

function splitContentBlocks(markdown: string) {
  const lines = markdown.split('\n');
  const blocks: any[] = [];
  let inCode = false;
  let codeLang = '';
  let codeLines: string[] = [];
  let currentList: string[] = [];
  let currentChecklist: { text: string; checked: boolean }[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: 'list', items: [...currentList] });
      currentList = [];
    }
    if (currentChecklist.length > 0) {
      blocks.push({ type: 'checklist', items: [...currentChecklist] });
      currentChecklist = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', content: codeLines.join('\n'), language: codeLang });
        codeLines = [];
        inCode = false;
      } else {
        flushList();
        inCode = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    // Dividers
    if (line.trim() === '---' || line.trim() === '***') {
      flushList();
      blocks.push({ type: 'divider' });
      continue;
    }

    // Checklist
    const checkMatch = line.match(/^\s*-\s*\[([ xX])\]\s*(.*)$/);
    if (checkMatch) {
      currentChecklist.push({
        checked: checkMatch[1].toLowerCase() === 'x',
        text: checkMatch[2]
      });
      continue;
    }

    // Regular List item
    const listMatch = line.match(/^\s*[-*•]\s+(.*)$/);
    if (listMatch) {
      currentList.push(listMatch[1]);
      continue;
    }

    flushList();

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2]
      });
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      blocks.push({
        type: 'quote',
        content: line.replace(/^>\s*/, '')
      });
      continue;
    }

    // Regular non-empty paragraph
    if (line.trim().length > 0) {
      blocks.push({
        type: 'paragraph',
        content: line
      });
    }
  }

  flushList();
  if (inCode && codeLines.length > 0) {
    blocks.push({ type: 'code', content: codeLines.join('\n'), language: codeLang });
  }

  return blocks;
}
