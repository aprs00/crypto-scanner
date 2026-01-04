import CSDrawer from '@/components/UI/CSDrawer';
import { ToastType, useToastStore } from '@/stores/useToastStore';

import { ChartType, ChartTypeDescriptions, ChartTypeLabels } from '../types';
import useChartStore from '../useChartStore';

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
            <div className="p-4 space-y-2">
                {chartTypes.map((type) => (
                    <button
                        className="w-full text-left p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors group"
                        key={type}
                        onClick={() => handleSelectChart(type)}
                        type="button"
                    >
                        <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
                            {ChartTypeLabels[type]}
                        </div>

                        <div className="text-sm text-slate-400 mt-1">{ChartTypeDescriptions[type]}</div>
                    </button>
                ))}
            </div>
        </CSDrawer>
    );
};

export default ChartDrawer;
