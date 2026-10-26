import { Figtree } from 'next/font/google';
import localFont from 'next/font/local';
import "./globals.css";

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

// Body text. Variable font, so every weight comes from one file.
const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

// Headings. Self-hosted because next/font/google does not list it yet
// (SIL Open Font License, see src/fonts/OFL-LibreCaslonCondensed.txt).
const caslon = localFont({
  src: [
    { path: '../fonts/LibreCaslonCondensed-Variable.woff2', weight: '400 700', style: 'normal' },
    { path: '../fonts/LibreCaslonCondensed-Italic-Variable.woff2', weight: '400 700', style: 'italic' },
  ],
  variable: '--font-caslon',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
      <html lang="en" className={`${figtree.variable} ${caslon.variable}`}>
          <body className="flex flex-col min-h-screen">
              <main className="grow">
                  {children}
              </main>
          </body>
      </html>
  );
}
