import type { Metadata } from 'next';
import {
  Inter,
  Outfit,
  Poppins,
  Roboto,
  Montserrat,
  Public_Sans,
  Work_Sans,
  Space_Grotesk,
  Manrope,
  Syne,
  Kanit,
  JetBrains_Mono,
  Fraunces,
  Raleway,
  Urbanist
} from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const poppins = Poppins({ weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], subsets: ['latin'], variable: '--font-poppins', display: 'swap' });
const roboto = Roboto({ weight: ['100', '300', '400', '500', '700', '900'], subsets: ['latin'], variable: '--font-roboto', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', display: 'swap' });
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans', display: 'swap' });
const workSans = Work_Sans({ subsets: ['latin'], variable: '--font-work-sans', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' });
const kanit = Kanit({ weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], subsets: ['latin'], variable: '--font-kanit', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap' });
const urbanist = Urbanist({ subsets: ['latin'], variable: '--font-urbanist', display: 'swap' });

export const metadata: Metadata = {
  title: 'PROFE - Sistema Nacional de Gestión Educativa',
  description: 'Arquitectura premium para la gestión de programas de formación especializada.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVariables = [
    inter.variable,
    outfit.variable,
    poppins.variable,
    roboto.variable,
    montserrat.variable,
    publicSans.variable,
    workSans.variable,
    spaceGrotesk.variable,
    manrope.variable,
    syne.variable,
    kanit.variable,
    jetbrains.variable,
    fraunces.variable,
    raleway.variable,
    urbanist.variable
  ].join(' ');

  return (
    <html lang="es" className={fontVariables} suppressHydrationWarning={true}>
      <body className="antialiased" suppressHydrationWarning={true}>
        <ThemeProvider>
          <AuthProvider>
            <Toaster position="top-right" richColors closeButton />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
