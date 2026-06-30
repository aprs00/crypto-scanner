import { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';

import CSFloatingButton from '@/components/UI/CSFloatingButton';

import ChartTape from './components/ChartTape';
import DepthChart from './components/DepthChart';
import Table from './components/OrderBook';
import PanelDrawer from './components/PanelDrawer';
import TickChart from './components/TickChart';
import TradingViewPanel from './components/TradingViewPanel';
import { PanelType, type PanelItem } from './types';
import useChartLayoutStore, { panelTemplates } from './useChartLayoutStore';
import useChartSeriesStore from './useChartSeriesStore';
import useChartSourceStore from './useChartSourceStore';

const ResponsiveGridLayout = WidthProvider(Responsive);

const gridLayoutRowHeight = 30;
const gridLayoutMargin: [number, number] = [8, 8];

const renderPanel = (panel: PanelItem, onRemove: () => void) => {
    switch (panel.type) {
        case PanelType.TradingView:
            return <TradingViewPanel onRemove={onRemove} panelId={panel.id} />;
        case PanelType.OrderBook:
            return <Table onRemove={onRemove} panelId={panel.id} />;
        case PanelType.Depth:
            return <DepthChart onRemove={onRemove} panelId={panel.id} />;
        case PanelType.Tape:
            return <ChartTape onRemove={onRemove} panelId={panel.id} />;
        case PanelType.Tick:
            return <TickChart onRemove={onRemove} panelId={panel.id} />;
    }
};

const CSChart = () => {
    const panels = useChartLayoutStore((state) => state.panels);
    const savedGridLayouts = useChartLayoutStore((state) => state.savedGridLayouts);
    const handleLayoutChange = useChartLayoutStore((state) => state.handleLayoutChange);
    const removePanel = useChartLayoutStore((state) => state.removePanel);
    const removeSource = useChartSourceStore((state) => state.removeSource);
    const removeSeries = useChartSeriesStore((state) => state.removeSeries);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleRemove = (id: string) => {
        removePanel(id);
        removeSource(id);
        removeSeries(id);
    };

    const layoutFor = (panel: PanelItem) => ({
        ...panelTemplates[panel.type].layout,
        ...savedGridLayouts[panel.id],
        i: panel.id,
    });

    return (
        <>
            <div className="grid-host scroll">
                <ResponsiveGridLayout
                    cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
                    draggableCancel=".cs-no-drag"
                    draggableHandle="#drag-handle"
                    margin={gridLayoutMargin}
                    onLayoutChange={handleLayoutChange}
                    rowHeight={gridLayoutRowHeight}
                >
                    {panels.map((panel) => (
                        <div className="grid-card" data-grid={layoutFor(panel)} key={panel.id}>
                            {renderPanel(panel, () => handleRemove(panel.id))}
                        </div>
                    ))}
                </ResponsiveGridLayout>
            </div>

            <CSFloatingButton label="+" onClick={() => setIsDrawerOpen(true)} />

            <PanelDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
        </>
    );
};

export default CSChart;
