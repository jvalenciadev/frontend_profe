'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 overflow-hidden" suppressHydrationWarning>
      {/* Navegación Sutil */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-gray-100 dark:border-slate-800" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between" suppressHydrationWarning>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black shadow-lg">P</div>
            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">PROFE</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-primary-600 transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/login" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full text-sm font-bold shadow-lg shadow-primary-600/20 transition-all hover:-translate-y-0.5">
              Acceso Sistema
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center" suppressHydrationWarning>
          <div className="space-y-8 animate-fade-in" suppressHydrationWarning>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800" suppressHydrationWarning>
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider">Versión 1.2.0 Estable</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight">
              Gestión Académica <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Sin Esfuerzo.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 dark:text-slate-400 leading-relaxed max-w-lg font-medium">
              La plataforma integral para el seguimiento territorial y administrativo de los programas de formación educativa. Control total de programas, inscripciones y sedes.
            </p>
            <div className="flex flex-wrap gap-4" suppressHydrationWarning>
              <Link href="/login" className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-lg font-bold shadow-2xl shadow-primary-600/30 transition-all hover:-translate-y-1">
                Empezar ahora
              </Link>
              <button className="px-8 py-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white rounded-2xl text-lg font-bold hover:shadow-xl transition-all">
                Saber más
              </button>
            </div>

            {/* Stats Rapidos */}
            <div className="pt-8 grid grid-cols-3 gap-8" suppressHydrationWarning>
              <div>
                <p className="text-3xl font-black text-gray-900 dark:text-whiteTracking-tighter">10k+</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Estudiantes</p>
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">500+</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Sedes</p>
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">12</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Departamentos</p>
              </div>
            </div>
          </div>

          {/* Decoración Visual / Dashboard Preview */}
          <div className="relative group animate-slide-in-up" suppressHydrationWarning>
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary-500/20 to-indigo-500/20 rounded-[40px] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" suppressHydrationWarning></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-2xl overflow-hidden aspect-[4/3] flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500" suppressHydrationWarning>
              {/* Placeholder Mockup representativo */}
              <div className="w-full h-full p-8 flex flex-col gap-6 bg-slate-50 dark:bg-slate-900" suppressHydrationWarning>
                <div className="h-8 w-1/3 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-primary-100/50 dark:bg-primary-900/10 rounded-2xl border border-primary-200/50 dark:border-primary-800/50"></div>
                  <div className="h-24 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700"></div>
                </div>
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 space-y-4">
                  <div className="h-4 w-full bg-gray-100 dark:bg-slate-700 rounded-full"></div>
                  <div className="h-4 w-full bg-gray-100 dark:bg-slate-700 rounded-full"></div>
                  <div className="h-4 w-2/3 bg-gray-100 dark:bg-slate-700 rounded-full"></div>
                </div>
              </div>
              {/* Overlay interactivo */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Background Blur Elements */}
      <div className="fixed top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary-500/10 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
}
