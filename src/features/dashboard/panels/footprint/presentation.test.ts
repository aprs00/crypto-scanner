import { describe, expect, it } from 'vitest';

import { chartCoverageLabel, chartErrorLabel } from './presentation';
import { ChartCoverageStatus, ChartType } from './types';
import { formatChartCoordinateLabel } from './useFootprintChart';

describe('chart presentation', () => {
    it('distinguishes pending repair from recorded Hyperliquid gaps', () => {
        expect(chartCoverageLabel({ status: ChartCoverageStatus.RepairPending, verifiedThroughMs: null })).toContain(
            'REPAIR',
        );
        expect(chartCoverageLabel({ status: ChartCoverageStatus.GapRecorded, verifiedThroughMs: null })).toBe(
            'TRADE GAP RECORDED',
        );
        expect(chartCoverageLabel({ status: ChartCoverageStatus.Live, verifiedThroughMs: null })).toBeNull();
    });
    it('explains a bounded TRev expansion failure', () => {
        expect(chartErrorLabel('TREV_EXPANSION_LIMIT', ChartType.Trev)).toContain('too many synthetic bars');
    });

    it('uses friendly labels for capacity, dense bars, and unavailable storage', () => {
        expect(chartErrorLabel('SERIES_CAPACITY_REACHED', ChartType.Tick)).toBe(
            'Footprint chart capacity is full. Try again later',
        );
        expect(chartErrorLabel('CHART_BAR_TOO_DENSE', ChartType.Tick)).toBe(
            'This chart produced too many footprint price levels',
        );
        expect(chartErrorLabel('CHART_UNAVAILABLE', ChartType.Tick)).toBe('Chart storage is temporarily unavailable');
    });

    it('formats ordinal coordinates with timestamps while keeping duplicate timestamps distinct', () => {
        const timestamp = Date.UTC(2026, 6, 29, 10, 11, 12);
        const timestamps = new Map([
            [50, timestamp],
            [51, timestamp],
        ]);

        expect(formatChartCoordinateLabel(50, timestamps)).toBe('07-29 10:11:12');
        expect(formatChartCoordinateLabel(51, timestamps)).toBe('07-29 10:11:12');
        expect(formatChartCoordinateLabel(52, timestamps)).toBe('#52');
    });
});
