# In Orbit — Product brief

Updated November 13, 2026. This brief supersedes the original V1. Product-specific decisions live here; collaboration instructions live in AGENTS.md and visual tokens in STYLE.md.

## Project Overview

**In Orbit** is a personal library for collecting, organizing, browsing, and rediscovering things I find worth saving.

*A constellation of things I read, save, revisit, and keep coming back to.*

I currently save books, links, design references, images, notes, and other discoveries in Notion. I want to create a more intentional, immersive, and enjoyable place to revisit them.

This is a personal passion project, but it should be useful rather than just visually impressive. I'm also using it to explore product design, interaction design, and AI-assisted development.

The experience should feel like a personal universe of saved things, not a productivity dashboard or generic bookmark manager.

## Product Direction

### Homepage — The Library

The homepage **is the library**, not a separate landing or marketing page.

The primary purpose is to browse, search, filter, and manage saved content.

Core elements:
- In Orbit branding and introductory copy
- Search and category navigation
- Filters and sorting
- Visual cards for saved content
- Add/Edit save functionality
- Navigation to Images
- A future-facing Ask the Atlas experience

Prioritize a straightforward browsing experience. The celestial theme should enhance the atmosphere without complicating the interface.

### Save Cards

Saved items may include books, articles, websites, videos, tools, design references, and other links.

Explore reusable layouts that accommodate:
- Cover or social preview image
- Title
- Content type
- Source or website
- Tags
- Description or personal notes
- Date saved
- Original URL

Not every field needs to appear on every card. Prioritize readable hierarchy and progressive disclosure.

The final card anatomy, metadata hierarchy, and filtering system are still design decisions to explore.

In the current card hierarchy, the `type` field appears as plain amber text (Book, Article, Website, Video, or Tool). The `source` field remains in the data model for detail views and future metadata, but is omitted from card previews. General topic tags and optional Portfolio style tags appear as secondary pills.

The Library provides Gallery and List layouts. Gallery cards use their content height rather than a uniform minimum, and the staggered masonry layout lets later saves rise into vertical gaps left by compact cards. The source and keyboard order still follows the selected sort. List uses the same card data in a denser single-column row with a smaller preview, preserving the open-link and management interactions.

Card navigation uses progressive disclosure. Saves with short descriptions open the original URL directly in a new tab. When notes are long enough to be truncated in the card preview, the card opens a read-only detail modal first so the full note is not skipped; that modal includes a clear link to the original source.

### Add/Edit Save

The intended interaction is a modal, not a separate page.

The Add save modal includes a required manual Type choice near the top, followed by title, URL, notes, and optional secondary tag entry. Type is a searchable single-select: existing values can be reused, and a new value can be created when the right category does not yet exist. The selected Type is persisted directly as the save's primary Library category rather than inferred by the system, and custom values become available as Library filters. The modal uses a warm yellow “star core” treatment and the primary action is labeled “Send into orbit.” When Supabase is configured, new saves are written through an authenticated server action and the success animation runs only after the database confirms the insert. Without backend configuration, the visual prototype retains its temporary local-state fallback. Custom secondary tag names are retained in browser session storage so the tag picker can be reviewed across modal openings. A short shooting-star transition is a provisional success animation pending further motion references.

Selecting `Portfolio` as the primary Type changes the lower optional tag control from Secondary tags to Portfolio Styles. Style labels such as `Playful` and `Modern & clean` remain distinct from general content tags. Legacy imported saves that used a secondary `Portfolio` tag retain their existing style metadata when edited.

Tag controls sit directly on the modal gradient as individual warm-white pills that echo the input fields, rather than inside a boxed field. The modal X closes immediately; Cancel, backdrop, and Escape retain unsaved-change protection.

Flow:
1. Open the Add modal.
2. Paste a URL.
3. Automatically retrieve available social preview metadata.
4. Populate title, description, preview image, and source where possible.
5. Allow manual edits and overrides.
6. Add optional tags and notes.
7. Save the item.

The goal is to minimize manual entry.

Some websites restrict automated preview access, so the interface continues to support missing metadata and manual entry.

The functional version now retrieves link metadata on the server when a save is created or updated and during the Notion import flow. It stores the fetched title, social description, and Open Graph or Twitter preview image when available. Fetched descriptions remain separate from owner-authored notes. Requests reject local and private network destinations, stop after four redirects or six seconds, and cap HTML reads at 1.5 MB. Metadata failure never blocks the underlying save.

This is part of the functional MVP, not the initial static prototype.

### Images

Images is a visual archive for screenshots and image inspiration.

**Core interaction: Copy → Paste → Saved.**

