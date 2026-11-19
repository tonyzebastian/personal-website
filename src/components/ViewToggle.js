'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// The view switch in a home section's header (Musings, Playground): two bare
// icons, the one showing in ink on a light fill, the other faded. They appear
// while the pointer is over the section (or focus is inside it), and always on
// touch screens. Which one is on comes from <html data-{name}> (set before
// paint), not from React state, so it is right before hydration
// (.view-toggle in globals.css). Each names itself in a tooltip.
//   name     the section, as in <html data-{name}="list">
//   options  [{ value, label, Icon }], the default view last
export default function ViewToggle({ name, view, onChange, options }) {
  const button =
    'grid size-7 place-items-center rounded-md outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring';
  return (
    <TooltipProvider>
      <div role="group" aria-label={`${name[0].toUpperCase()}${name.slice(1)} view`} data-toggle={name} className="view-toggle -mr-1.5 flex">
        {options.map(({ value, label, Icon }) => (
          <Tooltip key={value}>
            {/* closeOnClick off: Base UI closes a tooltip on click and keeps
                it shut until the pointer leaves, so after switching views the
                icons looked dead to hover. */}
            <TooltipTrigger
              closeOnClick={false}
              render={
                <button
                  type="button"
                  aria-label={label}
                  aria-pressed={view === value}
                  onClick={() => onChange(value)}
                  data-option={value === 'list' ? 'list' : 'default'}
                  className={button}
                />
              }
            >
              <Icon size={16} weight="bold" aria-hidden />
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
