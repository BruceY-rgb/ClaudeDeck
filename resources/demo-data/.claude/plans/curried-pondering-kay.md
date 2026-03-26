# Fix: Black Screen When Clicking Project in Office

Previous fixes (dashboard analytics, inline SessionDetailView, optional onBack) are done. The remaining issue: black screen when navigating to a project detail page in Office.

---

## Root Cause Analysis

Two simultaneous issues:

### Issue A: CSS Height Chain Collapse (Primary — causes black screen)

```
AppShell:
  div.h-screen.flex
    main.ml-64.flex-1.flex.flex-col.overflow-hidden
      div.p-6.flex-1.min-h-0.overflow-y-auto   ← SCROLL CONTAINER
        <Outlet/>
          ProjectDetailPage: div.h-full.flex.flex-col  ← height may resolve to 0
```

The AppShell outlet wrapper is a scroll container (`overflow-y-auto`) with padding (`p-6`). `ProjectDetailPage` uses `h-full` (height: 100%) which can fail to resolve to a concrete height inside a scroll container, causing the page to collapse to 0 height — appearing as a blank/black screen.

### Issue B: Worker Thread Crash (Secondary — sessions don't load)

The session parser Worker (`out/main/workers/session-parser.worker.js`) crashes with exit code 1 on startup. The `exit` handler in `SessionParserService` does NOT reject pending requests (only the `error` handler does), so IPC calls to `session.getDetail()` hang for 30 seconds before timing out.

---

## Fix A: Remove Worker — Inline parsing in SessionParserService

**File**: `src/main/services/SessionParserService.ts`

1. Remove `Worker` import and all Worker management code (`ensureWorker`, `terminateWorker`, `pendingRequests`, worker event handlers, `app.on("before-quit")`)
2. Import `createReadStream` from `fs` and `createInterface` from `readline`
3. Move the `parseJSONL` function from `session-parser.worker.ts` into this file (as a private method or module-level function)
4. In `parseSession()`, after cache check, directly call `parseJSONL()` (async, on main thread)
5. Keep the LRU cache

This eliminates the Worker crash entirely. Parsing is IO-bound (readline streaming), not CPU-bound, so main thread is fine.

**File**: `electron.vite.config.ts` — Remove the worker entry from `rollupOptions.input`:
```ts
// Remove this line:
'workers/session-parser.worker': resolve('src/main/workers/session-parser.worker.ts')
```

---

## Fix B: Fix ProjectDetailPage layout with absolute positioning

**File**: `src/renderer/components/layout/AppShell.tsx` (line 9)

Add `relative` to the outlet wrapper so absolutely-positioned children have a containing block:
```tsx
// From:
<div className="p-6 flex-1 min-h-0 overflow-y-auto">
// To:
<div className="p-6 flex-1 min-h-0 overflow-y-auto relative">
```

**File**: `src/renderer/pages/ProjectDetailPage.tsx` (line 314)

Use absolute positioning to escape the scroll container and get a concrete height:
```tsx
// From:
<div className="h-full flex flex-col">
// To:
<div className="absolute inset-0 flex flex-col overflow-hidden">
```

`absolute inset-0` fills the entire outlet wrapper's padding box (edge to edge). The page already has its own internal padding (`p-4` on header, `p-4` on agent list, etc.), so no extra padding is needed at root level.

**File**: `src/renderer/pages/SessionDetailPage.tsx`

Already uses `<div className="relative h-full">`. Change to match:
```tsx
// From:
<div className="relative h-full">
// To:
<div className="absolute inset-0">
```

---

## Files to modify

| File | Change |
|------|--------|
| `src/main/services/SessionParserService.ts` | Replace Worker with inline parseJSONL |
| `electron.vite.config.ts` | Remove worker entry (optional) |
| `src/renderer/components/layout/AppShell.tsx` | Add `relative` to outlet wrapper |
| `src/renderer/pages/ProjectDetailPage.tsx` | Use `absolute inset-0` instead of `h-full` |
| `src/renderer/pages/SessionDetailPage.tsx` | Use `absolute inset-0` instead of `relative h-full` |

## Verification

1. `npm run build` — no TypeScript errors
2. `npm run dev` — verify:
   - No `Worker exited with code: 1` in console
   - Clicking a project in Office shows the page correctly (not black)
   - Selecting a session loads and displays timeline inline
   - Other pages (Dashboard, Agents, Skills, etc.) still scroll correctly
