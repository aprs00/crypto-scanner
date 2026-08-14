import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { SettingsIcon } from '@/components/Icons';
import CSPanel from '@/components/Layouts/CSPanel';
import CSButton from '@/components/UI/CSButton';
import { decimalPlaces, formatPrice } from '@/utils/number';

import type { FootprintSettings as FootprintSettingsValue } from '../footprint/useFootprintSettingsStore';

import { createChartSeriesRequest, useChartBars, useChartSeries, useFootprintMarkets } from '../footprint/api';
import { formatFootprintQuantity } from '../footprint/FootprintSeries';
import { chartErrorLabel, footprintErrorCode } from '../footprint/presentation';
import { ChartSeriesStatus } from '../footprint/types';
import useChartFeed from '../footprint/useChartFeed';
import useFootprintChart from '../footprint/useFootprintChart';
import useFootprintSettingsStore, { defaultFootprintSettings } from '../footprint/useFootprintSettingsStore';
import styles from './FootprintChart.module.css';
import FootprintSettings from './FootprintSettings';
import FootprintSource from './FootprintSource';

type Props = { onRemove: () => void; panelId: string };

const formatChange = (open: number, close: number): { label: string; value: number } => {
    const value = open === 0 ? 0 : ((close - open) / open) * 100;
    const roundedValue = Math.abs(value) < 0.005 ? 0 : value;
    return {
        label: `${roundedValue > 0 ? '+' : ''}${roundedValue.toFixed(2)}%`,
        value: roundedValue,
    };
};

