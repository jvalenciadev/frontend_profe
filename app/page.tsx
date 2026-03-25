'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Calendar, MapPin, ArrowRight, GraduationCap, Users,
  Award, Building2, ChevronDown, Rocket, Globe, Sparkles, Quote, BookOpen, Clock, ShieldCheck, ChevronRight,
  Bell, History, Newspaper, ExternalLink, Bookmark, Target, Eye, Landmark, Megaphone, CheckCircle2, User,
  ArrowLeft, Image as ImageIcon, BookOpenText, MapPinned, Info, Mail, Phone, Facebook, Youtube, Instagram
} from 'lucide-react';
import publicService, { LandingPageData } from '@/services/publicService';
import { useTheme } from '@/contexts/ThemeContext';
import { getImageUrl } from '@/lib/utils';
import RegistrationModal from '@/components/RegistrationModal';
import { Toaster } from 'sonner';


/* ─── Types ─────────────────────────────────────────────────── */
interface Programa {
  id: string; nombre: string;
  tipo: { nombre: string }; modalidad: { nombre: string };
  duracion: { nombre: string }; sede: { nombre: string }; costo: number;
  banner?: string; afiche?: string;
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
const IMG = (url?: string) => getImageUrl(url);
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1541829070764-84a7d30dee63?auto=format&fit=crop&q=80';




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
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [selectedProg, setSelectedProg] = useState<any>(null);

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

      {/* ─── INSTITUTIONAL SOLEMN LOADING ─── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#FDFDFD] dark:bg-[#020617]"
            suppressHydrationWarning
          >
            {/* Background Seal watermark with slow rotation */}
            <motion.div
              initial={{ rotate: -5, opacity: 0 }}
              animate={{ rotate: 0, opacity: 0.04 }}
              transition={{ duration: 3 }}
              className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-[900px] h-[900px] bg-[url('https://www.minedu.gob.bo/templates/images/escudo.png')] bg-contain bg-center bg-no-repeat grayscale brightness-50" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col items-center gap-16" suppressHydrationWarning>
              {/* Central Premium Logo */}
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -inset-10 bg-primary-600/10 rounded-full blur-3xl"
                />
                <img src="/logo.svg" alt="PROFE" className="h-18 sm:h-28 w-auto relative z-8 drop-shadow-2xl" />
              </div>

              {/* Solemn Text & Progress */}
              <div className="flex flex-col items-center gap-8 text-center">
                <div className="space-y-3">
                  <p className="text-[9px] font-bold text-primary-600 uppercase tracking-[0.4em]">Programa de Formación Especializada</p>
                </div>

                {/* Progress Bar: Ultra Thin Professional */}
                <div className="w-64 h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '0%' }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                    className="absolute inset-0 bg-primary-600"
                  />
                </div>

              </div>
            </motion.div>

            {/* Bottom Slogan */}
            <div className="absolute bottom-16 left-0 w-full flex justify-center">
              <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300 dark:text-white/10">Ministerio de Educación · Bolivia</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>

