import CSDrawer from '@/components/UI/CSDrawer';
import { ToastType, useToastStore } from '@/stores/useToastStore';

import type { DashboardPanelDefinition } from '../model/panelRegistry';
import type { DashboardPanelType } from '../model/panelTypes';

import useDashboardStore from '../model/dashboardStore';
import { dashboardPanelCatalog, panelCatalogForSearch } from '../model/panelRegistry';
import styles from './PanelDrawer.module.css';

type PanelOptionProps = {
    definition: DashboardPanelDefinition;
    onSelect: (type: DashboardPanelType) => void;
};

const PanelOption = ({ definition, onSelect }: PanelOptionProps) => {
    const handleClick = () => onSelect(definition.type);

    return (
        <button className={styles.card} onClick={handleClick} type="button">
            <span className={styles.title}>{definition.label}</span>
        </button>
    );
};

type PanelDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
};

const PanelDrawer = ({ isOpen, onClose }: PanelDrawerProps) => {
    const addPanelToGroup = useDashboardStore((state) => state.addPanelToGroup);
    const showToast = useToastStore((state) => state.showToast);
    const availablePanels = panelCatalogForSearch(typeof window === 'undefined' ? '' : window.location.search);

    const handleSelect = (type: DashboardPanelType) => {
        const definition = dashboardPanelCatalog.find((candidate) => candidate.type === type);
        addPanelToGroup(type);
        showToast({ message: `${definition?.label ?? 'Panel'} added`, type: ToastType.Success });
    };

    return (
        <CSDrawer isOpen={isOpen} onClose={onClose} title="Add Panel">
            <div className={styles.options}>
                {availablePanels.map((definition) => (
                    <PanelOption definition={definition} key={definition.type} onSelect={handleSelect} />
                ))}
            </div>
        </CSDrawer>
    );
};

export default PanelDrawer;
