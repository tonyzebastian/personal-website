import { GithubLogo, LinkedinLogo, XLogo } from '@phosphor-icons/react/ssr';
import { aboutConversation, bio } from '@/lib/content';
import { buttonVariants } from '@/components/ui/button';
import HighlightLink from '@/components/ui/HighlightLink';

const LINKS = [
  { label: 'X', href: bio.social.x, Icon: XLogo },
  { label: 'LinkedIn', href: bio.social.linkedin, Icon: LinkedinLogo },
  { label: 'GitHub', href: bio.social.github, Icon: GithubLogo },
];

// "Start a conversation" at the bottom of the home page.
export default function Contact() {
  return (
    <section aria-labelledby="contact" className="flex flex-col gap-3">
      <h2 id="contact">Start a conversation</h2>
      <p>{aboutConversation.intro}</p>
      <ul className="list-disc space-y-1 pl-5 marker:text-ink/40">
        {aboutConversation.topics.map((topic) =>
          typeof topic === 'string' ? (
            <li key={topic}>{topic}</li>
          ) : (
            <li key={topic.text}>
              Just say <HighlightLink href={`mailto:${topic.email}`}>&ldquo;Hi&rdquo;!</HighlightLink>
            </li>
          )
        )}
      </ul>
      <div className="mt-2 flex flex-wrap gap-2">
        {LINKS.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline' })}
          >
            <Icon weight="bold" aria-hidden />
            {label}
          </a>
        ))}
      </div>
    </section>
  );
}
