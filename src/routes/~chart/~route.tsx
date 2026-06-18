import { createFileRoute } from '@tanstack/react-router';

import CSChart from './CSChart';

export const Route = createFileRoute('/chart')({
    component: CSChart,
});
