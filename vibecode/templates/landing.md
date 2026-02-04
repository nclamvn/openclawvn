# Landing Page Template

## Layout Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  1. HERO                                                    │
│     • Headline (8-12 từ, benefit-focused)                  │
│     • Subheadline + CTA                                    │
│     • Hero visual                                           │
├─────────────────────────────────────────────────────────────┤
│  2. SOCIAL PROOF                                            │
│     • Logo bar / Stats / Mini testimonial                  │
├─────────────────────────────────────────────────────────────┤
│  3. PROBLEM → SOLUTION                                      │
│     • Pain points → Your solution                          │
├─────────────────────────────────────────────────────────────┤
│  4. FEATURES / BENEFITS                                     │
│     • 3-4 key benefits với icons                           │
├─────────────────────────────────────────────────────────────┤
│  5. HOW IT WORKS                                            │
│     • 3 steps process                                       │
├─────────────────────────────────────────────────────────────┤
│  6. TESTIMONIALS                                            │
│     • 3 customer reviews                                    │
├─────────────────────────────────────────────────────────────┤
│  7. PRICING / CTA                                           │
│     • Clear offer + CTA                                    │
├─────────────────────────────────────────────────────────────┤
│  8. FAQ                                                     │
│     • 5-7 common questions                                  │
├─────────────────────────────────────────────────────────────┤
│  9. FINAL CTA + FOOTER                                      │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Font:** Inter / Plus Jakarta Sans

## File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── SocialProof.tsx
│   ├── Problem.tsx
│   ├── Features.tsx
│   ├── HowItWorks.tsx
│   ├── Testimonials.tsx
│   ├── Pricing.tsx
│   ├── FAQ.tsx
│   └── Footer.tsx
└── lib/
    └── utils.ts
```

## Component Specs

### Hero
- Full viewport height (min-h-screen)
- Headline: text-4xl md:text-6xl font-bold
- Subheadline: text-xl text-muted
- CTA: Primary button, large size
- Visual: Image hoặc illustration bên phải

### Social Proof
- Logo bar: 5-7 logos, grayscale, opacity-60
- Hoặc: 3 stats với số lớn (text-4xl font-bold)

### Features
- Grid 2x2 hoặc 3 columns
- Icon + Title + Description
- Hover effect subtle

### Testimonials
- Card layout
- Avatar + Name + Role
- Quote text
- Rating stars (optional)

### CTA Sections
- Background gradient hoặc solid color
- Large headline
- Single CTA button
- Urgency text (optional)

## Responsive Breakpoints

```css
/* Mobile first */
sm: 640px   /* Tablets */
md: 768px   /* Small laptops */
lg: 1024px  /* Desktops */
xl: 1280px  /* Large screens */
```

## Conversion Best Practices

1. **Above the fold:** Headline + CTA visible without scroll
2. **CTA xuất hiện 3 lần:** Hero, middle, footer
3. **Social proof sớm:** Ngay sau hero
4. **Mobile-first:** 60%+ traffic từ mobile
5. **Fast loading:** Optimize images, lazy load
