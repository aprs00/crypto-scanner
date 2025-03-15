import { createLazyFileRoute } from '@tanstack/react-router';

import CSTreemap from './CSTreemap';

export const Route = createLazyFileRoute('/treemap')({
    component: CSTreemap,
});
