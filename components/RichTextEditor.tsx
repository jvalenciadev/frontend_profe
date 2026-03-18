'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Bold, Italic, List, Heading1, Heading2,
    Link as LinkIcon, Image as ImageIcon,
    Video, Code, Eye, Edit3, Type,
    ChevronDown, AlignLeft, AlignCenter, AlignRight
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

    // Sync external value with editor content
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const execCommand = (command: string, value: string = '') => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
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
        if (url) {
            execCommand('createLink', url);
        }
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

                        <div className="flex items-center gap-0.5">
                            <ToolbarButton onClick={insertLink} icon={LinkIcon} label="Enlace" />
                            <ToolbarButton onClick={insertImage} icon={ImageIcon} label="Imagen" />
                            <ToolbarButton onClick={insertYoutube} icon={Video} label="Video YT" className="text-red-500 hover:bg-red-500/10" />
                        </div>
                    </>
                )}
            </div>

            {/* Editor Area */}
            <div className="relative min-h-[200px] flex flex-col">
                {isPreview ? (
                    <div
                        className="p-6 prose prose-invert prose-sm max-w-none bg-card min-h-[200px] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: value || '<p class="text-muted-foreground italic">Vista previa vacía...</p>' }}
                    />
                ) : (
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleInput}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        className="p-6 outline-none min-h-[200px] text-foreground font-medium leading-relaxed prose prose-invert prose-sm max-w-none"
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
                .prose h1 { font-weight: 900; font-size: 1.8rem; margin-top: 1rem; margin-bottom: 0.5rem; color: white !important; }
                .prose h2 { font-weight: 800; font-size: 1.4rem; margin-top: 1rem; margin-bottom: 0.5rem; color: var(--primary) !important; }
                .prose p { margin-bottom: 1rem; line-height: 1.6; }
                .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
                .prose img { max-width: 100%; border-radius: 1rem; }
                .prose iframe { border-radius: 1rem; width: 100%; aspect-ratio: 16/9; }
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
