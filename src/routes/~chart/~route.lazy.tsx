import {createLazyFileRoute} from '@tanstack/react-router';

import Chart from './Chart';

export const Route = createLazyFileRoute('/chart')({
    component: Chart,
});
