import {useEffect, useRef, useState} from 'react';
import * as echarts from 'echarts';

import {useHeatMapData} from '../api';

type EChartsOption = echarts.EChartsOption;

let option: EChartsOption;

const response = {minBeta: 0.28, maxBeta: 0.84, "xAxes": ["BTCUSDT", "ETHUSDT", "XRPUSDT", "BNBUSDT", "SOLUSDT", "DOTUSDT", "DOGEUSDT", "LTCUSDT", "LINKUSDT", "BCHUSDT", "SHIBUSDT"], "yAxes": ["BTCUSDT", "ETHUSDT", "XRPUSDT", "BNBUSDT", "SOLUSDT", "DOTUSDT", "DOGEUSDT", "LTCUSDT", "LINKUSDT", "BCHUSDT", "SHIBUSDT"], "data": [[0, 1, 0.8440720705552692], [0, 2, 0.4454441559598598], [0, 3, 0.6121640723161278], [0, 4, 0.5623504109689433], [0, 5, 0.6729395812827837], [0, 6, 0.5296785802669041], [0, 7, 0.6214907855160439], [0, 8, 0.5976086128725598], [0, 9, 0.5633491210390434], [0, 10, 0.5436958538315343], [1, 2, 0.4609598103898994], [1, 3, 0.6411732953046716], [1, 4, 0.5672847619564216], [1, 5, 0.6915625926230968], [1, 6, 0.542034389312601], [1, 7, 0.6351289209470244], [1, 8, 0.6406761886067206], [1, 9, 0.564694227339005], [1, 10, 0.5500606184458725], [2, 3, 0.3782091441817152], [2, 4, 0.3624092695561538], [2, 5, 0.4228211701633123], [2, 6, 0.3356858590731871], [2, 7, 0.32803013537694947], [2, 8, 0.3802908752195465], [2, 9, 0.27994901624644725], [2, 10, 0.3302732500138227], [3, 4, 0.48640738965970287], [3, 5, 0.593135692760848], [3, 6, 0.4570938720905418], [3, 7, 0.5064644246050812], [3, 8, 0.5271523549258275], [3, 9, 0.4619872836457932], [3, 10, 0.48131503832345574], [4, 5, 0.5260964048106591], [4, 6, 0.4154874480514123], [4, 7, 0.46355482481041216], [4, 8, 0.4890873018401175], [4, 9, 0.4142676432380914], [4, 10, 0.4277828446874897], [5, 6, 0.5196889430662828], [5, 7, 0.5958670256763557], [5, 8, 0.6180104447806207], [5, 9, 0.5255531690511407], [5, 10, 0.5274741966934186], [6, 7, 0.45346082371782476], [6, 8, 0.458881795691886], [6, 9, 0.40915288445017317], [6, 10, 0.6016851276082115], [7, 8, 0.5234115204094155], [7, 9, 0.5797938915821558], [7, 10, 0.46545720870233726], [8, 9, 0.471304880206589], [8, 10, 0.46575463500078096], [9, 10, 0.42231370672940194]]}

const data = response.data.map((item) => {
    return [item[0], item[1], item[2].toFixed(2)];
})

option = {  
    tooltip: {
        position: 'top',
    },
    grid: {
        height: '70%',
        top: '10%',
    },
    xAxis: {
        type: 'category',
        data: response.xAxes,
        splitArea: {
            show: true,
        },
    },
    yAxis: {
        type: 'category',
        data: response.yAxes,
        splitArea: {
            show: true,
        },
    },
    visualMap: {
        min: response.minBeta,
        max: response.maxBeta,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
    },
    series: [
        {
            type: 'heatmap',
            data: data,
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

const Heatmap = () => {
    const chartRef = useRef(null);

    useEffect(() => {
        const myChart = echarts.init(chartRef.current!);

        myChart.setOption(option);

        return () => {
            myChart.dispose();
        };
    }, []);

    return <div ref={chartRef} style={{width: '100%', height: '400px'}} />;
};

export default Heatmap;
