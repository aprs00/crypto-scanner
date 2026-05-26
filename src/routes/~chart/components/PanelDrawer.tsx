import CSDrawer from '@/components/UI/CSDrawer';
import { ToastType, useToastStore } from '@/stores/useToastStore';

import { PanelType, PanelTypeDescriptions, PanelTypeLabels } from '../types';
import useChartLayoutStore from '../useChartLayoutStore';
import styles from './PanelDrawer.module.css';

const panelTypes = Object.values(PanelType);

interface PanelDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const PanelDrawer = ({ isOpen, onClose }: PanelDrawerProps) => {
    const addPanel = useChartLayoutStore((state) => state.addPanel);
    const showToast = useToastStore((state) => state.showToast);

    const handleSelect = (type: PanelType) => {
        addPanel(type);
        showToast({ message: `${PanelTypeLabels[type]} added`, type: ToastType.Success });
    };

    return (
        <CSDrawer isOpen={isOpen} onClose={onClose} title="Add Panel">
            <div className={styles.bodyPad}>
                {panelTypes.map((type) => (
                    <button className={styles.card} key={type} onClick={() => handleSelect(type)} type="button">
                        <span className={styles.title}>{PanelTypeLabels[type]}</span>
                        <span className={styles.desc}>{PanelTypeDescriptions[type]}</span>
                    </button>
                ))}
            </div>
        </CSDrawer>
    );
};

export default PanelDrawer;