          {/* ── BACKGROUND ATMOSPHERE ── */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-primary-500/[0.03] rounded-full blur-[250px]" />
            <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-indigo-500/[0.02] rounded-full blur-[250px]" />
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
          </div>

          {/* ══════ HERO ══════ */}
          <section className="relative pt-32 md:pt-40 lg:pt-48 pb-0 z-10 overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)', backgroundSize: '40px 40px' }} />
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-100/60 dark:bg-primary-900/20 rounded-full blur-[150px]" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-100/80 dark:bg-slate-900/20 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-20 relative z-10">


              {/* ─── Main 2-column Grid ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-14 pb-12 items-start">

                {/* LEFT: Institutional Branding */}
                <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
                  className="order-2 lg:order-1 space-y-7">

                  {/* Super badge */}
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700">
                    <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
                    <span className="text-[10px] font-black text-primary-700 dark:text-primary-400 uppercase tracking-widest">Plataforma Nacional · Formación Docente</span>
                  </div>

                  {/* Hero title */}
                  <div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-tighter">
                      Programa de<br />
                      <span className="relative inline-block">
                        <span className="text-primary-600">Formación</span>
                        <span className="text-slate-900 dark:text-white"> Especializada</span>
                      </span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="h-1 w-10 bg-[#E12C21] rounded-full" />
                      <div className="h-1 w-6 bg-[#F9E11E] rounded-full" />
                      <div className="h-1 w-10 bg-[#009246] rounded-full" />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-md pl-5 border-l-4 border-primary-500">
                    {institution.descripcion}
                  </p>


                </motion.div>

                {/* RIGHT: Featured Event Card */}
                <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
                  className="order-1 lg:order-2">
                  {(() => {
                    const today = new Date();
                    const featured = (data?.eventos || []).find((e: any) => new Date(e.fecha) >= today) || (data?.eventos || [])[0];
                    const nextTwo = (data?.eventos || []).filter((e: any) => e.id !== featured?.id).slice(0, 3);
                    if (!featured) {
                      return (
                        <div className="relative h-72 sm:h-80 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
                          <img src={institution.afiche ? IMG(institution.afiche) : FALLBACK_IMG} className="w-full h-full object-cover" alt="Institución" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                        </div>
                      );
                    }
                    const evtDate = new Date(featured.fecha);
                    const isToday = evtDate.toDateString() === today.toDateString();
                    const isFuture = evtDate > today;
                    return (
                      <div className="space-y-3">
                        {/* Frame card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                          {/* Tricolor header band */}
                          <div className="flex h-1.5">
                            <div className="flex-1 bg-[#E12C21]" />
                            <div className="flex-1 bg-[#F9E11E]" />
                            <div className="flex-1 bg-[#009246]" />
                          </div>
                          {/* Section label */}
                          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary-600" />
                              <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Evento Destacado</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isToday && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[8px] font-black uppercase tracking-widest animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />HOY</span>}
                              {!isToday && isFuture && <span className="px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 text-[8px] font-black uppercase tracking-widest">Próximo</span>}
                              {!isToday && !isFuture && <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest">Finalizado</span>}
                            </div>
                          </div>
                          {/* Event image */}
                          <Link href={`/eventos/${featured.codigo || featured.id}`} className="block group">
                            <div className="relative h-[220px] sm:h-[280px] lg:h-[320px] overflow-hidden">
                              <img src={featured.banner ? IMG(featured.banner) : (featured.afiche ? IMG(featured.afiche) : FALLBACK_IMG)}
                                className="w-full h-full object-cover transition-transform duration-[6000ms] group-hover:scale-105" alt={featured.nombre} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              {/* Floating afiche */}
                              {featured.afiche && (
                                <div className="absolute bottom-4 right-4 w-16 sm:w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 border-white shadow-2xl group-hover:-translate-y-1 transition-transform duration-500">
                                  <img src={IMG(featured.afiche)} className="w-full h-full object-cover" alt="Afiche" />
                                </div>
                              )}
                              {/* Bottom info overlay */}
                              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-10 h-10 bg-white rounded-xl flex flex-col items-center justify-center shadow-lg shrink-0">
                                    <span className="text-sm font-black text-slate-900 leading-none">{evtDate.getDate()}</span>
                                    <span className="text-[6px] font-black text-primary-600 uppercase">{evtDate.toLocaleDateString('es-ES', { month: 'short' })}</span>
                                  </div>
                                  {featured.tipo?.nombre && (
                                    <span className="px-2 py-1 rounded-lg bg-primary-600 text-white text-[7px] font-black uppercase tracking-widest">{featured.tipo.nombre}</span>
                                  )}
                                </div>
                                <h3 className="text-white text-base sm:text-lg font-black uppercase leading-tight line-clamp-2" style={{ maxWidth: featured.afiche ? '78%' : '100%' }}>
                                  {featured.nombre}
                                </h3>
                              </div>
                            </div>
                          </Link>
                          {/* Action footer */}
                          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                            {featured.inscripcionAbierta && (
                              <Link href={`/eventos/${featured.codigo || featured.id}`}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-[9px] font-black uppercase tracking-wider hover:bg-primary-700 transition-all shadow-sm flex-1 justify-center">
                                <Users className="w-3 h-3" /> Inscripción
                              </Link>
                            )}
                            {featured.asistencia && (
                              <Link href={`/eventos/${featured.codigo || featured.id}?step=asistencia`}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider hover:bg-amber-600 transition-all shadow-sm flex-1 justify-center">
                                <CheckCircle2 className="w-3 h-3" /> Asistencia
                              </Link>
                            )}
                            <Link href={`/eventos/${featured.codigo || featured.id}`}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-[9px] font-black uppercase tracking-wider hover:border-primary-500 hover:text-primary-600 transition-all">
                              <Eye className="w-3 h-3" /> Ver
                            </Link>
                          </div>
                        </div>

                        {/* Mini event row */}
                        {nextTwo.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {nextTwo.map((evt: any) => (
                              <Link key={evt.id} href={`/eventos/${evt.codigo || evt.id}`}>
                                <div className="relative h-[80px] sm:h-[96px] rounded-2xl overflow-hidden group border border-slate-200 dark:border-slate-700 hover:border-primary-400 transition-all bg-white dark:bg-slate-800 shadow-sm">
                                  <img src={(evt.afiche || evt.banner) ? IMG(evt.afiche || evt.banner) : FALLBACK_IMG}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" alt={evt.nombre} />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                  <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-white flex flex-col items-center justify-center shadow">
                                    <span className="text-[10px] font-black text-slate-900 leading-none">{new Date(evt.fecha).getDate()}</span>
                                    <span className="text-[5px] font-black text-primary-600 uppercase">{new Date(evt.fecha).toLocaleDateString('es-ES', { month: 'short' })}</span>
                                  </div>
                                  <div className="absolute bottom-1.5 left-2 right-2">
                                    <p className="text-white text-[7px] font-black uppercase leading-tight line-clamp-2">{evt.nombre}</p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              </div>
            </div>
          </section>

          {/* ══════ OFERTA ACADÉMICA — Institucional blanco ══════ */}
          {(data?.programas || []).length > 0 && (
            <section className="relative py-14 bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Decorative side bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#E12C21] via-[#F9E11E] to-[#009246]" />
              <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04]"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)', backgroundSize: '32px 32px' }} />

              <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-20 relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 mb-10">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-md shadow-primary-500/25">
                        <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-primary-600 uppercase tracking-[0.6em]">Programas de Postgrado</p>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                          Oferta Académica
                        </h2>
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm ml-13 max-w-md pl-[52px]">
                      Formación de <strong className="text-slate-800 dark:text-white">Alta Jerarquía</strong> — certificación oficial del sistema educativo plurinacional.
                    </p>
                  </div>
                  <Link href="/oferta"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-[10px] font-black uppercase tracking-widest hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm">
                    Explorar Catálogo <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Program cards — white card style (NO REGISTER BUTTON) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {((data?.programas || []) as Programa[]).slice(0, 3).map((prog: Programa, idx: number) => (
                    <motion.div key={prog.id}
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                      className="group bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col shadow-sm">

                      <div className="relative h-56 overflow-hidden shrink-0">
                        {prog.banner ? (
                          <img src={IMG(prog.banner)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={prog.nombre} />
                        ) : (
                          <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                            <GraduationCap className="w-20 h-20 text-slate-200 dark:text-white/5" />
                          </div>
                        )}
                        <div className="absolute top-4 right-4 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[8px] font-black text-slate-900 uppercase tracking-widest shadow-lg">
                          {prog.tipo.nombre}
                        </div>
                      </div>

                      <div className="p-8 flex flex-col flex-1">
                        <h3 className="text-xl font-black text-slate-950 dark:text-white leading-tight uppercase tracking-tight group-hover:text-primary-600 transition-colors mb-6 line-clamp-2">
                          {prog.nombre}
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-slate-50 dark:border-white/5">
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Duración</span>
                            <span className="text-[10px] font-black text-slate-900 dark:text-white">{prog.duracion.nombre}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Sede</span>
                            <span className="text-[10px] font-black text-slate-900 dark:text-white truncate block">{prog.sede?.nombre || 'Nacional'}</span>
                          </div>
                        </div>

                        <Link href={`/oferta/${prog.id}`} className="mt-8 flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all">
                          Ver detalles profundos <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>


              </div>
            </section>
          )}



          {/* ══════════════════════════════════════════════════════════
              SOBRE NOSOTROS: THE NARRATIVE JOURNEY
          ══════════════════════════════════════════════════════════ */}
          {/* <section className="relative py-32 px-10 lg:px-24 overflow-hidden dark:bg-white/[0.01]">
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
          </section> */}


          {/* ══════════════════════════════════════════════════════════
              DIRECTORIO: THE ORGANIZATIONAL HIERARCHY
          ══════════════════════════════════════════════════════════ */}
          <section className="relative py-24 px-6 sm:px-10 lg:px-24 bg-white dark:bg-slate-950">
            <div className="max-w-[1700px] mx-auto">
              <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-20 border-b border-slate-100 dark:border-white/5 pb-16">
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-xl"><Landmark className="w-6 h-6" /></div>
                    <span className="text-primary-600 font-black text-[10px] uppercase tracking-[0.5em]">GOBERNANZA PLURINACIONAL</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white leading-tight uppercase tracking-tighter">
                    Cargos <span className="text-primary-600 font-serif italic lowercase tracking-normal">Jerárquico.</span>
                  </h2>
                </div>
                <div className="flex flex-col lg:items-end gap-4">
                  <p className="text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md lg:text-right">
                    Conducción estratégica de la formación posgradual para el magisterio boliviano.
                  </p>
                  <div className="px-6 py-2 rounded-full border border-primary-200 dark:border-white/10 text-[8px] font-black uppercase tracking-widest text-primary-600">Designación Oficial</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-10">
                {(data?.cargos || []).slice(0, 4).map((cargo: any, idx: number) => {
                  const person = cargo.admins?.[0];
                  return (
                    <motion.div key={cargo.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                      className="group flex flex-col items-center text-center space-y-6"
                    >
                      <div className="relative w-40 h-40 sm:w-56 sm:h-56 rounded-[3.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl group-hover:border-primary-600 transition-all duration-700">
                        {person?.imagen ? (
                          <img src={IMG(person.imagen)} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt={person.nombre} />
                        ) : (
                          <div className="w-full h-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300">
                            <User className="w-16 h-16" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base sm:text-lg font-black text-slate-950 dark:text-white uppercase tracking-tighter group-hover:text-primary-600 transition-colors">
                          {person ? `${person.nombre} ${person.apellidos}` : cargo.nombre}
                        </h4>
                        <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest">{cargo.nombre}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>



          {/* ══════════════════════════════════════════════════════════
              GALERÍA: THE VISUAL HERITAGE
          ══════════════════════════════════════════════════════════ */}
          <section className="relative py-16 px-6 sm:px-10 lg:px-24 bg-slate-50 dark:bg-white/[0.01]">
            <div className="max-w-[1700px] mx-auto">
              <div className="flex flex-col sm:flex-row items-end justify-between gap-6 mb-12 border-b border-slate-100 dark:border-white/5 pb-8">
                <div className="space-y-2">
                  <span className="text-primary-600 font-black text-[9px] uppercase tracking-[0.4em]">REGISTRO VISUAL</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">
                    Galería de <span className="text-primary-600 font-serif italic lowercase">Excelencia.</span>
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs sm:text-right">Vida académica y momentos históricos institucionalizados.</p>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-3 sm:gap-4">
                {(data?.galerias || []).slice(0, 20).map((item: any, idx: number) => (
                  <motion.div key={item.id} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                    className="relative group aspect-square overflow-hidden rounded-xl sm:rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm"
                  >
                    <img src={IMG(item.imagen)} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" alt={item.titulo} />
                    <div className="absolute inset-0 bg-primary-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>


          {/* ══════════════════════════════════════════════════════════
              COMUNICADOS: THE DIGITAL JOURNAL
          ══════════════════════════════════════════════════════════ */}
          <section className="relative py-24 px-6 sm:px-10 lg:px-24 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="max-w-[1700px] mx-auto">
              <div className="flex flex-col md:flex-row items-end justify-between gap-10 mb-16 border-b border-slate-100 dark:border-white/5 pb-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-600"><Newspaper className="w-6 h-6" /></div>
                    <span className="text-primary-600 font-black text-[10px] uppercase tracking-[0.5em]">COMUNICACIÓN OFICIAL</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white leading-tight uppercase tracking-tighter">
                    Diario de <span className="text-primary-600 font-serif italic lowercase tracking-normal">Gestión Pública.</span>
                  </h2>
                </div>
                <Link href="/comunicados" className="px-8 py-3 rounded-xl border border-primary-600/20 text-[9px] font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all">Ver Repositorio</Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {(data?.comunicados || []).slice(0, 4).map((com: any, idx: number) => (
                  <motion.div key={com.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    className="group relative bg-slate-50 dark:bg-white/[0.02] rounded-[2.5rem] border border-slate-100 dark:border-white/10 hover:border-primary-600 transition-all duration-700 overflow-hidden"
                  >
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img src={com.afiche ? IMG(com.afiche) : (com.banner ? IMG(com.banner) : FALLBACK_IMG)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={com.titulo} />
                      <div className="absolute top-4 left-4 bg-primary-600 text-white p-2 rounded-lg"><Megaphone className="w-4 h-4" /></div>
                    </div>
                    <div className="p-8 space-y-4">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(com.createdAt).toLocaleDateString()}</span>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight line-clamp-2 uppercase tracking-tight group-hover:text-primary-600 transition-colors">{com.titulo}</h4>
                      <Link href="/comunicados" className="inline-flex items-center gap-2 text-primary-600 text-[9px] font-black uppercase tracking-widest pt-2">Leer Más <ArrowRight className="w-3 h-3" /></Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>


          {/* ══════════════════════════════════════════════════════════
              BLOG: THE ACADEMIC THOUGHT
          ══════════════════════════════════════════════════════════ */}
          <section className="relative py-24 px-6 sm:px-10 lg:px-24 bg-slate-50 dark:bg-white/[0.01]">
            <div className="max-w-[1700px] mx-auto">
              <div className="flex flex-col lg:flex-row items-end justify-between gap-10 mb-16 border-b border-slate-100 dark:border-white/5 pb-12">
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-600"><BookOpenText className="w-6 h-6" /></div>
                    <span className="text-primary-600 font-black text-[10px] uppercase tracking-[0.5em]">PENSAMIENTO PEDAGÓGICO</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white leading-tight uppercase tracking-tighter">
                    Revista <span className="text-primary-600 font-serif italic lowercase tracking-normal">Científica.</span>
                  </h2>
                </div>
                <Link href="/blog" className="px-8 py-3 rounded-xl bg-slate-950 text-white text-[9px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all">Explorar Blog</Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {(data?.blogs || []).slice(0, 3).map((post: any, idx: number) => (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    className="group bg-slate-50 dark:bg-white/[0.02] rounded-[2.5rem] border border-slate-100 dark:border-white/10 overflow-hidden hover:border-primary-500 hover:shadow-2xl transition-all duration-500"
                  >
                    <div className="aspect-[16/11] overflow-hidden relative">
                      {IMG(post.imagen) ? (
                        <img src={IMG(post.imagen)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={post.titulo} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-300">
                          <BookOpenText className="w-12 h-12 opacity-20" />
                        </div>
                      )}
                      <div className="absolute bottom-6 left-6 px-4 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-primary-600 shadow-xl">
                        {new Date(post.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                    <div className="p-8 space-y-4">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white leading-tight line-clamp-2 uppercase tracking-tight group-hover:text-primary-600 transition-colors">{post.titulo}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">{post.subtitulo}</p>
                      <Link href={`/blog/${post.id}`} className="inline-flex items-center gap-3 text-primary-600 text-[10px] font-black uppercase tracking-widest pt-4 border-t border-slate-100 dark:border-white/5 w-full">
                        Leer Artículo Completo <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>


          {/* ══════════════════════════════════════════════════════════
              EVENTOS & AGENDA: THE OFFICIAL GAZETTE
          ══════════════════════════════════════════════════════════ */}
          <section className="relative py-24 px-6 sm:px-10 lg:px-24 bg-slate-50 dark:bg-slate-900 border-y border-slate-100 dark:border-white/5">
            <div className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 lg:gap-32 items-center">
              <div className="lg:col-span-4 space-y-12">
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-2xl shadow-primary-600/30 transform -rotate-3"><Calendar className="w-7 h-7" /></div>
                    <span className="text-primary-600 font-black text-[10px] uppercase tracking-[0.5em]">AGENDA OFICIAL</span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white leading-none tracking-tighter uppercase">
                    Gaceta de <br />
                    <span className="text-primary-600 italic">Eventos.</span>
                  </h2>
                  <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-lg border-l-4 border-primary-600/20 pl-8">
                    Encuentros pedagógicos de alta jerarquía, seminarios doctorales y conversatorios estratégicos.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                {(data?.eventos || []).slice(0, 3).map((evt: any, idx: number) => (
                  <motion.div key={evt.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    className="group relative flex flex-col sm:flex-row gap-6 p-6 sm:p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-primary-600 transition-all duration-500 overflow-hidden shadow-sm"
                  >
                    <div className="sm:w-24 flex flex-col items-center justify-center shrink-0">
                      <div className="w-20 h-20 rounded-[1.8rem] bg-slate-50 dark:bg-primary-950/50 border-2 border-slate-100 dark:border-primary-600/20 flex flex-col items-center justify-center text-slate-950 dark:text-white group-hover:bg-primary-600 group-hover:text-white transition-all shadow-md">
                        <span className="text-2xl font-black leading-none">{new Date(evt.fecha).getDate()}</span>
                        <span className="text-[9px] font-black uppercase tracking-[0.1em]">{new Date(evt.fecha).toLocaleDateString('es-ES', { month: 'short' })}</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="px-3 py-1 rounded-full bg-primary-600/10 text-primary-600 text-[8px] font-black uppercase tracking-widest">{evt.tipo?.nombre || 'Académico'}</span>
                        <div className="flex items-center gap-2 text-slate-400 text-[9px] font-bold uppercase tracking-widest"><MapPin className="w-3.5 h-3.5" /> {evt.lugar || 'Virtual'}</div>
                        <div className="flex items-center gap-2 text-slate-400 text-[9px] font-bold uppercase tracking-widest"><Clock className="w-3.5 h-3.5" /> {new Date(evt.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <h4 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight group-hover:text-primary-600 transition-colors leading-tight">{evt.nombre}</h4>
                    </div>

                    <div className="flex items-center justify-end sm:border-l border-slate-100 dark:border-white/10 sm:pl-8">
                      <Link href={`/eventos/${evt.codigo || evt.id}`} className="w-12 h-12 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all">
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>


          <section className="relative py-24 px-10 lg:px-24 bg-slate-50 dark:bg-white/[0.01]">
            <div className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">
              <div className="space-y-12">
                <div className="space-y-6">
                  <span className="text-primary-600 font-black text-[10px] uppercase tracking-[0.5em]">PRESENCIA TERRITORIAL</span>
                  <h2 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white leading-none tracking-tighter uppercase">
                    Red Nacional de <br /> <span className="text-primary-600 italic">Sedes PROFE.</span>
                  </h2>
                  <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                    Infraestructura especializada en todos los departamentos para garantizar un acompañamiento pedagógico de proximidad.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {(data?.sedes || []).slice(0, 6).map((sede: any) => (
                    <motion.div
                      key={sede.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      className="p-10 rounded-[3.5rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-primary-600 transition-all group shadow-sm hover:shadow-2xl hover:shadow-primary-500/5"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary-600/5 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                          <Landmark className="w-6 h-6" />
                        </div>
                        <h5 className="text-xl font-black uppercase tracking-tighter text-slate-950 dark:text-white leading-tight">{sede.nombre}</h5>
                      </div>

                      <ul className="space-y-5">
                        <li className="flex gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                          <MapPinned className="w-5 h-5 text-primary-600 shrink-0" />
                          <span>{sede.ubicacion || 'Dirección General Regional'}</span>
                        </li>
                        <li className="flex gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                          <Phone className="w-5 h-5 text-primary-600 shrink-0" />
                          {sede.contacto1 || 'S/N'}
                        </li>
                        <li className="flex gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                          <Clock className="w-5 h-5 text-primary-600 shrink-0" />
                          {sede.horario || '08:00 - 18:30'}
                        </li>
                      </ul>

                      {sede.nombreResponsable1 && (
                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                            {sede.imagenResponsable1 ? (
                              <img src={IMG(sede.imagenResponsable1)} className="w-full h-full object-cover" alt="Resp" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400"><User className="w-4 h-4" /></div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary-600">{sede.nombreResponsable1}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{sede.cargoResponsable1 || 'Responsable de Sede'}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <button onClick={() => setShowTenantMenu(true)} className="px-16 py-8 rounded-full bg-primary-600 text-white text-[11px] font-black uppercase tracking-[0.5em] hover:scale-105 hover:shadow-3xl hover:shadow-primary-600/20 transition-all flex items-center gap-6">
                  <Globe className="w-6 h-6" /> Desplegar Mapa Nacional
                </button>
              </div>

              <div className="relative group">
                <div className="absolute -inset-10 bg-primary-600/10 blur-[120px] rounded-full opacity-50" />
                <div className="relative z-10 aspect-[4/5] lg:aspect-square rounded-[6rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-3xl">
                  <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80" className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000" alt="Mapa" />
                  <div className="absolute inset-0 bg-primary-600/20 mix-blend-multiply opacity-40" />
                  <div className="absolute inset-0 flex items-center justify-center p-24">
                    <div className="w-full h-full border-2 border-white/20 rounded-[4rem] relative flex items-center justify-center">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }} className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-3xl border border-white/40 flex items-center justify-center text-white shadow-3xl">
                        <MapPin className="w-16 h-16" />
                      </motion.div>
                      <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-primary-500 shadow-[0_0_20px_white]" />
                      <div className="absolute bottom-1/3 right-1/4 w-3 h-3 rounded-full bg-white shadow-[0_0_15px_white]" />
                      <div className="absolute top-1/2 right-1/2 w-4 h-4 rounded-full bg-primary-600 shadow-[0_0_25px_white]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              FOOTER: THE IMPERIAL CONCLUSION
          ══════════════════════════════════════════════════════════ */}
          <footer className="relative mt-44 bg-white dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden border-t border-slate-200 dark:border-white/5">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-[3px] flex">
                <div className="flex-1 bg-[#E12C21]" />
                <div className="flex-1 bg-[#F9E11E]" />
                <div className="flex-1 bg-[#009246]" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.minedu.gob.bo/templates/images/escudo.png')] bg-no-repeat bg-center opacity-[0.02] scale-150 grayscale" />
            </div>

            <div className="max-w-[1700px] mx-auto px-10 lg:px-24 pt-32 pb-20 relative z-10">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-32 mb-32">

                {/* Main Identity */}
                <div className="xl:col-span-4 space-y-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-primary-600 text-white flex items-center justify-center p-4 shadow-xl shadow-primary-600/20">
                        <img src="/logo-principal.png" alt="Minedu" className="w-full h-auto object-contain brightness-[10]" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-3xl font-black uppercase tracking-tighter leading-none text-slate-950 dark:text-white">{institution.nombreAbreviado}</h3>
                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.4em]">Programa de Formación</p>
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-white/40 text-base font-medium leading-relaxed max-w-sm">
                      Comprometidos con la alta especialización académica para garantizar la soberanía científica de las naciones y el pueblo boliviano.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-primary-600">Contacto Directo</h5>
                    <div className="space-y-4">
                      {[
                        { i: Mail, t: institution.correo || 'contacto@profe.gob.bo' },
                        { i: Phone, t: institution.celular || 'S/N' },
                        { i: MapPin, t: institution.ubicacion || 'La Paz - Bolivia' },
                      ].map((c, i) => (
                        <div key={i} className="flex items-center gap-5 group cursor-pointer">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                            <c.i className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">{c.t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hierarchical Links */}
                <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-24">
                  {[
                    { title: 'Institucional', links: ['Ministerio de Educación', 'Viceministerios', 'Reglamentación', 'Transparencia', 'Gaceta Nacional'] },
                    { title: 'Plataforma PROFE', links: ['Sedes Académicas', 'Oferta Postgrado', 'Revista Científica', 'Banco de Profesionales', 'Sistema de Inscripción'] },
                    { title: 'Recursos Digitales', links: ['Repositorio Nacional', 'Aula Profe', 'Comunicados Oficiales', 'Trámites en Línea', 'Soporte Técnico'] },
                  ].map((group) => (
                    <div key={group.title} className="space-y-10">
                      <h5 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-950 dark:text-white border-l-3 border-primary-600 pl-5">{group.title}</h5>
                      <ul className="space-y-5">
                        {group.links.map(l => (
                          <li key={l}><a href="#" className="text-[11px] font-black text-slate-400 dark:text-white/30 hover:text-primary-600 transition-colors uppercase tracking-widest flex items-center gap-4 group">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-600 scale-0 group-hover:scale-100 transition-transform" /> {l}
                          </a></li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Footer Bar */}
              <div className="pt-16 border-t border-slate-100 dark:border-white/5 flex flex-col xl:flex-row items-center justify-between gap-12">
                <div className="flex items-center gap-10">
                  <img src="/logo-principal.png" className="h-8 w-auto opacity-20 grayscale" alt="Bolivia" />
                  <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
                  <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.5em] text-center xl:text-left leading-relaxed">
                    Ministerio de Educación © {new Date().getFullYear()} — Estado Plurinacional de Bolivia <br />
                    <span className="text-primary-600/60">Soberanía Científica y Democrática</span>
                  </p>
                </div>

                <div className="flex gap-10">
                  {['Privacidad', 'Condiciones', 'Accesibilidad'].map(l => (
                    <span key={l} className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 hover:text-primary-600 cursor-pointer transition-colors">{l}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Background Texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
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
      <RegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => {
          setIsRegModalOpen(false);
          setSelectedProg(null);
        }}
        program={selectedProg}
      />
      <Toaster position="top-right" richColors />
    </div>
  );
}
