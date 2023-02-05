import {RouterProvider} from '@tanstack/react-router';
import {QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';

import './index.css';

import {queryClient} from '@/lib/react-query';
import {router} from './lib/router';

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
        <button onClick={() => queryClient.clear()}>CLEAR CACHE</button>
    </QueryClientProvider>
);

export default App;
