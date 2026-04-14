'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sigma, Type, List, ListOrdered, Bold, Italic, Heading1, Heading2 } from 'lucide-react';
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

interface MathEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    theme: 'light' | 'dark';
    rows?: number;
    className?: string;
    label?: string;
}

export default function MathEditor({ value, onChange, placeholder, theme, className, label }: MathEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [activeCategory, setActiveCategory] = useState(MATH_CATEGORIES[0].id);
    const [showSymbols, setShowSymbols] = useState(false);
    const [focused, setFocused] = useState(false);
    const isDark = theme === 'dark';

    // Sync external value with editor content
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command: string, val: string = '') => {
        document.execCommand(command, false, val);
        handleInput();
    };

    const insertMath = useCallback((latex: string, isBlock = false) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        const content = isBlock ? `<div class="my-4 text-center">$$${latex}$$</div>` : ` $${latex}$ `;
        document.execCommand('insertHTML', false, content);
        handleInput();
    }, [onChange]);

    const clearAll = () => {
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
            onChange('');
        }
    };

    return (
        <div className={cn(
            'rounded-[2rem] border-2 transition-all flex flex-col',
            isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white shadow-sm',
            focused && (isDark ? 'border-primary/50 ring-4 ring-primary/5' : 'border-primary/30 ring-4 ring-primary/5'),
            className
        )}>

            {/* ── Toolbar ── */}
            <div className={cn('flex items-center justify-between px-4 py-3 border-b shrink-0', isDark ? 'border-slate-700/60 bg-slate-800/40' : 'border-slate-100 bg-slate-50/80')}>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                    
                    {/* HTML Format Controls */}
                    <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-slate-200 dark:border-slate-700">
                        <ToolbarButton onClick={() => execCommand('formatBlock', '<h1>')} icon={Heading1} label="H1" />
                        <ToolbarButton onClick={() => execCommand('formatBlock', '<h2>')} icon={Heading2} label="H2" />
                        <ToolbarButton onClick={() => execCommand('formatBlock', '<p>')} icon={Type} label="T" />
                    </div>

                    <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-slate-200 dark:border-slate-700">
                        <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} label="B" />
                        <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} label="I" />
                    </div>

                    <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-slate-200 dark:border-slate-700">
                        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} label="Lista" />
                        <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} label="Enum" />
                    </div>

                    {/* Math Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowSymbols(p => !p)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 h-8 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border',
                            showSymbols
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                                : isDark ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' : 'border-slate-200 text-slate-500 hover:text-primary hover:bg-primary/5'
                        )}
                    >
                        <Sigma size={12} />
                        Fórmulas
                    </button>
                    
                    {label && <span className="ml-3 text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{label}</span>}
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-1.5 ml-2">
                    {value && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                            title="Limpiar todo"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Symbols Panel (LaTeX) ── */}
            <AnimatePresence>
                {showSymbols && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={cn('border-b overflow-hidden', isDark ? 'border-slate-700/60' : 'border-slate-100')}
                    >
                        {/* Tabs */}
                        <div className="flex gap-1 px-4 py-2 overflow-x-auto no-scrollbar">
                            {MATH_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={cn(
                                        'shrink-0 px-3 h-7 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all',
                                        activeCategory === cat.id
                                            ? 'bg-primary text-white shadow-md'
                                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                    )}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="px-4 pb-4 pt-1 flex flex-wrap gap-1.5">
                            {MATH_CATEGORIES.find(c => c.id === activeCategory)?.symbols.map((sym, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        insertMath(sym.latex, activeCategory === 'plantillas');
                                    }}
                                    className={cn(
                                        'h-9 px-3 rounded-xl border-2 transition-all flex items-center gap-2 group/sym',
                                        isDark
                                            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-primary/50 hover:bg-slate-700'
                                            : 'bg-white border-slate-100 text-slate-700 hover:border-primary/30 hover:bg-slate-50 shadow-sm'
                                    )}
                                >
                                    <span className="font-serif text-[13px]">{sym.display}</span>
                                    <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 group-hover/sym:text-primary transition-colors">{sym.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Editor (contentEditable) ── */}
            <div className="relative flex-1 min-h-[120px] group/editor flex flex-col">
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={cn(
                        'outline-none px-6 py-5 text-sm font-medium leading-relaxed prose prose-slate dark:prose-invert max-w-none transition-all flex-1',
                        isDark ? 'text-slate-100' : 'text-slate-800',
                    )}
                />
                
                {!value && !focused && (
                    <div className="absolute top-5 left-6 pointer-events-none text-slate-400 text-sm italic opacity-50 flex items-center gap-2">
                        {placeholder || 'Escribe aquí tu contenido enriquecido...'}
                    </div>
                )}
            </div>

            {/* ── Live Preview Strip (Automatic) ── */}
            {value && value.includes('$') && (
                <div className={cn(
                    'border-t p-4',
                    isDark ? 'border-slate-800 bg-slate-800/20' : 'border-slate-50 bg-slate-50/50'
                )}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2 py-0.5 rounded-full">Vista Previa Matemática</span>
                    </div>
                    <div className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        <MathRenderer text={value} />
                    </div>
                </div>
            )}

            <style jsx global>{`
                .prose h1 { font-weight: 950 !important; font-size: 1.7rem !important; margin-bottom: 0.75rem !important; letter-spacing: -0.02em !important; }
                .prose h2 { font-weight: 900 !important; font-size: 1.3rem !important; margin-bottom: 0.5rem !important; letter-spacing: -0.01em !important; }
                .prose p { margin-bottom: 1rem !important; line-height: 1.6 !important; }
                .prose ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin-bottom: 1rem !important; }
                .prose ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin-bottom: 1rem !important; }
                .prose li { margin-bottom: 0.25rem !important; }
                .prose b, .prose strong { font-weight: 800 !important; color: inherit; }
            `}</style>
        </div>
    );
}

function ToolbarButton({ onClick, icon: Icon, label, className }: any) {
    return (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            className={cn(
                "p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white transition-all flex flex-col items-center gap-0.5 group/btn shrink-0",
                className
            )}
            title={label}
        >
            <Icon size={15} className="group-hover/btn:scale-110 transition-transform" />
            <span className="text-[7px] font-black uppercase tracking-tighter opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">{label}</span>
        </button>
    );
}
