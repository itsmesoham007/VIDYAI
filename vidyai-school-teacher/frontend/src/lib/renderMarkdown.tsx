'use client';

import React from 'react';
import katex from 'katex';

interface MarkdownWithMathProps {
  content: string;
  className?: string;
  latexAllowed?: boolean;
}

/**
 * Cleanly renders KaTeX math ($...$ and $$...$$) and standard Markdown
 * (headings, bold, italics, bullet lists, numbered lists, blockquotes, code, dividers)
 * with Claude's signature warm typography and zero raw asterisks or layout glitches.
 */
export const MarkdownWithMath: React.FC<MarkdownWithMathProps> = ({
  content,
  className = '',
  latexAllowed = true
}) => {
  if (!content) return null;

  // Split content into blocks by block math ($$...$$)
  const blocks = content.split(/(\$\$[\s\S]*?\$\$)/g);
  const hasTextColor = className.includes('text-');
  const baseTextColor = hasTextColor ? '' : 'text-[#1F1E1D]';

  return (
    <div className={`space-y-2.5 text-[14.5px] leading-relaxed ${baseTextColor} ${className}`}>
      {blocks.map((block, blockIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Block Math ($$...$$)
        if (block.startsWith('$$') && block.endsWith('$$')) {
          const math = block.slice(2, -2).trim();
          if (latexAllowed) {
            try {
              const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
              return (
                <div
                  key={blockIdx}
                  className="my-3 overflow-x-auto py-2.5 px-4 bg-[#F5F3EC] rounded-xl border border-[#E5E3DC] shadow-inner text-[#1F1E1D] text-center"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            } catch {
              return (
                <pre key={blockIdx} className="my-2 p-2.5 font-mono text-xs bg-[#2D2B28] rounded-lg text-amber-200">
                  {math}
                </pre>
              );
            }
          } else {
            // Primary junior mode: Clean arithmetic display without $$ or raw LaTeX code
            const cleanMath = math
              .replace(/\\mathbf\{([^}]+)\}/g, '$1')
              .replace(/\\times/g, '×')
              .replace(/\\div/g, '÷')
              .replace(/\\pm/g, '±')
              .replace(/\\text\{([^}]+)\}/g, '$1')
              .replace(/\$/g, '')
              .trim();
            return (
              <div
                key={blockIdx}
                className="my-3 py-2 px-4 bg-[#F5F3EC] rounded-2xl border border-[#E5E3DC] text-center font-bold text-base md:text-lg text-[#1F1E1D] tracking-wide"
              >
                {cleanMath}
              </div>
            );
          }
        }

        // 2. Parse lines within regular text block
        const lines = block.split('\n');
        return (
          <div key={blockIdx} className="space-y-1.5">
            {lines.map((line, lineIdx) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return <div key={lineIdx} className="h-1" />;

              // Heading 1: # Title
              if (trimmedLine.startsWith('# ')) {
                return (
                  <h1 key={lineIdx} className="text-base md:text-lg font-bold text-inherit tracking-tight mt-3 mb-1 border-b border-[#E5E3DC]/60 pb-1">
                    {renderInline(trimmedLine.slice(2), latexAllowed)}
                  </h1>
                );
              }
              // Heading 2: ## Subtitle
              if (trimmedLine.startsWith('## ')) {
                return (
                  <h2 key={lineIdx} className="text-sm md:text-base font-bold text-inherit mt-2.5 mb-1">
                    {renderInline(trimmedLine.slice(3), latexAllowed)}
                  </h2>
                );
              }
              // Heading 3: ### Sub-section
              if (trimmedLine.startsWith('### ')) {
                return (
                  <h3 key={lineIdx} className="text-xs md:text-sm font-bold text-[#C96442] mt-2 mb-0.5">
                    {renderInline(trimmedLine.slice(4), latexAllowed)}
                  </h3>
                );
              }
              // Blockquote: > text
              if (trimmedLine.startsWith('> ')) {
                return (
                  <blockquote key={lineIdx} className="border-l-4 border-[#C96442] pl-3.5 py-1.5 my-2 bg-[#F3F1EC] rounded-r-xl text-xs md:text-sm italic text-[#383633]">
                    {renderInline(trimmedLine.slice(2), latexAllowed)}
                  </blockquote>
                );
              }
              // Horizontal divider: --- or ***
              if (/^[-*_]{3,}$/.test(trimmedLine)) {
                return <hr key={lineIdx} className="my-3 border-[#E5E3DC]" />;
              }
              // Bulleted list: - item or * item
              if (/^[-*]\s+/.test(trimmedLine)) {
                const bulletText = trimmedLine.replace(/^[-*]\s+/, '');
                return (
                  <div key={lineIdx} className="flex items-start gap-2.5 pl-1.5 my-0.5">
                    <span className="text-[#C96442] font-bold text-sm leading-none mt-1.5">•</span>
                    <span className="flex-1">{renderInline(bulletText, latexAllowed)}</span>
                  </div>
                );
              }
              // Numbered list: 1. item
              const numMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                const num = numMatch[1];
                const listText = numMatch[2];
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-1.5 my-0.5">
                    <span className="font-mono text-xs font-bold text-[#C96442] min-w-[1.2rem] mt-0.5">{num}.</span>
                    <span className="flex-1">{renderInline(listText, latexAllowed)}</span>
                  </div>
                );
              }

              // Featured Image: ![Alt text](url)
              const imgMatch = trimmedLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
              if (imgMatch) {
                const altText = imgMatch[1];
                const imgUrl = imgMatch[2].trim();
                return (
                  <div key={lineIdx} className="my-4 rounded-2xl overflow-hidden border border-[#E5E3DC] bg-[#FAF9F5] shadow-md max-w-xl mx-auto group transition-all duration-300 hover:shadow-lg">
                    <div className="relative overflow-hidden bg-[#2D2B28]/5 flex items-center justify-center min-h-[220px]">
                      <img
                        src={imgUrl}
                        alt={altText || 'Educational Illustration'}
                        className="w-full h-auto max-h-[400px] object-cover rounded-t-2xl group-hover:scale-[1.01] transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.failed) {
                            target.dataset.failed = 'true';
                            target.src = `https://dummyimage.com/800x500/f5f3ec/c96442.png&text=${encodeURIComponent(altText || 'Educational Visual')}`;
                          }
                        }}
                      />
                    </div>
                    {altText && (
                      <div className="px-4 py-2.5 text-xs text-[#6B6862] font-medium bg-white border-t border-[#E5E3DC]/60 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-[#1F1E1D]">
                          <span>🎨</span>
                          <span>{altText}</span>
                        </span>
                        <span className="text-[10px] uppercase font-bold text-[#C96442] bg-[#C96442]/10 px-2 py-0.5 rounded-full border border-[#C96442]/20">
                          VidyAI Visual
                        </span>
                      </div>
                    )}
                  </div>
                );
              }

              // Standard paragraph
              return (
                <p key={lineIdx} className="leading-relaxed">
                  {renderInline(line, latexAllowed)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Renders inline text, handling inline KaTeX ($...$), bold (**...**),
 * italics (*...* or _..._), and inline code (`...`) cleanly without raw asterisks.
 */
function renderInline(text: string, latexAllowed: boolean): React.ReactNode[] {
  // Sanitize nested bold-dollar artifacts like **$0$** -> **0** and $**0**$ -> **0**
  let sanitizedText = text
    .replace(/\*\*\$([^\$\n]+)\$\*\*/g, '**$1**')
    .replace(/\$\*\*([^\*\n]+)\*\*\$/g, '**$1**');

  if (!latexAllowed) {
    // For primary grades (Classes 1-5), completely strip all dollar signs and LaTeX formatting commands
    sanitizedText = sanitizedText
      .replace(/\\mathbf\{([^}]+)\}/g, '$1')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\pm/g, '±')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\$([^\$\n]+)\$/g, '$1')
      .replace(/\$/g, '');
  }

  const result: React.ReactNode[] = [];
  const mathParts = sanitizedText.split(/(\$[^$\n]+\$)/g);

  mathParts.forEach((mPart, mIdx) => {
    if (mPart.startsWith('$') && mPart.endsWith('$')) {
      const math = mPart.slice(1, -1).trim();
      if (latexAllowed) {
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          result.push(
            <span
              key={`math-${mIdx}`}
              className="inline-block px-1 py-0.5 font-medium align-middle"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          result.push(<code key={`math-err-${mIdx}`} className="font-mono text-xs text-[#C96442]">{mPart}</code>);
        }
        return;
      } else {
        // Primary school mode: Strip the dollar signs cleanly!
        const cleanMath = math
          .replace(/\\mathbf\{([^}]+)\}/g, '$1')
          .replace(/\\times/g, '×')
          .replace(/\\div/g, '÷')
          .replace(/\\pm/g, '±')
          .replace(/\\text\{([^}]+)\}/g, '$1');
        result.push(
          <span key={`math-plain-${mIdx}`} className="font-semibold text-inherit">
            {cleanMath}
          </span>
        );
        return;
      }
    }

    const boldParts = mPart.split(/(\*\*[^*]+\*\*)/g);
    boldParts.forEach((bPart, bIdx) => {
      if (bPart.startsWith('**') && bPart.endsWith('**')) {
        const boldText = bPart.slice(2, -2);
        result.push(
          <strong key={`b-${mIdx}-${bIdx}`} className="font-bold text-inherit">
            {renderItalicsAndCode(boldText, `${mIdx}-${bIdx}`)}
          </strong>
        );
      } else {
        result.push(...renderItalicsAndCode(bPart, `${mIdx}-${bIdx}`));
      }
    });
  });

  return result;
}