The intended experience:
- Open Images.
- Paste an image using `⌘V` or `Ctrl+V` anywhere in the view, unless typing in an input.
- Show an immediate preview.
- Automatically upload and save the image.
- Insert the newest image first.
- Display images in a responsive Pinterest-style masonry layout.
- Preserve image aspect ratios.
- Allow clicking an image to enlarge it.
- Keep notes, tags, and source URLs optional and editable later.

No Add button or upload modal should be required for the primary paste interaction.

The grid should adjust naturally when new content is inserted without distorting images or causing unnecessary layout shifts.

For the functional version, provide upload progress, failure feedback, and retry behaviour. Do not indicate that an upload succeeded until persistence is confirmed.

Do not build an infinite canvas or manual image-reordering system unless explicitly requested.

The current frontend prototype uses a borderless masonry collage rather than a spatial canvas. It supports switching from the Library, searching and filtering sample images, pasting one PNG/JPG/WebP image from the clipboard, dragging one image from the desktop or Finder, optional inline tagging, an enlarged detail view, and deletion from that detail view. Image deletion is currently session-only: pasted images are removed from browser memory, while removed fictional samples return on refresh. Pasted images use temporary browser object URLs: they are inserted newest first and remain available while the page is open, but they are not uploaded or persisted and disappear on refresh. Unsupported formats and files larger than 15 MB receive neutral inline feedback.

### Ask the Atlas

Ask the Atlas is a future AI-powered guide that helps people discover content within the archive.

Potential queries:
- Find saves related to creativity.
- Show books about self-growth.
- Recommend something from my archive.
- Find connections between saved ideas.

For now, build only a visual skeleton or example interaction if requested.

Do not implement AI functionality, embeddings, or vector databases during the initial prototype.

## Visual Direction

**Mood:** Atmospheric, celestial, editorial, ethereal, intimate.

**Primary reference:** https://elishajeon.com/noto

Use the dark-mode atmosphere of Elisha Jeon's portfolio as inspiration, particularly:
- Starry night background
- Deep midnight and indigo gradients
- Subtle shooting-star animations
- Warm yellow/orange shooting-star cursor trail
- Transparent, softly illuminated surfaces
- Ethereal cards and buttons

The goal is to interpret these visual qualities for In Orbit rather than reproduce the reference website.

### Typography

- **All headings and the primary wordmark:** DT Nightingale Light
- **Body and interface:** Inter
- **Primary text:** White or soft white
- **Secondary text:** Subtle, readable grey

Use expressive editorial headings with clear, functional body typography.

### Surfaces and Components

- Translucent or glass-like dark cards
- Thin, subtle borders
- Gentle glows
- Soft hover transitions
- Transparent buttons and pill-shaped controls where appropriate
- Consistent spacing and readable hierarchy

Avoid making every element glow. Use light and motion to establish focus.

### Motion

Motion should feel calm, magical, and intentional.

Potential effects:
- Subtle star twinkling
- Infrequent shooting stars
- Warm cursor trail
- Gentle hover illumination
- Lightweight card transitions

Respect reduced-motion preferences. Avoid animations that interfere with reading, performance, or navigation.

### Avoid

- Generic SaaS dashboards
- Cyberpunk or excessively neon aesthetics
- Childish space illustrations
- Excessive particles and motion
- Heavy, opaque cards
- Cluttered interfaces
- Overly literal space terminology
- Visual effects that compete with content

## Project Principles

These priorities are ordered. When there's tension, the higher priority wins.

1. **Useful before impressive.** Browsing and saving content should be effortless.
2. **Digestible over complicated.** Keep information hierarchy clear and interactions intuitive.
3. **Atmosphere serves content.** Immersion should enhance usability, not replace it.
4. **Personal over generic.** This should feel like my own curated corner of the internet.
5. **Low friction.** Minimize steps, unnecessary forms, and repeated data entry.
6. **Build simply, expand intentionally.** Keep the codebase maintainable without prematurely engineering future features.

## Content and Language

**Voice:** Quiet, personal, editorial, and slightly dreamy.

The writing should feel like a thoughtful personal archive rather than a commercial product.

Avoid startup marketing language, unnecessary exclamation points, and excessive space metaphors.

### Working terminology

| Term | Meaning |
|---|---|
| In Orbit | The overall archive |
| The Library | Main collection of saved links and content |
| Images | Screenshot and visual inspiration archive |
| Constellations | Thematic collections or clusters |
| North Stars | Featured or favourite saves |
| New in Orbit | Recently saved content |
| Ask the Atlas | Future AI guide through the archive |
| Nearby Stars | Related saved content |
| Drift | Random discovery |
| Field Notes | Personal notes or reflections |

