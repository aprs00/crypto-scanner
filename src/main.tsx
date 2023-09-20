import {StrictMode} from 'react';
import ReactDOM from 'react-dom/client';
import {inject} from '@vercel/analytics';

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
