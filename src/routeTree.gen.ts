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

const TreemapRouteLazyImport = createFileRoute('/treemap')()
const PearsonRouteLazyImport = createFileRoute('/pearson')()
const ChartRouteLazyImport = createFileRoute('/chart')()

// Create/Update Routes

const TreemapRouteLazyRoute = TreemapRouteLazyImport.update({
  path: '/treemap',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/~treemap/~route.lazy').then((d) => d.Route),
)

const PearsonRouteLazyRoute = PearsonRouteLazyImport.update({
  path: '/pearson',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/~pearson/~route.lazy').then((d) => d.Route),
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
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRoute
    }
    '/chart': {
      preLoaderRoute: typeof ChartRouteLazyImport
      parentRoute: typeof rootRoute
    }
    '/pearson': {
      preLoaderRoute: typeof PearsonRouteLazyImport
      parentRoute: typeof rootRoute
    }
    '/treemap': {
      preLoaderRoute: typeof TreemapRouteLazyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexRouteRoute,
  ChartRouteLazyRoute,
  PearsonRouteLazyRoute,
  TreemapRouteLazyRoute,
])

/* prettier-ignore-end */
