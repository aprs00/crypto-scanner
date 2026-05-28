# TanStack Start Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (for the parallel per-route phases) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the crypto-scanner SPA to TanStack Start in **SPA mode** (SSR-ready), adopting the idiomatic `queryOptions` + loader + `useSuspenseQuery` data pattern and lifting key dashboard state into typed URL search params — with zero user-facing behavior regressions.

**Architecture:** The app is already on TanStack Router v1 + TanStack Query v5, so this is an upgrade, not a rewrite. We swap the Vite plugin to `tanstackStart()` (`spa.enabled`), replace the hand-written `main.tsx`/`index.html` entry with `getRouter()` + an auto/managed server+client entry, render the full HTML document from `__root.tsx`, and wire Query via `setupRouterSsrQueryIntegration`. Data stays **client-direct** (no server proxy). SSR is OFF (SPA mode) but the code is written SSR-safe so per-route SSR can be enabled later. Deployment target: **pure static on Vercel** (prerendered `_shell.html` + `dist/client`, no serverless functions).

**Tech Stack:** TanStack Start `^1.168`, TanStack Router `^1.170`, `@tanstack/react-router-ssr-query` `^1.167`, TanStack Query `^5.90`, Zod `^4` (search validation), React 19, React Compiler, Vite `^8`, ECharts, react-grid-layout, zustand, pnpm.

---

## Key Decisions (settled with user)

1. **SPA mode, SSR-ready** — `tanstackStart({ spa: { enabled: true } })`. Everything renders client-side; a static shell is prerendered. Architected so `ssr: true|'data-only'` can be flipped per-route later.
2. **Client-direct data** — no server functions / no API proxy. Browser keeps calling upstream APIs (own backend, Binance, CoinGecko, Hyperliquid) via axios/Query.
3. **Full idiomatic + URL state** — `queryOptions` factories everywhere; `loader` + `ensureQueryData` (blocking) / `prefetchQuery` (deferred) where inputs are known at route-load; **lift key view state into typed URL search params** (Zod v4) to make queries loader-eligible + deep-linkable; keep `useQuery` + `keepPreviousData` for rapidly-changing in-page params (avoids suspense flicker).

## Research-confirmed facts (authoritative, from TanStack/router@main)

- **Entry files**: only `vite.config.ts`, `src/router.tsx`, `src/routes/__root.tsx`, `tsconfig.json`, `package.json` are required. `src/routeTree.gen.ts` is generated. `src/server.ts` / `src/client.tsx` are **optional** (plugin auto-handles). We add a custom `src/client.tsx` only to preserve `StrictMode`.
- **Plugin order**: `tanstackStart()` BEFORE `@vitejs/plugin-react`.
- **`~` prefix**: supported via `tanstackStart({ tsr: { routeFilePrefix: '~' } })` (and `tsr.config.json` is merged). **No route files need renaming.**
- **Per-request QueryClient**: create `new QueryClient()` _inside_ `getRouter()`; pass via `context: { queryClient }`; call `setupRouterSsrQueryIntegration({ router, queryClient })` (defaults: `handleRedirects: true`, wraps `QueryClientProvider`, `shouldDehydrateQuery: () => true`).
- **Loaders**: `await context.queryClient.ensureQueryData(opts())` = blocking; bare `context.queryClient.prefetchQuery(opts())` (no await/return) = deferred/streamed behind `<Suspense>`. Same `queryOptions()` passed to loader AND `useSuspenseQuery`.
- **SPA mode semantics**: root route **component renders during shell prerender** (server build, no `window`); matched route components are replaced by the `defaultPendingComponent`. Non-root loaders run **client-only** in SPA mode. Client-only code in the root tree must live in effects.
- **Deployment**: no `target` option on `tanstackStart()`. Pure-static SPA = enable `spa`, omit Nitro, serve `dist/client` + `_shell.html` with `404 → /_shell.html` rewrite. (Vercel native Start support via `nitro/vite` is the server alternative, not used here.)
- **Search validation**: **Zod v4 implements Standard Schema natively** → pass the schema straight to `validateSearch`, **no `@tanstack/zod-adapter`**. Use `.catch(default)` so malformed URLs degrade gracefully. Keep `loaderDeps` minimal (only params the loader uses). Writes go through `Link`/`navigate({ search, replace })`; clean URLs via `stripSearchParams(defaults)`.

## Landmine audit (verified against current code)

