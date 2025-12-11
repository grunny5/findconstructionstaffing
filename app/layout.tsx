import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
