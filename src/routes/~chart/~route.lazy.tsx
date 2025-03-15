import { createLazyFileRoute } from '@tanstack/react-router';

import CSChart from './CSChart';

export const Route = createLazyFileRoute('/chart')({
    component: CSChart,
});
