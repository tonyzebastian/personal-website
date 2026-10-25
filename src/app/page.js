import ListItem from '@/components/list/ListItem';
import Title from '@/components/list/Title';
import {projects, experience, musings, designAreas, now, experience_small} from '@/lib/content';
import HighlightLink from '@/components/ui/HighlightLink';
import CopyEmailLink from '@/components/ui/CopyEmailLink';
import Hero from '@/components/Hero';

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

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

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section - Sticky Background */}
      <div className="sticky top-0 z-0">
        <Hero/>
      </div>

      {/* Main Content - Overlays hero on scroll */}
      <div className="relative z-10 bg-white min-h-screen rounded-3xl shadow-sm pt-4">

        <div className=" mx-auto w-32 h-1.5 bg-slate-200/75 rounded-full"></div>

        <div className="mx-auto max-w-2xl px-8  pb-16">
          <div className='flex flex-col gap-6 pt-8'>
          {/* Experience Section */}
          <div className="my-6">
            <h2 className="mb-2">Experience</h2>
            <div>
              <div className="space-y-1">
                {experience.map(exp => (
                  <ListItem
                    key={exp.link}
                    image={exp.image}
                    title={exp.name}
                    isExternal={true}
                    primaryText={exp.date}
                    secondaryText={exp.secondaryText}
                    href={exp.link}
                  />
                ))}
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center pt-4 gap-6 transition-all">
                {designAreas.map((area, index) => (
                  <a 
                    key={index} 
                    href={area.link}
                    target={area.isExternal ? "_blank" : "_self"}
                    rel={area.isExternal ? "noopener noreferrer" : ""}
                    className="no-underline"
                  >
                    <Title 
                      title={area.title}
                      image={area.image}
                      isExternal={area.isExternal}
                    />
                  </a>
                ))}
                <span className="font-sans text-slate-500 text-sm md:-ml-2">and more.</span>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="my-6">
            <h2 className="mb-2">Pet Projects</h2>
            <div className="space-y-1">
              {projects.map(project => (
                <ListItem 
                  key={project.link}
                  image={project.image}
                  title={project.name}
                  isExternal={true}
                  primaryText={project.date}
                  secondaryText={project.secondaryText}
                  href={project.link}
                />
              ))}
            </div>
          </div>


          {/* Musings Section */}
          <div className="my-6">
            <h2 className="mb-2">Musings</h2>
            <div className="space-y-1">
              {musings.map(musing => (
                <ListItem
                  key={musing.link}
                  title={musing.name}
                  isExternal={false}
                  primaryText={musing.date}
                  secondaryText={musing.secondaryText}
                  href={musing.link}
                />
              ))}
            </div>
          </div>

          {/* Now Section */}
          <div className="my-6">
            <h2 className="mb-2">Now</h2>
            <div className="space-y-4">
              {now.map((item, index) => (
                <p key={index} className="text-slate-700">
                  {Array.isArray(item.description) ? (
                    item.description.map((part, i) => (
                      typeof part === 'string' ? part : (
                        <HighlightLink key={i} href={part.href}>
                          {part.text}
                        </HighlightLink>
                      )
                    ))
                  ) : (
                    item.description
                  )}
                </p>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-6 mb-8">
            <h2 className="mb-2">Contact</h2>
            <div className="text-slate-700 font-sans text-sm">
            Reach me on <HighlightLink href='https://x.com/tonyzeb_design'> twitter </HighlightLink> or{' '}
            <CopyEmailLink />
            </div>
          </div>

          </div>
        </div>
      </div>
    </div>
  );
}