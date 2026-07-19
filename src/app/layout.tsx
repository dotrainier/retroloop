import type { Metadata } from 'next';
import { Fraunces, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' });

export const metadata: Metadata = {
  title: 'RetroLoop',
  description: 'Real-time collaborative retro & brainstorm board',
};

// Runs before paint: applies saved theme, or falls back to the system setting.
const themeScript = `
  (function () {
    try {
      var saved = localStorage.getItem('retroloop-theme');
      var system = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && system)) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={`${fraunces.variable} ${bricolage.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
