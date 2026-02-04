# SaaS Application Template

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  PUBLIC PAGES                                               │
│  ├── Landing Page (marketing)                              │
│  ├── Pricing Page                                          │
│  ├── Login / Register                                      │
│  └── Forgot Password                                       │
├─────────────────────────────────────────────────────────────┤
│  AUTHENTICATED AREA (Dashboard)                            │
│  ├── Overview (home)                                       │
│  ├── [Core Feature 1]                                      │
│  ├── [Core Feature 2]                                      │
│  ├── [Core Feature 3]                                      │
│  ├── Settings                                              │
│  └── Profile                                               │
├─────────────────────────────────────────────────────────────┤
│  ADMIN (optional)                                          │
│  ├── User Management                                       │
│  ├── Analytics                                             │
│  └── System Settings                                       │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Shadcn/ui
- **Auth:** NextAuth.js / Clerk / Supabase Auth
- **Database:** Supabase / Prisma + PostgreSQL
- **State:** Zustand / React Query
- **Forms:** React Hook Form + Zod

## File Structure

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx           # Landing
│   │   ├── pricing/page.tsx
│   │   └── layout.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── [feature]/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── [endpoints]/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                    # Shadcn components
│   ├── forms/
│   ├── layouts/
│   │   ├── PublicLayout.tsx
│   │   ├── AuthLayout.tsx
│   │   └── DashboardLayout.tsx
│   └── features/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── utils.ts
│   └── validations.ts
├── hooks/
├── types/
└── styles/
```

## Core Features (Typical)

1. **Authentication**
   - Email/Password login
   - OAuth (Google, GitHub)
   - Password reset
   - Email verification

2. **User Management**
   - Profile editing
   - Avatar upload
   - Account deletion

3. **CRUD Operations**
   - Create/Read/Update/Delete
   - Pagination
   - Search & Filter
   - Bulk actions

4. **Subscription/Billing** (optional)
   - Pricing tiers
   - Stripe integration
   - Usage tracking

## Dashboard Layout

```
┌──────────┐ ┌────────────────────────────────────────┐
│          │ │              HEADER                    │
│          │ │  Logo | Search | Notifications | User  │
│          │ └────────────────────────────────────────┘
│  SIDEBAR │ ┌────────────────────────────────────────┐
│          │ │                                        │
│  • Home  │ │            MAIN CONTENT                │
│  • Feat1 │ │                                        │
│  • Feat2 │ │                                        │
│  • Feat3 │ │                                        │
│  ─────── │ │                                        │
│  Settings│ │                                        │
│          │ │                                        │
└──────────┘ └────────────────────────────────────────┘
```

## API Routes Pattern

```typescript
// GET /api/items - List all
// POST /api/items - Create
// GET /api/items/[id] - Get one
// PUT /api/items/[id] - Update
// DELETE /api/items/[id] - Delete
```

## Security Checklist

- [ ] Auth middleware on protected routes
- [ ] Input validation (Zod)
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Secure headers
- [ ] Environment variables for secrets
