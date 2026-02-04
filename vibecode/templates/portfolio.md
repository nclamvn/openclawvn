# Portfolio Template

## Style Options

```
┌─────────────────────────────────────────────────────────────┐
│  OPTION A: MINIMAL (Developers, Writers)                   │
│  • Clean, whitespace-heavy                                 │
│  • Typography-driven                                        │
│  • Subtle animations                                        │
│  • Content-focused                                          │
├─────────────────────────────────────────────────────────────┤
│  OPTION B: BOLD (Designers, Creatives)                     │
│  • Strong visual impact                                     │
│  • Large imagery                                            │
│  • Creative layouts                                         │
│  • Expressive animations                                    │
├─────────────────────────────────────────────────────────────┤
│  OPTION C: EDITORIAL (Agencies, Studios)                   │
│  • Magazine-style                                           │
│  • Case study focused                                       │
│  • Professional tone                                        │
│  • Balanced text/image                                      │
└─────────────────────────────────────────────────────────────┘
```

## Sections (Typical)

```
┌─────────────────────────────────────────────────────────────┐
│  1. HERO                                                    │
│     • Name + Tagline                                       │
│     • Photo/Avatar (optional)                              │
│     • CTA (Contact / View Work)                            │
├─────────────────────────────────────────────────────────────┤
│  2. ABOUT                                                   │
│     • Short bio (2-3 paragraphs)                           │
│     • Skills / Expertise                                   │
│     • Current status (Available / Employed)                │
├─────────────────────────────────────────────────────────────┤
│  3. WORK / PROJECTS                                         │
│     • 3-6 featured projects                                │
│     • Thumbnail + Title + Brief                            │
│     • Link to detail page                                  │
├─────────────────────────────────────────────────────────────┤
│  4. PROJECT DETAIL (separate pages)                        │
│     • Hero image                                           │
│     • Problem / Solution / Result                          │
│     • Process images                                        │
│     • Technologies used                                     │
├─────────────────────────────────────────────────────────────┤
│  5. SERVICES (optional)                                     │
│     • What you offer                                       │
│     • Pricing (optional)                                   │
├─────────────────────────────────────────────────────────────┤
│  6. CONTACT                                                 │
│     • Email                                                │
│     • Social links                                         │
│     • Contact form (optional)                              │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Contact:** Formspree / EmailJS

## File Structure

```
src/
├── app/
│   ├── page.tsx              # Home
│   ├── about/page.tsx
│   ├── work/
│   │   ├── page.tsx          # Work listing
│   │   └── [slug]/page.tsx   # Project detail
│   ├── contact/page.tsx
│   └── layout.tsx
├── components/
│   ├── Hero.tsx
│   ├── About.tsx
│   ├── ProjectCard.tsx
│   ├── ProjectGrid.tsx
│   ├── Skills.tsx
│   ├── Contact.tsx
│   └── Navigation.tsx
├── content/
│   └── projects/
│       └── *.json
└── lib/
    └── projects.ts
```

## Animation Examples

```tsx
// Page transition
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>

// Stagger children
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }}
  initial="hidden"
  animate="show"
>

// Hover effect
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
```

## Project Data Structure

```typescript
interface Project {
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  images: string[];
  tags: string[];
  year: number;
  client?: string;
  url?: string;
  github?: string;
  featured: boolean;
}
```

## Typography Recommendations

| Style | Heading Font | Body Font |
|-------|--------------|-----------|
| Minimal | Inter | Inter |
| Bold | Space Grotesk | DM Sans |
| Editorial | Playfair Display | Source Sans Pro |
| Creative | Clash Display | Satoshi |

## Color Schemes

```css
/* Minimal - Monochrome */
--bg: #fafafa;
--text: #171717;
--accent: #000000;

/* Bold - High contrast */
--bg: #000000;
--text: #ffffff;
--accent: #ff3366;

/* Editorial - Warm neutrals */
--bg: #f5f0eb;
--text: #2d2a26;
--accent: #c9a87c;
```
