import CSButton, { CSButtonVariant } from '@/components/UI/CSButton';
import CSCheckbox from '@/components/UI/CSCheckbox';
import CSDrawer from '@/components/UI/CSDrawer';
import CSSettingsRow from '@/components/UI/CSSettingsRow';
import CSSettingsSection from '@/components/UI/CSSettingsSection';
import NumberInput from '@/components/UI/NumberInput';

import type { DomPreferences } from '../shared/settings/domPreferences';

import { DOM_PREFERENCE_LIMITS, DomQuantityMode } from '../shared/settings/domPreferences';

type Props = {
    isOpen: boolean;
    onChange: (patch: Partial<DomPreferences>) => void;
    onClose: () => void;
    preferences: DomPreferences;
};

const DepthAndSalesSettings = ({ isOpen, onChange, onClose, preferences }: Props) => {
    const handleGroupTicks = (groupTicks: number) => {
        if (!Number.isInteger(groupTicks)) return;
        onChange({ groupTicks });
    };

    const handlePullStackRows = (pullStackRows: number) => {
        if (!Number.isInteger(pullStackRows)) return;
        onChange({ pullStackRows });
    };

    const handleVisibleRowsPerSide = (visibleRowsPerSide: number) => {
        if (!Number.isInteger(visibleRowsPerSide)) return;
        onChange({ visibleRowsPerSide });
    };

    const handleShowPullStack = (showPullStack: boolean) => onChange({ showPullStack });
    const handleShowExecutions = (showExecutions: boolean) => onChange({ showExecutions });
    const handleShowTape = (showTape: boolean) => onChange({ showTape });
    const handleShowNotional = (showNotional: boolean) => {
        onChange({ quantityMode: showNotional ? DomQuantityMode.Notional : DomQuantityMode.Base });
    };
    const handleShowHeader = (showHeader: boolean) => onChange({ showHeader });
    const handleShowMeter = (showMeter: boolean) => onChange({ showMeter });
    const handleTapeMinNotional = (tapeMinNotional: number) => onChange({ tapeMinNotional });

    return (
        <CSDrawer
            footer={
                <CSButton onClick={onClose} variant={CSButtonVariant.Primary}>
                    Done
                </CSButton>
            }
            isOpen={isOpen}
            onClose={onClose}
            title="DOM Ladder Settings"
        >
            <CSSettingsSection title="Columns">
                <CSCheckbox
                    checked={preferences.showPullStack}
                    label="Pulled and added liquidity"
                    onChange={handleShowPullStack}
                />
                <CSSettingsRow label="Pull/stack rows per side">
                    <NumberInput
                        ariaLabel="Pull/stack rows per side"
                        max={DOM_PREFERENCE_LIMITS.pullStackRows.max}
                        min={DOM_PREFERENCE_LIMITS.pullStackRows.min}
                        onChange={handlePullStackRows}
                        placeholder="ROWS"
                        value={preferences.pullStackRows}
                    />
                </CSSettingsRow>
                <CSCheckbox
                    checked={preferences.showExecutions}
                    label="Execution columns"
                    onChange={handleShowExecutions}
                />
                <CSCheckbox checked={preferences.showTape} label="Time and sales tape" onChange={handleShowTape} />
            </CSSettingsSection>

            <CSSettingsSection title="Ladder">
                <CSSettingsRow label="Visible rows per side">
                    <NumberInput
                        ariaLabel="Visible rows per side"
                        max={DOM_PREFERENCE_LIMITS.visibleRowsPerSide.max}
                        min={DOM_PREFERENCE_LIMITS.visibleRowsPerSide.min}
                        onChange={handleVisibleRowsPerSide}
                        placeholder="ROWS"
                        value={preferences.visibleRowsPerSide}
                    />
                </CSSettingsRow>
                <CSSettingsRow label="Group native ticks">
                    <NumberInput
                        ariaLabel="Group native ticks"
                        max={DOM_PREFERENCE_LIMITS.groupTicks.max}
                        min={DOM_PREFERENCE_LIMITS.groupTicks.min}
                        onChange={handleGroupTicks}
                        value={preferences.groupTicks}
                    />
                </CSSettingsRow>
                <CSCheckbox
                    checked={preferences.quantityMode === DomQuantityMode.Notional}
                    label="Show quote notional ($)"
                    onChange={handleShowNotional}
                />
                <CSCheckbox checked={preferences.showHeader} label="Column headers" onChange={handleShowHeader} />
                <CSCheckbox checked={preferences.showMeter} label="Depth summary meter" onChange={handleShowMeter} />
            </CSSettingsSection>

            <CSSettingsSection title="Tape filter">
                <CSSettingsRow label="Minimum trade notional ($)">
                    <NumberInput
                        ariaLabel="Minimum trade notional"
                        max={DOM_PREFERENCE_LIMITS.tapeMinNotional.max}
                        min={DOM_PREFERENCE_LIMITS.tapeMinNotional.min}
                        onChange={handleTapeMinNotional}
                        placeholder="NOTIONAL"
                        value={preferences.tapeMinNotional}
                    />
                </CSSettingsRow>
            </CSSettingsSection>
        </CSDrawer>
    );
};

export default DepthAndSalesSettings;
