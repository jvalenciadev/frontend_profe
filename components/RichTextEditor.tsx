'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Bold, Italic, List, Heading1, Heading2,
    Link as LinkIcon, Image as ImageIcon,
    Video, Eye, Edit3, Type,
    AlignLeft, AlignCenter, AlignRight, Table, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isPreview, setIsPreview] = useState(false);
    const [focused, setFocused] = useState(false);
    const [tablePickerOpen, setTablePickerOpen] = useState(false);
    const [hovered, setHovered] = useState<{ r: number; c: number }>({ r: 0, c: 0 });

    const cleanHtml = (html: string): string => {
        if (!html) return '';
        return html.replace(/(<[a-z0-9]+[^>]*>)|((?:bis_skin_checked|skinchecked)=["']?\w+["']?\s*(?:style=["'][^"']*["'])?\s*(?:>|&gt;))/gi, (match, tag) => {
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
    };

    // Sync external value with editor content
    useEffect(() => {
        if (editorRef.current) {
            const cleaned = cleanHtml(value || '');
            // Only update innerHTML if it's actually different AND the editor is not focused.
            // This prevents the cursor from jumping to the beginning while typing.
            if (editorRef.current.innerHTML !== cleaned && document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = cleaned;
            }
        }
    }, [value]);

    const handleBlur = () => {
        setFocused(false);
        if (editorRef.current) {
            const cleaned = cleanHtml(editorRef.current.innerHTML);
            if (editorRef.current.innerHTML !== cleaned) {
                editorRef.current.innerHTML = cleaned;
            }
            onChange(cleaned);
        }
    };

    const execCommand = (command: string, val: string = '') => {
        document.execCommand(command, false, val);
        if (editorRef.current) {
            onChange(cleanHtml(editorRef.current.innerHTML));
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(cleanHtml(editorRef.current.innerHTML));
        }
    };

    const insertYoutube = () => {
        const url = prompt('Ingresa la URL del video de YouTube:');
        if (!url) return;

        let videoId = '';
        if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];

        if (videoId) {
            const embed = `<div class="relative w-full aspect-video my-4 rounded-2xl overflow-hidden shadow-xl border border-white/10">
                <iframe src="https://www.youtube.com/embed/${videoId}" class="absolute inset-0 w-full h-full" frameborder="0" allowfullscreen></iframe>
            </div><p><br></p>`;
            execCommand('insertHTML', embed);
        } else {
            alert('URL de YouTube no válida');
        }
    };

    const insertImage = () => {
        const url = prompt('Ingresa la URL de la imagen:');
        if (url) {
            const img = `<img src="${url}" class="max-w-full h-auto rounded-2xl shadow-xl my-4 mx-auto block border border-white/10" alt="Imagen" /><p><br></p>`;
            execCommand('insertHTML', img);
        }
    };

    const insertLink = () => {
        const url = prompt('Ingresa la URL del enlace:');
        if (url) execCommand('createLink', url);
    };

    const DEFAULT_TABLE_HEADERS = ['Fecha', 'Lugar', 'Título', 'Facilitador', 'Modalidad', 'Observaciones'];

    const insertDefaultTable = () => {
        setTablePickerOpen(false);
        const html = `<div class="rte-table-wrap"><table class="rte-table"><thead><tr><th class="rte-th">Fecha</th><th class="rte-th">Lugar</th><th class="rte-th">Título / Actividad</th><th class="rte-th">Facilitador</th></tr></thead><tbody><tr><td class="rte-td">10/10/2026 · 09:00</td><td class="rte-td">Aula Magna / Virtual</td><td class="rte-td">Inauguración y Módulo 1</td><td class="rte-td">Lic. Facilitador(a)</td></tr><tr><td class="rte-td">11/10/2026 · 09:00</td><td class="rte-td">Laboratorio 1</td><td class="rte-td">Taller Práctico</td><td class="rte-td">Lic. Facilitador(a)</td></tr></tbody></table></div><p><br></p>`;
        execCommand('insertHTML', html);
    };

    const insertTable = (rows: number, cols: number) => {
        setTablePickerOpen(false);
        if (rows < 1 || cols < 1) return;
        const headerCells = Array.from({ length: cols })
            .map((_, c) => `<th class="rte-th">${DEFAULT_TABLE_HEADERS[c] || `Columna ${c + 1}`}</th>`)
            .join('');
        const bodyRows = Array.from({ length: Math.max(rows - 1, 1) })
            .map(() => {
                const cells = Array.from({ length: cols })
                    .map(() => `<td class="rte-td"><br></td>`)
                    .join('');
                return `<tr>${cells}</tr>`;
            })
            .join('');
        const html = `<div class="rte-table-wrap"><table class="rte-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div><p><br></p>`;
        execCommand('insertHTML', html);
    };

    return (
        <div className={cn(
            "group flex flex-col rounded-3xl border-2 transition-all overflow-hidden",
            focused ? "border-primary shadow-xl shadow-primary/5 bg-card" : "border-border bg-muted/20",
            className
        )}>
            {/* Toolbar */}
            <div className="flex items-center flex-wrap gap-1 p-2 border-b border-border bg-muted/40 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-border">
                    <button onClick={() => setIsPreview(false)} type="button" className={cn("p-2 rounded-xl transition-all", !isPreview ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted")}>
                        <Edit3 size={16} />
                    </button>
                    <button onClick={() => setIsPreview(true)} type="button" className={cn("p-2 rounded-xl transition-all", isPreview ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted")}>
                        <Eye size={16} />
                    </button>
                </div>

                {!isPreview && (
                    <>
                        <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-border">
                            <ToolbarButton onClick={() => execCommand('formatBlock', '<h1>')} icon={Heading1} label="H1" />
                            <ToolbarButton onClick={() => execCommand('formatBlock', '<h2>')} icon={Heading2} label="H2" />
                            <ToolbarButton onClick={() => execCommand('formatBlock', '<p>')} icon={Type} label="Texto" />
                        </div>

                        <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-border">
                            <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} label="Negrita" />
                            <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} label="Cursiva" />
                            <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} label="Lista" />
                        </div>

                        <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-border">
                            <ToolbarButton onClick={() => execCommand('justifyLeft')} icon={AlignLeft} label="Izquierda" />
                            <ToolbarButton onClick={() => execCommand('justifyCenter')} icon={AlignCenter} label="Centro" />
                            <ToolbarButton onClick={() => execCommand('justifyRight')} icon={AlignRight} label="Derecha" />
                        </div>

                        <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-border">
                            <ToolbarButton onClick={insertLink} icon={LinkIcon} label="Enlace" />
                            <ToolbarButton onClick={insertImage} icon={ImageIcon} label="Imagen" />
                            <ToolbarButton onClick={insertYoutube} icon={Video} label="Video YT" className="text-red-500 hover:bg-red-500/10" />
                        </div>

                        {/* Table picker */}
                        <div className="relative">
                            <ToolbarButton
                                onClick={() => setTablePickerOpen(o => !o)}
                                icon={Table}
                                label="Tabla"
                                className={tablePickerOpen ? 'bg-primary/10 text-primary' : ''}
                            />
                            {tablePickerOpen && (
                                <div
                                    className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-2xl p-3.5 shadow-2xl min-w-[260px]"
                                    onMouseLeave={() => setHovered({ r: 0, c: 0 })}
                                >
                                    {/* Botón por defecto: 1 clic */}
                                    <div className="space-y-1.5 pb-2.5 border-b border-border/50 mb-2.5">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                            Tabla Predeterminada (1 Clic)
                                        </p>
                                        <button
                                            type="button"
                                            onClick={insertDefaultTable}
                                            className="w-full text-left px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all text-xs font-bold flex items-center justify-between group"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-black text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                                                    <Sparkles className="w-3 h-3 text-primary" />
                                                    Cronograma Oficial
                                                </span>
                                                <span className="text-[9px] font-semibold text-muted-foreground group-hover:text-primary/80 mt-0.5">
                                                    Fecha · Lugar · Título · Facilitador
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary text-white">
                                                Insertar
                                            </span>
                                        </button>
                                    </div>

                                    {/* Cuadrícula libre */}
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 text-center">
                                            {hovered.r > 0 && hovered.c > 0 ? `${hovered.r} filas × ${hovered.c} cols` : 'O personaliza el tamaño'}
                                        </p>
                                        <div className="grid gap-1 justify-center" style={{ gridTemplateColumns: 'repeat(6, 1.5rem)' }}>
                                            {Array.from({ length: 6 }).flatMap((_, r) =>
                                                Array.from({ length: 6 }).map((_, c) => (
                                                    <button
                                                        key={`${r}-${c}`}
                                                        type="button"
                                                        onMouseEnter={() => setHovered({ r: r + 1, c: c + 1 })}
                                                        onClick={() => insertTable(r + 1, c + 1)}
                                                        className={cn(
                                                            'w-6 h-6 rounded border transition-all',
                                                            r < hovered.r && c < hovered.c
                                                                ? 'bg-primary border-primary'
                                                                : 'bg-muted/60 border-border hover:bg-primary/20'
                                                        )}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Editor Area */}
            <div className="relative min-h-[200px] flex flex-col">
                {isPreview ? (
                    <div
                        className="p-6 prose dark:prose-invert prose-sm max-w-none bg-card min-h-[200px] overflow-y-auto rte-content"
                        dangerouslySetInnerHTML={{ __html: value || '<p class="text-muted-foreground italic">Vista previa vacía...</p>' }}
                    />
                ) : (
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleInput}
                        onFocus={() => setFocused(true)}
                        onBlur={handleBlur}
                        className="p-6 outline-none min-h-[200px] text-foreground font-medium leading-relaxed prose dark:prose-invert prose-sm max-w-none rte-content"
                    />
                )}

                {!value && !focused && !isPreview && (
                    <div className="absolute top-6 left-6 pointer-events-none text-muted-foreground/50 text-sm italic">
                        {placeholder || 'Escribe aquí la descripción del cuestionario...'}
                    </div>
                )}
            </div>

            {/* Bottom Status */}
            <div className="px-4 py-1.5 bg-muted/40 border-t border-border flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Editor HTML Pro</span>
                <span className="text-[10px] font-bold text-muted-foreground">{value?.length || 0} caracteres</span>
            </div>

            <style jsx global>{`
                .prose h1 { font-weight: 900; font-size: 1.8rem; margin-top: 1rem; margin-bottom: 0.5rem; }
                .prose h2 { font-weight: 800; font-size: 1.4rem; margin-top: 1rem; margin-bottom: 0.5rem; color: var(--primary) !important; }
                .prose p { margin-bottom: 1rem; line-height: 1.6; }
                .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
                .prose img { max-width: 100%; border-radius: 1rem; }
                .prose iframe { border-radius: 1rem; width: 100%; aspect-ratio: 16/9; }

                /* ── Tabla generada por el editor ─────────────────────── */
                .rte-table-wrap { overflow-x: auto; margin: 1.25rem 0; border-radius: 0.75rem; border: 1px solid hsl(var(--border)); box-shadow: 0 1px 4px 0 rgb(0 0 0 / .06); }
                .rte-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
                .rte-th { background: hsl(var(--primary) / 0.1); color: hsl(var(--primary)); font-weight: 800; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; padding: 0.55rem 0.85rem; border: 1px solid hsl(var(--border)); text-align: left; white-space: nowrap; }
                .rte-td { padding: 0.5rem 0.85rem; border: 1px solid hsl(var(--border)); vertical-align: top; min-width: 80px; line-height: 1.5; }
                .rte-table tbody tr:nth-child(even) .rte-td { background: hsl(var(--muted) / 0.35); }
                .rte-table tbody tr:hover .rte-td { background: hsl(var(--primary) / 0.05); }

                /* ── Tablas sin clases rte- (compatibilidad / copy-paste) */
                .rte-content table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.84rem; border: 1px solid hsl(var(--border)); border-radius: 0.75rem; overflow: hidden; }
                .rte-content table th { background: hsl(var(--primary) / 0.1); color: hsl(var(--primary)); font-weight: 800; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; padding: 0.55rem 0.85rem; border: 1px solid hsl(var(--border)); text-align: left; }
                .rte-content table td { padding: 0.5rem 0.85rem; border: 1px solid hsl(var(--border)); vertical-align: top; line-height: 1.5; }
                .rte-content table tbody tr:nth-child(even) td { background: hsl(var(--muted) / 0.35); }
                .rte-content table tbody tr:hover td { background: hsl(var(--primary) / 0.05); }
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
                "p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex flex-col items-center gap-0.5 group/btn",
                className
            )}
            title={label}
        >
            <Icon size={16} className="group-hover/btn:scale-110 transition-transform" />
            <span className="text-[7px] font-black uppercase tracking-tighter opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">{label}</span>
        </button>
    );
}
