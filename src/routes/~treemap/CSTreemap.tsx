import type { EChartsOption } from 'echarts';

import { useSuspenseQuery } from '@tanstack/react-query';
import { sumBy } from 'lodash-es';
import { useRef } from 'react';

import CSPanel from '@/components/Layouts/CSPanel';
import { echarts, ECHARTS_THEME } from '@/lib/echarts';
import { ReactEChartsCore } from '@/lib/ReactECharts';
import { fontSize, fontWeightSemibold, treemapColorFor } from '@/lib/theme';
import { resizeEChart } from '@/utils/chart';
import { formatUSD } from '@/utils/number';

import type { HeatmapResponseType } from './types';

import { heatmapQueryOptions } from './api';
import styles from './CSTreemap.module.css';

const CSTreemap = () => {
    const chartRef = useRef<ReactEChartsCore | null>(null);

    const treemap = useSuspenseQuery(heatmapQueryOptions());

    const sourceCoins: HeatmapResponseType[] = treemap.data ?? [];

    const children = sourceCoins.map((coin) => ({
        ...coin,
        itemStyle: { color: treemapColorFor(coin.colorValue ?? 0) },
        value: [coin.value, coin.colorValue],
    }));

    const totalCap = sumBy(sourceCoins, (c) => Number(c.value ?? 0));
    const avgChange = sourceCoins.length > 0 ? sumBy(sourceCoins, 'colorValue') / sourceCoins.length : 0;
    const greenCount = sourceCoins.filter((c) => (c.colorValue ?? 0) > 0).length;
    const breadth = sourceCoins.length > 0 ? Math.round((greenCount / sourceCoins.length) * 100) : 0;

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

    const formattedAvgChange = `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`;

    const summary: { k: string; v: string }[] = [
        { k: 'TOTAL CAP', v: formatUSD(totalCap) },
        { k: 'AVG 24H', v: formattedAvgChange },
        { k: 'BREADTH', v: `${breadth}%` },
        { k: 'ASSETS', v: String(sourceCoins.length) },
    ];

    return (
        <>
            <div className={styles.summary}>
                {summary.map((it, i) => (
                    <div className={styles.item} key={i}>
                        <span className={styles.k}>{it.k}</span>
                        <span className={[styles.v, 'num'].join(' ')}>{it.v}</span>
                    </div>
                ))}
            </div>

            <div className="page-body">
                <CSPanel className="flex-1 min-w-0" title="Market Treemap">
                    <ReactEChartsCore
                        echarts={echarts}
                        onChartReady={() => resizeEChart(chartRef)}
                        option={option}
                        ref={chartRef}
                        style={{ height: '100%', width: '100%' }}
                        theme={ECHARTS_THEME}
                    />
                </CSPanel>
            </div>
        </>
    );
};

export default CSTreemap;
