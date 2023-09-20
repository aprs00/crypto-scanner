import {RouterProvider} from '@tanstack/react-router';
import {QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {inject} from '@vercel/analytics';

import './index.css';

import {queryClient} from '@/lib/react-query';
import {router} from './lib/router';

inject();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtools
            initialIsOpen
            position="bottom-left"
            toggleButtonProps={{
                style: {
                    marginLeft: '5.5rem',
                    transform: `scale(.7)`,
                    transformOrigin: 'bottom left',
                },
            }}
        />
    </QueryClientProvider>
);

export default App;
