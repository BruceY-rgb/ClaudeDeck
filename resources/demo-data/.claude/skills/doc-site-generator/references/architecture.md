# Architecture Reference

## Project Structure

```
project-name/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── components.json              # shadcn/ui config
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component
│   ├── App.css                  # App-specific styles (minimal)
│   ├── index.css                # Tailwind + CSS variable theme
│   ├── lib/
│   │   └── utils.ts             # cn() utility
│   ├── hooks/
│   │   └── use-mobile.ts        # Responsive hook
│   ├── contexts/
│   │   └── LanguageContext.tsx   # i18n context (optional)
│   ├── components/
│   │   ├── Header.tsx           # Top navigation bar
│   │   ├── Sidebar.tsx          # Left sidebar navigation
│   │   ├── Content.tsx          # Section router
│   │   ├── SearchDialog.tsx     # Cmd+K search dialog
│   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── accordion.tsx
│   │   │   └── tooltip.tsx
│   │   └── sections/            # Documentation section components
│   │       ├── OverviewSection.tsx
│   │       ├── FeaturesSection.tsx
│   │       └── ...
│   └── assets/                  # Static assets
└── public/                      # Public static files
```

## Core Config Files

### vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### src/index.css — Theme Variables

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.625rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### src/lib/utils.ts

```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Core Component Templates

### App.tsx (with i18n)

```tsx
import { useState, useEffect } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Content } from './components/Content';
import { SearchDialog } from './components/SearchDialog';

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onSearchClick={() => setIsSearchOpen(true)}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="flex pt-14">
        <Sidebar
          isOpen={isSidebarOpen}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <main className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-72' : 'ml-0'
        }`}>
          <Content activeSection={activeSection} />
        </main>
      </div>
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSectionChange={setActiveSection}
      />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>  {/* Remove wrapper if no i18n */}
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
```

### App.tsx (without i18n)

```tsx
import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Content } from './components/Content';
import { SearchDialog } from './components/SearchDialog';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onSearchClick={() => setIsSearchOpen(true)}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="flex pt-14">
        <Sidebar
          isOpen={isSidebarOpen}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <main className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-72' : 'ml-0'
        }`}>
          <Content activeSection={activeSection} />
        </main>
      </div>
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSectionChange={setActiveSection}
      />
    </div>
  );
}

export default App;
```

### Header.tsx

```tsx
import { Menu, Search, Github, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
  isSidebarOpen: boolean;
}

export function Header({ onMenuClick, onSearchClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center h-full px-4">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">XX</span>
              {/* Replace XX with project initials */}
            </div>
            <span className="font-semibold text-lg hidden sm:inline">Project Name</span>
          </a>
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center px-4">
          <Button
            variant="outline"
            onClick={onSearchClick}
            className="w-full max-w-md justify-start text-muted-foreground"
          >
            <Search className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Search documentation...</span>
            <span className="sm:hidden">Search...</span>
            <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">&#x2318;</span>K
            </kbd>
          </Button>
        </div>

        {/* Right: Links */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com/YOUR_REPO" target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon">
            <BookOpen className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
```

### Sidebar.tsx

```tsx
import { useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: { id: string; label: string }[];
}

export function Sidebar({ isOpen, activeSection, onSectionChange }: SidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Define navigation items — customize per project
  const navItems: NavItem[] = [
    // { id: 'overview', label: 'Overview', icon: Home },
    // { id: 'features', label: 'Features', icon: Layers, children: [...] },
  ];

  useEffect(() => {
    const el = document.querySelector(`[data-section="${activeSection}"]`);
    if (el && scrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeSection]);

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-72 bg-background border-r border-border z-40">
      <ScrollArea className="h-full" ref={scrollRef}>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <div key={item.id} className="space-y-1">
              <button
                data-section={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  activeSection === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.children && <ChevronRight className="h-4 w-4" />}
              </button>
              {item.children && (
                <div className="ml-4 pl-4 border-l border-border space-y-1">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      data-section={child.id}
                      onClick={() => onSectionChange(child.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                        activeSection === child.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <span className="flex-1 text-left">{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
```

### Content.tsx

```tsx
import { ScrollArea } from '@/components/ui/scroll-area';
// Import all section components here

interface ContentProps {
  activeSection: string;
}

export function Content({ activeSection }: ContentProps) {
  const renderSection = () => {
    switch (activeSection) {
      // Map section ids to components:
      // case 'overview': return <OverviewSection />;
      // case 'features':
      // case 'feature-sub-1':
      //   return <FeaturesSection activeSubsection={activeSection} />;
      default:
        return null; // Replace with default section
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-3.5rem)]">
      <div className="max-w-4xl mx-auto p-8">
        {renderSection()}
      </div>
    </ScrollArea>
  );
}
```

### SearchDialog.tsx

```tsx
import { useState, useEffect } from 'react';
import { Search, FileText, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSectionChange: (section: string) => void;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  section: string;
}

// Populate with all searchable sections
const searchData: SearchResult[] = [
  // { id: 'overview', title: 'Overview', description: '...', section: 'overview' },
];

export function SearchDialog({ isOpen, onClose, onSectionChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredResults = query
    ? searchData.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      )
    : searchData;

  useEffect(() => { setSelectedIndex(0); }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => prev < filteredResults.length - 1 ? prev + 1 : prev);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredResults[selectedIndex]) {
            onSectionChange(filteredResults[selectedIndex].section);
            onClose();
            setQuery('');
          }
          break;
        case 'Escape':
          onClose();
          setQuery('');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onSectionChange, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Search Documentation</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-8 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium">
              ESC
            </kbd>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="p-2">
            {filteredResults.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            ) : (
              <div className="space-y-1">
                {filteredResults.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => { onSectionChange(result.section); onClose(); setQuery(''); }}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors',
                      index === selectedIndex ? 'bg-primary/10' : 'hover:bg-muted'
                    )}
                  >
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{result.title}</div>
                      <div className="text-sm text-muted-foreground truncate">{result.description}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-3 border-t text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">&#x2191;&#x2193;</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">&#x21B5;</kbd> to select
            </span>
          </div>
          <span>{filteredResults.length} results</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### LanguageContext.tsx (optional, only if i18n requested)

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'en' | 'zh'; // Add more as needed

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'search.placeholder': 'Search documentation...',
    'search.short': 'Search...',
    // Add all translation keys here
  },
  zh: {
    'search.placeholder': '搜索文档...',
    'search.short': '搜索...',
    // Add all translation keys here
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
```

### index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Project Documentation</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### main.tsx

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```
