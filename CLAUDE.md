# CLAUDE.md - Tony Sebastian Portfolio Website

## Project overview

Personal portfolio of Tony Sebastian, a visual product designer. One home page lists experience and musings, then the Playground grid; every internal link opens its page in a side panel next to that list (a sheet on smaller screens). The address bar stays on `/` while a panel is open, so a refresh always lands on home.

## Technology stack

- **Next.js 15** (App Router) with **React 19**, JavaScript (no TypeScript)
- **Tailwind CSS v4**: CSS-first config in `src/app/globals.css` (`@theme`), PostCSS via `@tailwindcss/postcss`, animations from `tw-animate-css`
- **shadcn/ui on Base UI** (`@base-ui/react`): components live in `src/components/ui/`. Compose with `render={<el />}`, not `asChild`. To style a link like a button, use `buttonVariants()` on the link itself (rendering a link through `Button` gives it a button role)
- **Phosphor icons** (`@phosphor-icons/react`): the only icon set. Import from `@phosphor-icons/react/ssr` in server components. Use `weight="bold"` for UI icons
- **Motion** (`motion/react`): panel animations, loaded through `LazyMotion` with `m.` components; features load on demand from `src/lib/motion-features.js`
- **Fonts**: Figtree (body, `next/font/google`) and Libre Caslon Condensed (headings, self-hosted in `src/fonts/` via `next/font/local`, SIL OFL)
- **react-plock**: masonry layout for the about galleries

## Design system

Tokens are defined in `src/app/globals.css`. Type scale follows rachelchen.tech; text colours and the paper texture follow flowjam.com. Light mode only.

