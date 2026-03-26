# UI & Component Patterns Reference

## Section Component Pattern

Every documentation section follows this structure:

```tsx
interface SectionProps {
  activeSubsection: string;
}

export function ExampleSection({ activeSubsection }: SectionProps) {
  const renderContent = () => {
    switch (activeSubsection) {
      case 'sub-page-1':
        return <SubPage1Content />;
      case 'sub-page-2':
        return <SubPage2Content />;
      default:
        return <SectionOverview />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Section Title</h1>
        <p className="text-muted-foreground">Section description</p>
      </div>
      {renderContent()}
    </div>
  );
}
```

For sections without sub-pages (e.g. Overview, Roadmap), skip the `activeSubsection` prop and render content directly.

## UI Composition Patterns

### 1. Hero Section with Badges

Used for the Overview/landing section.

```tsx
<div className="space-y-4">
  <div className="flex items-center gap-2">
    <Badge variant="secondary" className="text-xs">v1.0</Badge>
    <Badge variant="outline" className="text-xs">Documentation</Badge>
  </div>
  <h1 className="text-4xl font-bold tracking-tight">Project Title</h1>
  <p className="text-xl text-muted-foreground leading-relaxed">
    Brief project description or tagline.
  </p>
</div>
```

### 2. Value Proposition Cards (3-column)

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card>
    <CardHeader className="pb-3">
      <IconComponent className="h-8 w-8 text-yellow-500 mb-2" />
      <CardTitle className="text-lg">Value Title</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Value description</p>
    </CardContent>
  </Card>
  {/* Repeat for each value */}
