# Dashboard Template

## Layout Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐ ┌────────────────────────────────────────┐   │
│  │          │ │              HEADER                    │   │
│  │          │ │  Search | Notifications | Profile     │   │
│  │          │ └────────────────────────────────────────┘   │
│  │  SIDEBAR │ ┌────────────────────────────────────────┐   │
│  │          │ │                                        │   │
│  │  • Nav 1 │ │            MAIN CONTENT                │   │
│  │  • Nav 2 │ │                                        │   │
│  │  • Nav 3 │ │  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │   │
│  │  • Nav 4 │ │  │KPI │ │KPI │ │KPI │ │KPI │         │   │
│  │          │ │  └────┘ └────┘ └────┘ └────┘         │   │
│  │          │ │                                        │   │
│  │          │ │  ┌─────────────┐ ┌─────────────┐      │   │
│  │          │ │  │   CHART 1   │ │   CHART 2   │      │   │
│  │          │ │  └─────────────┘ └─────────────┘      │   │
│  │          │ │                                        │   │
│  │          │ │  ┌─────────────────────────────┐      │   │
│  │          │ │  │         DATA TABLE          │      │   │
│  │          │ │  └─────────────────────────────┘      │   │
│  │          │ │                                        │   │
│  └──────────┘ └────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Shadcn/ui
- **Charts:** Recharts / Chart.js / Tremor
- **Tables:** TanStack Table
- **Icons:** Lucide React
- **Theme:** Dark mode recommended

## File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Overview
│   │   ├── analytics/
│   │   ├── users/
│   │   ├── reports/
│   │   └── settings/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── charts/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   └── AreaChart.tsx
│   ├── tables/
│   │   ├── DataTable.tsx
│   │   └── columns.tsx
│   ├── cards/
│   │   ├── KPICard.tsx
│   │   └── StatCard.tsx
│   └── layouts/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── DashboardShell.tsx
├── lib/
│   ├── data.ts
│   └── utils.ts
└── hooks/
    └── useStats.ts
```

## Component Specs

### KPI Cards (4-6 metrics)
```tsx
<KPICard
  title="Total Revenue"
  value="$45,231.89"
  change="+20.1%"
  trend="up"
  icon={DollarSign}
/>
```

### Charts
- **Line Chart:** Trends over time
- **Bar Chart:** Comparisons
- **Pie/Donut:** Distributions
- **Area Chart:** Volume data

### Data Table
- Sortable columns
- Filterable
- Pagination
- Row selection
- Export (CSV/Excel)

### Sidebar Navigation
```tsx
const navItems = [
  { label: 'Overview', href: '/', icon: Home },
  { label: 'Analytics', href: '/analytics', icon: BarChart },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Reports', href: '/reports', icon: FileText },
  { separator: true },
  { label: 'Settings', href: '/settings', icon: Settings },
]
```

## Color Scheme (Dark Mode)

```css
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--card: 222.2 84% 4.9%;
--card-foreground: 210 40% 98%;
--primary: 217.2 91.2% 59.8%;
--secondary: 217.2 32.6% 17.5%;
--muted: 217.2 32.6% 17.5%;
--accent: 217.2 32.6% 17.5%;
--border: 217.2 32.6% 17.5%;
```

## Data Visualization Best Practices

1. **Hierarchy:** Most important KPIs at top
2. **Grouping:** Related metrics together
3. **Consistency:** Same chart type for same data type
4. **Colors:** Max 5-6 colors, meaningful
5. **Labels:** Clear, no jargon
6. **Interactivity:** Tooltips, drill-down

## Responsive Behavior

- **Desktop (lg+):** Full sidebar + content
- **Tablet (md):** Collapsible sidebar
- **Mobile (sm):** Bottom nav or hamburger menu
