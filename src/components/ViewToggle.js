'use client';

// The view switch in a home section's header (Musings, Playground): two words,
// "List" and "Tile". The one showing is in ink with an underline, the other
// faded. They appear while the pointer is over the section (or focus is inside
// it), and always on touch screens. Which one is on comes from <html
// data-{name}> (set before paint), not from React state, so it is right before
// hydration (.view-toggle in globals.css). It sits above the section's content
// (z-10): the Musings rail reaches up over the header to leave room for card
// shadows and would otherwise take clicks on the lower half of the words.
//   name     the section, as in <html data-{name}="list">
//   options  [{ value, label }], the default view last
export default function ViewToggle({ name, view, onChange, options }) {
  return (
    <div role="group" aria-label={`${name[0].toUpperCase()}${name.slice(1)} view`} data-toggle={name} className="view-toggle relative z-10 -mr-0.5 flex">
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          data-option={value === 'list' ? 'list' : 'default'}
          className="-my-1.5 rounded-sm px-1.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
