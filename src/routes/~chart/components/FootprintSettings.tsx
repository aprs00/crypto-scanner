import { useEffect, useState } from 'react';

import CSButton, { CSButtonVariant } from '@/components/UI/CSButton';
import CSDrawer from '@/components/UI/CSDrawer';
import CSSegmented from '@/components/UI/CSSegmented';
import CSSettingsRow from '@/components/UI/CSSettingsRow';
import CSSettingsSection from '@/components/UI/CSSettingsSection';
import NumberInput from '@/components/UI/NumberInput';

import type { ChartType as ChartTypeValue } from '../footprint/types';
import type { FootprintSettings as FootprintSettingsValue } from '../footprint/useFootprintSettingsStore';

import { ChartType } from '../footprint/types';
import { FOOTPRINT_SETTING_LIMITS } from '../footprint/useFootprintSettingsStore';

type Props = {
    isOpen: boolean;
    onApply: (settings: FootprintSettingsValue) => void;
    onClose: () => void;
    settings: FootprintSettingsValue;
};

const chartTypeOptions = Object.values(ChartType);
const chartTypeLabel = (chartType: ChartTypeValue): string => chartType.toUpperCase();

const FootprintSettings = ({ isOpen, onApply, onClose, settings }: Props) => {
    const [draft, setDraft] = useState(settings);

    useEffect(() => {
        if (isOpen) setDraft(settings);
    }, [isOpen, settings]);

    const handleChartType = (chartType: ChartTypeValue) => setDraft((current) => ({ ...current, chartType }));
    const handleLookbackDays = (lookbackDays: number) => setDraft((current) => ({ ...current, lookbackDays }));
    const handleTradesPerBar = (tradesPerBar: number) => setDraft((current) => ({ ...current, tradesPerBar }));
    const handleContinuationTicks = (continuationTicks: number) =>
        setDraft((current) => ({ ...current, continuationTicks }));
    const handleReversalTicks = (reversalTicks: number) => setDraft((current) => ({ ...current, reversalTicks }));
    const handleTicksPerRow = (ticksPerRow: number) => setDraft((current) => ({ ...current, ticksPerRow }));
    const handleApply = () => {
        onApply(draft);
        onClose();
    };

    return (
        <CSDrawer
            footer={
                <CSButton onClick={handleApply} variant={CSButtonVariant.Primary}>
                    Apply
                </CSButton>
            }
            isOpen={isOpen}
            onClose={onClose}
            title="Footprint Settings"
        >
            <CSSettingsSection title="Chart">
                <CSSettingsRow label="Bar type">
                    <CSSegmented<ChartTypeValue>
                        ariaLabel="Footprint bar type"
                        onChange={handleChartType}
                        options={chartTypeOptions}
                        renderLabel={chartTypeLabel}
                        value={draft.chartType}
                    />
                </CSSettingsRow>
                <CSSettingsRow label="Lookback days">
                    <NumberInput
                        ariaLabel="Footprint history lookback days"
                        max={FOOTPRINT_SETTING_LIMITS.lookbackDays.max}
                        min={FOOTPRINT_SETTING_LIMITS.lookbackDays.min}
                        onChange={handleLookbackDays}
                        step={1}
                        value={draft.lookbackDays}
                    />
                </CSSettingsRow>
            </CSSettingsSection>

            {draft.chartType === ChartType.Tick && (
                <CSSettingsSection title="Tick bars">
                    <CSSettingsRow label="Trades per bar">
                        <NumberInput
                            ariaLabel="Trades per tick bar"
                            max={FOOTPRINT_SETTING_LIMITS.tradesPerBar.max}
                            min={FOOTPRINT_SETTING_LIMITS.tradesPerBar.min}
                            onChange={handleTradesPerBar}
                            placeholder="TRADES"
                            step={1}
                            value={draft.tradesPerBar}
                        />
                    </CSSettingsRow>
                </CSSettingsSection>
            )}

            {draft.chartType === ChartType.Trev && (
                <CSSettingsSection title="TRev bars">
                    <CSSettingsRow label="Continuation ticks">
                        <NumberInput
                            ariaLabel="TRev continuation ticks"
                            max={FOOTPRINT_SETTING_LIMITS.trevTicks.max}
                            min={FOOTPRINT_SETTING_LIMITS.trevTicks.min}
                            onChange={handleContinuationTicks}
                            prefix="C"
                            step={1}
                            value={draft.continuationTicks}
                        />
                    </CSSettingsRow>
                    <CSSettingsRow label="Reversal ticks">
                        <NumberInput
                            ariaLabel="TRev reversal ticks"
                            max={FOOTPRINT_SETTING_LIMITS.trevTicks.max}
                            min={FOOTPRINT_SETTING_LIMITS.trevTicks.min}
                            onChange={handleReversalTicks}
                            prefix="R"
                            step={1}
                            value={draft.reversalTicks}
                        />
                    </CSSettingsRow>
                </CSSettingsSection>
            )}

            <CSSettingsSection title="Footprint">
                <CSSettingsRow label="Group native ticks">
                    <NumberInput
                        ariaLabel="Native ticks per footprint row"
                        max={FOOTPRINT_SETTING_LIMITS.ticksPerRow.max}
                        min={FOOTPRINT_SETTING_LIMITS.ticksPerRow.min}
                        onChange={handleTicksPerRow}
                        step={1}
                        value={draft.ticksPerRow}
                    />
                </CSSettingsRow>
            </CSSettingsSection>
        </CSDrawer>
    );
};

export default FootprintSettings;