These are working terms, not mandatory navigation labels. Prefer clarity when a themed name makes an interaction harder to understand.

## Technology

**Planned stack:**
- Next.js
- TypeScript
- Tailwind CSS
- Personal GitHub repository
- Vercel deployment

**Initial prototype:** Static placeholder data.

**Functional MVP:** Persistent saves, metadata fetching, image storage, and private management functionality.

Supabase is the selected backend for the functional MVP. It provides the Postgres database, private owner authentication, and image storage. The first version is private to its owner; public sharing can be designed separately later rather than weakening the initial access rules.

Existing Notion content may be imported later. Do not build a permanent two-way Notion synchronization system unless explicitly requested.

Do not add backend services, authentication providers, or significant dependencies without explaining the need and getting approval.

## Development Milestones

### Milestone 1 — Visual Foundation

Focus on:
- Minimal project setup
- Homepage layout
- Typography and theme
- Starry background
- Translucent components
- Placeholder saves
- Reusable card patterns
- Responsive behaviour

Use static data. No backend is necessary.

### Milestone 2 — Library Interactions

Focus on:
- Search and filtering with local data
- Sorting
- Card interactions
- Add/Edit modal prototype
- Images masonry layout
- Clipboard paste prototype

Interactions may use temporary local state. Make it clear when data is not persisted.

### Milestone 3 — Functional MVP

Introduce:
- Persistent database
- Private authentication for content management
- Add/Edit/Delete saves
- Server-side social preview fetching
- Persistent image uploads
- Image auto-save
- Data export and basic backup strategy

Keep the application private to its authenticated owner during this milestone.

### Future Exploration

- Import existing Notion saves
- Ask the Atlas AI integration
- More sophisticated collections
- Constellation relationship visualization
- Additional discovery interactions

These features are not requirements for the first build.

## Implementation structure

Use `app/` for routes and global styles, `components/` for reusable UI, and `content/` for typed sample saves. Add asset folders only when needed. See the setup notes at the end of this brief.

## Current Focus

**Working on:** Milestone 3 backend foundations across the Library and Images.

**Latest product decisions:**
- The homepage is the actual library.
- Add/Edit uses a modal.
- Link previews should eventually populate automatically.
- Images uses clipboard-first image saving.
- Images display newest first in a responsive masonry grid.
- The Images prototype uses temporary in-memory previews, not uploads.
- Images should feel like an open visual field while retaining automatic masonry placement.
- Ask the Atlas remains a future feature.
- The site uses DT Nightingale Light for headings and Inter for body and interface text.
- Save cards can switch between Gallery and List; Gallery cards hug their actual content height.
- Link metadata and social thumbnails are fetched server-side without overwriting personal notes.
- Supabase is the selected backend for database, authentication, and image storage.
- The first functional version is private to one owner.
- Placeholder content remains in the interface until each persistence flow is connected and verified.
- Notion is a one-time import source rather than a permanent two-way sync.
- Imported saves preserve Notion Type values as categories, descriptive Tags separately, Portfolio Level where present, and Favourite as a dedicated state.
- Add and Edit save flows expose Type as an explicit primary category; the system does not choose it automatically.
- General tags remain optional secondary metadata; selecting Portfolio as the primary Type replaces that control with Portfolio Styles.
- Images can be removed from the current session through the enlarged detail view; persistent deletion waits for Storage integration.
- Each imported record stores its Notion page ID and source so repeated imports can update or skip the same page without relying on URL uniqueness.

**Still to explore:**
- Homepage card anatomy and metadata hierarchy
- Category and filtering patterns
- Responsive layout details
- Final visual tokens
- Image viewing and optional editing interactions

**Immediate next step:** Connect Images paste and drop interactions to private Supabase Storage, with honest upload progress, failure, and retry states.

Before the Images slice, the approved Notion migration adds import-safe source identifiers, categories, portfolio level, favourite state, and import timestamps. A private `/import/notion` review screen maps the local source export, compares Source IDs and URLs with Supabase, and labels records Ready, Already imported, or Needs review. Its source JSON stays local and ignored by Git. An authenticated import action rechecks the preview when submitted and imports only records that are still Ready; ambiguous or duplicate records are never included automatically. The first ten approved records were imported and verified on November 19, 2026. On November 20, the complete 380-row export was reviewed and 349 additional Ready records were imported, bringing the persistent Library to 359 saves.

The connected Notion Bookmarks data source contains 380 rows. The complete read-only export remains local and ignored by Git. After the full import, 359 records are Already imported and 21 remain in Needs review: nine have no valid URL and twelve repeat a URL elsewhere in the export. These held records were not silently discarded or imported; review them separately before deciding whether any duplicate-URL entries contain distinct notes or taxonomy worth preserving.

