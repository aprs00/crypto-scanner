import type { ReactNode } from 'react';

import CSPanel from '@/components/Layouts/CSPanel';

type ChartContainerProps = {
    children: ReactNode;
    controls?: ReactNode;
    onRemoveClick: () => void;
    title: string;
};

const ChartContainer = (props: ChartContainerProps) => {
    const { children, controls, onRemoveClick, title } = props;

    return (
        <CSPanel className="h-full" controls={controls} onRemove={onRemoveClick} title={title}>
            {children}
        </CSPanel>
    );
};

export default ChartContainer;
