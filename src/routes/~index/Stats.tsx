import { useState } from 'react';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout';

import CSButton, { CSButtonVariant } from '@/components/UI/CSButton';
import CSFloatingButton from '@/components/UI/CSFloatingButton';
import GroupTabs from '@/components/UI/GroupTabs';

import ChartDrawer from './components/ChartDrawer';
import ChartWrapper from './components/ChartWrapper';
import styles from './Stats.module.css';
import useChartStore, { chartTemplates, CHART_HEIGHT } from './useChartStore';

const GridLayout = WidthProvider(ReactGridLayout);

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

    const handleOpenDrawer = () => setIsDrawerOpen(true);
    const handleCloseDrawer = () => setIsDrawerOpen(false);

    return (
        <>
            <GroupTabs
                activeGroupId={activeGroupId}
                groups={groups}
                onCreateGroup={createGroup}
                onDeleteGroup={deleteGroup}
                onRenameGroup={renameGroup}
                onSelectGroup={setActiveGroup}
            />

            <div className="grid-host scroll">
                {(filteredChartIds.length && (
                    <GridLayout
                        cols={12}
                        draggableCancel=".cs-no-drag"
                        draggableHandle="#drag-handle"
                        onLayoutChange={handleLayoutChange}
                        rowHeight={30}
                    >
                        {gridLayouts.map((grid) => (
                            <div className="grid-card" data-grid={grid.gridLayout} key={grid.key}>
                                {grid.component}
                            </div>
                        ))}
                    </GridLayout>
                )) || (
                    <div className={styles.empty}>
                        <p className={styles.emptyMsg}>NO CHARTS IN THIS GROUP</p>
                        <CSButton onClick={handleOpenDrawer} variant={CSButtonVariant.Primary}>
                            + ADD FIRST CHART
                        </CSButton>
                    </div>
                )}
            </div>

            <CSFloatingButton ariaLabel="Add chart" label="+" onClick={handleOpenDrawer} />

            <ChartDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} />
        </>
    );
};

export default Stats;
