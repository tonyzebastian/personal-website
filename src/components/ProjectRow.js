import { PanelLink } from '@/components/panel/ActivePath';

// A home "Side projects" row: the project's logo as a 48px tile on the left,
// its name with a short line about it below, at every width. Opens its page
// in the panel like `Row`, and stays highlighted while that page is open.
export default function ProjectRow({ href, logo, title, summary }) {
  return (
    <PanelLink
      href={href}
      className="group -mx-3 flex items-center gap-4 rounded-md px-3 py-2.5 text-base outline-none transition-[background-color,box-shadow] hover:bg-body/[0.03] focus-visible:bg-body/[0.05] focus-visible:ring-2 focus-visible:ring-ring data-active:bg-paper data-active:shadow-[0_0_0_1px_var(--color-green-700),0_1px_3px_rgb(0_0_0/0.04)]"
    >
      <img
        src={logo}
        alt=""
        width={48}
        height={48}
        loading="lazy"
        decoding="async"
        className="size-12 shrink-0 rounded-md shadow-[0_0_0_1px_rgb(0_0_0/0.06)]"
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium text-ink">{title}</span>
        <span className="text-body/70">{summary}</span>
      </span>
    </PanelLink>
  );
}