The ten-record test batch has been enriched against its source websites. All ten successfully returned usable metadata; the Library now displays meaningful page titles, fetched descriptions where personal notes are absent, and available social thumbnail images. The same enrichment runs automatically for future Notion imports and manual saves.

## Milestone 1 implementation notes

The starter is in `app/`, `components/`, and `content/`; no empty directories are included. This is a local Next.js App Router project with strict TypeScript and Tailwind's PostCSS integration. Tailwind utilities and named CSS classes share a single global stylesheet so the visual foundation is easy to inspect. The interactive library remains a client component while authentication and future data reads use server-side Supabase utilities.

Six fictional saves and CSS artwork demonstrate several content types without exposing personal records or implying an import has happened. They appear only while the persistent Library is empty or unavailable, and disappear as soon as the first real save is confirmed. Search, category filtering, title sorting, newest-first sorting, Add save, progressive note details, and temporary tag creation remain client-side interactions around the persisted records. Images still has a functional local prototype with six fictional SVG studies plus clipboard paste and desktop drag/drop previews; those images are not yet uploaded and disappear on refresh.

A denser upper-page star field, subtle static constellation lines, a restrained shooting star, translucent controls, and a continuous warm cursor trail establish the celestial foundation. The card composition has been reviewed against the supplied wireframe: previews are inset within a consistent bookmark-card shell, and the checkerboard is treated only as a transparency indicator rather than a rendered pattern.

## Milestone 3 foundation notes

The free Supabase project is connected locally through ignored `.env.local` values and documented with a safe `.env.example`. The initial migration creates owner-scoped `saves` and `nebula_images` tables, a private `nebula` storage bucket limited to PNG, JPG, and WebP files up to 15 MB, updated-at triggers, indexes, and row-level security policies. Anonymous table access is revoked. Storage paths must begin with the authenticated owner's user ID.

Next.js uses the official Supabase browser and server clients with cookie-based sessions. The root proxy protects application routes when Supabase is configured, and `/login` provides the single-owner email/password sign-in flow. The Library now reads owner-scoped records on the server and creates, updates, and deletes saves through authenticated server actions with server-side validation. Persisted cards expose a quiet management menu, editing reuses the Add save form, and deletion requires confirmation. Images uploads still use temporary frontend state until that persistence step is implemented and verified.

The Notion import metadata migration adds `external_source`, `external_id`, `imported_at`, `categories`, `portfolio_level`, and `is_favorite` to saves. A partial unique index on owner, source, and external ID prevents the same Notion page from being imported twice while deliberately allowing separate Notion records to share a URL when their notes or taxonomy differ.

### Run and check

Use Node 22 or newer (a `.nvmrc` selects 22).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Stop the preview with Ctrl+C.

Before sharing changes:

```sh
npm run lint
npm run typecheck
npm run build
```

`npm start` serves the production build. The visual prototype can still run without environment variables, while the private backend and route protection require the Supabase values documented in `.env.example`. Google font files are retrieved at build time by Next.js, so a build requires network access. Review the UI at desktop and mobile widths, with keyboard navigation and reduced motion.

### Personal GitHub and eventual Vercel

`package.json` is private to prevent accidental npm publication. `.gitignore` excludes installed dependencies, build output, deployment state, and environment files. The dependency lockfile records the resolved package versions. No remote account or repository is linked.

After approval, create an empty repository in the intended personal GitHub account, verify the account and repository visibility, then add its remote and push the reviewed source. Commit the lockfile. Do not push personal Notion exports or secrets. A local repository can be initialized independently of any remote.

After separate deployment approval, import that repository into the intended Vercel account. Select the Next.js preset, use this project directory as the root (or the repository root if its contents are copied there), use Node 22, `npm run build`, and the framework's default output settings. Configure the Supabase URL and publishable key as deployment environment variables before reviewing the first preview. Metadata currently requests no indexing; route protection and database policies provide the actual privacy boundary. Revisit indexing at launch.

### Review and unresolved decisions

Review card anatomy, metadata density, typography size, categories, responsive composition, and motion as persistence is introduced. The first version is confirmed as a private, single-owner tool using Supabase. Public visitors must never receive private records or privileged credentials; any future sharing experience should be designed as a separate, deliberate milestone.

Tooling note: ESLint is pinned to 9.39.5 because the React, import, and accessibility plugins bundled with the selected Next.js configuration currently declare compatibility through ESLint 9. That release reports an upstream end-of-support notice during installation; revisit the pin when those plugins support ESLint 10. Do not force incompatible peer dependencies.

Local Git is initialized on `main`, with no commits or remote configured. No publishing or deployment has occurred.
