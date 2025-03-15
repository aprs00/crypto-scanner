import { createLazyFileRoute } from '@tanstack/react-router';

import ZScore from './ZScore';

export const Route = createLazyFileRoute('/z-score')({
    component: ZScore,
});
