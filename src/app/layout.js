import { Figtree } from 'next/font/google';
import localFont from 'next/font/local';
import { INTRO_SCRIPT } from '@/lib/intro';
import { MUSINGS_VIEW_SCRIPT } from '@/lib/musings-view';
import "./globals.css";

// Defaults for every page. Pages set their own title, description and
// canonical; link-preview images come from opengraph-image.png and
// twitter-image.png in src/app/(site)/.
export const metadata = {
  metadataBase: new URL('https://www.tonyzeb.com'),
  authors: [{ name: 'Tony Sebastian', url: 'https://www.tonyzeb.com' }],
  appleWebApp: { capable: true, title: 'Tony Sebastian', statusBarStyle: 'black-translucent' },
  twitter: { card: 'summary_large_image', site: '@tonyzebastian', creator: '@tonyzebastian' },
};

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
  ],
  variable: '--font-caslon',
  display: 'swap',
  // Match the fallback to a serif, so headings barely shift when it loads.
  fallback: ['Georgia', 'serif'],
  adjustFontFallback: 'Times New Roman',
});

export default function RootLayout({ children }) {
  return (
      // The intro and musings-view scripts mark <html> before React starts.
      <html lang="en" className={`${figtree.variable} ${caslon.variable}`} suppressHydrationWarning>
          <head>
              <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT + MUSINGS_VIEW_SCRIPT }} />
          </head>
          <body className="flex flex-col min-h-screen">
              <main className="grow">
                  {children}
              </main>
          </body>
      </html>
  );
}
