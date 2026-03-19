# RollTrackr — Audit & Roadmap

> Last updated: 2026-03-19 | Build #26

## ✅ Completed

| Feature | Build |
|---------|-------|
| Live Open P/L from SnapTrade/Robinhood | #26 |
| IV + underlying price in position modal | #26 |
| Date range filter (All/7d/1m/3m/6m/12m/Custom) | #25 |
| Auto-sync cron Mon–Fri 6am PT | #25 |
| Account filter dropdown on Options + Equities | #24 |
| Position_id backfill on duplicate trades | #23 |
| Strategy auto-classification (Short Put, Covered Call, etc.) | #23 |
| Date picker wired into Sync API | #23 |
| macOS-style sync terminal UI | #23 |
| Sort chips: Date, P/L, Symbol, Status | #23 |
| Options + Equities filters: search, status, strategy | #22 |
| Position detail modal with trade timeline | #22 |
| Dashboard live metrics (YTD P/L, Win Rate, strategy breakdown) | earlier |

---

## 🔴 Remaining Bugs

| # | Issue | Root Cause | Fix |
|---|-------|-----------|-----|
| 1 | **"Refresh" button on Brokerage page does nothing** | No onClick handler | Wire client-side re-fetch |
| 2 | **"Delete Position" button does nothing** | No handler wired | Wire DELETE + toast confirmation |
| 3 | **Alert() used for sync errors** | `SyncButton` fallback | Already fixed in new SyncButton |

---

## 🔵 About Greeks

**SnapTrade / Robinhood does NOT expose Greeks** (Δ, Γ, Θ, Ν) through their API.

