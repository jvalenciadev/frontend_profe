'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    Bold, Italic, List, ListOrdered, Heading1, Heading2,
    Type, Eye, Sparkles, Sigma, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MathRenderer from '@/components/aula/MathRenderer';

export interface RichTextMathEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    label?: string;
    rows?: number;
    compact?: boolean;
    className?: string;
    required?: boolean;
}

type FormulaCategory = 'FRACCIONES' | 'POTENCIAS' | 'GRIEGAS' | 'OPERADORES' | 'CALCULO' | 'PLANTILLAS';

interface MathFormulaItem {
    label: string;
    sublabel?: string;
    latex: string;
    title: string;
}

const FORMULA_CATEGORIES: { id: FormulaCategory; label: string }[] = [
    { id: 'FRACCIONES', label: 'FRACCIONES' },
    { id: 'POTENCIAS', label: 'POTENCIAS Y RAÍCES' },
    { id: 'GRIEGAS', label: 'LETRAS GRIEGAS' },
    { id: 'OPERADORES', label: 'OPERADORES' },
    { id: 'CALCULO', label: 'CÁLCULO' },
    { id: 'PLANTILLAS', label: 'PLANTILLAS' },
];

const MATH_FORMULAS: Record<FormulaCategory, MathFormulaItem[]> = {
    FRACCIONES: [
        { label: '½', sublabel: 'a/b', latex: '$\\frac{a}{b}$', title: 'Fracción simple a/b' },
        { label: '½²', sublabel: 'aˣ/bʸ', latex: '$\\frac{a^{x}}{b^{y}}$', title: 'Fracción con potencias' },
        { label: '1/n', sublabel: '1/N', latex: '$\\frac{1}{n}$', title: 'Fracción unitaria 1/n' },
        { label: 'a/(b+c)', sublabel: 'Compuesta', latex: '$\\frac{a}{b + c}$', title: 'Fracción con denominador compuesto' },
        { label: 'df/dx', sublabel: 'Diferencial', latex: '$\\frac{df}{dx}$', title: 'Cociente diferencial' },
    ],
    POTENCIAS: [
        { label: 'x²', sublabel: 'Cuadrado', latex: '$x^2$', title: 'Potencia al cuadrado' },
        { label: 'xⁿ', sublabel: 'Exponente', latex: '$x^{n}$', title: 'Potencia n-ésima' },
        { label: '√x', sublabel: 'Raíz', latex: '$\\sqrt{x}$', title: 'Raíz cuadrada' },
        { label: 'ⁿ√x', sublabel: 'Raíz n', latex: '$\\sqrt[n]{x}$', title: 'Raíz n-ésima' },
        { label: 'xᵢ', sublabel: 'Subíndice', latex: '$x_{i}$', title: 'Subíndice' },
        { label: 'xᵢⁿ', sublabel: 'Sub+Exp', latex: '$x_{i}^{n}$', title: 'Subíndice y exponente' },
        { label: '|x|', sublabel: 'Absoluto', latex: '$|x|$', title: 'Valor absoluto' },
    ],
    GRIEGAS: [
        { label: 'π', sublabel: 'pi', latex: '$\\pi$', title: 'Número Pi' },
        { label: 'θ', sublabel: 'theta', latex: '$\\theta$', title: 'Ángulo Theta' },
        { label: 'α', sublabel: 'alpha', latex: '$\\alpha$', title: 'Alpha' },
        { label: 'β', sublabel: 'beta', latex: '$\\beta$', title: 'Beta' },
        { label: 'γ', sublabel: 'gamma', latex: '$\\gamma$', title: 'Gamma' },
        { label: 'λ', sublabel: 'lambda', latex: '$\\lambda$', title: 'Lambda' },
        { label: 'Δ', sublabel: 'Delta', latex: '$\\Delta$', title: 'Delta / Incremento' },
        { label: 'μ', sublabel: 'mu', latex: '$\\mu$', title: 'Micro / Media' },
        { label: 'σ', sublabel: 'sigma', latex: '$\\sigma$', title: 'Desviación Sigma' },
        { label: 'ω', sublabel: 'omega', latex: '$\\omega$', title: 'Omega' },
        { label: 'Ω', sublabel: 'Omega', latex: '$\\Omega$', title: 'Omega mayúscula' },
        { label: 'Σ', sublabel: 'Sigma', latex: '$\\Sigma$', title: 'Sigma mayúscula' },
        { label: 'Φ', sublabel: 'phi', latex: '$\\phi$', title: 'Phi' },
    ],
    OPERADORES: [
        { label: '±', sublabel: 'mas-menos', latex: '$\\pm$', title: 'Más o menos' },
        { label: '×', sublabel: 'multiplica', latex: '$\\times$', title: 'Multiplicación' },
        { label: '·', sublabel: 'punto', latex: '$\\cdot$', title: 'Punto escalar' },
        { label: '÷', sublabel: 'divide', latex: '$\\div$', title: 'División' },
        { label: '≤', sublabel: 'menor-igual', latex: '$\\le$', title: 'Menor o igual' },
        { label: '≥', sublabel: 'mayor-igual', latex: '$\\ge$', title: 'Mayor o igual' },
        { label: '≠', sublabel: 'distinto', latex: '$\\ne$', title: 'Distinto de' },
        { label: '≈', sublabel: 'aprox', latex: '$\\approx$', title: 'Aproximado' },
        { label: '≡', sublabel: 'identico', latex: '$\\equiv$', title: 'Idéntico / Congruente' },
        { label: '∈', sublabel: 'pertenece', latex: '$\\in$', title: 'Pertenece a' },
        { label: '∉', sublabel: 'no-pertenece', latex: '$\\notin$', title: 'No pertenece a' },
        { label: '⊂', sublabel: 'subconjunto', latex: '$\\subset$', title: 'Subconjunto' },
        { label: '∪', sublabel: 'union', latex: '$\\cup$', title: 'Unión' },
        { label: '∩', sublabel: 'intersec', latex: '$\\cap$', title: 'Intersección' },
        { label: '∅', sublabel: 'vacio', latex: '$\\emptyset$', title: 'Conjunto vacío' },
        { label: '∞', sublabel: 'infinito', latex: '$\\infty$', title: 'Infinito' },
    ],
    CALCULO: [
        { label: '∑', sublabel: 'Sumatoria', latex: '$$\\sum_{i=1}^{n} x_i$$', title: 'Sumatoria con límites' },
        { label: '∫', sublabel: 'Integral', latex: '$$\\int_{a}^{b} f(x) \\, dx$$', title: 'Integral definida' },
        { label: '∬', sublabel: 'Doble Int.', latex: '$$\\iint_{D} f(x,y) \\, dA$$', title: 'Integral doble' },
        { label: 'lim', sublabel: 'Límite', latex: '$$\\lim_{x \\to \\infty} \\frac{1}{x}$$', title: 'Límite al infinito' },
        { label: '∂f/∂x', sublabel: 'Parcial', latex: '$\\frac{\\partial f}{\\partial x}$', title: 'Derivada parcial' },
        { label: 'log', sublabel: 'Logaritmo', latex: '$\\log_{b}(x)$', title: 'Logaritmo base b' },
        { label: 'ln', sublabel: 'Log Natural', latex: '$\\ln(x)$', title: 'Logaritmo natural' },
        { label: 'sin', sublabel: 'Seno', latex: '$\\sin(x)$', title: 'Función Seno' },
        { label: 'cos', sublabel: 'Coseno', latex: '$\\cos(x)$', title: 'Función Coseno' },
        { label: 'tan', sublabel: 'Tangente', latex: '$\\tan(x)$', title: 'Función Tangente' },
        { label: '∠', sublabel: 'Ángulo', latex: '$\\angle ABC = 45^\\circ$', title: 'Ángulo geométrico' },
        { label: '→v', sublabel: 'Vector', latex: '$\\vec{v}$', title: 'Vector con flecha' },
    ],
    PLANTILLAS: [
        { label: '⊞ Cuadrática', sublabel: 'Fórmula General', latex: '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$', title: 'Ecuación cuadrática general' },
        { label: '{ Sistema 2x2', sublabel: 'Ecuaciones', latex: '$$\\begin{cases}\n  2x + y = 10 \\\\\n  x - 3y = -2\n\\end{cases}$$', title: 'Sistema de ecuaciones 2x2' },
        { label: '[ Matriz 2x2 ]', sublabel: 'Matriz', latex: '$$\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}$$', title: 'Matriz 2x2' },
        { label: '[ Matriz 3x3 ]', sublabel: 'Matriz 3x3', latex: '$$\\begin{bmatrix}\n  1 & 0 & 0 \\\\\n  0 & 1 & 0 \\\\\n  0 & 0 & 1\n\\end{bmatrix}$$', title: 'Matriz identidad 3x3' },
        { label: '| Det 2x2 |', sublabel: 'Determinante', latex: '$$\\begin{vmatrix}\n  a & b \\\\\n  c & d\n\\end{vmatrix} = ad - bc$$', title: 'Determinante 2x2' },
    ],
};

