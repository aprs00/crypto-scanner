import type { ChartBar } from './types';

const DATABASE_NAME = 'crypto-scanner-footprints';
const DATABASE_VERSION = 1;
const BAR_STORE = 'bars';

type CachedBar = {
    bar: ChartBar;
    barIndex: number;
    seriesKey: string;
};

let databasePromise: Promise<IDBDatabase | null> | undefined;
const retiredSeries = new Set<string>();

export const isRetiredSeries = (seriesKey: string) => retiredSeries.has(seriesKey);

export const retireCachedSeries = async (seriesKey: string): Promise<void> => {
    retiredSeries.add(seriesKey);
    const db = await database();
    if (!db) return;
    await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(BAR_STORE, 'readwrite');
        transaction
            .objectStore(BAR_STORE)
            .delete(IDBKeyRange.bound([seriesKey, 0], [seriesKey, Number.MAX_SAFE_INTEGER]));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
};

const database = (): Promise<IDBDatabase | null> => {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onerror = () => resolve(null);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(BAR_STORE)) {
                request.result.createObjectStore(BAR_STORE, {
                    keyPath: ['seriesKey', 'barIndex'],
                });
            }
        };
        request.onsuccess = () => {
            request.result.onversionchange = () => request.result.close();
            resolve(request.result);
        };
    });
    return databasePromise;
};

export const readCachedBars = async (
    seriesKey: string,
    beforeBarIndex: number | undefined,
    limit: number,
): Promise<ChartBar[]> => {
    const db = await database();
    if (!db || isRetiredSeries(seriesKey)) return [];
    const upperIndex = beforeBarIndex ?? Number.MAX_SAFE_INTEGER;
    if (upperIndex <= 0) return [];
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BAR_STORE, 'readonly');
        const store = transaction.objectStore(BAR_STORE);
        const range = IDBKeyRange.bound([seriesKey, 0], [seriesKey, upperIndex], false, beforeBarIndex !== undefined);
        const request = store.openCursor(range, 'prev');
        const bars: ChartBar[] = [];
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const cursor = request.result;
            if (!cursor || bars.length >= limit) {
                resolve(isRetiredSeries(seriesKey) ? [] : bars.reverse());
                return;
            }
            bars.push((cursor.value as CachedBar).bar);
            cursor.continue();
        };
    });
};

export const writeCachedBars = async (seriesKey: string, bars: ChartBar[]): Promise<void> => {
    if (bars.length === 0) return;
    const db = await database();
    if (!db || isRetiredSeries(seriesKey)) return;
    await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(BAR_STORE, 'readwrite');
        const store = transaction.objectStore(BAR_STORE);
        for (const bar of bars) {
            store.put({ bar, barIndex: bar.barIndex, seriesKey } satisfies CachedBar);
        }
        transaction.onabort = () => reject(transaction.error);
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
    });
};
