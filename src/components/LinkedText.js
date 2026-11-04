import HighlightLink from '@/components/ui/HighlightLink';

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Plain text with some of its words turned into green highlight links, for
// copy kept as strings in data files.
//   text    the copy
//   links   { phrase: url }: each phrase in the text becomes a link
export default function LinkedText({ text, links }) {
  const phrases = Object.keys(links ?? {});
  if (!text || phrases.length === 0) return text ?? null;
  const pattern = new RegExp(`(${phrases.map(escape).join('|')})`);
  return text.split(pattern).map((part, index) =>
    links[part] ? (
      <HighlightLink key={index} href={links[part]}>
        {part}
      </HighlightLink>
    ) : (
      part
    ),
  );
}