- `useServerNotifications` (WebSocket) — side effects in `useEffect` → **safe** in shell. ✓
- `CSNavigation` (`window.setInterval`) — in `useEffect` → safe. ✓
- `useToastStore` — no localStorage → safe. ✓
- Route-component browser APIs (`DepthChart` → `window.devicePixelRatio`, TradingView `document.createElement`) — never render during shell prerender (pending fallback) → safe. ✓
- **QueryClient singleton** (`src/lib/react-query.ts`) imported only by `main.tsx` (deleted) → remove file. All other usage is `useQueryClient()` hook → unaffected. ✓
- **zustand `persist`** stores (`useChartStore`, `useChartSourceStore`, `useChartLayoutStore`) `create()` at module-eval during shell prerender → add explicit SSR-safe storage guard.

---

## File Structure

**Create:**

- `src/router.tsx` — `getRouter()`: per-request QueryClient, router config, SSR-query integration, `Register` type.
- `src/client.tsx` — client hydration entry (`StrictMode` + `StartClient`).
- `src/lib/safeStorage.ts` — SSR-safe `createJSONStorage` wrapper for zustand persist.
- `src/components/UI/DefaultCatchBoundary/` — terminal-styled error boundary (+ `index.ts`).
- `src/components/UI/NotFound/` — terminal-styled 404 (+ `index.ts`).
- `src/lib/queries/` — shared `queryOptions` factories (or co-locate per route; see Phase 2).
- `src/routes/~index/search.ts`, `src/routes/~chart/search.ts` — Zod search schemas (Phase 3).

**Modify:**

- `vite.config.ts` — `tanstackStart({ spa, tsr })` + svgr + react(compiler).
- `tsconfig.json` — `moduleResolution: "Bundler"`, add `vite/client` types.
- `src/routes/~__root.tsx` — `createRootRouteWithContext`, `head()`, HTML document shell, devtools.
- `package.json` — deps swap + scripts.
- `vercel.json` — static shell rewrite.
- `.gitignore` — `.output`, `.nitro`, `.vercel`.
- Per-route `api.tsx` / hooks → `queryOptions` factories (Phase 2).
- Per-route `~route.tsx` + components → loaders + search params + `useSuspenseQuery`/`useQuery` (Phase 3).

**Delete:**

- `src/main.tsx`, `index.html`, `src/lib/react-query.ts`.

---

## PHASE 1 — Foundation (INLINE, sequential, atomic). After this the app runs on Start in SPA mode with existing `useQuery` intact (behavior-preserving milestone).

### Task 1.1: Dependencies

- [ ] Remove `@tanstack/router-vite-plugin`, `@tanstack/router-devtools`.
- [ ] Add `@tanstack/react-start`, `@tanstack/react-router-ssr-query`, `@tanstack/react-router-devtools`, `zod@^4`.
- [ ] Bump `@tanstack/react-router` → `^1.170`, `vite` → `^8`, `@vitejs/plugin-react` → `^6`.
- [ ] Keep `@tanstack/react-query@^5.90`, `babel-plugin-react-compiler`, `vite-plugin-svgr` (verify Vite 8 compat; if incompatible, upgrade svgr or pin `vite@^7` — Start peer allows `>=7`).

```bash
pnpm remove @tanstack/router-vite-plugin @tanstack/router-devtools
pnpm add @tanstack/react-start @tanstack/react-router-ssr-query @tanstack/react-router-devtools zod
pnpm add -D vite@^8 @vitejs/plugin-react@^6
pnpm add @tanstack/react-router@^1.170
```

Verify: `pnpm install` completes; check peer-dep warnings for svgr/vite. Expected: no hard errors.

### Task 1.2: `vite.config.ts`

```ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
    plugins: [
        tanstackStart({
            spa: { enabled: true, prerender: { crawlLinks: true } },
            tsr: { routeFilePrefix: '~' },
        }),
        svgr(),
        // React plugin MUST come after tanstackStart()
        react({
            babel: { plugins: ['babel-plugin-react-compiler'] },
        }),
    ],
    resolve: {
        alias: [{ find: '@', replacement: new URL('./src', import.meta.url).pathname }],
    },
});
```

### Task 1.3: `tsconfig.json`

Change `"moduleResolution": "Node"` → `"Bundler"`; add `"vite/client"` to `types`. Keep `paths`, `strict`, `noEmit`, `jsx: react-jsx`.

```json
"moduleResolution": "Bundler",
"types": ["node", "vite/client"],
```

