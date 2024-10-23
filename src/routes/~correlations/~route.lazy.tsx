import {createLazyFileRoute} from '@tanstack/react-router';

import CSCorrelations from './CSCorrelations';

export const Route = createLazyFileRoute('/correlations')({
    component: CSCorrelations,
});
