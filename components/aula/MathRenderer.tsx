'use client';

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { cn } from '@/lib/utils';

// Helper function declared in the top level with try-catch block
function markdownToHtml(mdText: string): string {
    if (!mdText) return '';
    try {
        let html = mdText;

        // Parsear Tablas Markdown
        const tableRegex = /((?:\|[^\n]+\|\r?\n?)+)/g;
        html = html.replace(tableRegex, (tableBlock) => {
            const lines = tableBlock.trim().split(/\r?\n/).filter(line => line.startsWith('|'));
            if (lines.length < 2) return tableBlock;

            let hasHeaderSeparator = false;
            let headerLine = '';
            let rowsLines: string[] = [];

            const separatorIdx = lines.findIndex(l => l.includes('-') && !l.match(/[a-zA-Z0-9]/));
            if (separatorIdx !== -1) {
                hasHeaderSeparator = true;
                headerLine = lines[0];
                rowsLines = lines.slice(separatorIdx + 1);
            } else {
                rowsLines = lines;
            }

            const parseRow = (rowText: string, cellTag: 'th' | 'td') => {
                const cells = rowText.split('|').slice(1, -1).map(c => c.trim());
                return `<tr>${cells.map(c => `<${cellTag} class="px-4 py-2 border border-slate-200 dark:border-slate-800 font-bold">${c}</${cellTag}>`).join('')}</tr>`;
            };

            let tableHtml = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-slate-200 dark:border-slate-800 text-xs text-left">';
            if (hasHeaderSeparator && headerLine) {
                tableHtml += `<thead class="bg-slate-100 dark:bg-slate-800">${parseRow(headerLine, 'th')}</thead>`;
            }
            tableHtml += '<tbody>';
            tableHtml += rowsLines.map(r => parseRow(r, 'td')).join('');
            tableHtml += '</tbody></table></div>';
            return tableHtml;
        });

        // Negrita
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

        // Cursiva
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Enlaces
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
            const cleanUrl = url.replace(/&amp;/g, '&');
            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-primary dark:text-blue-400 underline font-black hover:opacity-80">${text}</a>`;
        });

        // Listas
        const mdLines = html.split('\n');
        let inList = false;
        const processedLines = mdLines.map(line => {
            const trimmed = line.trim();
            const listMatch = trimmed.match(/^[-*]\s+(.*)$/);
            if (listMatch) {
                let prefix = '';
                if (!inList) {
                    inList = true;
                    prefix = '<ul class="list-disc pl-5 my-2 space-y-1">';
                }
                return `${prefix}<li>${listMatch[1]}</li>`;
            } else {
                let suffix = '';
                if (inList) {
                    inList = false;
                    suffix = '</ul>';
                }
                return suffix + line;
            }
        });
        if (inList) {
            processedLines.push('</ul>');
        }
        html = processedLines.join('\n');

        // Saltos de línea
        html = html.replace(/\n/g, '<br />');

        return html;
    } catch (e) {
        console.error('Error parsing markdown:', e);
        return mdText;
    }
}

interface MathRendererProps {
    text: string;
    className?: string;
    blockClassName?: string;
}

/**
 * MathRenderer — parses text for LaTeX delimiters and renders KaTeX.
 * Supports:  $$ ... $$  |  \[ ... \]  (block)
 *            $ ... $    |  \( ... \)  (inline)
 */
export default function MathRenderer({ text, className, blockClassName }: MathRendererProps) {
    if (!text) return null;

    // Clean skinchecked browser extension garbage
    const cleanedText = text.replace(/(<[a-z0-9]+[^>]*>)|((?:bis_skin_checked|skinchecked)=["']?\w+["']?\s*(?:style=["'][^"']*["'])?\s*(?:>|&gt;))/gi, (match, tag) => {
        if (tag) {
            return tag
                .replace(/\s+bis_skin_checked=["']?\w+["']?/gi, '')
                .replace(/\s+skinchecked=["']?\w+["']?/gi, '')
                .replace(/border-color:\s*rgb\(226,\s*232,\s*240\);?/gi, '')
                .replace(/\s+style="\s*"/gi, '')
                .replace(/\s+style='\s*'/gi, '');
        } else {
            return '';
        }
    });

    // Split on block then inline delimiters
    const parts: { content: string; type: 'text' | 'inline' | 'block' }[] = [];

    // First split by $$...$$ or \[...\] (block)
    const blockRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g;

    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = blockRegex.exec(cleanedText)) !== null) {
        if (match.index > lastIdx) {
            // Process the text segment before this block for inline math
            processInline(cleanedText.slice(lastIdx, match.index), parts);
        }
        const raw = match[0];
        let formula = raw;
        if (raw.startsWith('$$')) formula = raw.slice(2, -2);
        else if (raw.startsWith('\\[')) formula = raw.slice(2, -2);
        parts.push({ content: formula.trim(), type: 'block' });
        lastIdx = match.index + raw.length;
    }

    // Remaining text after last block match
    if (lastIdx < cleanedText.length) {
        processInline(cleanedText.slice(lastIdx), parts);
    }

    return (
        <div className={cn("math-renderer-root", className)}>
            {parts.map((part, i) => {
                if (part.type === 'block') {
                    return (
                        <div key={i} className={cn("my-4", blockClassName)}>
                            <BlockMath
                                math={part.content}
                                renderError={(err) => (
                                    <span className="text-rose-500 text-xs font-mono">{part.content}</span>
                                )}
                            />
                        </div>
                    );
                }
                if (part.type === 'inline') {
                    return (
                        <InlineMath
                            key={i}
                            math={part.content}
                            renderError={() => (
                                <span className="text-rose-500 text-xs font-mono">${part.content}$</span>
                            )}
                        />
                    );
                }
                // Usamos div con display inline/block para evitar inconsistencias de DOM con listas y tablas
                return (
                    <div
                        key={i}
                        className="inline-block w-full"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(part.content) }}
                    />
                );
            })}
        </div>
    );
}

function processInline(segment: string, parts: { content: string; type: 'text' | 'inline' | 'block' }[]) {
    const inlineRegex = /(\$[^$\n]+?\$|\\\([^)]*?\\\))/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = inlineRegex.exec(segment)) !== null) {
        if (m.index > last) {
            parts.push({ content: segment.slice(last, m.index), type: 'text' });
        }
        const raw = m[0];
        let formula = raw.startsWith('\\(') ? raw.slice(2, -2) : raw.slice(1, -1);
        parts.push({ content: formula.trim(), type: 'inline' });
        last = m.index + raw.length;
    }
    if (last < segment.length) {
        parts.push({ content: segment.slice(last), type: 'text' });
    }
}
