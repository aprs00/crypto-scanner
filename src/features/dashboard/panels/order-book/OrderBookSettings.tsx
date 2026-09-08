import CSButton, { CSButtonVariant } from '@/components/UI/CSButton';
import CSCheckbox from '@/components/UI/CSCheckbox';
import CSDrawer from '@/components/UI/CSDrawer';
import CSSegmented from '@/components/UI/CSSegmented';
import CSSettingsRow from '@/components/UI/CSSettingsRow';
import CSSettingsSection from '@/components/UI/CSSettingsSection';
import NumberInput from '@/components/UI/NumberInput';

import type { Orientation } from '../shared/settings/types';

import { Orientation as OrientationValue } from '../shared/settings/types';

type Props = {
    isOpen: boolean;
    notional: boolean;
    numOfTicks: number;
    onClose: () => void;
    onNotionalChange: (showNotional: boolean) => void;
    onNumOfTicksChange: (numOfTicks: number) => void;
    onOrientationChange: (orientation: Orientation) => void;
    orientation: Orientation;
};

const orientationOptions = Object.values(OrientationValue);

const orientationLabel = (orientation: Orientation): string =>
    orientation === OrientationValue.V ? 'Vertical' : 'Horizontal';

const OrderBookSettings = ({
    isOpen,
    notional,
    numOfTicks,
    onClose,
    onNotionalChange,
    onNumOfTicksChange,
    onOrientationChange,
    orientation,
}: Props) => (
    <CSDrawer
        footer={
            <CSButton onClick={onClose} variant={CSButtonVariant.Primary}>
                Done
            </CSButton>
        }
        isOpen={isOpen}
        onClose={onClose}
        title="Order Book Settings"
    >
        <CSSettingsSection title="Display">
            <CSSettingsRow label="Group native ticks">
                <NumberInput ariaLabel="Order book tick grouping" onChange={onNumOfTicksChange} value={numOfTicks} />
            </CSSettingsRow>
            <CSSettingsRow label="Orientation">
                <CSSegmented<Orientation>
                    ariaLabel="Orientation"
                    onChange={onOrientationChange}
                    options={orientationOptions}
                    renderLabel={orientationLabel}
                    value={orientation}
                />
            </CSSettingsRow>
            <CSCheckbox checked={notional} label="Show quote notional ($)" onChange={onNotionalChange} />
        </CSSettingsSection>
    </CSDrawer>
);

export default OrderBookSettings;
