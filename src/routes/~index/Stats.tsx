import { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';

import CSFloatingButton from '@/components/UI/CSFloatingButton';
import GroupTabs from '@/components/UI/GroupTabs';

import ChartDrawer from './components/ChartDrawer';
import ChartWrapper from './components/ChartWrapper';
import useChartStore, { chartTemplates, CHART_HEIGHT } from './useChartStore';

const ResponsiveGridLayout = WidthProvider(Responsive);

const Stats = () => {
    const chartIds = useChartStore((state) => state.chartIds);
    const savedGridLayouts = useChartStore((state) => state.savedGridLayouts);
    const handleLayoutChange = useChartStore((state) => state.handleLayoutChange);
    const groups = useChartStore((state) => state.groups);
    const activeGroupId = useChartStore((state) => state.activeGroupId);
    const setActiveGroup = useChartStore((state) => state.setActiveGroup);
    const createGroup = useChartStore((state) => state.createGroup);
    const renameGroup = useChartStore((state) => state.renameGroup);
    const deleteGroup = useChartStore((state) => state.deleteGroup);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const activeGroup = groups.find((g) => g.id === activeGroupId);
    const activeChartIds = new Set(activeGroup?.chartIds || []);
    const filteredChartIds = chartIds.filter((chart) => activeChartIds.has(chart.id));

    const gridLayouts = filteredChartIds.map((chart, index) => {
        const template = chartTemplates[chart.type];
        const savedLayout = savedGridLayouts[chart.id] || {};

        return {
            component: <ChartWrapper chart={chart} savedLayout={savedLayout} />,
            gridLayout: {
                ...template.gridLayout,
                ...savedLayout?.layout,
                y: index * CHART_HEIGHT,
            },
            key: chart.id,
        };
    });

    return (
        <>
            <div className="p-4">
                <GroupTabs
                    activeGroupId={activeGroupId}
                    groups={groups}
                    onCreateGroup={createGroup}
                    onDeleteGroup={deleteGroup}
                    onRenameGroup={renameGroup}
                    onSelectGroup={setActiveGroup}
                />
            </div>

            {filteredChartIds.length ? (
                <ResponsiveGridLayout
                    cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
                    draggableHandle="#drag-handle"
                    onLayoutChange={handleLayoutChange}
                    rowHeight={30}
                >
                    {gridLayouts.map((grid) => (
                        <div
                            className="bg-slate-900 overflow-hidden rounded-sm"
                            data-grid={grid.gridLayout}
                            key={grid.key}
                        >
                            {grid.component}
                        </div>
                    ))}
                </ResponsiveGridLayout>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <p className="text-lg mb-4">No charts in this group</p>
                    <button
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        onClick={() => setIsDrawerOpen(true)}
                        type="button"
                    >
                        Add your first chart
                    </button>
                </div>
            )}

            <CSFloatingButton label="+" onClick={() => setIsDrawerOpen(true)} />

            <ChartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
        </>
    );
};

export default Stats;
