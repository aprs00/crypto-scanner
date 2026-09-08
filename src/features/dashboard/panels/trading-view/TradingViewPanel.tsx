import CSPanel from '@/components/Layouts/CSPanel';
import { palette } from '@/lib/theme';
import { getExchange } from '@/services/exchanges/registry';

import type { DashboardPanelProps } from '../../model/panelTypes';

import { DashboardPanelType } from '../../model/panelTypes';
import PanelSource from '../shared/source/PanelSource';
import useResolvedSource from '../shared/source/useResolvedSource';
import TradingViewRealTimeChart from './widgets/RealTimeChart';

const tradingViewThemeProps = {
    backgroundColor: palette.bgPanel,
    gridColor: palette.bd,
    overrides: {
        'mainSeriesProperties.candleStyle.borderDownColor': palette.down,
        'mainSeriesProperties.candleStyle.borderUpColor': palette.up,
        'mainSeriesProperties.candleStyle.downColor': palette.down,
        'mainSeriesProperties.candleStyle.upColor': palette.up,
        'mainSeriesProperties.candleStyle.wickDownColor': palette.down,
        'mainSeriesProperties.candleStyle.wickUpColor': palette.up,
        'paneProperties.background': palette.bgPanel,
        'paneProperties.backgroundType': 'solid',
        'paneProperties.horzGridProperties.color': palette.bd,
        'paneProperties.vertGridProperties.color': palette.bd,
        'scalesProperties.lineColor': palette.bdHi,
        'scalesProperties.textColor': palette.fgDim,
    },
} as const;

const TradingViewPanel = ({ onRemove, panel, title }: DashboardPanelProps) => {
    const panelId = panel.id;
    const { exchange, symbol } = useResolvedSource(panelId, DashboardPanelType.TradingView);
    const tvSymbol = getExchange(exchange).toTradingViewSymbol(symbol);

    return (
        <CSPanel
            className="h-full"
            controls={<PanelSource panelId={panelId} panelType={DashboardPanelType.TradingView} />}
            onRemove={onRemove}
            title={title}
        >
            {symbol && (
                <TradingViewRealTimeChart
                    autosize
                    key={tvSymbol}
                    symbol={tvSymbol}
                    theme="dark"
                    toolbar_bg={palette.bgAlt}
                    {...tradingViewThemeProps}
                />
            )}
        </CSPanel>
    );
};

export default TradingViewPanel;
