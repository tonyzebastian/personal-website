# CLAUDE.md - Tony Sebastian Portfolio Website

## Project overview

Personal portfolio of Tony Sebastian, a visual product designer. One home page lists experience, pet projects and musings; every internal link opens its page in a side panel next to that list (a sheet on smaller screens). The URL always matches what is on screen.

## Technology stack

- **Next.js 15** (App Router) with **React 19**, JavaScript (no TypeScript)
- **Tailwind CSS v4**: CSS-first config in `src/app/globals.css` (`@theme`), PostCSS via `@tailwindcss/postcss`, animations from `tw-animate-css`
- **shadcn/ui on Base UI** (`@base-ui/react`): components live in `src/components/ui/`. Compose with `render={<el />}`, not `asChild`. To style a link like a button, use `buttonVariants()` on the link itself (rendering a link through `Button` gives it a button role)
- **Phosphor icons** (`@phosphor-icons/react`): the only icon set. Import from `@phosphor-icons/react/ssr` in server components. Use `weight="bold"` for UI icons
- **Motion** (`motion/react`): panel animations, loaded through `LazyMotion` with `m.` components; features load on demand from `src/lib/motion-features.js`
- **Fonts**: Figtree (body, `next/font/google`) and Libre Caslon Condensed (headings, self-hosted in `src/fonts/` via `next/font/local`, SIL OFL)
- **react-plock**: masonry layout for the about galleries

## Design system

Tokens are defined in `src/app/globals.css`. Type scale and ink colours follow rachelchen.tech. Light mode only.

- **Ink**: one text colour, `#32404f`. Hierarchy comes from opacity: `text-ink`, `text-ink/80`, `text-ink/55`, `text-ink/40`, `text-ink/25`
- **Highlight**: the green link style, `bg-highlight` / `bg-highlight-strong` (`HighlightLink`, or the Button `highlight` variant)
- **Type**: body 15px with 1.5 line height; serif headings h1 2rem (2.25rem from 1200px), h2 1.25rem, h3 1.125rem, all -0.02em letter spacing. Base element styles sit in `@layer base`, so utility classes override them
- **Canvas**: the page colour is a warm stone, `--canvas` (#fcfaf8, a lighter take on buffmotion.com's #f2ece7), with a fine warm SVG grain; both come from the `.surface-canvas` class on the site shell and the list column. Panels stay white (`--paper`). The hero video uses `mix-blend-multiply` so its white backdrop takes on the canvas. `/experience` keeps its own fading band (`NoiseBand`, `public/noise.png`)
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

- `src/components/panel/SiteShell.js` draws the home list and, for any route other than `/`, a panel. From 1280px wide the panel opens beside the list and pushes it aside; below that `PanelSheet.js` shows it as a bottom sheet (Base UI Dialog, drag to close, loaded only on small screens)
- Split, breakpoint and spring live in `src/components/panel/config.js`
- `FrozenRouter.js` keeps the outgoing page rendered while a panel closes or swaps. It relies on a Next.js internal (`LayoutRouterContext`); recheck it after Next upgrades
- New panel page: add a route under `src/app/(site)/`, wrap its content in `PanelPage` (title, details line, actions), and link to it from a `Row`. Internal `Row` links use `scroll={false}` so the list does not jump

## Content

All copy lives in `src/lib/content.js`:

- `experience`: rows and the `[company]` pages (`role`, `period`, `description`, optional `related` links). Entries with `timeline: false` are left off `/experience`
- `projects`: pet projects (external links, or `link: null` for a plain row)
- `musings`: home list of articles (the article itself is its own route)
- `bio`, `aboutBio`, `aboutFunThings`, `aboutPrinciples`, `now`, `animation`, `junymade`, `photography`, `aboutConversation`

Case study data for Postman and Hypersonix is in `src/lib/case-studies/` and rendered by `src/components/CaseStudy.js`. The three Postman sub case studies under `src/app/project/` still use `CaseStudyTemplate.js`.

## Key components

- `Row`: every home list row (icon, title, hover arrow, details). Stacks when its column is narrow, using container queries (`@lg:`) rather than the window width
- `ShowMore`: folds extra rows behind "View more" (Base UI Collapsible)
- `Contact`: "Start a conversation" with X, LinkedIn and GitHub buttons
- `AutoVideo`: muted looping video that plays only while on screen and loads only metadata until then. Use it for any inline clip
- `MediaGrid`: media side by side in a row

## Performance

- Static export (`output: 'export'`), so there is no image server: images are served as they are in `public/`. Convert them to WebP and size them before adding
- Keep pages as server components; client code is limited to the panel shell, `ShowMore`, `AutoVideo` and the galleries
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
