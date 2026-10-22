# CLAUDE.md - Tony Sebastian Portfolio Website

## Project Overview

This is a personal portfolio website for Tony Sebastian, a visual product designer. Built with Next.js 14, it showcases projects, experience, musings, and personal information through a modern, interactive interface.

## Technology Stack

### Core Framework
- **Next.js 14.2.18** - React framework with App Router
- **React 18** - UI library
- **JavaScript** - Primary language (no TypeScript)

### Styling & UI
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Tailwind CSS Animate** - Animation utilities
- **CSS Variables** - Custom design system colors and spacing
- **Progressive Blur** - Custom blur effects
- **Geist Font** - Sans-serif typography
- **Instrument Serif** - Serif typography for headings

### UI Components & Libraries
- **@headlessui/react** - Unstyled accessible components
- **@radix-ui/react-slot** - Component composition utilities
- **Lucide React** - Icon library
- **React Feather** - Additional icons
- **Class Variance Authority** - Component variant management
- **clsx & tailwind-merge** - Conditional class utilities

### Interactions & Animations
- **Motion (Framer Motion v12)** - Animation library
- **Progressive Blur** - Custom blur effects for navigation
- **React Plock** - Masonry layout for image grids

### Development Tools
- **ESLint** - Code linting (warnings ignored in builds)
- **Autoprefixer** - CSS vendor prefixing
- **PostCSS** - CSS processing

### Performance & Analytics
- **Next.js Image Optimization** - Built-in image optimization

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.js          # Root layout with fonts and navigation
│   ├── page.js            # Homepage with projects, experience, musings
│   ├── globals.css        # Global styles and CSS variables
│   ├── about/             # About page route
│   ├── craft/             # Craft/design work showcase
│   ├── AI/                # AI-related projects
│   └── musings/           # Blog-style content pages
├── components/            # Reusable UI components
│   ├── DockNavigation.js  # Bottom navigation with blur effect
│   ├── Hero.js            # Hero section with video
│   ├── CaseStudyTemplate.js # Reusable case study page template
│   ├── list/              # List components (ListItem, Title, SubText)
│   ├── ui/                # UI primitives and utilities
│   ├── fancy/             # Advanced interactive components
│   └── unused/            # Archived unused components
├── lib/                   # Utilities and content
│   ├── content.js         # All site content and data
│   └── utils.js           # Utility functions
└── public/                # Static assets
    ├── images/            # Organized by category (AI, Craft, about, etc.)
    ├── icons/             # Company/project icons
    └── hero.gif           # Hero animation
```

## Key Features

### Content Management
- **Centralized Content**: All site content managed in `src/lib/content.js`
- **Structured Data**: Projects, experience, musings, and bio information
- **Dynamic Rendering**: Content rendered dynamically throughout the site

### Navigation & UX
- **Sticky Bottom Navigation**: Modern mobile-first navigation pattern
- **Progressive Blur**: Advanced blur effect behind navigation
- **Active State Management**: Automatic route-based active states
- **Responsive Design**: Mobile-first approach with desktop enhancements

### Performance Optimizations
- **Next.js Image Optimization**: Automatic image optimization and lazy loading
- **React Memoization**: Extensive use of React.memo(), useMemo(), and useCallback() in client components
- **Suspense Boundaries**: Proper Suspense wrapping for useSearchParams() to enable static generation
- **Static Helper Functions**: Helper functions moved outside components to prevent recreation
- **Client-side Mounting**: Prevents hydration issues with proper SSR handling
- **ESLint Bypass**: Build optimization (errors ignored during builds)

## Available Scripts

```bash
# Development
npm run dev          # Start development server on localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint (currently configured to ignore errors in builds)
```

## Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development**:
   ```bash
   npm run dev
   ```

3. **Environment**: 
   - Development server runs on `http://localhost:3000`
   - Hot reload enabled for all file changes

## Content Structure

