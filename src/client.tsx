import { StartClient } from '@tanstack/react-start/client';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

// The Footprint panel was removed; clear the settings and chart cache it left in visitors' browsers.
const removeRetiredFootprintStorage = () => {
    try {
        window.localStorage.removeItem('dashboard-footprint-settings');
        window.indexedDB?.deleteDatabase('crypto-scanner-footprints');
    } catch {
        // Storage can be unavailable (private mode, blocked site data); nothing to clean up then.
    }
};

removeRetiredFootprintStorage();

hydrateRoot(
    document,
    <StrictMode>
        <StartClient />
    </StrictMode>,
);
