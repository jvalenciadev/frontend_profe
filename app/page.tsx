'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Calendar, MapPin, ArrowRight, GraduationCap, Users,
  Award, Building2, ChevronDown, Rocket, Globe, Sparkles, Quote, BookOpen, Clock, ShieldCheck, ChevronRight,
  Bell, History, Newspaper, ExternalLink, Bookmark, Target, Eye, Landmark, Megaphone, CheckCircle2,
  Image as ImageIcon, BookOpenText, MapPinned, Info, Mail, Phone, Facebook, Youtube, Instagram
} from 'lucide-react';
import publicService, { LandingPageData } from '@/services/publicService';
import { useTheme } from '@/contexts/ThemeContext';

/* ─── Types ─────────────────────────────────────────────────── */
interface Programa {
  id: string; nombre: string;
  tipo: { nombre: string }; modalidad: { nombre: string };
  duracion: { nombre: string }; sede: { nombre: string }; costo: number;
}
interface Departamento {
  id: string; nombre: string; abreviacion: string;
}
interface ExtendedLandingPageData extends LandingPageData {
  programas: Programa[];
  comunicados: any[];
  eventos: any[];
  blogs: any[];
  galerias: any[];
  sedes: any[];
  cargos: any[];
}

/* ─── Helpers ────────────────────────────────────────────────── */
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1541339907198-e08759df9a73?auto=format&fit=crop&q=80';

