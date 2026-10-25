// The frame for every page shown in the panel: a header (optional logo,
// title, details line and actions) and the body below it.
export default function PanelPage({ icon, title, meta = [], actions, children }) {
  const details = meta.filter(Boolean);

  return (
    <article className="@container mx-auto w-full max-w-2xl px-6 pb-20 md:px-10">
      <header className="mb-10 flex flex-col items-start gap-3">
        {icon && (
          <img
            src={icon}
            alt=""
            width={40}
            height={40}
            className="size-10 object-contain drop-shadow-md"
          />
        )}
        <h1>{title}</h1>
        {details.length > 0 && (
          <p className="flex flex-wrap gap-x-3 text-ink/55 tabular-nums">
            {details.map((text) => (
              <span key={text}>{text}</span>
            ))}
          </p>
        )}
        {actions && <div className="mt-1 flex flex-wrap gap-2">{actions}</div>}
      </header>
      <div className="flex flex-col gap-6">{children}</div>
    </article>
  );
}
