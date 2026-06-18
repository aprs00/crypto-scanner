import { createFileRoute } from '@tanstack/react-router';

import { heatmapQueryOptions } from './api';
import CSTreemap from './CSTreemap';

// Start always runs the automatic route code-splitter, so `component` (the heavy
// ECharts treemap) is split into its own chunk while `loader` stays in the
// critical chunk and warms the cache for the route's useSuspenseQuery. No
// separate ~route.lazy.tsx is needed.
export const Route = createFileRoute('/treemap')({
    loader: ({ context }) => context.queryClient.ensureQueryData(heatmapQueryOptions()),
    component: CSTreemap,
});
