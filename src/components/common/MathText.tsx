import React, { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  text?: string | null;
  className?: string;
  block?: boolean;
}

// In-memory cache for rendered KaTeX HTML strings to maximize rendering performance
const mathCache = new Map<string, string>();

function renderKatexToString(mathStr: string, displayMode: boolean): string {
  const cacheKey = `${displayMode ? 'D' : 'I'}:${mathStr}`;
  const cached = mathCache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const rendered = katex.renderToString(mathStr, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
      trust: true,
    });
    // Cap cache size to avoid memory bloat
    if (mathCache.size > 2000) {
      const firstKey = mathCache.keys().next().value;
      if (firstKey) mathCache.delete(firstKey);
    }
    mathCache.set(cacheKey, rendered);
    return rendered;
  } catch (err) {
    console.warn('KaTeX render error:', err);
    return `<span class="katex-error text-red-500 font-mono text-xs">${mathStr}</span>`;
  }
}

interface TextSegment {
  type: 'text' | 'inline-math' | 'block-math';
  content: string;
}

/**
 * Parses raw text into alternating text and math segments based on delimiters:
 * - $$...$$ or \[...\] -> block math
 * - $...$ or \(...\) -> inline math
 */
function parseMathSegments(raw: string): TextSegment[] {
  if (!raw) return [];

  const segments: TextSegment[] = [];

  // Match $$...$$, \[...\], $...$, \(...\)
  // Non-greedy matching within delimiters
  const mathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?!\$)[\s\S]*?\$|\\\([\s\S]*?\\\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(raw)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: raw.slice(lastIndex, matchIndex),
      });
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$')) {
      segments.push({
        type: 'block-math',
        content: matchedStr.slice(2, -2).trim(),
      });
    } else if (matchedStr.startsWith('\\[') && matchedStr.endsWith('\\]')) {
      segments.push({
        type: 'block-math',
        content: matchedStr.slice(2, -2).trim(),
      });
    } else if (matchedStr.startsWith('\\(') && matchedStr.endsWith('\\)')) {
      segments.push({
        type: 'inline-math',
        content: matchedStr.slice(2, -2).trim(),
      });
    } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$')) {
      segments.push({
        type: 'inline-math',
        content: matchedStr.slice(1, -1).trim(),
      });
    }

    lastIndex = matchIndex + matchedStr.length;
  }

  if (lastIndex < raw.length) {
    segments.push({
      type: 'text',
      content: raw.slice(lastIndex),
    });
  }

  // Fallback: If no explicit $ delimiters were found, but the string contains unmistakable LaTeX commands
  // like \frac, \sqrt, \times, \pm, \text{...}, etc. and has no delimiters, treat the whole string or parts as math
  if (segments.length === 1 && segments[0].type === 'text') {
    const textContent = segments[0].content;
    const hasUnwrappedLatex =
      /\\[a-zA-Z]+|\^{[^}]+}|_{[^}]+}|\^[\d\w]|_[\d\w]/.test(textContent) &&
      !textContent.includes('<') &&
      (textContent.includes('\\frac') ||
        textContent.includes('\\sqrt') ||
        textContent.includes('\\text') ||
        textContent.includes('\\times') ||
        textContent.includes('\\pm') ||
        textContent.includes('\\cdot') ||
        textContent.includes('\\approx') ||
        textContent.includes('\\neq') ||
        textContent.includes('\\le') ||
        textContent.includes('\\ge') ||
        textContent.includes('\\Delta') ||
        textContent.includes('\\theta') ||
        textContent.includes('\\alpha') ||
        textContent.includes('\\beta') ||
        textContent.includes('\\gamma') ||
        textContent.includes('\\lambda') ||
        textContent.includes('\\mu') ||
        textContent.includes('\\Omega') ||
        textContent.includes('\\pi') ||
        textContent.includes('\\degree') ||
        textContent.includes('^\\circ') ||
        textContent.includes('\\rightarrow') ||
        textContent.includes('\\to'));

    if (hasUnwrappedLatex) {
      return [{ type: 'inline-math', content: textContent.trim() }];
    }
  }

  return segments;
}

export const MathText: React.FC<MathTextProps> = React.memo(({ text, className = '', block = false }) => {
  if (!text) return null;

  const segments = useMemo(() => parseMathSegments(text), [text]);

  const renderedContent = (
    <>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return <React.Fragment key={idx}>{seg.content}</React.Fragment>;
        }

        const isBlock = seg.type === 'block-math';
        const html = renderKatexToString(seg.content, isBlock);

        if (isBlock) {
          return (
            <div
              key={idx}
              className="my-2 overflow-x-auto text-center py-1 max-w-full"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return (
          <span
            key={idx}
            className="inline-block px-0.5 align-baseline"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </>
  );

  if (block) {
    return <div className={`math-text-block ${className}`}>{renderedContent}</div>;
  }

  return <span className={`math-text-inline ${className}`}>{renderedContent}</span>;
});

MathText.displayName = 'MathText';
export default MathText;
