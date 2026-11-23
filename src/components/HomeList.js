// The home page content. It lives in the (site) layout so it stays on screen
// while a panel is open beside it.
import Hero from '@/components/Hero';
import CopyEmail from '@/components/CopyEmail';
import HiddenGallery from '@/components/HiddenGallery';
import Musings from '@/components/Musings';
import Playground from '@/components/Playground';
import IntroFlow from '@/components/IntroFlow';
import { bio, musings } from '@/lib/content';
import { playground } from '@/lib/playground';

// The reading column: 512px, centred, with the page gutters.
function Column({ className = '', children, ...props }) {
  return (
    <div {...props} className={`px-6 md:px-8 ${className}`}>
      <div data-reading-column className="mx-auto w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}

const FOOTER_LINK =
  'rounded-sm text-body/80 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ring';

const FOOTER_LINKS = [
  { label: 'X', href: bio.social.x },
  { label: 'LinkedIn', href: bio.social.linkedin },
  { label: 'GitHub', href: bio.social.github },
];

export default function HomeList() {
  return (
    <div className="relative">
      {/* Photos that bloom out from a press and hold beside the content. */}
      <HiddenGallery />
      {/* Each direct child of IntroFlow is one section of the page, and appears
          in turn on the first load. Add new sections here. */}
      <IntroFlow className="home-flow relative z-10 flex flex-col gap-16 pt-16 pb-24 lg:pt-24 lg:pb-20">
        <Column className="intro-hero">
          <Hero />
        </Column>

        <Column>
          <Musings items={musings} />
        </Column>

        <Column>
          <Playground
            items={playground.map((item) => ({
              href: item.type === 'link' ? item.href : `/playground/${item.slug}`,
              external: item.type === 'link',
              title: item.title,
              kind: item.kind,
              size: item.size,
              cover: item.cover,
            }))}
          />
        </Column>

        {/* Footer, after shahimim.com: plain links in a row. "Email" copies
            the address. */}
        <Column>
          <footer>
            <ul className="flex flex-wrap gap-x-8 gap-y-2">
              <li>
                <CopyEmail email={bio.email} className={FOOTER_LINK} />
              </li>
              {FOOTER_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={FOOTER_LINK}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </footer>
        </Column>
      </IntroFlow>
    </div>
  );
}
