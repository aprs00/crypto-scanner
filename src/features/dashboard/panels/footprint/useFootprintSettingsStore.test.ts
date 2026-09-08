import { beforeEach, describe, expect, it } from 'vitest';

import { ChartType } from './types';
import useFootprintSettingsStore, { defaultFootprintSettings } from './useFootprintSettingsStore';

describe('footprint settings', () => {
    beforeEach(() => {
        useFootprintSettingsStore.setState({ settings: {} });
    });

    it('defaults to five-day TRev 314/471 bars grouped by 50 native ticks', () => {
        expect(defaultFootprintSettings).toMatchObject({
            chartType: ChartType.Trev,
            continuationTicks: 314,
            lookbackDays: 5,
            reversalTicks: 471,
            ticksPerRow: 50,
        });
    });

    it('commits a complete TRev chart specification atomically', () => {
        useFootprintSettingsStore.getState().setSettings('panel-1', {
            ...defaultFootprintSettings,
            chartType: ChartType.Trev,
            continuationTicks: 25,
            reversalTicks: 40,
            ticksPerRow: 10,
        });

        expect(useFootprintSettingsStore.getState().settings['panel-1']).toEqual({
            ...defaultFootprintSettings,
            chartType: ChartType.Trev,
            continuationTicks: 25,
            reversalTicks: 40,
            ticksPerRow: 10,
        });
    });

    it('clamps chart and display inputs before saving them', () => {
        useFootprintSettingsStore.getState().setSettings('panel-1', {
            ...defaultFootprintSettings,
            continuationTicks: 0,
            lookbackDays: 100,
            reversalTicks: 5_000,
            ticksPerRow: 2_000,
            tradesPerBar: 2_000_000,
        });

        expect(useFootprintSettingsStore.getState().settings['panel-1']).toMatchObject({
            continuationTicks: 1,
            lookbackDays: 30,
            reversalTicks: 4_000,
            ticksPerRow: 1_000,
            tradesPerBar: 4_000,
        });
    });
});
