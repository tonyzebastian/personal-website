export const metadata = {
  title: 'Tony Sebastian ✦ designer',
  description: 'A visual product designer | Love to code | always tinkering with a side project',
  keywords: 'design, art, cinematography, photography, travel',
  author: 'Tony Sebastian',
  robots: 'index,follow',
  'mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-title': 'Tony Sebastian',
  'apple-mobile-web-app-status-bar-style': 'black-translucent',
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://tonyzeb.design',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tonyzebastian',
    creator: '@tonyzebastian',
    title: 'Tony Sebastian ✦ designer',
    description: 'A visual product designer | Love to code | always tinkering with a side project',
    image: 'https://tonyzeb.design/preview.png',
    imageAlt: 'Tony Sebastian - Visual Product Designer',
  },
  openGraph: {
    title: 'Tony Sebastian ✦ designer',
    description: 'A visual product designer | Love to code | always tinkering with a side project',
    url: 'https://tonyzeb.design/',
    siteName: 'Tony Sebastian',
    images: [{
      url: 'https://tonyzeb.design/preview.png',
      alt: 'Tony Sebastian - Visual Product Designer',
      width: 1200,
      height: 630,
    }],
    locale: 'en_US',
    type: 'website',
  },

};

// The home list is drawn by the (site) layout; the home route itself has no
// panel, so it renders nothing.
export default function HomePage() {
  return null;
}