const IMG = (src: string) => {
  if (!src) return FALLBACK_IMG;
  return src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith('/') ? '' : '/'}${src}`;
};

export default function LandingPage() {
  const { effectiveTheme, setPrimaryColor, setCustomHex } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tenantParam = searchParams?.get('tenant') ?? undefined;

  const [data, setData] = useState<ExtendedLandingPageData | null>(null);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [activeTenant, setActiveTenant] = useState<string | undefined>(tenantParam);
  const [isLoading, setIsLoading] = useState(true);
  const [showTenantMenu, setShowTenantMenu] = useState(false);

  // High-End Scroll Dynamics
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    setActiveTenant(searchParams?.get('tenant') ?? undefined);
  }, [searchParams]);

  useEffect(() => {
    publicService.getDepartamentos().then(setDepartamentos).catch(() => { });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    publicService.getLandingPageData(activeTenant)
      .then(res => {
        const extendedData = res as ExtendedLandingPageData;
        setData(extendedData);
        // Aplica colores dinámicos del dashboard si están presentes
        if (extendedData.profe?.color) {
          setPrimaryColor('profe');
        }
      })
      .catch(() => { })
      .finally(() => {
        setTimeout(() => setIsLoading(false), 1200);
      });
  }, [activeTenant, setPrimaryColor, setCustomHex]);

  const handleTenantChange = (newTenant: string | undefined) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (newTenant) params.set('tenant', newTenant);
    else params.delete('tenant');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setShowTenantMenu(false);
  };

  const institution = data?.profe || {
    nombre: 'PROFE',
    nombreAbreviado: 'PROFE',
    descripcion: 'Pilar de la formación académica y pedagógica del magisterio boliviano.',
    sobreNosotros: 'Nuestra institución se dedica a la excelencia académica y la formación continua del magisterio, impulsando el desarrollo educativo nacional a través de programas de postgrado de alto impacto.',
    mision: 'Formar profesionales de excelencia con compromiso social y rigor científico.',
    vision: 'Ser el referente nacional e internacional en formación pedagógica de postgrado.',
    imagen: null, logoPrincipal: null, afiche: null,
    correo: '', celular: '', ubicacion: '', facebook: '', youtube: '', tiktok: ''
  };

  const activeDep = departamentos.find(d => d.abreviacion === activeTenant);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FDFDFD] dark:bg-primary-950 text-slate-900 dark:text-white transition-colors duration-1000 selection:bg-primary-600 selection:text-white overflow-hidden" suppressHydrationWarning>

      {/* ─── MAJESTIC CENTRIC LOADING ─── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-white dark:bg-[#020617]"
          >
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary-500/[0.08] rounded-full blur-[180px] animate-pulse" />
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 flex flex-col items-center">
              <div className="w-40 h-40 bg-white dark:bg-primary-600 rounded-[3.5rem] p-10 shadow-2xl border border-primary-500/10 flex items-center justify-center">
                {institution.imagen ? (
                  <img src={IMG(institution.imagen)} className="w-full h-full object-contain" alt="Logo" />
                ) : (
                  <span className="text-7xl font-black text-primary-600">P</span>
                )}
              </div>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="mt-10 text-[10px] font-black uppercase tracking-[1em] text-primary-600 ml-[1em]">
                Sincronizando
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>

          {/* ── BACKGROUND ATMOSPHERE ── */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-primary-500/[0.03] rounded-full blur-[250px]" />
            <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-indigo-500/[0.02] rounded-full blur-[250px]" />
          </div>

          {/* ══════════════════════════════════════════════════════════
              HERO: THE MAJESTIC ALTAR
          ══════════════════════════════════════════════════════════ */}
          <section className="relative pt-52 pb-20 px-10 lg:px-24 z-10">
            <div className="max-w-[1700px] mx-auto space-y-24">

              {/* Branding Stage */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative">
                <div className="relative py-14 px-12 md:px-24 rounded-[4rem] bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl border border-white dark:border-white/5 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-16 overflow-hidden">
                  <img src={institution.logoPrincipal ? IMG(institution.logoPrincipal) : '/logo-principal.png'} className="h-20 md:h-28 lg:h-36 w-auto object-contain dark:brightness-[10]" alt="Ministerio" />
                  <div className="hidden lg:block w-px h-28 bg-primary-500/10" />
                  <div className="flex flex-col items-center lg:items-end gap-4 text-center lg:text-right">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-950 dark:text-white uppercase tracking-tighter leading-none">{institution.nombreAbreviado}</h2>
                    <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.6em]">Excelencia Académica de Estado</span>
                  </div>
                  <div className="absolute top-0 right-1/2 translate-x-1/2 lg:right-24 lg:translate-x-0 px-10 py-3.5 bg-primary-600 text-white rounded-b-[2rem] text-[8px] font-black uppercase tracking-[0.5em]">AUTORIDAD TERRITORIAL</div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-14">
                  <div className="space-y-8">
                    <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-primary-500/5 border border-primary-500/10 text-[9px] font-black text-primary-600 uppercase tracking-[0.5em]">
                      <Sparkles className="w-5 h-5" /> Soberanía Educativa 2024
                    </div>
                    <h1 className="text-5xl md:text-8xl lg:text-[8.5rem] font-black text-slate-950 dark:text-white leading-[0.85] tracking-tighter">
                      Docente: <br />
                      <span className="text-primary-600 italic">Transforma Realidades.</span>
                    </h1>
                    <p className="text-xl lg:text-3xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                      {institution.descripcion}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-8">
                    <Link href="/registro-profe" className="px-16 py-8 bg-primary-600 text-white rounded-full text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:brightness-110 hover:-translate-y-2 transition-all flex items-center gap-4 group">
                      Iniciar Inscripción <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </Link>
                    <button onClick={() => setShowTenantMenu(true)} className="px-12 py-8 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-full text-[11px] font-black uppercase tracking-[0.4em] hover:border-primary-600 transition-all flex items-center gap-4">
                      <Building2 className="w-5 h-5 text-primary-600" /> {activeDep ? activeDep.nombre : 'Plataforma Nacional'}
                    </button>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="relative">
                  <div className="relative z-10 aspect-[3.5/4.5] rounded-[6rem] overflow-hidden border border-primary-500/20 shadow-3xl group">
                    <img src={institution.afiche ? IMG(institution.afiche) : FALLBACK_IMG} className="w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-110" alt="Prestigio" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-70" />
                    <div className="absolute bottom-12 left-12 right-12 p-10 bg-white/5 backdrop-blur-3xl rounded-[4rem] border border-white/10 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white"><Award className="w-6 h-6" /></div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tighter">Certificación Nacional</h4>
                      </div>
                      <p className="text-white/70 text-sm font-medium italic">"Liderando la formación continua con rigor científico y compromiso social."</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-24 border-t border-slate-100 dark:border-white/5">
                {[
                  { l: 'Maestros', v: '40K+', d: 'Egresados del Sistema', i: Users },
                  { l: 'Oferta', v: '180+', d: 'Programas de Postgrado', i: GraduationCap },
                  { l: 'País', v: '100%', d: 'Cobertura Plurinacional', i: Globe }
                ].map((s) => (
                  <div key={s.l} className="flex items-center gap-8 group">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-primary-500/5 group-hover:bg-primary-600 transition-all flex items-center justify-center text-primary-600 group-hover:text-white shadow-sm"><s.i className="w-10 h-10" /></div>
                    <div className="space-y-1">
                      <div className="text-5xl font-black text-slate-950 dark:text-white tracking-tighter leading-none">{s.v}</div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-primary-600 uppercase tracking-widest">{s.l}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">{s.d}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              SOBRE NOSOTROS: THE NARRATIVE JOURNEY
          ══════════════════════════════════════════════════════════ */}
          <section className="relative py-32 px-10 lg:px-24 overflow-hidden dark:bg-white/[0.01]">
            <div className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
              <div className="space-y-16">
                <div className="space-y-8">
                  <span className="text-primary-600 font-black text-[11px] uppercase tracking-[0.8em]">HISTORIA & VISIÓN</span>
                  <h2 className="text-5xl md:text-7xl font-black text-slate-950 dark:text-white leading-none tracking-tighter">
                    Identidad que <br /> <span className="text-primary-600">Alta Jerarquía.</span>
                  </h2>
                  <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {institution.sobreNosotros}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="p-10 rounded-[3rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 group hover:border-primary-600 transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-primary-500/5 flex items-center justify-center text-primary-600 mb-6"><Target className="w-8 h-8" /></div>
                    <h5 className="text-xl font-black uppercase tracking-widest mb-4">Nuestra Misión</h5>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">"{institution.mision}"</p>
                  </div>
                  <div className="p-10 rounded-[3rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 group hover:border-primary-600 transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-primary-500/5 flex items-center justify-center text-primary-600 mb-6"><Eye className="w-8 h-8" /></div>
                    <h5 className="text-xl font-black uppercase tracking-widest mb-4">Nuestra Visión</h5>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">"{institution.vision}"</p>
                  </div>
                </div>
                <div className="flex items-center gap-10 pt-4">
                  <div className="flex -space-x-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="w-14 h-14 rounded-full border-4 border-white dark:border-[#020617] bg-slate-100 overflow-hidden"><img src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" /></div>)}
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400"><span className="text-primary-600">+40,000</span> Maestros Conectados</div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary-600/10 blur-[150px] rounded-full" />
                <div className="relative z-10 grid grid-cols-2 gap-8 transform hover:scale-[1.02] transition-transform duration-1000">
                  <div className="space-y-8 mt-12">
                    <div className="aspect-square rounded-[4rem] bg-primary-600 flex items-center justify-center text-white p-12 shadow-2xl">
                      <Landmark className="w-full h-full opacity-20 absolute scale-150 rotate-12" />
                      <div className="text-center relative z-10">
                        <h4 className="text-6xl font-black leading-none">15</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest mt-2">Años de Excelencia</p>
                      </div>
                    </div>
                    <div className="aspect-[4/5] rounded-[4rem] overflow-hidden"><img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Edu" /></div>
                  </div>
                  <div className="space-y-8">
                    <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl"><img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Edu 2" /></div>
                    <div className="aspect-square rounded-[4rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-12 flex flex-col items-center justify-center text-center space-y-4">
                      <ShieldCheck className="w-12 h-12 text-primary-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Soberanía Científica</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              DIRECTORIO: THE LEADERSHIP
          ══════════════════════════════════════════════════════════ */}
          <section className="relative py-32 px-10 lg:px-24 bg-white dark:bg-slate-900/40">
            <div className="max-w-[1700px] mx-auto space-y-20">
              <div className="flex flex-col lg:flex-row items-end justify-between gap-12">
                <div className="space-y-6 max-w-4xl">
                  <span className="text-primary-600 font-black text-[11px] uppercase tracking-[0.8em]">CUERPO JERÁRQUICO</span>
                  <h2 className="text-5xl md:text-7xl font-black text-slate-950 dark:text-white leading-none tracking-tighter">
                    Directorio <br /> <span className="text-primary-600">Institucional.</span>
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {(data?.cargos || []).slice(0, 4).map((cargo, idx) => (
                  <motion.div key={cargo.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    className="p-10 rounded-[3rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-center space-y-4 hover:border-primary-600 transition-all group"
                  >
                    <div className="w-20 h-20 rounded-full bg-primary-600/10 flex items-center justify-center text-primary-600 mx-auto group-hover:scale-110 transition-transform">
                      <Users className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-black uppercase tracking-tighter text-slate-950 dark:text-white">{cargo.nombre}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">Autoridad Estratégica</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              OFERTA ACADÉMICA: THE PRECISION GRID
          ══════════════════════════════════════════════════════════ */}
          <section className="relative py-32 px-10 lg:px-24">
            <div className="max-w-[1700px] mx-auto space-y-20">
              <div className="flex flex-col lg:flex-row items-end justify-between gap-12">
                <div className="space-y-6 max-w-4xl">
                  <span className="text-primary-600 font-black text-[11px] uppercase tracking-[0.8em]">PROGRAMAS ESPECIALIZADOS</span>
                  <h2 className="text-5xl md:text-7xl font-black text-slate-950 dark:text-white leading-none tracking-tighter">
                    Formación de <br /> <span className="text-primary-600">Alta Jerarquía.</span>
                  </h2>
                </div>
                <Link href="/oferta" className="px-12 py-6 rounded-full border-2 border-primary-500/20 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-4 hover:bg-slate-950 hover:text-white transition-all shadow-xl">
                  Ver Oferta Completa <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {(data?.programas || []).slice(0, 3).map((prog, idx) => (
                  <motion.div key={prog.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    className="group relative h-[600px] rounded-[4.5rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 p-12 flex flex-col justify-between hover:shadow-3xl hover:shadow-primary-500/10 transition-all duration-700 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-0"><GraduationCap className="w-32 h-32" /></div>
                    <div className="space-y-8 relative z-10">
                      <div className="flex gap-4">
                        <span className="px-5 py-2 rounded-full bg-primary-600/10 text-primary-600 text-[9px] font-black uppercase tracking-[0.2em] border border-primary-600/20">{prog.tipo.nombre}</span>
                        <span className="px-5 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">{prog.modalidad.nombre}</span>
                      </div>
                      <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white leading-[1.05] tracking-tight group-hover:text-primary-600 transition-colors uppercase">{prog.nombre}</h3>
                    </div>
                    <div className="space-y-10 relative z-10">
                      <div className="grid grid-cols-2 gap-8 py-8 border-y border-slate-100 dark:border-white/5">
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4 text-primary-600" /> Duración</span>
                          <p className="text-xl font-black">{prog.duracion.nombre}</p>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-600" /> Sede</span>
                          <p className="text-xl font-black">{prog.sede.nombre}</p>
                        </div>
                      </div>
                      <Link href={`/oferta/${prog.id}`} className="w-full py-7 rounded-3xl bg-primary-600 text-white flex items-center justify-center gap-4 group/btn overflow-hidden relative transition-all hover:brightness-110">
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] relative z-10 ml-[0.4em]">Detalles Académicos</span>
                        <ArrowRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-3 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              GALERÍA: THE VISUAL HERITAGE
          ══════════════════════════════════════════════════════════ */}
          <section className="relative py-32 px-10 lg:px-24 dark:bg-slate-900/20">
            <div className="max-w-[1700px] mx-auto space-y-20">
              <div className="text-center space-y-6 max-w-3xl mx-auto">
                <span className="text-primary-600 font-black text-[11px] uppercase tracking-[0.8em]">CRÓNICA VISUAL</span>
                <h2 className="text-5xl md:text-7xl font-black text-slate-950 dark:text-white leading-none tracking-tighter">
                  Galería de <br /> <span className="text-primary-600">Excelencia Institucional.</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {(data?.galerias || []).slice(0, 8).map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative group overflow-hidden rounded-[3rem] ${idx % 3 === 0 ? 'md:col-span-2 md:row-span-2 h-[600px]' : 'h-[284px]'}`}
                  >
                    <img src={IMG(item.imagen)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={item.titulo} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-10">
                      <h4 className="text-xl font-black text-white uppercase tracking-tighter">{item.titulo}</h4>
                      <p className="text-white/70 text-sm line-clamp-2">{item.descripcion}</p>
                    </div>
                    <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              COMUNICADOS: THE DIGITAL JOURNAL
          ══════════════════════════════════════════════════════════ */}
          <section className="relative py-32 px-10 lg:px-24 bg-primary-600">
            <div className="max-w-[1700px] mx-auto space-y-20">
              <div className="flex flex-col lg:flex-row items-end justify-between gap-12 text-white">
                <div className="space-y-6">
                  <span className="text-white/40 font-black text-[11px] uppercase tracking-[0.8em]">COMUNICACIÓN OFICIAL</span>
                  <h2 className="text-5xl md:text-7xl font-black leading-none tracking-tighter">Diario de <br /> Gestión Pública.</h2>
                </div>
                <Link href="/comunicados" className="px-12 py-6 rounded-full border-2 border-white/20 text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-4 hover:bg-white hover:text-primary-600 transition-all">
                  Ver Repositorio <ExternalLink className="w-5 h-5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-slate-900 dark:text-white">
                {(data?.comunicados || []).slice(0, 4).map((com, idx) => (
                  <motion.div key={com.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    className="group bg-white/10 backdrop-blur-3xl p-10 rounded-[4rem] border border-white/10 hover:bg-white transition-all duration-700 h-[320px] flex flex-col justify-between"
                  >
                    <div className="space-y-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 group-hover:bg-primary-500/10 flex items-center justify-center text-white group-hover:text-primary-600 transition-colors"><Megaphone className="w-8 h-8" /></div>
                      <h4 className="text-xl font-black text-white group-hover:text-slate-950 leading-[1.3] line-clamp-3 uppercase tracking-tight">{com.titulo}</h4>
                    </div>
                    <div className="flex items-center justify-between text-white/50 group-hover:text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] pt-6 border-t border-white/10 group-hover:border-slate-100">
                      <span>Comunicado Oficial</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              BLOG: THE ACADEMIC THOUGHT
          ══════════════════════════════════════════════════════════ */}
          <section className="relative py-32 px-10 lg:px-24">
            <div className="max-w-[1700px] mx-auto space-y-20">
              <div className="flex flex-col lg:flex-row items-end justify-between gap-12">
                <div className="space-y-6 max-w-4xl">
                  <span className="text-primary-600 font-black text-[11px] uppercase tracking-[0.8em]">PENSAMIENTO PEDAGÓGICO</span>
                  <h2 className="text-5xl md:text-7xl font-black text-slate-950 dark:text-white leading-none tracking-tighter">
                    Revista <br /> <span className="text-indigo-600">Científica & Blog.</span>
                  </h2>
                </div>
                <Link href="/blog" className="px-12 py-6 rounded-full border-2 border-primary-500/20 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-4 hover:bg-primary-950 hover:text-white transition-all shadow-xl">
                  Explorar Artículos <BookOpenText className="w-5 h-5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {(data?.blogs || []).slice(0, 3).map((post, idx) => (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    className="group flex flex-col space-y-8"
                  >
                    <div className="aspect-[16/10] rounded-[3.5rem] overflow-hidden border border-slate-100 dark:border-white/5 relative">
                      <img src={IMG(post.imagen)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={post.titulo} />
                      <div className="absolute top-6 left-6 px-6 py-2 rounded-full bg-white/90 dark:bg-primary-900/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-primary-600 shadow-xl">
                        {new Date(post.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="space-y-4 px-2">
                      <h3 className="text-3xl font-black text-slate-950 dark:text-white leading-tight hover:text-primary-600 transition-colors uppercase tracking-tight">{post.titulo}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed line-clamp-2">{post.subtitulo}</p>
                      <Link href={`/blog/${post.id}`} className="inline-flex items-center gap-4 text-primary-600 text-[10px] font-black uppercase tracking-[0.3em] group/link">
                        Continuar Leyendo <div className="w-10 h-[1px] bg-primary-600 group-hover/link:w-16 transition-all" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              EVENTOS & AGENDA: THE TIMELINE
          ══════════════════════════════════════════════════════════ */}
          <section className="relative py-32 px-10 lg:px-24">
            <div className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-32">
              <div className="lg:col-span-5 space-y-12">
                <div className="space-y-8">
                  <span className="text-primary-600 font-black text-[11px] uppercase tracking-[0.8em]">CRONOGRAMA ACADÉMICO</span>
                  <h2 className="text-5xl md:text-7xl font-black text-slate-950 dark:text-white leading-none tracking-tighter uppercase">Agenda del <br /> Magisterio.</h2>
                </div>
                <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Encuentros pedagógicos, seminarios de alta especialización y conversatorios que marcan el rumbo de la educación nacional.
                </p>
                <Link href="/eventos" className="inline-flex items-center gap-6 px-12 py-6 rounded-full bg-primary-600 text-white text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:brightness-110 transition-all">
                  Ver Calendario Nacional <Calendar className="w-5 h-5" />
                </Link>
              </div>

              <div className="lg:col-span-7 space-y-12">
                {(data?.eventos || []).slice(0, 3).map((evt, idx) => (
                  <motion.div key={evt.id} initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                    className="flex gap-12 group relative"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-[2.5rem] bg-white dark:bg-primary-900 border-2 border-primary-600 flex flex-col items-center justify-center text-primary-600 shadow-xl group-hover:bg-primary-600 group-hover:text-white transition-all transform group-hover:scale-110">
                        <span className="text-lg font-black leading-none">{new Date(evt.fecha).getDate()}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{new Date(evt.fecha).toLocaleDateString('es-ES', { month: 'short' })}</span>
                      </div>
                      <div className="w-[1px] h-full bg-slate-100 dark:bg-white/5 my-6" />
                    </div>
                    <div className="flex-1 pb-20">
                      <div className="p-12 rounded-[4rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 group-hover:border-primary-600 transition-all hover:shadow-2xl hover:shadow-primary-500/5">
                        <div className="flex flex-wrap gap-4 mb-8">
                          <span className="px-5 py-2 rounded-full bg-primary-600/10 text-primary-600 text-[10px] font-black uppercase tracking-widest">{evt.tipo.nombre}</span>
                          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest"><MapPin className="w-4 h-4 text-primary-600" /> {evt.lugar}</div>
                        </div>
                        <h4 className="text-3xl lg:text-4xl font-black text-slate-950 dark:text-white uppercase tracking-tight leading-tight mb-6">{evt.nombre}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed line-clamp-2">{evt.descripcion}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              SEDES: THE TERRITORIAL REACH
          ══════════════════════════════════════════════════════════ */}
          <section className="relative py-32 px-10 lg:px-24 bg-slate-50 dark:bg-white/[0.01]">
            <div className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                <div className="space-y-8">
                  <span className="text-primary-600 font-black text-[11px] uppercase tracking-[0.8em]">PRESENCIA NACIONAL</span>
                  <h2 className="text-5xl md:text-7xl font-black text-slate-950 dark:text-white leading-none tracking-tighter">
                    Nuestras <br /> <span className="text-primary-600">Sedes Académicas.</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {(data?.sedes || []).slice(0, 6).map((sede) => (
                    <div key={sede.id} className="p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-primary-600 transition-all group">
                      <h5 className="text-lg font-black uppercase tracking-tight mb-4 group-hover:text-primary-600 transition-colors">{sede.nombre}</h5>
                      <ul className="space-y-3">
                        <li className="flex gap-3 text-[11px] text-slate-400 font-bold uppercase tracking-widest"><MapPinned className="w-4 h-4 text-primary-600 shrink-0" /> {sede.direccion}</li>
                        <li className="flex gap-3 text-[11px] text-slate-400 font-bold uppercase tracking-widest"><Phone className="w-4 h-4 text-primary-600 shrink-0" /> {sede.telefono}</li>
                      </ul>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowTenantMenu(true)} className="px-12 py-6 rounded-full bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all">
                  Ver Mapa Completo
                </button>
              </div>
              <div className="relative aspect-square rounded-[5rem] overflow-hidden group">
                <div className="absolute inset-0 bg-primary-600/20 group-hover:bg-primary-600/10 transition-colors z-10" />
                <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt="Mapa" />
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="w-32 h-32 rounded-full bg-white/90 dark:bg-primary-900/90 backdrop-blur-xl flex items-center justify-center shadow-3xl animate-bounce">
                    <MapPin className="w-12 h-12 text-primary-600" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              FOOTER: THE DIGITAL SOVEREIGNTY
          ══════════════════════════════════════════════════════════ */}
          <footer className="relative pt-44 pb-20 px-10 lg:px-24 border-t border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-slate-200 dark:bg-white/10" />
            <div className="max-w-[1700px] mx-auto space-y-32 relative z-10">

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-24 items-start">
                <div className="xl:col-span-4 space-y-12">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-primary-600 text-white flex items-center justify-center shadow-3xl transform rotate-3"><Landmark className="w-10 h-10" /></div>
                    <div className="space-y-1">
                      <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">{institution.nombreAbreviado}</h3>
                      <div className="text-[10px] font-black text-primary-600 uppercase tracking-[0.6em]">Excelencia del Magisterio</div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <p className="text-slate-400 dark:text-slate-500 text-base font-medium leading-relaxed max-w-sm">
                      {institution.descripcion}
                    </p>
                    <div className="space-y-4">
                      {institution.correo && <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest"><Mail className="w-4 h-4 text-primary-600" /> {institution.correo}</div>}
                      {institution.celular && <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest"><Phone className="w-4 h-4 text-primary-600" /> {institution.celular}</div>}
                      {institution.ubicacion && <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest"><MapPin className="w-4 h-4 text-primary-600" /> {institution.ubicacion}</div>}
                    </div>
                    <div className="flex gap-6">
                      {institution.facebook && <a href={institution.facebook} target="_blank" className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-primary-600 hover:text-white transition-all"><Facebook className="w-5 h-5" /></a>}
                      {institution.youtube && <a href={institution.youtube} target="_blank" className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-primary-600 hover:text-white transition-all"><Youtube className="w-5 h-5" /></a>}
                      {institution.tiktok && <a href={institution.tiktok} target="_blank" className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-primary-600 hover:text-white transition-all"><span className="text-xs font-black">TT</span></a>}
                    </div>
                  </div>
                </div>

                <div className="xl:col-span-8 grid grid-cols-2 lg:grid-cols-3 gap-20">
                  <div className="space-y-12">
                    <h5 className="text-[12px] font-black uppercase tracking-[0.5em] text-primary-600">Gobernanza</h5>
                    <ul className="space-y-6">
                      {['Identidad Nacional', 'Jurisdicciones', 'Convenios', 'Transparencia'].map(l => (
                        <li key={l}><a href="#" className="text-[13px] font-black text-slate-500 hover:text-primary-600 transition-colors uppercase tracking-widest">{l}</a></li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-12">
                    <h5 className="text-[12px] font-black uppercase tracking-[0.5em] text-primary-600">Academia</h5>
                    <ul className="space-y-6">
                      {['Postgrado', 'Especialidades', 'Investigación', 'Publicaciones'].map(l => (
                        <li key={l}><a href="#" className="text-[13px] font-black text-slate-500 hover:text-primary-600 transition-colors uppercase tracking-widest">{l}</a></li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-12">
                    <h5 className="text-[12px] font-black uppercase tracking-[0.5em] text-primary-600">Redes</h5>
                    <ul className="space-y-6">
                      {['Facebook', 'YouTube', 'TikTok', 'Instagram'].map(l => (
                        <li key={l}><a href="#" className="text-[13px] font-black text-slate-500 hover:text-primary-600 transition-colors uppercase tracking-widest">{l}</a></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-20 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
                <p className="text-[11px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.8em] text-center md:text-left">
                  Ministerio de Educación © {new Date().getFullYear()} PROFE Bolivia — ESTADO PLURINACIONAL DE BOLIVIA
                </p>
                <div className="flex gap-12">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 cursor-pointer hover:text-primary-600 transition-colors">Privacidad</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 cursor-pointer hover:text-primary-600 transition-colors">Términos</span>
                </div>
              </div>
            </div>
          </footer>

          {/* NATIONAL SELECTION MODAL */}
          <AnimatePresence>
            {showTenantMenu && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[190] bg-primary-950/20 backdrop-blur-xl" onClick={() => setShowTenantMenu(false)} />
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] w-[90%] max-w-2xl bg-white dark:bg-primary-950 rounded-[4rem] p-16 shadow-3xl border border-primary-500/10"
                >
                  <div className="text-center space-y-4 mb-14">
                    <span className="text-[11px] font-black text-primary-600 uppercase tracking-[1em]">Selector Nacional</span>
                    <h3 className="text-4xl font-black uppercase tracking-tighter">Sedes Académicas</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-5 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    <button onClick={() => handleTenantChange(undefined)} className="col-span-2 p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 text-[12px] font-black uppercase tracking-widest text-slate-500 hover:bg-primary-600 hover:text-white transition-all">🌐 SEDE CENTRAL PLURINACIONAL</button>
                    {departamentos.map(dep => (
                      <button key={dep.id} onClick={() => handleTenantChange(dep.abreviacion)} className="p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 text-[12px] font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all">
                        {dep.nombre}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

        </motion.div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-h),var(--primary-s),0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
