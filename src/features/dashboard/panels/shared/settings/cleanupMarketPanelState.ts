import useChartSourceStore from '../source/useChartSourceStore';
import useChartSeriesStore from './useChartSeriesStore';

export const cleanupMarketPanelState = (panelId: string): void => {
    useChartSourceStore.getState().removeSource(panelId);
    useChartSeriesStore.getState().removeSeries(panelId);
};
