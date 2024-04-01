import {createLazyFileRoute} from '@tanstack/react-router';
import * as echarts from 'echarts';
import ReactEcharts from 'echarts-for-react';

export const Route = createLazyFileRoute('/heatmap')({
    component: Heatmap,
});

function Heatmap() {
    const visualMin = -100;
    const visualMax = 100;

    const data = [
        {
            children: [
                {
                    discretion: 'mandatory',
                    id: 'leaf-135',
                    name: 'Centers for Medicare and Medicaid Services',
                    value: [110522000, 93.11734937600765],
                },
                {
                    discretion: 'mandatory',
                    id: 'leaf-131',
                    name: 'Administration for Children and Families',
                    value: [34502000, 69.51540568103],
                },
                {
                    discretion: 'discretionary',
                    id: 'leaf-127',
                    name: 'National Institutes of Health',
                    value: [31829000, 3.39462058212059],
                },
                {
                    discretion: 'discretionary',
                    id: 'leaf-118',
                    name: 'Administration for Children and Families',
                    value: [16180000, -60.65743625245183],
                },
                {
                    discretion: 'discretionary',
                    id: 'leaf-121',
                    name: 'Centers for Medicare and Medicaid Services',
                    value: [7324000, 17.2590457893051],
                },
            ],
            discretion: null,
            name: 'Health and Human Services',
            value: [1226629000, null, null],
        },
    ];

    function isValidNumber(num: any) {
        return num != null && isFinite(num);
    }

    const option = {
        series: [
            {
                data: data,
                levels: [
                    {
                        itemStyle: {
                            borderColor: '#333',
                            borderWidth: 1,
                            gapWidth: 1,
                        },
                    },
                    {
                        color: [
                            '#450a0a',
                            '#7f1d1d',
                            '#991b1b',
                            '#b91c1c',
                            '#dc2626',
                            '#ef4444',
                            '#f87171',
                            '#4ade80',
                            '#22c55e',
                            '#16a34a',
                            '#15803d',
                            '#166534',
                            '#14532d',
                            '#052e16',
                        ],
                        colorMappingBy: 'value',
                        itemStyle: {
                            gapWidth: 1,
                        },
                    },
                ],
                name: 'ALL',
                top: 80,
                type: 'treemap',
                visualDimension: 1,
                visualMax: visualMax,
                visualMin: visualMin,
            },
        ],
        tooltip: {
            formatter: function (info: any) {
                const value = info.value;
                let amount = value[0];
                amount = isValidNumber(amount) ? echarts.format.addCommas(amount * 1000) + '$' : '-';
                let change = value[2];
                change = isValidNumber(change) ? change.toFixed(2) + '%' : '-';
                return [
                    '<div class="tooltip-title">' + echarts.format.encodeHTML(info.name) + '</div>',
                    '2012 Amount: &nbsp;&nbsp;' + amount + '<br>',
                    'Change From 2011: &nbsp;&nbsp;' + change,
                ].join('');
            },
        },
    };

    return <ReactEcharts option={option} style={{height: '95%', width: '100%'}}></ReactEcharts>;
}
