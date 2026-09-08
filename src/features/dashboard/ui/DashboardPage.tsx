import { useState } from 'react';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout';

import CSButton, { CSButtonVariant } from '@/components/UI/CSButton';
import CSFloatingButton from '@/components/UI/CSFloatingButton';

import type { DashboardPanelItem, DashboardPanelLayout } from '../model/panelTypes';

import useDashboardStore from '../model/dashboardStore';
import { DashboardPanelActionsProvider } from '../model/panelActionsContext';
import { layoutForPanel } from '../model/panelRegistry';
import useServerNotifications from '../panels/shared/data/useServerNotifications';
import styles from './DashboardPage.module.css';
import DashboardPanel from './DashboardPanel';
import GroupTabs from './GroupTabs';
import PanelDrawer from './PanelDrawer';

const DashboardGridLayout = WidthProvider(ReactGridLayout);
const gridLayoutMargin: [number, number] = [8, 8];

type DashboardPanelContentProps = {
    onRemove: (panelId: string) => Promise<void>;
    panel: DashboardPanelItem;
    savedLayout: DashboardPanelLayout;
};

const DashboardPanelContent = ({ onRemove, panel, savedLayout }: DashboardPanelContentProps) => {
    const handleRemove = () => onRemove(panel.id);

    return <DashboardPanel onRemove={handleRemove} panel={panel} savedLayout={savedLayout} />;
};

const DashboardPage = () => {
    useServerNotifications({
        debounceMs: 1000,
        maxReconnectAttempts: 20,
    });

    const panels = useDashboardStore((state) => state.panels);
    const savedGridLayouts = useDashboardStore((state) => state.savedGridLayouts);
    const handleLayoutChange = useDashboardStore((state) => state.handleLayoutChange);
    const removePanel = useDashboardStore((state) => state.removePanel);
    const groups = useDashboardStore((state) => state.groups);
    const activeGroupId = useDashboardStore((state) => state.activeGroupId);
    const setActiveGroup = useDashboardStore((state) => state.setActiveGroup);
    const createGroup = useDashboardStore((state) => state.createGroup);
    const renameGroup = useDashboardStore((state) => state.renameGroup);
    const deleteGroup = useDashboardStore((state) => state.deleteGroup);
    const setChartExchange = useDashboardStore((state) => state.setChartExchange);
    const updateExchangeConfig = useDashboardStore((state) => state.updateExchangeConfig);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const activeGroup = groups.find((group) => group.id === activeGroupId);
    const activePanelIds = new Set(activeGroup?.panelIds ?? []);
    const activePanels = panels.filter((panel) => activePanelIds.has(panel.id));
    let fallbackY = 0;
    const gridItems = activePanels.map((panel) => {
        const savedLayout = savedGridLayouts[panel.id] ?? {};
        const layout = savedLayout.layout ?? layoutForPanel(panel.type, panel.id, fallbackY);
        fallbackY = Math.max(fallbackY, layout.y + layout.h);
        return { layout, panel, savedLayout };
    });

    const handleOpenDrawer = () => setIsDrawerOpen(true);
    const handleCloseDrawer = () => setIsDrawerOpen(false);
    const panelActions = { setChartExchange, updateExchangeConfig };

    return (
        <DashboardPanelActionsProvider value={panelActions}>
            <GroupTabs
                activeGroupId={activeGroupId}
                groups={groups}
                onCreateGroup={createGroup}
                onDeleteGroup={deleteGroup}
                onRenameGroup={renameGroup}
                onSelectGroup={setActiveGroup}
            />

            <div className="grid-host scroll">
                {(gridItems.length > 0 && (
                    <DashboardGridLayout
                        cols={12}
                        draggableCancel=".cs-no-drag"
                        draggableHandle="#drag-handle"
                        margin={gridLayoutMargin}
                        onLayoutChange={handleLayoutChange}
                        rowHeight={30}
                    >
                        {gridItems.map(({ layout, panel, savedLayout }) => (
                            <div className="grid-card" data-grid={layout} key={panel.id}>
                                <DashboardPanelContent onRemove={removePanel} panel={panel} savedLayout={savedLayout} />
                            </div>
                        ))}
                    </DashboardGridLayout>
                )) || (
                    <div className={styles.empty}>
                        <p className={styles.emptyMsg}>NO PANELS IN THIS GROUP</p>
                        <CSButton onClick={handleOpenDrawer} variant={CSButtonVariant.Primary}>
                            + ADD FIRST PANEL
                        </CSButton>
                    </div>
                )}
            </div>

            <CSFloatingButton ariaLabel="Add panel" label="+" onClick={handleOpenDrawer} />
            <PanelDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} />
        </DashboardPanelActionsProvider>
    );
};

export default DashboardPage;
