import './globals.css';
import type { Metadata } from 'next';
import { Inter, Bebas_Neue, Barlow, Libre_Barcode_39_Text } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/lib/auth/auth-context';

/**
 * Font Configuration for Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 1.2 - Configure Google Fonts with Next.js Font Optimization
 *
 * All fonts use display: 'swap' to prevent FOUT and latin subset for performance.
 * CSS variables enable usage throughout the application.
 */

// Existing font - kept for backward compatibility during transition
const inter = Inter({ subsets: ['latin'] });

// Industrial Design System Fonts
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bebas-neue',
});

const barlow = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-barlow',
});

const libreBarcode = Libre_Barcode_39_Text({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-libre-barcode',
});

export const metadata: Metadata = {
  title:
    'Construction Recruiter Directory | Find Specialized Staffing Agencies',
  description:
    'Connect with top construction staffing agencies specializing in trades, industrial work, and specialized labor. Find the right recruiting partner for your next project.',
  keywords:
    'construction recruiting, staffing agencies, trade workers, industrial staffing, construction jobs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${bebasNeue.variable} ${barlow.variable} ${libreBarcode.variable}`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