### Main Sections
- **Projects**: Personal projects and side ventures
- **Experience**: Professional work history with company details
- **Musings**: Blog-style articles and thoughts
- **About**: Personal information and philosophy
- **Now**: Current activities and learning

### Data Organization
All content is exported from `src/lib/content.js`:
- `projects` - Project showcase data
- `experience` - Work experience
- `designAreas` - Additional experience areas
- `musings` - Blog posts/articles
- `bio` - Personal information
- `now` - Current status updates

## Design System

### Typography
- **Geist Sans**: Primary sans-serif font
- **Instrument Serif**: Headings and emphasis

### Color Palette
- Uses Tailwind CSS default color system
- Primary colors: Slate for text and borders
- Accent colors: Green for highlights and active states
- Background colors: Default white with slate hover states

### Component Patterns
- **ListItem**: Consistent item display pattern
- **HighlightLink**: Styled external/internal links
- **Badge**: Status indicators
- **ImageGridWithLightbox**: Gallery components

## Image Management

### Organization
- `public/images/AI/` - AI-related project images
- `public/images/Craft/` - Design craft showcase
- `public/images/about/` - Personal/about section images
- `public/images/musings/` - Blog article images
- `public/images/visuals/` - General visual content
- `public/icons/` - Company and project icons

### Optimization
- Next.js automatic image optimization
- WebP conversion where supported
- Responsive image sizing
- Lazy loading by default

## Deployment

### Cloudflare Pages
- Deployed to Cloudflare Pages (project `tonyzebdesign`); pushes to Git trigger builds and pull requests get preview deployments
- Static export: `output: 'export'` in `next.config.mjs`, so `npm run build` writes the site to `out/`, which is the build output directory
- Images are unoptimized (`images.unoptimized: true`) because there is no Next.js image server on a static host
- Static export rules out server features: API routes, middleware, ISR and on-demand image optimization
- Node.js 22 or newer (see `engines` in `package.json` and `.nvmrc`)
- Vercel is no longer used; Vercel Speed Insights and Analytics were removed

### Build Configuration
- ESLint errors ignored during builds for flexibility
- PostCSS processing for Tailwind CSS
- Next.js optimization features enabled

## SEO & Meta

### Homepage SEO
- Comprehensive meta tags
- Open Graph integration
- Twitter Card support
- Structured data for social sharing

### Performance
- Core Web Vitals optimization
- Progressive loading strategies

## Future Considerations

### Potential Improvements
- Add TypeScript for better type safety
- Implement proper error handling
- Add automated testing
- Consider adding a CMS for content management
- Implement proper loading states
- Add more interactive animations

### Content Management
- Currently all content is hardcoded in `content.js`
- Consider migrating to a headless CMS for easier updates
- Implement dynamic content loading for better performance

## Performance Best Practices

### Component Optimization
- **Server Components by Default**: Most pages are server components for optimal performance
- **Client Components**: Only use 'use client' when needed for interactivity
- **React.memo()**: Applied to frequently re-rendered components (CaseStudyTemplate child components, list items)
- **useMemo()**: Used for expensive calculations and static arrays in client components
- **useCallback()**: Applied to event handlers passed as props
- **Static Data**: Helper functions and data arrays moved outside components

### Build Optimizations
- **Suspense Boundaries**: useSearchParams() wrapped in Suspense for proper static generation
- **Viewport Export**: Separate viewport export (not in metadata) for Next.js 14 compatibility
- **Image Optimization**: All images use Next.js Image component with proper sizing
- **Code Splitting**: Components lazy loaded where appropriate

## Notes for Development

- The project uses JavaScript instead of TypeScript
- ESLint is configured to allow builds with warnings/errors
- All animations use Framer Motion v12 (latest major version)
- Navigation uses client-side routing with Next.js App Router
- Images are manually optimized and organized by content type
- The site follows a mobile-first responsive design approach
- Node.js version: >=22.0.0 (specified in package.json)