function renderItalicsAndCode(text: string, keyPrefix: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  const imgParts = text.split(/(!\[[^\]]*\]\([^)]+\))/g);

  imgParts.forEach((part, partIdx) => {
    const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      result.push(
        <img
          key={`img-${keyPrefix}-${partIdx}`}
          src={imgMatch[2].trim()}
          alt={imgMatch[1] || 'Illustration'}
          className="inline-block my-2 rounded-2xl max-h-72 object-cover border border-[#E5E3DC] shadow-xs"
          loading="lazy"
        />
      );
      return;
    }

    const codeParts = part.split(/(`[^`]+`)/g);
    codeParts.forEach((cPart, cIdx) => {
      if (cPart.startsWith('`') && cPart.endsWith('`')) {
        result.push(
          <code
            key={`code-${keyPrefix}-${partIdx}-${cIdx}`}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-[#EBE8E0] text-[#8C3E25] font-mono text-xs border border-[#E0DCD3]"
          >
            {cPart.slice(1, -1)}
          </code>
        );
        return;
      }

      const italicParts = cPart.split(/(?<!\*)\*([^*]+)\*(?!\*)/g);
      italicParts.forEach((iPart, iIdx) => {
        if (iIdx % 2 === 1) {
          result.push(
            <em key={`em-${keyPrefix}-${partIdx}-${cIdx}-${iIdx}`} className="italic text-[#3D3A36]">
              {iPart}
            </em>
          );
        } else if (iPart) {
          result.push(iPart);
        }
      });
    });
  });

  return result;
}