export function RichTextMathEditor({
    value,
    onChange,
    placeholder = 'Escribe aquí tu indicador o texto de evaluación...',
    label,
    rows = 3,
    compact = false,
    className,
    required = false,
}: RichTextMathEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showFormulas, setShowFormulas] = useState(false);
    const [activeCategory, setActiveCategory] = useState<FormulaCategory>('FRACCIONES');
    const [showPreview, setShowPreview] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Sincronizar el contenido interno cuando cambia externamente
    useEffect(() => {
        if (editorRef.current && document.activeElement !== editorRef.current) {
            const htmlValue = value || '';
            if (editorRef.current.innerHTML !== htmlValue) {
                editorRef.current.innerHTML = htmlValue;
            }
        }
    }, [value]);

    const handleContentChange = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            // Limpieza básica de spans redundantes de navegadores
            const cleaned = html === '<p><br></p>' || html === '<br>' ? '' : html;
            onChange(cleaned);
        }
    };

    // Ejecutar comando de formato WYSIWYG
    const format = (command: string, val: string = '') => {
        document.execCommand(command, false, val);
        editorRef.current?.focus();
        handleContentChange();
    };

    // Insertar fórmula matemática en la posición del cursor
    const insertFormula = (latex: string) => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(` ${latex} `);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
        } else if (editorRef.current) {
            // Si el cursor no estaba en el editor, agregar al final
            editorRef.current.focus();
            const textNode = document.createTextNode(` ${latex} `);
            editorRef.current.appendChild(textNode);
        }
        handleContentChange();
    };

    const hasContent = Boolean(value && value.trim());

    return (
        <div className={cn(
            "rounded-3xl border border-border/60 bg-card overflow-hidden shadow-xs transition-all",
            isFocused && "border-amber-500/50 shadow-md ring-2 ring-amber-500/10",
            compact ? "p-0" : "",
            className
        )}>
            {/* Header con Etiqueta (si existe) */}
            {label && (
                <div className="px-4 pt-3 pb-1 border-b border-border/20 bg-background/50">
                    <span className="text-[11px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <Sigma className="w-3.5 h-3.5 text-[#c29b38]" />
                        {label}
                        {required && <span className="text-destructive">*</span>}
                    </span>
                </div>
            )}

            {/* ── BARRA PRINCIPAL DE HERRAMIENTAS WYSIWYG ─────── */}
            <div className={cn(
                "flex items-center gap-1 px-3 bg-background/80 border-b border-border/40 flex-wrap select-none",
                compact ? "py-1.5" : "py-2.5"
            )}>
                {/* Grupo Tipografía */}
                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        onClick={() => format('formatBlock', '<h1>')}
                        title="Título Principal H1"
                        className="px-2 py-1 rounded-xl text-xs font-black text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all cursor-pointer"
                    >
                        H<sub className="text-[9px]">1</sub>
                    </button>
                    <button
                        type="button"
                        onClick={() => format('formatBlock', '<h2>')}
                        title="Subtítulo H2"
                        className="px-2 py-1 rounded-xl text-xs font-black text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all cursor-pointer"
                    >
                        H<sub className="text-[9px]">2</sub>
                    </button>
                    <button
                        type="button"
                        onClick={() => format('formatBlock', '<p>')}
                        title="Párrafo normal"
                        className="px-2 py-1 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all cursor-pointer"
                    >
                        <Type className="w-3.5 h-3.5" />
                    </button>
                </div>

                <span className="w-px h-4 bg-border/50 mx-1" />

                {/* Grupo Negrita / Cursiva */}
                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        onClick={() => format('bold')}
                        title="Negrita (Ctrl+B)"
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all cursor-pointer font-black"
                    >
                        <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => format('italic')}
                        title="Cursiva (Ctrl+I)"
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all cursor-pointer"
                    >
                        <Italic className="w-3.5 h-3.5" />
                    </button>
                </div>

                <span className="w-px h-4 bg-border/50 mx-1" />

                {/* Grupo Listas */}
                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        onClick={() => format('insertUnorderedList')}
                        title="Lista con viñetas"
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all cursor-pointer"
                    >
                        <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => format('insertOrderedList')}
                        title="Lista numerada"
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all cursor-pointer"
                    >
                        <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Botón Destacado: ∑ FÓRMULAS (Toggle para desplegar/ocultar) */}
                <button
                    type="button"
                    onClick={() => setShowFormulas(prev => !prev)}
                    className={cn(
                        "ml-1.5 px-3 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 transition-all shadow-xs cursor-pointer",
                        showFormulas
                            ? "bg-[#c29b38] text-white shadow-md shadow-[#c29b38]/30 scale-[1.02]"
                            : "bg-[#c29b38]/15 text-[#a07c24] dark:text-[#dfb74f] hover:bg-[#c29b38]/25"
                    )}
                >
                    <Sigma className="w-3.5 h-3.5" />
                    <span>{showFormulas ? 'Ocultar Fórmulas' : 'Fórmulas'}</span>
                </button>

                {/* Toggle Vista Previa KaTeX Renderizada */}
                <button
                    type="button"
                    onClick={() => setShowPreview(prev => !prev)}
                    title="Ver resultado renderizado"
                    className={cn(
                        "ml-auto px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border",
                        showPreview
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/60"
                    )}
                >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Vista Final</span>
                </button>
            </div>

            {/* ── PANEL EXPANDIDO DE FÓRMULAS MATEMÁTICAS (OPCIONAL) ────── */}
            {showFormulas && (
                <div className="p-3 bg-secondary/15 border-b border-border/40 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between gap-2">
                        {/* Pills de Categorías */}
                        <div className="flex flex-wrap items-center gap-1">
                            {FORMULA_CATEGORIES.map(cat => {
                                const isSelected = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={cn(
                                            "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                            isSelected
                                                ? "bg-[#c29b38] text-white shadow-xs"
                                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                                        )}
                                    >
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Botón cerrar panel de fórmulas */}
                        <button
                            type="button"
                            onClick={() => setShowFormulas(false)}
                            className="text-[10px] font-bold text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-lg hover:bg-secondary cursor-pointer"
                        >
                            ✕ Ocultar
                        </button>
                    </div>

                    {/* Botones Visuales de Fórmulas de la Categoría Activa */}
                    <div className="flex flex-wrap items-center gap-1.5 max-h-32 overflow-y-auto pt-0.5 pb-0.5">
                        {MATH_FORMULAS[activeCategory].map((item, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => insertFormula(item.latex)}
                                title={item.title}
                                className="group px-2.5 py-1 rounded-xl bg-card border border-border/70 hover:border-[#c29b38] hover:bg-[#c29b38]/5 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <span className="text-xs font-black text-foreground group-hover:text-[#c29b38] transition-colors">
                                    {item.label}
                                </span>
                                {item.sublabel && (
                                    <span className="text-[9px] font-mono text-muted-foreground/70 uppercase group-hover:text-[#c29b38]/80 transition-colors">
                                        {item.sublabel}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── ÁREA DE EDICIÓN VISUAL WYSIWYG ─────────────── */}
            <div className="relative">
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    data-placeholder={placeholder}
                    className={cn(
                        "w-full overflow-y-auto px-4 bg-background text-sm leading-relaxed text-foreground outline-none",
                        compact ? "py-2.5 min-h-[55px] max-h-[220px]" : "py-3.5 min-h-[90px] max-h-[350px]",
                        "prose prose-sm dark:prose-invert max-w-none",
                        "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 empty:before:pointer-events-none"
                    )}
                />
            </div>

            {/* ── VISTA PREVIA RENDERIZADA CON KATEX ─────────── */}
            {showPreview && (
                <div className="p-5 bg-secondary/30 border-t border-border/40 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#c29b38] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Vista Previa de Evaluación Renderizada
                    </span>
                    {hasContent ? (
                        <div className="p-4 rounded-2xl bg-card border border-border/40 text-sm leading-relaxed">
                            <MathRenderer text={value} className="prose prose-sm dark:prose-invert max-w-none font-medium" />
                        </div>
                    ) : (
                        <p className="text-xs italic text-muted-foreground/50">
                            Escribe texto o inserta fórmulas para visualizar el resultado final.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

