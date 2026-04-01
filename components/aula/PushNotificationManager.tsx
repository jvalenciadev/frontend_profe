"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BookOpen, Trophy, Flame, AlertTriangle, Clock, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { aulaService } from "@/services/aulaService";

// Dynamic import for Firebase so it safely runs on client
const loadFirebase = async () => {
  const { requestForToken, onMessageListener } = await import(
    "@/lib/firebase"
  );
  return { requestForToken, onMessageListener };
};

export default function PushNotificationManager() {
  const [isTokenFound, setTokenFound] = useState(false);
  const [fcmToken, setFcmToken] = useState("");

  useEffect(() => {
    let mounted = true;

    // Solo se ejecuta en el cliente (Browser)
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      loadFirebase()
        .then(({ requestForToken, onMessageListener }) => {
          // Request token right away when component mounts
          requestForToken().then((token) => {
            if (mounted && token) {
              setTokenFound(true);
              setFcmToken(token);
              // Enviar token al backend para guardarlo en la tabla 'token_dispositivo'
              aulaService.saveTokenDispositivo(token)
                .then(() => console.log("[FCM] Token registrado en el servidor"))
                .catch(err => console.error("[FCM] Error registrando token", err));
            }
          });

          // Escuchar notificaciones foreground (CANAL CONTINUO)
          const unsubscribe = onMessageListener((payload: any) => {
            if (mounted && payload) {
              const title = payload.notification?.title || 'Nueva Notificación';
              const body = payload.notification?.body || '';
              const link = payload.data?.linkRef || '/aula';
              const tipo = payload.data?.tipo || 'INFO';

              // Diseño Ultra-Premium: Glassmorphism Floating Card
              toast.custom((t) => {
                const config = {
                  URGENTE: { icon: Flame, color: '#ef4444' },
                  ALERTA: { icon: AlertTriangle, color: '#f97316' },
                  RECORDATORIO: { icon: Clock, color: '#facc15' },
                  NUEVA_ACTIVIDAD: { icon: BookOpen, color: '#3b82f6' },
                  ACTIVIDAD_CALIFICADA: { icon: Trophy, color: '#10b981' },
                  INFO: { icon: Bell, color: '#6366f1' }
                };

                const s = config[tipo as keyof typeof config] || config.INFO;
                const Icon = s.icon;

                return (
                  <div
                    onClick={() => {
                      toast.dismiss(t);
                      window.location.href = link;
                    }}
                    className="group flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] p-4 min-w-[300px] max-w-[360px] cursor-pointer hover:scale-[1.02] transition-all duration-300 pointer-events-auto"
                  >
                    {/* ... (mismo diseño interior que ya tenemos) */}
                    <div className="flex items-start gap-4">
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: `${s.color}15`, color: s.color }}
                      >
                        <Icon className="h-6 w-6 stroke-[2.5px]" />
                      </div>
                      <div className="flex-1 flex flex-col pt-0.5">
                        <header className="flex items-center justify-between">
                          <span
                            className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5"
                            style={{ color: s.color }}
                          >
                            {tipo.replace('_', ' ')}
                          </span>
                          <ArrowUpRight className="h-4 w-4 text-slate-300 dark:text-slate-600 transition-colors group-hover:text-primary" />
                        </header>
                        <h4 className="text-[13px] font-black text-slate-900 dark:text-white leading-tight">
                          {title}
                        </h4>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                          {body}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }, { duration: 7000, position: 'top-right' });
            }
          });

          // Limpiar al desmontar
          return () => {
            if (unsubscribe) unsubscribe();
          };
        })
        .catch((err) => console.log("Firebase module fail", err));
    }

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
