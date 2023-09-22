import {memo, useState} from 'react';
import ReactEcharts from 'echarts-for-react';

import CustomSelect from '@/components/Select';
import ChartContainer from './ChartContainer';

import {useBetaHeatmapData} from '../api';
import type {BetaHeatmapPropsType} from '../types';

const BetaHeatmap = (props: BetaHeatmapPropsType) => {
    const {timeFrameOptions, tf} = props;

    const [selectedTf, setSelectedTf] = useState(tf);

    const betaHeatmap = useBetaHeatmapData(selectedTf);

    const option = {
        grid: {top: 20, right: 82, bottom: 30, left: 50},
        tooltip: {
            position: 'top',
            formatter: function (params: any) {
                const yLabel = betaHeatmap?.data?.xAxis[params?.data?.[1]];
                return `${params.marker}${yLabel} - ${params.name}: <strong>${params.value[2]}</strong>`;
            },
        },
        xAxis: {
            type: 'category',
            data: betaHeatmap?.data?.xAxis,
            splitArea: {
                show: true,
            },
        },
        yAxis: {
            type: 'category',
            data: betaHeatmap?.data?.yAxis,
            splitArea: {
                show: true,
            },
        },
        visualMap: {
            // type: 'piecewise',
            min: -1,
            max: 1,
            calculable: true,
            orient: 'vertical',
            right: '3',
            bottom: '25%',
            textStyle: {
                color: '#B8A3A5',
            },
            splitNumber: 10,
            precision: 2,
            inRange: {
                color: ['#67001f', '#a50f15', '#d6604d', '#f4a582', '#ffffff', '#92c5de', '#4393c3', '#2166ac'],
            },
        },
        series: [
            {
                type: 'heatmap',
                data: betaHeatmap?.data?.data,
                label: {
                    show: true,
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                    },
                },
            },
        ],
    };

    return (
        <ChartContainer
            header={
                <>
                    <h3>Pearson correlation</h3>
                    <div className="z-50">
                        <CustomSelect options={timeFrameOptions} value={selectedTf} onChange={setSelectedTf} />
                    </div>
                </>
            }
            body={<ReactEcharts option={option} style={{width: '100%', height: '92%'}}></ReactEcharts>}
        />
    );
};

export default memo(BetaHeatmap);
