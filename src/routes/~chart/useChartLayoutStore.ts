import { type Layout } from 'react-grid-layout';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { safeJSONStorage } from '@/lib/safeStorage';

import { PanelType, type PanelItem } from './types';

export type SavedLayout = Pick<Layout, 'x' | 'y' | 'w' | 'h' | 'i'>;

export interface PanelTemplate {
    layout: Omit<SavedLayout, 'i'>;
}

export const panelTemplates: Record<PanelType, PanelTemplate> = {
    [PanelType.TradingView]: { layout: { h: 15, w: 12, x: 0, y: 0 } },
    [PanelType.OrderBook]: { layout: { h: 14, w: 5, x: 0, y: 16 } },
    [PanelType.Depth]: { layout: { h: 14, w: 4, x: 5, y: 16 } },
    [PanelType.Tape]: { layout: { h: 14, w: 3, x: 9, y: 16 } },
};

const makeDefaults = (): PanelItem[] => [
    { id: crypto.randomUUID(), type: PanelType.TradingView },
    { id: crypto.randomUUID(), type: PanelType.OrderBook },
    { id: crypto.randomUUID(), type: PanelType.Depth },
    { id: crypto.randomUUID(), type: PanelType.Tape },
];

export interface ChartLayoutStore {
    panels: PanelItem[];
    savedGridLayouts: Record<string, SavedLayout>;
    addPanel: (type: PanelType) => string;
    removePanel: (id: string) => void;
    handleLayoutChange: (layouts: Layout[]) => void;
}

const useChartLayoutStore = create<ChartLayoutStore>()(
    persist(
        (set) => ({
            panels: makeDefaults(),
            savedGridLayouts: {},
            addPanel: (type) => {
                const id = crypto.randomUUID();
                set((state) => ({ panels: [...state.panels, { id, type }] }));
                return id;
            },
            removePanel: (id) => {
                set((state) => {
                    const { [id]: _removed, ...rest } = state.savedGridLayouts;
                    return {
                        panels: state.panels.filter((p) => p.id !== id),
                        savedGridLayouts: rest,
                    };
                });
            },
            handleLayoutChange: (layouts: Layout[]) => {
                set((state) => {
                    const next = { ...state.savedGridLayouts };
                    for (const item of layouts) {
                        const { i, x, y, w, h } = item;
                        next[i] = { i, x, y, w, h };
                    }
                    return { savedGridLayouts: next };
                });
            },
        }),
        {
            name: 'chart-page-layout',
            version: 2,
            storage: safeJSONStorage(),
        },
    ),
);

export default useChartLayoutStore;
