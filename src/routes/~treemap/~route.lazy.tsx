import {createLazyFileRoute} from '@tanstack/react-router';

import Treemap from './Treemap';

export const Route = createLazyFileRoute('/treemap')({
    component: Treemap,
});
