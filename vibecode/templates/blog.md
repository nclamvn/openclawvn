# Blog / Documentation Template

## Blog Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HOMEPAGE                                                   │
│  ├── Featured posts (hero)                                 │
│  ├── Recent posts (grid/list)                              │
│  └── Categories sidebar                                    │
├─────────────────────────────────────────────────────────────┤
│  POST PAGE                                                  │
│  ├── Title + Meta (date, author, read time)               │
│  ├── Featured image                                        │
│  ├── Content (MDX)                                         │
│  ├── Author bio                                            │
│  └── Related posts                                         │
├─────────────────────────────────────────────────────────────┤
│  CATEGORY / TAG PAGES                                       │
│  AUTHOR PAGES                                               │
└─────────────────────────────────────────────────────────────┘
```

## Documentation Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐ ┌────────────────────────┐ ┌──────────┐      │
│  │ Sidebar  │ │     Main Content       │ │   TOC    │      │
│  │ (nav)    │ │     (MDX)              │ │ (right)  │      │
│  │          │ │                        │ │          │      │
│  │ • Guide  │ │  # Heading             │ │ • H2     │      │
│  │   • P1   │ │                        │ │ • H2     │      │
│  │   • P2   │ │  Content here...       │ │   • H3   │      │
│  │ • API    │ │                        │ │ • H2     │      │
│  │   • P1   │ │  ```code```            │ │          │      │
│  │          │ │                        │ │          │      │
│  └──────────┘ └────────────────────────┘ └──────────┘      │
│  + Search (global)                                         │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Content:** MDX / Contentlayer
- **Styling:** Tailwind CSS + Typography plugin
- **Search:** Algolia / Pagefind (static)
- **Syntax:** Shiki / Prism

## File Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage
│   ├── blog/
│   │   ├── page.tsx          # Blog listing
│   │   └── [slug]/page.tsx   # Post detail
│   ├── docs/
│   │   └── [...slug]/page.tsx
│   └── layout.tsx
├── components/
│   ├── mdx/
│   │   ├── MDXComponents.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── Callout.tsx
│   │   └── Image.tsx
│   ├── blog/
│   │   ├── PostCard.tsx
│   │   ├── PostList.tsx
│   │   └── AuthorCard.tsx
│   └── docs/
│       ├── Sidebar.tsx
│       ├── TOC.tsx
│       └── Search.tsx
├── content/
│   ├── blog/
│   │   └── *.mdx
│   └── docs/
│       └── *.mdx
└── lib/
    ├── mdx.ts
    └── posts.ts
```

## Typography Settings

```css
/* Tailwind Typography */
prose-lg
prose-slate
dark:prose-invert
prose-headings:font-semibold
prose-a:text-primary
prose-code:text-sm
prose-pre:bg-muted
```

## Post Frontmatter

```yaml
---
title: "Tiêu đề bài viết"
description: "Mô tả ngắn"
date: 2024-01-15
author: "Tên tác giả"
image: "/images/post-cover.jpg"
tags: ["tag1", "tag2"]
category: "Category"
draft: false
---
```

## MDX Components

```tsx
// Custom components available in MDX
<Callout type="info">
  This is an info callout
</Callout>

<CodeBlock language="typescript" filename="example.ts">
  const hello = "world"
</CodeBlock>

<Image src="/img.png" alt="Description" caption="Caption text" />

<Video src="youtube.com/..." />
```

## SEO Checklist

- [ ] Meta title & description
- [ ] Open Graph tags
- [ ] Twitter cards
- [ ] Canonical URLs
- [ ] Sitemap.xml
- [ ] RSS feed
- [ ] JSON-LD structured data
