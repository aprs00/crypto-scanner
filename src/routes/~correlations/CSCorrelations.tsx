import {useState} from 'react';
import {Responsive, WidthProvider} from 'react-grid-layout';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';

import {useCorrelations, useCorrelationsTimeframeOptions, useCorrelationTypeOptions} from './api';

const gridLayoutRowHeight = 30;
const ResponsiveGridLayout = WidthProvider(Responsive);

const CSCorrelations = () => {
    const [selectedTf, setSelectedTf] = useState('5m');
    const [selectedType, setSelectedType] = useState('price');
    const timeFrameOptions = useCorrelationsTimeframeOptions();
    const typeOptions = useCorrelationTypeOptions();

    const pearsonCorrelation = useCorrelations({duration: selectedTf, type: selectedType});

    const gridLayouts = [
        {
            component: (
                <ChartContainer
                    body={<CSHeatmap data={pearsonCorrelation.data} />}
                    selects={[
                        {
                            componentName: 'select',
                            id: '1',
                            onChange: setSelectedTf,
                            options: timeFrameOptions.data || [],
                            value: selectedTf,
                        },
                        {
                            class: 'w-24',
                            componentName: 'select',
                            id: '2',
                            onChange: setSelectedType,
                            options: typeOptions.data || [],
                            value: selectedType,
                        },
                    ]}
                    title="Pearson / Spearman"
                />
            ),
            gridLayout: {h: 28, w: 12, x: 0, y: 0},
            key: 'correlation1',
        },
    ];

    return (
        <ResponsiveGridLayout
            cols={{lg: 12, md: 12, sm: 6, xs: 6, xxs: 6}}
            draggableHandle="#drag-handle"
            rowHeight={gridLayoutRowHeight}
        >
            {gridLayouts.map((grid) => (
                <div className="bg-slate-900 overflow-hidden rounded-sm" data-grid={grid.gridLayout} key={grid.key}>
                    {grid.component}
                </div>
            ))}
        </ResponsiveGridLayout>
    );
};

export default CSCorrelations;
