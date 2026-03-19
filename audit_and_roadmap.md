# RollTrackr — Audit & Roadmap

> Last updated: 2026-03-19 | Build #30

## ✅ Completed

| Feature | Notes |
|---------|-------|
| Live Open P/L from SnapTrade/Robinhood | Displayed globally and individually |
| IV, Bid/Ask, OI, Underlying Price | Added to position modals |
| Auto-sync cron + Force Resync UI | Mon–Fri 6am PT + Wipe/Rebuild button |
| Strategy auto-classification (Side-Aware) | Accurately handles Long vs Short closing logic |
| Date range filter (All/7d/1m/3m/6m/12m/Custom) | Fully functional across tables |
| Account filter dropdown on Options + Equities | Working |
| Position_id linking & Discrete Contracts | Options separated strictly by strike/exp/type |
| Auto-Expiration Sweep | Automatically closes options that expire worthless |
| macOS-style sync terminal UI | Added animated progress bar |
| Sort chips & Column Sorting | Options (chips) & Equities (column click) |
| Position detail modal with trade timeline | Working, added "Log Trade / Roll" shortcut |
| Mobile Responsive Layout | Hamburger menu, stackable grids, horizontal tables |
| Dashboard charts & Analytics | Real P/L, Win Rate, Strategy Mix, Avg DTE |
| Toast notification system | Global feedback for actions |
| CSV export | Data portability enabled |
| Black-Scholes Greeks | Δ, Γ, Θ, ν live in position modal |

---

## 🔴 Remaining Bugs

*No major functional bugs currently known after Vercel deployment and Force Resync.*

---

## 🟡 Data & Backend Enhancements (To-Do)

| # | Issue | Fix |
|---|-------|-----|
| 1 | **No Zod validation on API surface** | Implement Zod schemas to validate incoming webhook/sync payloads to prevent database corruption. |
| 2 | **Server-Side Pagination** | 800+ rows on one page can slow down DOM rendering. Implement "Load More" or pagination via Supabase `range()`. |

---

## 🔵 UX & UI Improvements (To-Do)

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 3 | **Trade modal** | Need ability to edit trade notes post-sync. | Add a small "Edit" pencil icon next to notes in the timeline. |
| 4 | **Brokerage page** | "Add Account" button redirect has no loading state. | Show "Loading..." spinner during SnapTrade OAuth redirect. |
| 5 | **Analytics filtering** | Analytics page shows all-time data. | Add the `DateRangeFilter` to Analytics to allow filtering stats by year/month. |

---

## Recommended Next Steps
1. Add Zod validation to API routes for robust error handling.
2. Implement server-side pagination for Options/Equities to improve performance for users with 1000+ trades.
3. Add a Date Range filter to the Analytics dashboard.