### Task 1.4: `src/router.tsx` (create)

```tsx
import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import DefaultCatchBoundary from '@/components/UI/DefaultCatchBoundary';
import NotFound from '@/components/UI/NotFound';
import CSSpinner from '@/components/UI/CSSpinner';

import { routeTree } from './routeTree.gen';

export function getRouter() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000 } },
    });

    const router = createRouter({
        routeTree,
        context: { queryClient },
        defaultPreload: 'intent',
        defaultPendingComponent: () => (
            <div className="center-overlay">
                <CSSpinner />
            </div>
        ),
        defaultErrorComponent: DefaultCatchBoundary,
        defaultNotFoundComponent: () => <NotFound />,
        scrollRestoration: true,
    });

    setupRouterSsrQueryIntegration({ router, queryClient });

    return router;
}

declare module '@tanstack/react-router' {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
```

Verify CSSpinner/CSNavigation/CSToast export style (default vs named) and `.center-overlay` exists in `utilities.css` (it does per CLAUDE.md). Adjust imports to match.

### Task 1.5: `src/client.tsx` (create)

```tsx
import { StartClient } from '@tanstack/react-start/client';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

hydrateRoot(
    document,
    <StrictMode>
        <StartClient />
    </StrictMode>,
);
```

### Task 1.6: `src/routes/~__root.tsx` (rewrite)

```tsx
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { ReactNode } from 'react';

import indexCss from '@/index.css?url';
import CSNavigation from '@/components/Layouts/CSNavigation';
import CSToastContainer from '@/components/UI/CSToast';
import useServerNotifications from '@/hooks/useServerNotifications';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    head: () => ({
        meta: [
            { charSet: 'UTF-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
            {
                name: 'description',
                content: 'Explore cryptocurrency charts and statistics for informed decision-making.',
            },
            { name: 'keywords', content: 'crypto, cryptocurrency, charts, stats, bitcoin, ethereum, blockchain' },
            { name: 'msapplication-TileColor', content: '#da532c' },
            { name: 'theme-color', content: '#ffffff' },
            { title: 'crypto-scanner' },
        ],
        links: [
            { rel: 'stylesheet', href: indexCss },
            { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
            { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
            { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
            { rel: 'manifest', href: '/site.webmanifest' },
            { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#5bbad5' },
        ],
    }),
    component: RootComponent,
});

function RootComponent() {
    return (
        <RootDocument>
            <BaseLayout />
        </RootDocument>
    );
}

function BaseLayout() {
    useServerNotifications({ debounceMs: 1000, maxReconnectAttempts: 20 });

    return (
        <div className="flex flex-col h-full">
            <CSNavigation />
            <div className="flex flex-col flex-1 min-h-0">
                <Outlet />
            </div>
            <CSToastContainer />
        </div>
    );
}

function RootDocument({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                {children}
                {import.meta.env.DEV && (
                    <>
                        <TanStackRouterDevtools position="bottom-right" />
                        <ReactQueryDevtools buttonPosition="bottom-left" />
                    </>
                )}
                <Scripts />
            </body>
        </html>
    );
}
```

### Task 1.7: SSR-safe zustand storage (`src/lib/safeStorage.ts` + apply)

```ts
import { createJSONStorage } from 'zustand/middleware';

const noopStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
};

export const safeJSONStorage = () =>
    createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : noopStorage));
```

Apply `storage: safeJSONStorage()` to the persist options in `useChartStore.ts`, `~chart/useChartSourceStore.ts`, `~chart/useChartLayoutStore.ts`.

### Task 1.8: Error / NotFound components (terminal-styled)

Create `src/components/UI/DefaultCatchBoundary/{DefaultCatchBoundary.tsx,index.ts}` and `src/components/UI/NotFound/{NotFound.tsx,index.ts}`. Use `var(--down)` for the error glyph, ALLCAPS labels, mono, `.btn` from controls.css, `useRouter().invalidate()` for "RETRY", `<Link to="/">HOME</Link>`. Keep dense/hairline per CLAUDE.md.

### Task 1.9: Delete old entry + singleton

- [ ] `git rm src/main.tsx index.html src/lib/react-query.ts`
- [ ] Verify no remaining imports of `@/lib/react-query` (grep) or `/src/main.tsx` (was only in index.html).

### Task 1.10: `package.json` scripts + `vercel.json` + `.gitignore`