const FootprintChart = ({ onRemove, panelId }: Props) => {
    const settings = useFootprintSettingsStore(
        useShallow((state) => ({ ...defaultFootprintSettings, ...state.settings[panelId] })),
    );
    const setMarketKey = useFootprintSettingsStore((state) => state.setMarketKey);
    const setSettings = useFootprintSettingsStore((state) => state.setSettings);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const marketsQuery = useFootprintMarkets();
    const markets = marketsQuery.data?.markets ?? [];
    const market = markets.find((item) => item.marketKey === settings.marketKey);

    useEffect(() => {
        if (marketsQuery.isSuccess && markets[0] && !market) setMarketKey(panelId, markets[0].marketKey);
    }, [market, markets, marketsQuery.isSuccess, panelId, setMarketKey]);

    const request = market ? createChartSeriesRequest(settings, market.marketKey) : undefined;
    const seriesQuery = useChartSeries(request);
    const series = seriesQuery.data;
    const isSeriesReady = series?.status === ChartSeriesStatus.Ready;
    const seriesKey = isSeriesReady ? series.seriesKey : undefined;
    const barsQuery = useChartBars(seriesKey, isSeriesReady);
    const refreshSnapshot = async () => {
        const result = await barsQuery.refetch();
        return result.isSuccess;
    };
    const feed = useChartFeed({
        refreshSnapshot,
        seriesKey: barsQuery.data ? seriesKey : undefined,
        snapshot: barsQuery.data,
    });
    const { legendBar, wrapRef } = useFootprintChart({
        bars: feed.bars,
        currentTickSize: market?.currentTickSize,
        hasMore: barsQuery.hasMore,
        loadOlder: barsQuery.loadOlder,
        marketKey: market?.marketKey,
        scopeKey: seriesKey ?? '',
        ticksPerRow: settings.ticksPerRow,
    });

    const openSettings = () => setSettingsOpen(true);
    const closeSettings = () => setSettingsOpen(false);
    const handleApplySettings = (nextSettings: FootprintSettingsValue) => setSettings(panelId, nextSettings);

    const missingMarket = Boolean(settings.marketKey && marketsQuery.isSuccess && !market);
    const noMarkets = marketsQuery.isSuccess && markets.length === 0;
    const queryError = marketsQuery.error ?? seriesQuery.error ?? barsQuery.error;
    const failureCode =
        series?.status === ChartSeriesStatus.Failed
            ? (series.errorCode ?? footprintErrorCode(queryError))
            : footprintErrorCode(queryError ?? feed.streamError);
    const errorText = missingMarket
        ? 'Selected footprint market is unavailable'
        : noMarkets
          ? 'No footprint markets are available'
          : marketsQuery.error
            ? 'Unable to load footprint market catalog'
            : series?.status === ChartSeriesStatus.Failed || seriesQuery.error || barsQuery.error
              ? chartErrorLabel(failureCode, settings.chartType)
              : feed.streamError
                ? chartErrorLabel(feed.streamError, settings.chartType)
                : null;
    const building = series?.status === ChartSeriesStatus.Queued || series?.status === ChartSeriesStatus.Building;
    const loadingText = marketsQuery.isLoading
        ? 'Loading footprint markets…'
        : market && seriesQuery.isLoading
          ? `Loading ${settings.chartType.toUpperCase()} series…`
          : building
            ? `Building ${settings.chartType.toUpperCase()} series…`
            : isSeriesReady && barsQuery.isLoading
              ? 'Loading chart history…'
              : null;
    const stateText =
        (feed.bars.length === 0 && (errorText || loadingText)) ||
        (barsQuery.isSuccess && feed.bars.length === 0 ? 'Waiting for chart data…' : null);
    const stateIsError = Boolean(errorText && feed.bars.length === 0);
    const statusText =
        feed.bars.length > 0 && feed.streamError
            ? chartErrorLabel(feed.streamError, settings.chartType).toUpperCase()
            : feed.bars.length > 0 && feed.reconnecting
              ? 'LIVE FEED RECONNECTING'
              : feed.bars.length > 0 && barsQuery.loadingOlder
                ? 'LOADING EARLIER HISTORY'
                : null;
    const priceDecimals = legendBar ? decimalPlaces(legendBar.tickSize) : 0;
    const change = legendBar ? formatChange(legendBar.open, legendBar.close) : null;
    const changeClass = [
        styles.change,
        change && change.value > 0 && styles.positive,
        change && change.value < 0 && styles.negative,
    ]
        .filter(Boolean)
        .join(' ');
    const controls = (
        <>
            {market && <FootprintSource marketKey={market.marketKey} markets={markets} panelId={panelId} />}
            <CSButton ariaLabel="Settings" onClick={openSettings} square title="Settings">
                <SettingsIcon />
            </CSButton>
        </>
    );

    return (
        <>
            <CSPanel className="h-full" controls={controls} onRemove={onRemove}>
                <div className={`${styles.body} cs-no-drag`}>
                    <div className={styles.chart} ref={wrapRef} />
                    {legendBar && change && (
                        <div aria-label="Selected candle values" className={styles.legend}>
                            <span className={styles.legendItem}>
                                <span className={styles.legendLabel}>O</span>
                                {formatPrice(legendBar.open, priceDecimals)}
                            </span>
                            <span className={styles.legendItem}>
                                <span className={styles.legendLabel}>H</span>
                                {formatPrice(legendBar.high, priceDecimals)}
                            </span>
                            <span className={styles.legendItem}>
                                <span className={styles.legendLabel}>L</span>
                                {formatPrice(legendBar.low, priceDecimals)}
                            </span>
                            <span className={styles.legendItem}>
                                <span className={styles.legendLabel}>C</span>
                                {formatPrice(legendBar.close, priceDecimals)}
                            </span>
                            <span className={changeClass}>{change.label}</span>
                            <span className={styles.legendItem}>
                                S {formatFootprintQuantity(legendBar.sellQuantity, legendBar.quantityPrecision)}
                            </span>
                            <span className={styles.legendItem}>
                                B {formatFootprintQuantity(legendBar.buyQuantity, legendBar.quantityPrecision)}
                            </span>
                            <span className={styles.legendItem}>N {legendBar.tradeCount}</span>
                        </div>
                    )}
                    {statusText && <div className={styles.status}>{statusText}</div>}
                    {stateText && (
                        <div className={[styles.state, stateIsError && styles.error].filter(Boolean).join(' ')}>
                            {stateText}
                        </div>
                    )}
                </div>
            </CSPanel>
            <FootprintSettings
                isOpen={settingsOpen}
                onApply={handleApplySettings}
                onClose={closeSettings}
                settings={settings}
            />
        </>
    );
};

export default FootprintChart;
