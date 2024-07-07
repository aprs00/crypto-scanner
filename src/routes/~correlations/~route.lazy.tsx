import {createLazyFileRoute} from '@tanstack/react-router';

import Correlations from './Correlations';

export const Route = createLazyFileRoute('/correlations')({
    component: Correlations,
});
