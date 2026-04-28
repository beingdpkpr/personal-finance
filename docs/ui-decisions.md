# UI Decisions

Design decisions made 2026-04-29. Treat as the foundation for all future UI work.

## Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Visual theme | Dark Glass | Deep navy bg (`#0b0c14`), frosted-glass cards, ambient radial glows. Always dark. |
| Navigation | Floating Pill Dock | Centered frosted-glass pill at bottom, icons only, active item gets accent highlight + dot. Replaces both `SidebarNav` and `BottomNav`. Same component on web and mobile. |
| Dashboard layout | Hero Number + Bento Grid | One dominant net savings number with sparkline, 3-tile bento grid (income / spent / savings rate). |
| Light mode | Removed for now | Dark glass aesthetic depends on it. Toggle can return later. |
| Motion | Entrance animations | Card fade-up on screen load, dock active-item transition, ambient glow on hero card. |
| Scope | Core screens first | Dashboard, Transactions, Budgets, Monthly. Others in a follow-up. |

## Glass Surface Tokens (`constants/theme.ts`)

```typescript
glass:       'rgba(255,255,255,0.06)'   // frosted card background
glassBorder: 'rgba(255,255,255,0.10)'   // frosted card border
glassStrong: 'rgba(255,255,255,0.09)'   // slightly more opaque surface
glowPurple:  'rgba(159,110,255,0.22)'   // ambient glow blob — purple
glowBlue:    'rgba(79,136,255,0.18)'    // ambient glow blob — blue
glowGreen:   'rgba(46,209,138,0.15)'    // ambient glow blob — green/savings
```

## Dock Nav Spec (`components/DockNav.tsx`)

- Shape: rounded pill, `borderRadius: 28`
- Background: `rgba(25,26,40,0.88)` + blur (web)
- Border: `rgba(255,255,255,0.12)`
- Shadow: `0 8px 32px rgba(0,0,0,0.5)`
- Position: absolute bottom center, `bottom: 16`, `zIndex: 100`
- Active item: `rgba(240,114,42,0.15)` bg, accent icon, dot indicator below
- 5 items: Dashboard, Transactions, Budgets, Monthly, Profile
- Divider before Profile

## Screen Scope

| Screen | Status |
|---|---|
| Dashboard | ✅ Redesigned |
| Transactions | ✅ Redesigned |
| Budgets | ✅ Redesigned |
| Monthly | ✅ Redesigned |
| Yearly | ⏳ Follow-up |
| Goals | ⏳ Follow-up |
| Net Worth | ⏳ Follow-up |
| Recurring | ⏳ Follow-up |
| Profile | ⏳ Follow-up |
| Login | ⏳ Follow-up |
