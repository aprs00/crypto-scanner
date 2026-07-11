import { useEffect, useState } from 'react';

import { SettingsIcon } from '@/components/Icons';
import CSPanel from '@/components/Layouts/CSPanel';
import CSButton from '@/components/UI/CSButton';
import CSToggleButton from '@/components/UI/CSToggleButton';

import { PanelType } from '../types';
import useChartSeriesStore, { defaultLiquidityPreferences, defaultSeriesVisibility } from '../useChartSeriesStore';
import useResolvedSource from '../useResolvedSource';
import useTickChartCanvas from '../useTickChartCanvas';
import PanelSource from './PanelSource';
import styles from './TickChart.module.css';
import TickChartSettings from './TickChartSettings';

type Props = { panelId: string; onRemove: () => void };

const TickChart = ({ panelId, onRemove }: Props) => {
    const { exchange, symbol, tickSize } = useResolvedSource(panelId, PanelType.Tick);

    // Sub-series visibility is persisted per panel; the canvas hook mirrors it for
    // the RAF loop without forcing stream-driven React renders.
    const visibility = useChartSeriesStore((s) => s.visibility[panelId] ?? defaultSeriesVisibility);
    const storedLiquidityPreferences = useChartSeriesStore((s) => s.liquidity[panelId] ?? defaultLiquidityPreferences);
    const setLiquidityMarket = useChartSeriesStore((s) => s.setLiquidityMarket);
    const marketKey = `${exchange}:${symbol}`;
    const liquidityPreferences =
        storedLiquidityPreferences.thresholdMarket === marketKey
            ? storedLiquidityPreferences
            : { ...storedLiquidityPreferences, minNotional: 0, thresholdMarket: marketKey };
    const [settingsOpen, setSettingsOpen] = useState(false);

    useEffect(() => setLiquidityMarket(panelId, marketKey), [marketKey, panelId, setLiquidityMarket]);

    const { canvasRef, centered, depthRef, goLive, live, toggleCentered, wrapRef } = useTickChartCanvas({
        exchange,
        liquidityPreferences,
        symbol,
        tickSize,
        visibility,
    });

    const openSettings = () => setSettingsOpen(true);
    const closeSettings = () => setSettingsOpen(false);

    return (
        <>
            <CSPanel
                className="h-full"
                controls={
                    <>
                        <PanelSource panelId={panelId} panelType={PanelType.Tick} />
                        <CSToggleButton
                            active={centered}
                            ariaLabel="Center price"
                            onClick={toggleCentered}
                            title="Center price"
                        >
                            C
                        </CSToggleButton>
                        <CSToggleButton
                            active={live}
                            ariaLabel="Follow live view"
                            onClick={goLive}
                            title="Follow live view"
                        >
                            V
                        </CSToggleButton>
                        <CSButton onClick={openSettings} square>
                            <SettingsIcon />
                        </CSButton>
                        <CSButton onClick={onRemove} square>
                            -
                        </CSButton>
                    </>
                }
            >
                <div className={`${styles.body} cs-no-drag`} ref={wrapRef}>
                    <canvas className={styles.canvas} ref={canvasRef} />
                </div>
            </CSPanel>
            <TickChartSettings
                depthRef={depthRef}
                isOpen={settingsOpen}
                onClose={closeSettings}
                panelId={panelId}
                tickSize={tickSize}
            />
        </>
    );
};

export default TickChart;
