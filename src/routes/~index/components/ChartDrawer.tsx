import CSDrawer from '@/components/UI/CSDrawer';
import { ToastType, useToastStore } from '@/stores/useToastStore';

import { ChartType, ChartTypeDescriptions, ChartTypeLabels } from '../types';
import useChartStore from '../useChartStore';
import styles from './ChartDrawer.module.css';

const chartTypes = Object.values(ChartType);

interface ChartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChartDrawer = (props: ChartDrawerProps) => {
    const { isOpen, onClose } = props;

    const addChartToGroup = useChartStore((state) => state.addChartToGroup);
    const showToast = useToastStore((state) => state.showToast);

    const handleSelectChart = (type: ChartType) => {
        addChartToGroup(type);
        showToast({ message: `${ChartTypeLabels[type]} added`, type: ToastType.Success });
    };

    return (
        <CSDrawer isOpen={isOpen} onClose={onClose} title="Add Chart">
            {chartTypes.map((type) => (
                <button className={styles.card} key={type} onClick={() => handleSelectChart(type)} type="button">
                    <div className={styles.head}>
                        <span className={styles.title}>{ChartTypeLabels[type]}</span>
                    </div>
                    <span className={styles.desc}>{ChartTypeDescriptions[type]}</span>
                </button>
            ))}
        </CSDrawer>
    );
};

export default ChartDrawer;
