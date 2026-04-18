import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';
import { Fira_Sans, Fira_Code } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import './globals.css';

const firaSans = Fira_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-fira-sans',
});

const firaCode = Fira_Code({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-fira-code',
});

export const metadata: Metadata = {
  title: 'Gasolineras',
  description: 'Precios de combustible en tiempo real en España',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${firaSans.variable} ${firaCode.variable} h-full`}>
      <body className="h-full antialiased overflow-hidden">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
