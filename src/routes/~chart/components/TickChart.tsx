import CSPanel from '@/components/Layouts/CSPanel';
import CSButton from '@/components/UI/CSButton';
import CSToggleButton from '@/components/UI/CSToggleButton';

import { PanelType } from '../types';
import useChartSeriesStore, { defaultSeriesVisibility } from '../useChartSeriesStore';
import useResolvedSource from '../useResolvedSource';
import useTickChartCanvas from '../useTickChartCanvas';
import PanelSource from './PanelSource';
import styles from './TickChart.module.css';

type Props = { panelId: string; onRemove: () => void };

const TickChart = ({ panelId, onRemove }: Props) => {
    const { exchange, symbol, tickSize } = useResolvedSource(panelId, PanelType.Tick);

    // Sub-series visibility is persisted per panel; the canvas hook mirrors it for
    // the RAF loop without forcing stream-driven React renders.
    const visibility = useChartSeriesStore((s) => s.visibility[panelId] ?? defaultSeriesVisibility);
    const toggleSeries = useChartSeriesStore((s) => s.toggleSeries);
    const { canvasRef, centered, goLive, live, toggleCentered, wrapRef } = useTickChartCanvas({
        exchange,
        symbol,
        tickSize,
        visibility,
    });

    return (
        <CSPanel
            className="h-full"
            controls={
                <>
                    <PanelSource panelId={panelId} panelType={PanelType.Tick} />
                    <CSToggleButton active={visibility.spread} onClick={() => toggleSeries(panelId, 'spread')}>
                        SPREAD
                    </CSToggleButton>
                    <CSToggleButton active={visibility.volume} onClick={() => toggleSeries(panelId, 'volume')}>
                        VOL
                    </CSToggleButton>
                    <CSToggleButton active={visibility.book} onClick={() => toggleSeries(panelId, 'book')}>
                        BOOK
                    </CSToggleButton>
                    <CSToggleButton active={centered} onClick={toggleCentered}>
                        CENTER
                    </CSToggleButton>
                    <CSToggleButton active={live} onClick={goLive}>
                        ● LIVE
                    </CSToggleButton>
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
    );
};

export default TickChart;
