import {inject} from '@vercel/analytics';
import {StrictMode} from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

const rootElement = document.getElementById('root')!;

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);

    inject();

    root.render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}