- **Ink**: `#160216`, a plum-tinted near-black for headings and titles (`text-ink`). Body copy is `--body` `#363636` (`text-body`); faded text, hover fills and lines are built from it so greys stay neutral: `text-body/80`, `text-body/70` (the lightest that passes AA for text, 4.7:1), and `text-body/40`, `text-body/25` only for decoration (pipes, list markers, icons)
- **Highlight**: the green link style, `bg-highlight` / `bg-highlight-strong` (`HighlightLink`, or the Button `highlight` variant)
- **Type**: body 15px with 1.5 line height; serif headings h1 2rem (2.25rem from 1200px), h2 1.25rem, h3 1.125rem, all -0.02em letter spacing. Base element styles sit in `@layer base`, so utility classes override them
- **Canvas**: the page colour is a warm stone, `--canvas` (#fcfaf8), from the `.surface-canvas` class on the site shell and the list column. Panels stay white (`--paper`). A paper texture (fine grain plus soft fibre, SVG noise tuned to flowjam.com) sits over the whole screen on `html::before`/`::after`, fixed and click-through. The hero video uses `mix-blend-multiply` so its white backdrop takes on the canvas. `/experience` keeps its own fading band (`NoiseBand`, `public/noise.png`)
- **shadcn tokens** (`--background`, `--primary`, `--border`, ...) are mapped onto ink and paper

## How pages and the panel work

```
src/app/
├── layout.js              # Root: fonts, viewport, globals
├── (site)/                # Everything that shares the home list
│   ├── layout.js          # SiteShell: home list + panel for the current route
│   ├── page.js            # "/": metadata only, renders nothing (no panel)
│   ├── [company]/page.js  # /sundial, /postman, /hypersonix, /avrl, /infosys
│   ├── about/             # About me panel
│   └── musings/*          # One folder per musing
├── experience/            # Standalone timeline page (unlisted, noindex)
├── project/*              # Postman sub case studies, full pages
├── film/                  # Standalone film site (own font)
└── craft/                 # Old craft page (to be replaced)
```

- `src/components/panel/SiteShell.js` draws the home list and, for any route other than `/`, a panel. From 1024px wide the panel opens beside the list and pushes it aside; below that `PanelSheet.js` shows it as a bottom sheet (Base UI Dialog, drag to close, loaded only on small screens)
- Panel pages still open through the router, but `SiteShell` sets the address bar back to `/` as each one opens (`history.replaceState`, which Next follows while keeping the page's route tree). The open page is read from `useSelectedLayoutSegments()`, not `usePathname()`, which says `/`. Back and Forward still close and reopen the panel
- Arriving straight on a page (typed link, new tab, the panel's expand button) shows it full width on its own, keeping its URL, under a breadcrumb in the top left ("Tony Sebastian › page", shadcn `breadcrumb` in `src/components/ui/`, titles from `pageTitles` in the `(site)` layout). Pages that `fill` (`fillPaths`: the drawing wall, Flock, Mosaic, Fish) take the whole screen below it with their heading hidden; both the side panel and that view carry `data-fills`, and fill styles use Tailwind `in-data-fills:`. `PanelPage` also takes `heading={false}` to hide a page's title and description anywhere; once the visitor reaches `/`, the list and panel take over for the rest of the visit (`fullPage` in `SiteShell.js`)
- The panel is one layer over home: switching panels replaces the history entry, and closing steps back when the panel was opened from home, so Back always returns home
- Split, breakpoint and spring live in `src/components/panel/config.js`
- `FrozenRouter.js` keeps the outgoing page rendered while a panel closes or swaps. It relies on a Next.js internal (`LayoutRouterContext`), which is why `next` is pinned to 15.5.x; recheck it before upgrading
- New panel page: add a route under `src/app/(site)/`, wrap its content in `PanelPage` (logo and title on one line, details line split by pipes, with an optional `href` shown at its end as a "Website" link), and link to it from a `Row`. Internal `Row` links use `scroll={false}` so the list does not jump

## Content

All copy lives in `src/lib/content.js`:

- `experience`: rows and the `[company]` pages (`role`, `period`, `description` for metadata, `overview` paragraphs for the page, where an object like `{ youtube, title }` embeds a video, optional `related` links). Hypersonix folds its case studies behind "More about my work here" (`Expandable`); Postman's live on the full-width `/postman/work` page (listed in `FULL_PAGE_PATHS` in the `(site)` layout). Entries with `timeline: false` are left off `/experience`. The overview copy is drafted in the wiki (`areas/career/overview/website-experience-drafts.md`)
- `musings`: home list of articles (the article itself is its own route)
- Playground entries live in `src/lib/playground.js`, not here: groups (`gallery-pieces`, `light-and-shadow`, `pocket-worlds`) list live pieces one below the other, singles show one piece, `clips` (In Motion, the Animation section moved here from About) lists short videos, `note` is a plain text page (Dalal Prints, for now) and `link` is an outside project whose card opens its site in a new tab (UX Nudges; no page here, see `playgroundPages`). The rest open `/playground/<slug>` in the panel. The old Pet Projects section is gone: UX Nudges and Dalal Prints became Playground cards
- `bio`, `aboutBio`, `aboutFunThings`, `aboutPrinciples`, `now`, `junymade`, `photography`, `aboutConversation`

Case study data for Postman and Hypersonix is in `src/lib/case-studies/` and rendered by `src/components/CaseStudy.js`. The three Postman sub case studies under `src/app/project/` still use `CaseStudyTemplate.js`.

## Key components

- `Row`: every home list row (icon, title, details). External links get an ↗ on hover; internal ones have no arrow. On links, the dates (every detail but the last) fade in on hover with a pipe before the role. Stacks when its column is narrow, using container queries (`@lg:`) rather than the window width
- `CoverGrid`: the Playground grid, after officecommun.com. Follows the list column's width: two fluid columns below 792px, then three and four 232px columns, balanced so the last row isn't nearly empty. While a panel is open it holds two fluid columns (`data-panel-open` on the list column, set by `SiteShell` as the panel starts opening and cleared once it has closed), so the slide changes the layout once. Covers fade up as they scroll in (`RevealGroup`, `.cover-reveal` in globals.css) and the image eases to 103% on hover
- Playground pieces (`src/components/playground/`): code copied from the playground repo (`../playground`) and adapted to fill a box. `pieces/index.js` maps each piece id to a lazily loaded component; `Stage` mounts a piece only while it is near the screen; `GroupItem` shows it live in the panel with a line below: its name, then "| hint" (the short `hint` from `playground.js`, fainter, cut short on narrow pages) and outline buttons on the right; the hint and buttons show on hover or focus (always on touch). Replay (pieces marked `replay` in the registry; it remounts the piece) and Expand, which opens it in a lightbox (Base UI Dialog) with its description, where pieces with DialKit controls show them (`Controls`). Playground pages use `PanelPage` with `wide` (body up to `max-w-5xl`), `description` in place of the details line, and `compact`: in the side panel their heading is hidden (kept for screen readers) and the title shows in the panel's top row beside expand and close (`panelTitles` from the `(site)` layout to `PanelHeader`); the sheet and full-page view still show the heading Pieces built at a fixed size use `Fit` to scale down. WebGL pieces call `releaseContext` (`src/lib/webgl.js`) in their cleanup so contexts are freed once their canvas leaves the page. Single-piece pages are `bare` (no line below; the panel header names them); clips have a name and hint but no actions. Assets are in `public/playground/` (WebP, converted with sharp)
- 365 Days of Drawing (`pieces/drawings/DrawingWall.js`): an endless drag wall after thiings.co, laid out like the About galleries (react-plock masonry: 160px columns, each drawing at its own proportions, 12px gaps), with every column an endless stack so it packs without seams. One layer moved with a translate, only the drawings near the screen rendered, momentum with friction (5% a 60fps frame, release speed capped). Images are WebP built by `node scripts/import-drawings.mjs <folder of originals>` into `public/playground/drawings/thumbs` (360px) and `large` (1600px), listed in `src/lib/drawings.json`. The 1.7 GB originals are kept outside the repo, never in `public/`
- Never run a second `next dev` in this folder while one is running: they share `.next` and break each other
- `ShowMore`: folds extra rows (musings after 3; experience lists every job) behind a small centred button: "•••" when closed, an up caret when open (text labels for screen readers only). Rows fade in with a stagger (`.reveal-rows` in globals.css); curve token `ease-snappy`
- `Contact`: "Start a conversation" with X, LinkedIn and GitHub buttons, at the bottom of the About page
- `YouTubeEmbed`: a YouTube video that shows only its thumbnail until played, then loads the privacy-enhanced player
- `Expandable`: a button that unfolds a server-rendered section below it
- `AutoVideo`: muted looping video that plays only while on screen and loads only metadata until then. Use it for any inline clip
- `MediaGrid`: media side by side in a row

## Performance

- Static export (`output: 'export'`), so there is no image server: images are served as they are in `public/`. Convert them to WebP and size them before adding
- Keep pages as server components; client code is limited to the panel shell, `ShowMore`, `RevealGroup`, `AutoVideo` and the galleries
- Lazy-load anything below the fold (`loading="lazy"` on images and iframes); the hero image uses `fetchPriority="high"`
- Do not autoplay video with a plain `<video autoPlay>`; use `AutoVideo`

## Deployment

- Cloudflare Pages (project `tonyzebdesign`); pushes build automatically and pull requests get preview deployments
- `npm run build` writes the static site to `out/`
- `public/_redirects` holds redirects for moved URLs (Cloudflare format); keep `public/sitemap.xml` in step with the routes
- Static export rules out API routes, middleware, ISR and on-demand image optimisation
- Node.js 22 or newer (`engines` in `package.json` and `.nvmrc`)

## Scripts

```bash
npm run dev     # Development server on localhost:3000
npm run build   # Production build to out/
npm run lint    # ESLint (errors do not block builds)
```

Running `npm run build` while the dev server is running overwrites its `.next` cache; restart the dev server afterwards.
