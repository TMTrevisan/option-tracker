# RollTrackr — Phase 6 Roadmap (Pro Tier Upgrades)

> A prioritized execution plan to elevate RollTrackr from a stable MVP to a commercial-grade platform.

## 🧱 Phase 6.1: The Foundation
*Strengthening the core before adding complex features.*

1.  [x] **Strict Supabase Typing:** Run `supabase gen types typescript` to replace all generic `any` casts in the backend services with strict, auto-generated database schemas. Prevents silent data bugs.
2.  [x] **Global Error Boundaries:** Implement Next.js `error.tsx` files across the dashboard segments to ensure API or database timeouts result in graceful fallback UI cards instead of full-page crashes.
3.  [x] **Price API Caching:** Implement a 60-second Next.js `unstable_cache` or `revalidate` on the `/api/prices` route. This stops us from hammering SnapTrade on every page load, eliminating rate limits and making page loads near-instant.

## 🧠 Phase 6.2: Core Domain Logic
*Making the options engine significantly smarter.*

4.  [ ] **Assignment Automation:** When a trade triggers an `ASSIGNMENT` status on a short option, the system should automatically generate a corresponding `EQUITY` position (e.g., creating a Long Stock position of 100 shares at the strike price of a Short Put).
5.  [x] **Break-Even Calculation:** Add dynamic "Break-Even Price" calculations to the `PositionModal` (e.g., *Strike + Premium* for Calls, *Strike - Premium* for Puts).

## 🎨 Phase 6.3: Pro UX & Polish
*Making the app feel like a $50/month SaaS.*

6.  [x] **URL State Persistence:** Sync the Date Range and Strategy filters to the URL query parameters (`?range=3m&strategy=Short+Put`). This allows for shareable links and maintains filter states when navigating between Options and Analytics.
7.  [x] **Skeleton Loaders:** Replace the basic spinners with animated CSS skeleton rows for tables and stat cards while data is fetching.
8.  [x] **"Campaign" View for Rolls:** Create a visual grouping or a dedicated "Roll History" tab inside the `PositionModal` that links chronologically adjacent positions on the same underlying, calculating the true net P/L of an entire rolling campaign.
9.  [ ] **Supabase Realtime:** Wire up Supabase WebSockets so that if a webhook fires from Robinhood in the background, the UI updates the row status and P/L instantly without a page refresh.