What IS available from the SnapTrade SDK:
| Field | Source |
|-------|--------|
| `price` (mark per share) | `OptionsPosition` |
| `average_purchase_price` (per contract) | `OptionsPosition` |
| `units` (# contracts, +long/-short) | `OptionsPosition` |
| `bid_price`, `ask_price`, `last_price` | `OptionQuote` |
| `implied_volatility` | `OptionQuote` |
| `underlying_price` | `OptionQuote` |
| `open_interest`, `volume` | `OptionQuote` |

To get Delta/Gamma/Theta/Vega: would need a Black-Scholes calculation library (`financejs` or similar) computing from strike, expiration, IV, risk-free rate.

---

## 🟠 High-Priority Remaining Work

| Priority | Feature | Impact |
|----------|---------|--------|
| ✅ DONE | `CRON_SECRET` set on Vercel | Nightly sync is live |
| ✅ DONE | **Dashboard chart wired to real P/L** | Real-time YTD performance curve |
| ✅ DONE | **Analytics tab** | Win rate, strategy mix, best/worst tickers |
| ✅ DONE | **Toast notification system** | Global feedback system implemented |
| ✅ DONE | **CSV export** | Data portability for Options/Equities |
| ✅ DONE | **Black-Scholes Greeks** | Δ, Γ, Θ, ν live in position modal |
| P3 | **Mobile responsive layout** | sidebar hamburger, scrollable tables |
| P3 | **bid/ask spread + open interest in modal** | call OptionQuote endpoint |

---

## 🟡 Data & Backend Issues

| # | Issue | Fix |
|---|-------|-----|
| 6 | **`trades.position_id` never linked** | After inserting a trade, immediately run `UPDATE trades SET position_id = $1 WHERE id = $2` |
| 7 | **No Zod validation on API surface** | Any malformed payload can corrupt the database silently |
| 8 | **`trade_type` column is TEXT not ENUM** | DB will silently accept `"buy"`, `"Buy"`, `"BUY"` — add a CHECK constraint or ENUM |
| 9 | **Auto-sync cadence missing** | User has to manually click Sync — no daily webhook or cron trigger. Vercel Cron exists at `/api/cron/process-expirations` but doesn't sync new trades |
| 10 | **`brokerage_trade_id` unique constraint** | Currently deduplication only works if the constraint exists — was this SQL ever run? Needs verification |
| 11 | **Open P/L is N/A for all open positions** | No live price fetch — need to call Alpha Vantage or a price service to compute current market value vs. cost basis |

---

## 🟠 Missing Filters & Sorts

### Options Page
| Filter/Sort | Type |
|-------------|------|
| Sort by: P/L (best/worst), Date (newest/oldest), Symbol (A-Z) | Column header click |
| Filter: Date range (from / to) | Date picker |
| Filter: Option type (Call / Put) | Toggle |
| Filter: P/L range (profitable only / loss only) | Checkbox |
| Filter: DTE at open (0–7d, 7–30d, 30+d) | Dropdown |

### Equities Page
| Filter/Sort | Type |
|-------------|------|
| Sort by Symbol, Cost Basis, Qty, P/L | Column header click |
| Filter by date range | Date picker |

### Global
| Feature | Notes |
|---------|-------|
| CSV export | Download filtered view as spreadsheet |
| Pagination / "Load More" | 849 rows on one page = slow render |

---

## 🔵 UX & UI Improvements

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 12 | **Sidebar** | Active state logic is correct but "Log Trade" prefix-matches all paths | No active bug, works correctly |
| 13 | **Dashboard** | YTD P/L card shows `$0.00` for open positions (correct) but unintuitive | Add tooltip: "Realized P/L only. Open positions excluded." |
| 14 | **Dashboard chart** | `DashboardChart` is not wired to real data | Replace placeholder with real P/L over time from trades table |
| 15 | **Brokerage page** | Date picker defaulting to `2026-02-17` (hardcoded) | Default to 1 year ago dynamically |
| 16 | **Sync progress** | Progress bar stops at 800/849 then jumps to done | Add animated progress bar using character count / estimated records |
| 17 | **Empty states** | "No positions found" is plain text | Upgrade with icon + actionable CTA button |
| 18 | **Mobile layout** | Not responsive — sidebar overlaps content on small screens | Add hamburger menu + responsive CSS |
| 19 | **Toast system** | No feedback for successful actions (trade logged, position deleted) | Add lightweight toast notifications |
| 20 | **Trade modal** | "Manage Trade" button missing from sync-imported positions | Show edit form to add notes, tag strategy type |
| 21 | **Options page** | Strategy column shows "Option Trade" for all sync-imported rows | SnapTrade type field needs mapping (BTO+CALL = Covered Call, STO+PUT = Short Put) |
| 22 | **Brokerage page** | "Add Account" button re-opens the OAuth flow but no feedback | Show "Loading..." state during redirect |

---

## 🟢 High-Value Features to Build Next

| Priority | Feature | Description |
|----------|---------|-------------|
| P0 | **Auto-sync via Vercel Cron** | Call the sync API daily at 6am so user never has to click the button |
| P0 | **Wire position_id on trades** | So modal shows full trade history |
| P1 | **Column sorting** | Click any header to sort asc/desc |
| P1 | **Strategy auto-classification** | Map BTO+CALL → "Covered Call", STO+PUT → "Short Put", etc. |
| P1 | **Live Open P/L** | Fetch current price via Alpha Vantage and compute unrealized P/L |
| P2 | **Dashboard chart real data** | Plot realized P/L curve over time |
| P2 | **CSV export** | Let user download filtered positions |
| P2 | **Analytics tab** | Win rate by strategy, avg DTE, max drawdown, rolling P/L |
| P3 | **Mobile responsive** | Responsive sidebar + tables |

---

## Recommended Execution Order
1. Fix `position_id` linking on trades ← makes modal useful immediately
2. Wire the date picker to the Sync API
3. Add column sorting to Options & Equities
4. Add strategy auto-classification
5. Auto-sync cron job
6. Live Open P/L via Alpha Vantage
7. Dashboard chart with real data
