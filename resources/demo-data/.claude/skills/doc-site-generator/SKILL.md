---
name: doc-site-generator
description: "Generate documentation websites using React + Vite + Tailwind CSS + shadcn/ui architecture. Use this skill when the user wants to create a documentation site, product docs page, project documentation, or any structured web-based documentation. Triggers on requests like: 'create a doc site', 'make documentation page', 'build a docs website', 'generate project documentation site'."
---

# Documentation Site Generator

Generate professional documentation websites following a proven architecture pattern: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui.

## When to Use

- User wants to create a documentation website for a project
- User wants to build a product docs / landing page with structured content
- User wants a multi-section documentation page with sidebar navigation

## Workflow

### Step 1: Gather Requirements

Ask the user for:
1. **Project name** and brief description
2. **Documentation sections** — what chapters/pages are needed (e.g., Overview, Features, Architecture, Roadmap)
3. **i18n** — whether multi-language support is needed (if yes, which languages)
4. **Content** — any existing content (markdown, text, etc.) to incorporate
5. **Branding** — logo, colors, or links (GitHub, etc.)

### Step 2: Scaffold the Project

Create the project using Vite + React + TypeScript:

```bash
npm create vite@latest <project-name> -- --template react-ts
cd <project-name>
npm install
```

Install core dependencies:
```bash
npm install tailwindcss @tailwindcss/vite lucide-react class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-scroll-area @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-separator @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-accordion @radix-ui/react-slot
```

Initialize shadcn/ui:
```bash
npx shadcn@latest init
```

Add required shadcn components:
```bash
npx shadcn@latest add card badge button scroll-area dialog input dropdown-menu separator tabs table accordion tooltip
```

### Step 3: Create Core Architecture

Read `references/architecture.md` for the complete project structure template.

Create files in this order:
1. `src/index.css` — CSS variable theme (light/dark)
2. `tailwind.config.js` — Tailwind config with shadcn color system
3. `src/lib/utils.ts` — `cn()` utility
4. `src/components/ui/` — shadcn components (auto-generated)
5. `src/contexts/LanguageContext.tsx` — (only if i18n requested)
6. `src/components/Header.tsx` — Fixed top navigation
7. `src/components/Sidebar.tsx` — Left sidebar with nested nav items
8. `src/components/Content.tsx` — Section router
9. `src/components/SearchDialog.tsx` — Cmd+K search
10. `src/components/sections/*.tsx` — One component per documentation section
11. `src/App.tsx` — Root composition

### Step 4: Populate Content Sections

Read `references/patterns.md` for UI component patterns.

For each documentation section, create a section component using these patterns:
- **Overview/Landing**: Hero section with badges + value proposition cards + feature grid + quick start steps
- **Feature pages**: Icon + title header, card grid with highlights, feature checklist table
- **Architecture**: Flow diagrams (colored boxes with arrows), tech stack cards, data flow numbered steps
- **User scenarios/Personas**: Avatar cards with goals/pain points lists
- **Roadmap**: Timeline with phase cards and status badges
- **Appendix**: Tables, glossary definitions, reference links

### Step 5: Configure & Build

1. Update `vite.config.ts` with base path if needed for deployment
2. Test with `npm run dev`
3. Build with `npm run build`

## Key Architecture Principles

- **State-driven routing**: Single `activeSection` state controls which section component renders. No router library needed.
- **Sidebar nav structure**: `NavItem[]` array with `id`, `label`, `icon`, optional `children[]` — drives both sidebar rendering and content switching.
- **Section components**: Each accepts `activeSubsection` prop to render sub-pages within the section.
- **Search data**: Flat array of `{ id, title, description, section }` entries for Cmd+K search.
- **Responsive layout**: Fixed header (h-14, z-50) + fixed sidebar (w-72) + scrollable main content area.
- **Theme**: HSL CSS variables for all colors, supporting light/dark mode via `.dark` class.

## File References

- `references/architecture.md` — Project structure, config files, core component templates
- `references/patterns.md` — Section component patterns, UI composition patterns, i18n pattern
