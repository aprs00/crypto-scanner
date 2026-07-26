import CSPanel from '@/components/Layouts/CSPanel';
import TradingViewRealTimeChart from '@/components/TradingViewWidgets/RealTimeChart';
import { palette } from '@/lib/theme';
import { getExchange } from '@/services/exchanges/registry';

import { PanelType } from '../types';
import useResolvedSource from '../useResolvedSource';
import PanelSource from './PanelSource';

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

type Props = { panelId: string; onRemove: () => void };

const TradingViewPanel = ({ panelId, onRemove }: Props) => {
    const { exchange, symbol } = useResolvedSource(panelId, PanelType.TradingView);
    const tvSymbol = getExchange(exchange).toTradingViewSymbol(symbol);

    return (
        <CSPanel
            className="h-full"
            controls={<PanelSource panelId={panelId} panelType={PanelType.TradingView} />}
            onRemove={onRemove}
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
