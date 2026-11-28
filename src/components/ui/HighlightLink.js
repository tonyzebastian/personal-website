// Your green highlight link, for links inside running text.
export default function HighlightLink({ href, children, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-sm bg-highlight px-1 text-highlight-ink transition-colors hover:bg-highlight-strong"
    >
      {children}
    </a>
  );
}
