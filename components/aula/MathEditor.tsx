'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Edit3, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import MathRenderer from './MathRenderer';

// ─── Catálogo de símbolos ─────────────────────────────────────────────────────
const MATH_CATEGORIES = [
    {
        id: 'fracciones',
        label: 'Fracciones',
        symbols: [
            { label: 'a/b', latex: '\\frac{a}{b}', display: String.raw`½` },
            { label: 'a²/b²', latex: '\\frac{a^2}{b^2}', display: String.raw`½²` },
            { label: '1/n', latex: '\\frac{1}{n}', display: '1/n' },
        ],
    },
    {
        id: 'potencias',
        label: 'Potencias y Raíces',
        symbols: [
            { label: 'x²', latex: 'x^{2}', display: 'x²' },
            { label: 'xⁿ', latex: 'x^{n}', display: 'xⁿ' },
            { label: 'x₁', latex: 'x_{1}', display: 'x₁' },
            { label: '√x', latex: '\\sqrt{x}', display: '√x' },
            { label: '∛x', latex: '\\sqrt[3]{x}', display: '∛x' },
            { label: 'ⁿ√x', latex: '\\sqrt[n]{x}', display: 'ⁿ√x' },
        ],
    },
    {
        id: 'griegas',
        label: 'Letras Griegas',
        symbols: [
            { label: 'α', latex: '\\alpha', display: 'α' },
            { label: 'β', latex: '\\beta', display: 'β' },
            { label: 'γ', latex: '\\gamma', display: 'γ' },
            { label: 'δ', latex: '\\delta', display: 'δ' },
            { label: 'θ', latex: '\\theta', display: 'θ' },
            { label: 'λ', latex: '\\lambda', display: 'λ' },
            { label: 'μ', latex: '\\mu', display: 'μ' },
            { label: 'π', latex: '\\pi', display: 'π' },
            { label: 'σ', latex: '\\sigma', display: 'σ' },
            { label: 'φ', latex: '\\phi', display: 'φ' },
            { label: 'ω', latex: '\\omega', display: 'ω' },
            { label: 'Δ', latex: '\\Delta', display: 'Δ' },
            { label: 'Σ', latex: '\\Sigma', display: 'Σ' },
            { label: 'Ω', latex: '\\Omega', display: 'Ω' },
        ],
    },
    {
        id: 'operadores',
        label: 'Operadores',
        symbols: [
            { label: '≤', latex: '\\leq', display: '≤' },
            { label: '≥', latex: '\\geq', display: '≥' },
            { label: '≠', latex: '\\neq', display: '≠' },
            { label: '≈', latex: '\\approx', display: '≈' },
            { label: '±', latex: '\\pm', display: '±' },
            { label: '×', latex: '\\times', display: '×' },
            { label: '÷', latex: '\\div', display: '÷' },
            { label: '∞', latex: '\\infty', display: '∞' },
            { label: '∈', latex: '\\in', display: '∈' },
            { label: '⊂', latex: '\\subset', display: '⊂' },
            { label: '∪', latex: '\\cup', display: '∪' },
            { label: '∩', latex: '\\cap', display: '∩' },
        ],
    },
    {
        id: 'calculo',
        label: 'Cálculo',
        symbols: [
            { label: '∫', latex: '\\int_{a}^{b}', display: '∫' },
            { label: '∑', latex: '\\sum_{i=1}^{n}', display: '∑' },
            { label: '∏', latex: '\\prod_{i=1}^{n}', display: '∏' },
            { label: 'lim', latex: '\\lim_{x \\to \\infty}', display: 'lim' },
            { label: 'd/dx', latex: '\\frac{d}{dx}', display: 'd/dx' },
            { label: '∂', latex: '\\partial', display: '∂' },
            { label: '∇', latex: '\\nabla', display: '∇' },
        ],
    },
    {
        id: 'plantillas',
        label: 'Plantillas',
        symbols: [
            { label: 'Cuadrática', latex: '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', display: 'ax²+..' },
            { label: 'Pitágoras', latex: 'a^2 + b^2 = c^2', display: 'a²+b²' },
            { label: 'Área círculo', latex: 'A = \\pi r^2', display: 'πr²' },
            { label: 'Euler', latex: 'e^{i\\pi} + 1 = 0', display: 'eⁱπ' },
            { label: 'Vector', latex: '\\vec{v} = v_x\\hat{i} + v_y\\hat{j}', display: '→v' },
        ],
    },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface MathEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    theme: 'light' | 'dark';
    rows?: number;
    className?: string;
    label?: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MathEditor({ value, onChange, placeholder, theme, rows = 3, className, label }: MathEditorProps) {
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    const [activeCategory, setActiveCategory] = useState(MATH_CATEGORIES[0].id);
    const [showToolbar, setShowToolbar] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isDark = theme === 'dark';
    const hasMath = /\$/.test(value);

    const insertAtCursor = useCallback((latex: string) => {
        const ta = textareaRef.current;
        if (!ta) {
            onChange(value + ' $' + latex + '$ ');
            return;
        }
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newValue = value.slice(0, start) + ` $${latex}$ ` + value.slice(end);
        onChange(newValue);

        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
            const newPos = start + latex.length + 4;
            ta.focus();
            ta.setSelectionRange(newPos, newPos);
        });
    }, [value, onChange]);

    const insertBlock = useCallback((latex: string) => {
        const ta = textareaRef.current;
        if (!ta) {
            onChange(value + '\n$$' + latex + '$$\n');
            return;
        }
        const start = ta.selectionStart;
        const newValue = value.slice(0, start) + `\n$$${latex}$$\n` + value.slice(start);
        onChange(newValue);
        requestAnimationFrame(() => {
            ta.focus();
        });
    }, [value, onChange]);

    const clearAll = () => onChange('');

    return (
        <div className={cn('rounded-2xl border-2 overflow-hidden transition-all', isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white shadow-sm', className)}>

            {/* ── Header ── */}
            <div className={cn('flex items-center justify-between px-3 py-2 border-b', isDark ? 'border-slate-700/60 bg-slate-800/40' : 'border-slate-100 bg-slate-50/80')}>
                <div className="flex items-center gap-2">
                    {label && <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>}
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Toggle Toolbar Button */}
                    <button
                        type="button"
                        onClick={() => setShowToolbar(p => !p)}
                        className={cn(
                            'flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border',
                            showToolbar
                                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                                : isDark ? 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white' : 'border-slate-200 text-slate-400 hover:border-primary/40 hover:text-primary'
                        )}
                    >
                        <span className="text-[11px]">Σ</span> Fórmulas
                    </button>

                    {/* Divider */}
                    <span className={cn('w-px h-4', isDark ? 'bg-slate-700' : 'bg-slate-200')} />

                    {/* Edit / Preview */}
                    <div className={cn('flex rounded-lg p-0.5', isDark ? 'bg-slate-800' : 'bg-slate-100')}>
                        {[
                            { id: 'edit' as const, icon: Edit3, label: 'Editar' },
                            { id: 'preview' as const, icon: Eye, label: 'Vista' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setMode(tab.id)}
                                className={cn(
                                    'flex items-center gap-1 px-2 h-6 rounded-md text-[8px] font-black uppercase tracking-wider transition-all',
                                    mode === tab.id
                                        ? isDark ? 'bg-slate-700 text-white shadow' : 'bg-white text-slate-900 shadow'
                                        : 'text-slate-400 hover:text-slate-600'
                                )}
                            >
                                <tab.icon size={10} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Clear */}
                    {value && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                            title="Limpiar"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Symbol Toolbar ── */}
            <AnimatePresence>
                {showToolbar && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className={cn('border-b overflow-hidden', isDark ? 'border-slate-700/60' : 'border-slate-100')}
                    >
                        {/* Category tabs */}
                        <div className={cn('flex gap-1 px-3 pt-2.5 pb-1 overflow-x-auto', isDark ? '' : '')}>
                            {MATH_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={cn(
                                        'shrink-0 px-2.5 h-6 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all whitespace-nowrap',
                                        activeCategory === cat.id
                                            ? 'bg-primary text-white shadow-sm'
                                            : isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                    )}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Symbols grid */}
                        <div className="px-3 pb-2.5 pt-1">
                            <div className="flex flex-wrap gap-1.5">
                                {MATH_CATEGORIES.find(c => c.id === activeCategory)?.symbols.map((sym, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            // Plantillas use block, others inline
                                            activeCategory === 'plantillas' ? insertBlock(sym.latex) : insertAtCursor(sym.latex);
                                            setMode('preview');
                                            setTimeout(() => setMode('edit'), 1200);
                                        }}
                                        title={sym.label + ' → ' + sym.latex}
                                        className={cn(
                                            'group h-8 px-2.5 rounded-xl border-2 transition-all text-xs font-bold hover:scale-105 active:scale-95 flex items-center gap-1.5',
                                            isDark
                                                ? 'bg-slate-800 border-slate-700 text-white hover:border-primary/60 hover:bg-primary/10'
                                                : 'bg-white border-slate-150 text-slate-700 hover:border-primary/40 hover:bg-primary/5 shadow-sm hover:shadow-md'
                                        )}
                                    >
                                        <span className="font-mono text-[13px] leading-none">{sym.display}</span>
                                        <span className="text-[7px] text-slate-400 truncate max-w-[50px] hidden group-hover:block">{sym.label}</span>
                                    </button>
                                ))}
                            </div>
                            <p className={cn('text-[7px] font-bold uppercase tracking-widest mt-2 opacity-50', isDark ? 'text-slate-400' : 'text-slate-400')}>
                                Tip: usa <code className="font-mono">$...$</code> inline · <code className="font-mono">$$...$$</code> bloque · Los botones insertan en el cursor
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Editor Area ── */}
            <AnimatePresence mode="wait">
                {mode === 'edit' ? (
                    <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            placeholder={placeholder}
                            rows={rows}
                            className={cn(
                                'w-full px-4 py-3 font-medium text-sm leading-relaxed outline-none resize-none transition-all',
                                isDark ? 'bg-slate-900 text-white placeholder-slate-600' : 'bg-white text-slate-900 placeholder-slate-300'
                            )}
                        />
                        {/* Inline preview strip when text contains $ */}
                        {hasMath && (
                            <div className={cn('px-4 py-2 border-t flex items-start gap-2', isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-50 bg-slate-50/80')}>
                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 shrink-0 mt-1">Vista:</span>
                                <div className={cn('text-sm leading-relaxed', isDark ? 'text-slate-200' : 'text-slate-800')}>
                                    <MathRenderer text={value} />
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className={cn('px-4 py-4 min-h-[80px] cursor-text', isDark ? 'bg-slate-900' : 'bg-white')}
                        onClick={() => setMode('edit')}
                    >
                        {value ? (
                            <div className={cn('text-sm font-medium leading-relaxed', isDark ? 'text-slate-100' : 'text-slate-800')}>
                                <MathRenderer text={value} blockClassName="my-2 text-center block" />
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm italic">{placeholder || 'Escribe el enunciado...'}</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
