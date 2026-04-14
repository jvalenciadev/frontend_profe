'use client';

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

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

    // Split on block then inline delimiters
    const parts: { content: string; type: 'text' | 'inline' | 'block' }[] = [];

    // First split by $$...$$ or \[...\] (block)
    const blockRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g;

    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = blockRegex.exec(text)) !== null) {
        if (match.index > lastIdx) {
            // Process the text segment before this block for inline math
            processInline(text.slice(lastIdx, match.index), parts);
        }
        const raw = match[0];
        let formula = raw;
        if (raw.startsWith('$$')) formula = raw.slice(2, -2);
        else if (raw.startsWith('\\[')) formula = raw.slice(2, -2);
        parts.push({ content: formula.trim(), type: 'block' });
        lastIdx = match.index + raw.length;
    }

    // Remaining text after last block match
    if (lastIdx < text.length) {
        processInline(text.slice(lastIdx), parts);
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
                return <span key={i} dangerouslySetInnerHTML={{ __html: part.content }} />;
            })}
        </div>
    );
}

// Added cn utility import if not present or just use simple template literals
import { cn } from '@/lib/utils';

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
