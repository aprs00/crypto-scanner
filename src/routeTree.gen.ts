/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/~__root'
import { Route as IndexRouteImport } from './routes/~index/~route'

// Create Virtual Routes

const ZScoreRouteLazyImport = createFileRoute('/z-score')()
const TreemapRouteLazyImport = createFileRoute('/treemap')()
const CorrelationsRouteLazyImport = createFileRoute('/correlations')()
const ChartRouteLazyImport = createFileRoute('/chart')()

// Create/Update Routes

const ZScoreRouteLazyRoute = ZScoreRouteLazyImport.update({
  path: '/z-score',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/~z-score/~route.lazy').then((d) => d.Route),
)

const TreemapRouteLazyRoute = TreemapRouteLazyImport.update({
  path: '/treemap',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/~treemap/~route.lazy').then((d) => d.Route),
)

const CorrelationsRouteLazyRoute = CorrelationsRouteLazyImport.update({
  path: '/correlations',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/~correlations/~route.lazy').then((d) => d.Route),
)

const ChartRouteLazyRoute = ChartRouteLazyImport.update({
  path: '/chart',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/~chart/~route.lazy').then((d) => d.Route))

const IndexRouteRoute = IndexRouteImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRoute
    }
    '/chart': {
      id: '/chart'
      path: '/chart'
      fullPath: '/chart'
      preLoaderRoute: typeof ChartRouteLazyImport
      parentRoute: typeof rootRoute
    }
    '/correlations': {
      id: '/correlations'
      path: '/correlations'
      fullPath: '/correlations'
      preLoaderRoute: typeof CorrelationsRouteLazyImport
      parentRoute: typeof rootRoute
    }
    '/treemap': {
      id: '/treemap'
      path: '/treemap'
      fullPath: '/treemap'
      preLoaderRoute: typeof TreemapRouteLazyImport
      parentRoute: typeof rootRoute
    }
    '/z-score': {
      id: '/z-score'
      path: '/z-score'
      fullPath: '/z-score'
      preLoaderRoute: typeof ZScoreRouteLazyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  IndexRouteRoute,
  ChartRouteLazyRoute,
  CorrelationsRouteLazyRoute,
  TreemapRouteLazyRoute,
  ZScoreRouteLazyRoute,
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "~__root.tsx",
      "children": [
        "/",
        "/chart",
        "/correlations",
        "/treemap",
        "/z-score"
      ]
    },
    "/": {
      "filePath": "~index/~route.tsx"
    },
    "/chart": {
      "filePath": "~chart/~route.lazy.tsx"
    },
    "/correlations": {
      "filePath": "~correlations/~route.lazy.tsx"
    },
    "/treemap": {
      "filePath": "~treemap/~route.lazy.tsx"
    },
    "/z-score": {
      "filePath": "~z-score/~route.lazy.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