</div>
```

### 3. Feature Card Grid (2-column)

```tsx
const features = [
  { id: 'feat-1', title: 'Feature', icon: IconComponent, description: '...', highlights: ['tag1', 'tag2'] },
];

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {features.map((feature) => (
    <Card key={feature.id} className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <feature.icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">{feature.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{feature.description}</p>
        <div className="flex flex-wrap gap-2">
          {feature.highlights.map((h, i) => (
            <Badge key={i} variant="secondary" className="text-xs">{h}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

### 4. Compact Feature List

```tsx
<div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
  <IconComponent className="h-5 w-5 text-primary mt-0.5" />
  <div>
    <h3 className="font-medium">Feature Name</h3>
    <p className="text-sm text-muted-foreground mt-1">Feature description</p>
  </div>
</div>
```

### 5. Sub-section Header with Icon

```tsx
<div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
    <IconComponent className="h-5 w-5 text-primary" />
  </div>
  <div>
    <h2 className="text-2xl font-semibold">Sub-section Title</h2>
    <p className="text-muted-foreground">Sub-section description</p>
  </div>
</div>
```

### 6. Numbered Steps / Quick Start

```tsx
<div className="bg-muted rounded-lg p-4 space-y-3">
  <ol className="space-y-2 text-sm">
    <li className="flex items-start gap-2">
      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
      <span>Step description here</span>
    </li>
    {/* More steps */}
  </ol>
</div>
```

### 7. Workflow / Process Flow (Horizontal)

```tsx
<div className="flex flex-col md:flex-row items-start md:items-center gap-4">
  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
    <div>
      <p className="font-medium">Step Name</p>
      <p className="text-xs text-muted-foreground">Brief description</p>
    </div>
  </div>
  <div className="hidden md:block text-muted-foreground">&rarr;</div>
  {/* More steps */}
</div>
```

### 8. Vertical Flow Steps (Data Flow)

```tsx
<div className="space-y-4">
  <div className="flex items-start gap-4">
    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">1</div>
    <div>
      <p className="font-medium">Step Title</p>
      <p className="text-sm text-muted-foreground">Step description with details.</p>
    </div>
  </div>
  {/* More steps */}
</div>
```

### 9. Architecture Diagram (Text-based)

```tsx
<div className="bg-muted p-6 rounded-lg font-mono text-sm space-y-4">
  <div className="flex justify-center gap-4">
    <div className="px-4 py-2 bg-blue-100 border border-blue-300 rounded text-center">
      <p className="font-semibold text-blue-800">Component A</p>
    </div>
  </div>
  <div className="flex justify-center">
    <ArrowRight className="rotate-90 text-muted-foreground" />
  </div>
  <div className="flex justify-center gap-4">
    <div className="px-4 py-2 bg-green-100 border border-green-300 rounded text-center">
      <p className="font-semibold text-green-800">Component B</p>
    </div>
  </div>
</div>
```

### 10. Feature Checklist Table

```tsx
const checklistData = [
  {
    category: 'Category Name',
    features: [
      { name: 'Feature', desc: 'Description', value: 'User value' },
    ],
  },
];

{checklistData.map((category) => (
  <Card key={category.category}>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">{category.category}</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/4">Feature</TableHead>
            <TableHead className="w-2/5">Description</TableHead>
            <TableHead>User Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {category.features.map((feature, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{feature.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{feature.desc}</TableCell>
              <TableCell className="text-sm">{feature.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
))}
```

### 11. Persona Cards

```tsx
const personas = [
  {
    name: 'User Name',
    role: 'Role Title',
    avatar: 'UN',    // Initials
    color: 'bg-blue-500',
    description: 'Brief description',
    goals: ['Goal 1', 'Goal 2'],
    frustrations: ['Pain 1', 'Pain 2'],
  },
];

{personas.map((persona) => (
  <Card key={persona.name}>
    <CardHeader>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 ${persona.color} rounded-full flex items-center justify-center text-white font-semibold`}>
          {persona.avatar}
        </div>
        <div>
          <CardTitle className="text-xl">{persona.name}</CardTitle>
          <Badge variant="secondary" className="mt-1">{persona.role}</Badge>
          <p className="text-sm text-muted-foreground mt-2">{persona.description}</p>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" /> Goals
          </h4>
          <ul className="space-y-2">
            {persona.goals.map((g, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-green-500 mt-1">&bull;</span>{g}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" /> Pain Points
          </h4>
          <ul className="space-y-2">
            {persona.frustrations.map((f, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-red-500 mt-1">&bull;</span>{f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </CardContent>
  </Card>
))}
```

### 12. Risk Level Badges

```tsx
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <Badge variant="destructive">High</Badge>
    <span className="text-sm">Critical items description</span>
  </div>
  <div className="flex items-center gap-2">
    <Badge variant="default" className="bg-yellow-500">Medium</Badge>
    <span className="text-sm">Important items description</span>
  </div>
  <div className="flex items-center gap-2">
    <Badge variant="secondary">Low</Badge>
    <span className="text-sm">Minor items description</span>
  </div>
</div>
```

### 13. Tech Stack Display

```tsx
const techStack = [
  { layer: 'Frontend', technologies: [{ name: 'React', purpose: 'UI' }] },
];

{techStack.map((layer) => (
  <Card key={layer.layer}>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">{layer.layer}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-3">
        {layer.technologies.map((tech) => (
          <div key={tech.name} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <span className="font-medium text-sm">{tech.name}</span>
            <Badge variant="secondary" className="text-xs">{tech.purpose}</Badge>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
))}
```

### 14. Highlighted Summary Card

```tsx
<Card className="bg-primary/5 border-primary/20">
  <CardHeader>
    <CardTitle className="text-lg">Summary Title</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <p className="text-sm text-muted-foreground">Summary content here.</p>
  </CardContent>
</Card>
```

### 15. Bullet List in Card

```tsx
<Card>
  <CardHeader className="pb-3">
    <div className="flex items-center gap-2">
      <IconComponent className="h-5 w-5 text-blue-500" />
      <CardTitle className="text-lg">List Title</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <ul className="space-y-2 text-sm text-muted-foreground">
      <li>&bull; Item 1</li>
      <li>&bull; Item 2</li>
      <li>&bull; Item 3</li>
    </ul>
  </CardContent>
</Card>
```

### 16. Checklist with Icons

```tsx
<ul className="space-y-1 text-sm">
  <li className="flex items-start gap-2">
    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
    <span>Completed or supported item</span>
  </li>
</ul>
```

### 17. Market Comparison Table

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Tool</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Strengths</TableHead>
      <TableHead>Weaknesses</TableHead>
      <TableHead>Our Advantage</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {competitors.map((comp) => (
      <TableRow key={comp.name}>
        <TableCell className="font-medium">{comp.name}</TableCell>
        <TableCell>{comp.type}</TableCell>
        <TableCell>
          <ul className="space-y-1">
            {comp.strengths.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground">&bull; {s}</li>
            ))}
          </ul>
        </TableCell>
        <TableCell>
          <ul className="space-y-1">
            {comp.weaknesses.map((w, i) => (
              <li key={i} className="text-xs text-muted-foreground">&bull; {w}</li>
            ))}
          </ul>
        </TableCell>
        <TableCell className="text-sm text-primary">{comp.ourAdvantage}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## i18n Pattern (when multi-language is enabled)

When the user requests i18n support:

1. Create `LanguageContext.tsx` (see architecture.md)
2. Wrap App in `<LanguageProvider>`
3. Add language switcher dropdown in Header using `DropdownMenu`
4. Use `const { t } = useLanguage();` in all components
5. All user-facing strings use `t('key.path')` instead of hardcoded text
6. Translation keys follow dot notation: `'section.subsection.element'`

For bilingual content within section components, use the pattern:
```tsx
function SectionContent({ language }: { language: string }) {
  const isZh = language === 'zh';
  return (
    <p>{isZh ? '中文内容' : 'English content'}</p>
  );
}
```

## Common Lucide Icons for Documentation

```
Home, Target, Users, Layers, Cpu, BarChart3, FileText,  // Navigation
Zap, Brain, Shield, Bell, Filter, CheckCircle,          // Features
Radio, Clock, GitCompare, Search, AlertTriangle,        // Specific
Menu, Github, BookOpen, MessageCircle, Languages,        // Header
ChevronRight, ArrowRight, XCircle, MinusCircle,          // UI
Server, Database, Layers, ArrowRight,                    // Architecture
TrendingUp, Grid3X3, List                               // Analytics
```

## Responsive Grid Patterns

- **3 columns**: `grid grid-cols-1 md:grid-cols-3 gap-4` (value props, metrics)
- **2 columns**: `grid grid-cols-1 md:grid-cols-2 gap-4` (feature cards, content pairs)
- **1 column**: `grid grid-cols-1 gap-6` (persona cards, full-width content)

## Layout Constants

- Header height: `h-14` (3.5rem)
- Sidebar width: `w-72` (18rem)
- Content max width: `max-w-4xl`
- Content padding: `p-8`
- Content area height: `h-[calc(100vh-3.5rem)]`
