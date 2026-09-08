import type { ReactNode } from 'react';

import { Component, lazy, Suspense, useState } from 'react';

import ErrorIcon from '@/components/Icons/ErrorIcon';
import CSPanel from '@/components/Layouts/CSPanel';
import CSButton from '@/components/UI/CSButton';
import CSSpinner from '@/components/UI/CSSpinner';

import type { DashboardPanelProps } from '../model/panelTypes';

import { panelDefinitionFor } from '../model/panelRegistry';
import styles from './DashboardPanel.module.css';

type DashboardPanelHostProps = Omit<DashboardPanelProps, 'title'>;

const createLazyPanel = (type: DashboardPanelProps['panel']['type']) => lazy(panelDefinitionFor(type).load);

type PanelStateProps = {
    onRemove: () => void;
    title: string;
};

const DashboardPanelLoading = ({ onRemove, title }: PanelStateProps) => (
    <CSPanel className="h-full" onRemove={onRemove} title={title}>
        <CSSpinner />
    </CSPanel>
);

type DashboardPanelErrorProps = PanelStateProps & {
    onRetry: () => void;
};

const DashboardPanelError = ({ onRemove, onRetry, title }: DashboardPanelErrorProps) => (
    <CSPanel className="h-full" onRemove={onRemove} title={title}>
        <div className={styles.state} role="alert">
            <ErrorIcon />
            <span>UNABLE TO LOAD PANEL</span>
            <CSButton onClick={onRetry}>RETRY</CSButton>
        </div>
    </CSPanel>
);

type DashboardPanelErrorBoundaryProps = DashboardPanelErrorProps & {
    children: ReactNode;
};

type DashboardPanelErrorBoundaryState = {
    hasError: boolean;
};

class DashboardPanelErrorBoundary extends Component<
    DashboardPanelErrorBoundaryProps,
    DashboardPanelErrorBoundaryState
> {
    state: DashboardPanelErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): DashboardPanelErrorBoundaryState {
        return { hasError: true };
    }

    render() {
        return (
            (this.state.hasError && (
                <DashboardPanelError
                    onRemove={this.props.onRemove}
                    onRetry={this.props.onRetry}
                    title={this.props.title}
                />
            )) ||
            this.props.children
        );
    }
}

const DashboardPanelAttempt = (props: DashboardPanelProps) => {
    const [Panel] = useState(() => createLazyPanel(props.panel.type));

    return (
        <Suspense fallback={<DashboardPanelLoading onRemove={props.onRemove} title={props.title} />}>
            <Panel {...props} />
        </Suspense>
    );
};

const DashboardPanel = ({ onRemove, panel, savedLayout }: DashboardPanelHostProps) => {
    const [retryAttempt, setRetryAttempt] = useState(0);
    const title = panelDefinitionFor(panel.type).label;
    const handleRetry = () => setRetryAttempt((attempt) => attempt + 1);

    return (
        <DashboardPanelErrorBoundary
            key={`${panel.type}:${retryAttempt}`}
            onRemove={onRemove}
            onRetry={handleRetry}
            title={title}
        >
            <DashboardPanelAttempt onRemove={onRemove} panel={panel} savedLayout={savedLayout} title={title} />
        </DashboardPanelErrorBoundary>
    );
};

export default DashboardPanel;
