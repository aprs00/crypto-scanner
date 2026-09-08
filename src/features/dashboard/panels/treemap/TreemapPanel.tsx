import type { EChartsOption } from 'echarts';

import { sumBy } from 'lodash-es';
import { useRef } from 'react';

import CSPanel from '@/components/Layouts/CSPanel';
import CSButton from '@/components/UI/CSButton';
import CSSpinner from '@/components/UI/CSSpinner';
import { fontSize, fontWeightSemibold, treemapColorFor } from '@/lib/theme';
import { formatUSD } from '@/utils/number';

import type { DashboardPanelProps } from '../../model/panelTypes';
import type { HeatmapResponseType } from './types';

import { echarts, ECHARTS_THEME } from '../shared/charting/echarts';
import { ReactEChartsCore } from '../shared/charting/ReactECharts';
import { resizeEChart } from '../shared/charting/resizeEChart';
import { useHeatmapData } from './api';
import styles from './TreemapPanel.module.css';

const TreemapPanel = ({ onRemove, title }: DashboardPanelProps) => {
    const chartRef = useRef<ReactEChartsCore | null>(null);
    const treemap = useHeatmapData();
    const sourceCoins: HeatmapResponseType[] = treemap.data ?? [];

    const children = sourceCoins.map((coin) => ({
        ...coin,
        itemStyle: { color: treemapColorFor(coin.colorValue ?? 0) },
        value: [coin.value, coin.colorValue],
    }));
    const totalCap = sumBy(sourceCoins, (coin) => Number(coin.value ?? 0));
    const avgChange = sourceCoins.length > 0 ? sumBy(sourceCoins, 'colorValue') / sourceCoins.length : 0;
    const greenCount = sourceCoins.filter((coin) => (coin.colorValue ?? 0) > 0).length;
    const breadth = sourceCoins.length > 0 ? Math.round((greenCount / sourceCoins.length) * 100) : 0;
    const formattedAvgChange = `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`;
    const summary: { key: string; value: string }[] = [
        { key: 'TOTAL CAP', value: formatUSD(totalCap) },
        { key: 'AVG 24H', value: formattedAvgChange },
        { key: 'BREADTH', value: `${breadth}%` },
        { key: 'ASSETS', value: String(sourceCoins.length) },
    ];
    const option: EChartsOption = {
        series: [
            {
                data: [{ children }],
                height: '100%',
                label: {
                    fontSize: fontSize.xl,
                    fontWeight: fontWeightSemibold,
                    formatter: (params: any) =>
                        `${params.data.name?.toUpperCase()}\n${params.data.colorValue?.toFixed(2)}%`,
                    show: true,
                },
                type: 'treemap',
                width: '100%',
            },
        ],
    };

    const handleChartReady = () => resizeEChart(chartRef);
    const handleRetry = () => void treemap.refetch();

    return (
        <CSPanel className="h-full" onRemove={onRemove} title={title}>
            {(treemap.isPending && <CSSpinner />) ||
                (treemap.isError && sourceCoins.length === 0 && (
                    <div className={styles.state}>
                        <span>UNABLE TO LOAD MARKET TREEMAP</span>
                        <CSButton onClick={handleRetry}>RETRY</CSButton>
                    </div>
                )) ||
                (sourceCoins.length === 0 && <div className={styles.state}>NO TREEMAP DATA</div>) || (
                    <div className={styles.body}>
                        <div className={styles.summary}>
                            {summary.map((item) => (
                                <div className={styles.item} key={item.key}>
                                    <span className={styles.key}>{item.key}</span>
                                    <span className={`${styles.value} num`}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className={styles.chart}>
                            <ReactEChartsCore
                                echarts={echarts}
                                onChartReady={handleChartReady}
                                option={option}
                                ref={chartRef}
                                style={{ height: '100%', width: '100%' }}
                                theme={ECHARTS_THEME}
                            />
                        </div>
                    </div>
                )}
        </CSPanel>
    );
};

export default TreemapPanel;