- scripts: `"dev": "vite dev"`, `"build": "vite build && tsc --noEmit"`, `"preview": "vite preview"`, keep `"type-check": "tsc --noEmit"`, `"lint"`. Remove old `tsc && vite build`.
- `vercel.json` (static shell): `{ "outputDirectory": "dist/client", "rewrites": [{ "source": "/(.*)", "destination": "/_shell.html" }] }` — **verify output dir after first build** (could be `dist/client`); adjust if Start emits elsewhere. Flag: real Vercel deploy needed to confirm.
- `.gitignore`: add `.output`, `.nitro`, `.vercel`.

### Task 1.11: base.css / `#root` cleanup

The app no longer has `#root` (we hydrate `document`). Check `src/styles/base.css`: ensure `html, body { height: 100% }` so `.h-full` top div fills viewport; remove or keep a harmless `#root` rule. Verify no FOUC.

### Task 1.12: Phase 1 verification gate

- [ ] `pnpm dev` → app boots; `/`, `/chart`, `/treemap` render; WebSockets connect (top-bar ticker + notifications); ECharts + grid render; no console errors; HMR works.
- [ ] `pnpm type-check` passes.
- [ ] `pnpm build` → prerender produces `_shell.html`; `tsc --noEmit` clean.
- [ ] `pnpm preview` → served shell hydrates; navigation + back/forward work; no console errors.
- [ ] Confirm React Compiler still applied (build log / no eslint-react-hooks regressions).
- [ ] Commit: `feat: migrate to TanStack Start (SPA mode), behavior-preserving foundation`.

---

## PHASE 2 — `queryOptions` factories (queryOptions everywhere). Can fan out by file.

**Pattern** (replace each `useX` hook that wraps `useQuery`):

```tsx
// before: const useFoo = (params) => useQuery({ queryKey:['foo',params], queryFn: ... })
// after:
export const fooQueryOptions = (params: FooParams) =>
    queryOptions({
        queryKey: ['foo', params],
        queryFn: async () => (await api.post<FooResponse>('foo', params)).data,
        // keep existing options: staleTime, gcTime, refetchInterval, placeholderData, enabled
    });
// thin hook kept for components that stay on useQuery:
export const useFoo = (params: FooParams) => useQuery(fooQueryOptions(params));
```

- [ ] **Task 2.1** `src/routes/~index/api.tsx` — convert all 9 hooks (`average-prices`, `pearson-correlation`, `z-score-matrix` ×2, `z-score-heatmap`, `bootstrap`, `correlation-pair-history`, `cointegration-pair-history`, `cointegration-live-table`) to `*QueryOptions` factories + thin `use*` wrappers. Preserve every existing option verbatim (refetchInterval, staleTime, gcTime, placeholderData: keepPreviousData, enabled).
- [ ] **Task 2.2** `src/routes/~treemap/api.tsx` — `heatmapQueryOptions()` (no params) + `useHeatmapData`.
- [ ] **Task 2.3** `src/services/exchanges/hooks.ts` — convert to factories (evaluate each; keep `enabled`/param-driven semantics).
- [ ] **Task 2.4** `useTopBarTicker.ts` — WebSocket, **leave as-is** (not a REST query).
- [ ] Verify: `pnpm type-check` + `pnpm dev` (data still loads identically). Commit.

---

## PHASE 3 — URL state + loaders (FAN OUT: one subagent per route subtree; independent). Each subagent gets the canonical patterns below + Phase 2 factories.

**Canonical route pattern (search → loaderDeps → loader → component):**

```tsx
import { z } from 'zod';
import { createFileRoute } from '@tanstack/react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';

const searchSchema = z.object({
    exchange: z.string().catch('binance'),
    symbol: z.string().catch('BTCUSDT'),
    window: z.number().catch(60),
});

export const Route = createFileRoute('/...')({
    validateSearch: searchSchema, // Zod v4 — no adapter
    loaderDeps: ({ search }) => ({ exchange: search.exchange, window: search.window }), // ONLY loader-used keys
    loader: ({ context, deps }) => {
        // blocking for must-have data:
        return context.queryClient.ensureQueryData(fooQueryOptions(deps));
        // or deferred (no await/return) for slow/non-critical:
        // context.queryClient.prefetchQuery(barQueryOptions(deps));
    },
    component: RouteComponent,
});

function RouteComponent() {
    const search = Route.useSearch();
    // blocking/critical → suspense:
    const foo = useSuspenseQuery(fooQueryOptions({ exchange: search.exchange, window: search.window }));
    // rapidly-changing in-page param → keepPreviousData (no flicker):
    const bar = useQuery({ ...barQueryOptions(search), placeholderData: keepPreviousData });
    // writes:
    const navigate = Route.useNavigate();
    const setWindow = (window: number) => navigate({ search: (p) => ({ ...p, window }), replace: true });
}
```

