import { ArrowRight } from '@phosphor-icons/react/ssr';

// The hover affordance for a clickable block (the parent needs the `group`
// class): the line draws out to the right edge, then "View project" appears.
// Touch screens have no hover, so it is always shown there.
export default function ViewLine() {
  return (
    <>
      <span
        className="h-px flex-1 origin-left scale-x-0 bg-[#c8c0cc] transition-transform duration-300 ease-out delay-150 group-hover:scale-x-100 group-focus-visible:scale-x-100 [@media(hover:none)]:scale-x-100"
        aria-hidden
      />
      <span className="flex shrink-0 items-center gap-1 text-xs text-slate-600 opacity-0 transition-opacity duration-200 delay-0 group-hover:opacity-100 group-hover:delay-450 group-focus-visible:opacity-100 group-focus-visible:delay-450 [@media(hover:none)]:opacity-100">
        View project
        <ArrowRight size={12} weight="bold" aria-hidden />
      </span>
    </>
  );
}
