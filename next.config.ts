import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // reactStrictMode: false evita el doble render en dev que exacerba los errores de hidratación
  reactStrictMode: false,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignorar atributos desconocidos inyectados por extensiones del navegador
  // (como bis_skin_checked de Bitdefender/AVG/etc.)
  compiler: {
    // Elimina console.error en producción para evitar que el warning se muestre
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
};

export default nextConfig;