**Rules for what to lift into URL search params (vs keep in zustand/local):**

- **Lift** (shareable/bookmarkable, drives a query): selected exchange, symbol/base symbol, timeframe/window, metric, comparison selections.
- **Keep in zustand** (persisted device prefs / layout): `useChartStore` grid layouts, groups, chart instances; chart panel layout. These are not query inputs and shouldn't be in the URL.
- **Keep local React state** (ephemeral): open drawers/menus, in-progress draft inputs (push to URL only on commit; debounce with `replace: true`).
- Clean URLs: add `stripSearchParams(defaults)` middleware so default values don't clutter the URL.

- [ ] **Task 3.1 (Treemap — simplest, do first inline as the reference):** `~treemap/~route.lazy.tsx` → add `loader: ({ context }) => context.queryClient.ensureQueryData(heatmapQueryOptions())`; `CSTreemap` uses `useSuspenseQuery(heatmapQueryOptions())`. No search params (static endpoint). Verify suspense + pending component.
- [ ] **Task 3.2 (Treemap promote loader to non-lazy route if needed):** loaders belong on the route definition; ensure the loader is on `~treemap/~route` (may need to move loader out of `.lazy` since lazy files can't define loaders — loaders go in the non-lazy `~route.tsx`; create `~treemap/~route.tsx` with the route+loader and keep component in `.lazy`). **Confirm against Router rules: `createLazyFileRoute` cannot contain `loader`/`validateSearch`; those go in the non-lazy route file.**
- [ ] **Task 3.3 (Index dashboard — subagent):** Define `~index/search.ts` (Zod schema for the dashboard-level params that drive queries — exchange/window/metric/selected symbols as applicable). Move those reads from `useChartStore`/local state to `Route.useSearch()`; writes via `navigate({ search, replace:true })`. Add `loaderDeps` (minimal) + `loader` with `ensureQueryData` for the param-known queries (e.g. `average-prices`, `z-score-*`, `pearson-correlation`). For per-widget rapidly-changing params, use `useQuery` + `keepPreviousData`. Keep grid layout/groups in `useChartStore`. Add `stripSearchParams`.
- [ ] **Task 3.4 (Chart — subagent):** Define `~chart/search.ts` (exchange/symbol/source). Migrate `useChartSourceStore`-derived _selection_ to search params (keep layout in `useChartLayoutStore`). Loader/suspense only where inputs are param-known and not socket-driven; socket/order-book stays client `useEffect`. Many chart panels are WebSocket — leave those.
- [ ] Each subagent verifies: `pnpm type-check`, route loads, deep-link (paste URL with params) restores state, back/forward works, no console errors. Commit per route.

---

## PHASE 4 — Verification, deployment, docs, memory

- [ ] **4.1 Full verification:** `pnpm lint`, `pnpm type-check`, `pnpm build` (shell prerenders, no errors), `pnpm preview` — all 3 routes, sockets, charts, deep links, back/forward, refresh-on-deep-link, mobile pages; zero console errors. Use the `verify`/`run` skill or Chrome MCP to drive the app.
- [ ] **4.2 Deployment:** confirm `dist/client` + `_shell.html` artifacts; finalize `vercel.json`. (Real Vercel deploy needed to fully confirm static serving + shell rewrite.)
- [ ] **4.3 Docs:** update `CLAUDE.md` (routing/data-fetching conventions: queryOptions factories, loader patterns, search-params-as-state), `README.md`, `.nvmrc` if bumping.
- [ ] **4.4 Memory:** record migration outcome + new conventions in project memory.
- [ ] **4.5** Final commit + `superpowers:finishing-a-development-branch` (PR or merge per user).

---

## Verification gates (run after every phase)

1. `pnpm type-check` — clean.
2. `pnpm dev` — boots, all routes, sockets connect, charts render, no console errors.
3. `pnpm build` — prerenders `_shell.html`, `tsc --noEmit` clean.
4. `pnpm preview` — hydrates, navigation/deep-links/back-forward work, no console errors.

## Rollback

All work is on `feat/tanstack-start-migration`. `main` is untouched. Each phase commits independently; revert by commit if needed.
