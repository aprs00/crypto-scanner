import {memo, useMemo} from 'react';
import ReactEcharts from 'echarts-for-react';

import {useBetaHeatMapData} from '../api';

const BetaHeatmap = () => {
    const betaHeatmap = useBetaHeatMapData('3m');

    const option = useMemo(
        () => ({
            grid: {top: 20, right: 60, bottom: 30, left: 50},
            tooltip: {
                position: 'top',
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
                min: -1,
                max: 1,
                calculable: true,
                orient: 'vertical',
                right: '2',
                bottom: '25%',
                textStyle: {
                    color: '#fff',
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
        }),
        [betaHeatmap.isFetched],
    );

    return (
        <div className="border-2 border-slate-800 rounded m-1">
            <div className="flex justify-between items-center pl-3 py-1 rounded-t-xs bg-slate-800">
                <h3>Pearson correlation</h3>
                {/* <CustomSelect
                        options={statsSelectOptions || []}
                        value={tf as string}
                        onChange={(e) => {
                            // setTableAlignment(e as string);
                        }}
                    /> */}
            </div>
            <ReactEcharts option={option} style={{width: '100%', height: '400px'}}></ReactEcharts>
        </div>
    );
};

export default memo(BetaHeatmap);
