import type { MouseEvent, RefObject } from 'react';

import { useEffect, useState } from 'react';

import type { DepthState } from '@/services/exchanges/types';

import CSButton, { CSButtonVariant } from '@/components/UI/CSButton';
import CSCheckbox from '@/components/UI/CSCheckbox';
import CSDrawer from '@/components/UI/CSDrawer';
import CSSegmented from '@/components/UI/CSSegmented';
import CSSettingsRow from '@/components/UI/CSSettingsRow';
import CSSettingsSection from '@/components/UI/CSSettingsSection';
import NumberInput from '@/components/UI/NumberInput';
import { DepthFeedStatus } from '@/services/exchanges/types';

import { MAX_MIN_NOTIONAL, liquidityPresetValues } from '../liquidityModel';
import useChartSeriesStore, {
    LiquidityContrast,
    LiquidityIntensity,
    defaultLiquidityPreferences,
    defaultSeriesVisibility,
} from '../useChartSeriesStore';
import styles from './TickChartSettings.module.css';

type Props = {
    depthRef: RefObject<DepthState>;
    isOpen: boolean;
    onClose: () => void;
    panelId: string;
    tickSize: number;
};

const intensityOptions = [LiquidityIntensity.Low, LiquidityIntensity.Medium, LiquidityIntensity.High];
const contrastOptions = [LiquidityContrast.Soft, LiquidityContrast.Normal, LiquidityContrast.Sharp];

const intensityLabel = (value: LiquidityIntensity): string => value.toUpperCase();

const contrastLabel = (value: LiquidityContrast): string => value.toUpperCase();

const formatPreset = (value: number): string => {
    if (value < 1_000) return Math.round(value).toString();
    const divisor = value >= 1_000_000 ? 1_000_000 : 1_000;
    const suffix = value >= 1_000_000 ? 'M' : 'K';
    const scaled = value / divisor;
    const digits = scaled < 10 && !Number.isInteger(scaled) ? 1 : 0;
    return `${scaled.toFixed(digits)}${suffix}`;
};

const sameNumbers = (left: number[], right: number[]): boolean =>
    left.length === right.length && left.every((value, index) => value === right[index]);

const TickChartSettings = ({ depthRef, isOpen, onClose, panelId, tickSize }: Props) => {
    const visibility = useChartSeriesStore((state) => state.visibility[panelId] ?? defaultSeriesVisibility);
    const preferences = useChartSeriesStore((state) => state.liquidity[panelId] ?? defaultLiquidityPreferences);
    const setContrast = useChartSeriesStore((state) => state.setLiquidityContrast);
    const setIntensity = useChartSeriesStore((state) => state.setLiquidityIntensity);
    const setMinNotional = useChartSeriesStore((state) => state.setMinNotional);
    const toggleSeries = useChartSeriesStore((state) => state.toggleSeries);
    const [presets, setPresets] = useState<number[]>([0]);

    useEffect(() => {
        if (!isOpen || !visibility.liquidity) return;
        const update = () => {
            const depth = depthRef.current;
            const next = depth?.status === DepthFeedStatus.Healthy ? liquidityPresetValues(depth.book, tickSize) : [0];
            setPresets((current) => (sameNumbers(current, next) ? current : next));
        };
        update();
        const timer = setInterval(update, 1_000);
        return () => clearInterval(timer);
    }, [depthRef, isOpen, tickSize, visibility.liquidity]);

    const handleSpread = () => toggleSeries(panelId, 'spread');
    const handleVolume = () => toggleSeries(panelId, 'volume');
    const handleLiquidity = () => toggleSeries(panelId, 'liquidity');
    const handleBook = () => toggleSeries(panelId, 'book');
    const handleIntensity = (value: LiquidityIntensity) => setIntensity(panelId, value);
    const handleContrast = (value: LiquidityContrast) => setContrast(panelId, value);
    const handleThreshold = (value: number) => setMinNotional(panelId, value);
    const firstPositive = presets.find((value) => value > 0);
    const increment = Math.max(100, (firstPositive ?? 10_000) / 10);
    const thresholdInputId = `liq-threshold-${panelId}`;
    const thresholdHelpId = `liq-threshold-help-${panelId}`;
    const handlePreset = (event: MouseEvent<HTMLButtonElement>) => {
        const value = Number(event.currentTarget.dataset.value);
        if (!Number.isFinite(value)) return;
        setMinNotional(panelId, value);
    };

    return (
        <CSDrawer
            footer={
                <CSButton onClick={onClose} variant={CSButtonVariant.Primary}>
                    Done
                </CSButton>
            }
            isOpen={isOpen}
            onClose={onClose}
            title="Tick Chart Settings"
        >
            <CSSettingsSection title="Chart display">
                <div className={styles.layers}>
                    <CSCheckbox checked={visibility.spread} label="Spread panel" onChange={handleSpread} />
                    <CSCheckbox checked={visibility.volume} label="Volume panel" onChange={handleVolume} />
                    <CSCheckbox checked={visibility.liquidity} label="Liquidity heatmap" onChange={handleLiquidity} />
                    <CSCheckbox checked={visibility.book} label="Order book depth" onChange={handleBook} />
                </div>
            </CSSettingsSection>

            {visibility.liquidity && (
                <>
                    <CSSettingsSection title="Liquidity appearance">
                        <CSSettingsRow label="Intensity">
                            <CSSegmented
                                ariaLabel="Intensity"
                                onChange={handleIntensity}
                                options={intensityOptions}
                                renderLabel={intensityLabel}
                                value={preferences.intensity}
                            />
                        </CSSettingsRow>
                        <CSSettingsRow label="Contrast">
                            <CSSegmented
                                ariaLabel="Contrast"
                                onChange={handleContrast}
                                options={contrastOptions}
                                renderLabel={contrastLabel}
                                value={preferences.contrast}
                            />
                        </CSSettingsRow>
                    </CSSettingsSection>

                    <CSSettingsSection title="Liquidity filter">
                        <CSSettingsRow htmlFor={thresholdInputId} label="Hide below">
                            <NumberInput
                                ariaDescribedBy={thresholdHelpId}
                                ariaLabel="Hide below"
                                className={styles.notionalInput}
                                id={thresholdInputId}
                                max={MAX_MIN_NOTIONAL}
                                min={0}
                                onChange={handleThreshold}
                                prefix="$"
                                step={increment}
                                value={preferences.minNotional}
                            />
                        </CSSettingsRow>
                        <div aria-label="Suggested liquidity thresholds" className={styles.presets} role="group">
                            {presets.map((value) => {
                                const label = value === 0 ? 'SHOW ALL' : `$${formatPreset(value)}+`;
                                return (
                                    <button
                                        className={
                                            preferences.minNotional === value ? styles.selectedPreset : undefined
                                        }
                                        data-value={value}
                                        key={value}
                                        onClick={handlePreset}
                                        type="button"
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        <p className={styles.help} id={thresholdHelpId}>
                            Hides liquidity below the selected notional. Show all keeps the visual noise floor.
                        </p>
                    </CSSettingsSection>
                </>
            )}
        </CSDrawer>
    );
};

export default TickChartSettings;
