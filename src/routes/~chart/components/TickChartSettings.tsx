import type { ChangeEvent, FocusEvent, MouseEvent, RefObject } from 'react';

import { useEffect, useRef, useState } from 'react';

import type { DepthState } from '@/services/exchanges/types';

import CSButton, { CSButtonVariant } from '@/components/UI/CSButton';
import CSDrawer from '@/components/UI/CSDrawer';
import CSSegmented from '@/components/UI/CSSegmented';
import CSToggleButton from '@/components/UI/CSToggleButton';
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

const intensityLabel = (value: LiquidityIntensity): string =>
    value === LiquidityIntensity.Medium ? 'MED' : value.toUpperCase();

const contrastLabel = (value: LiquidityContrast): string =>
    value === LiquidityContrast.Normal ? 'NORM' : value.toUpperCase();

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
    const editingRef = useRef(false);
    const [presets, setPresets] = useState<number[]>([0]);
    const [thresholdText, setThresholdText] = useState(String(preferences.minNotional));

    useEffect(() => {
        if (!editingRef.current) setThresholdText(String(preferences.minNotional));
    }, [preferences.minNotional]);

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
    const handleFocus = () => {
        editingRef.current = true;
    };
    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
        editingRef.current = false;
        const value = Number(event.currentTarget.value);
        if (event.currentTarget.value.trim() === '' || !Number.isFinite(value) || value < 0 || value > MAX_MIN_NOTIONAL)
            setThresholdText(String(preferences.minNotional));
    };
    const handleThreshold = (event: ChangeEvent<HTMLInputElement>) => {
        const text = event.currentTarget.value;
        setThresholdText(text);
        if (text.trim() === '') {
            setMinNotional(panelId, 0);
            return;
        }
        const value = Number(text);
        if (Number.isFinite(value) && value >= 0 && value <= MAX_MIN_NOTIONAL) setMinNotional(panelId, value);
    };
    const firstPositive = presets.find((value) => value > 0);
    const increment = Math.max(100, (firstPositive ?? 10_000) / 10);
    const changeBy = (direction: 1 | -1) => {
        const next = Math.max(0, Math.min(MAX_MIN_NOTIONAL, preferences.minNotional + direction * increment));
        setThresholdText(String(next));
        setMinNotional(panelId, next);
    };
    const handleIncrement = () => changeBy(1);
    const handleDecrement = () => changeBy(-1);
    const handlePreset = (event: MouseEvent<HTMLButtonElement>) => {
        const value = Number(event.currentTarget.dataset.value);
        if (!Number.isFinite(value)) return;
        setThresholdText(String(value));
        setMinNotional(panelId, value);
    };

    return (
        <CSDrawer isOpen={isOpen} onClose={onClose} title="Tick Chart Settings">
            <div className={styles.body}>
                <section className={styles.section}>
                    <h3 className={styles.heading}>Series</h3>
                    <div className={styles.series}>
                        <CSToggleButton active={visibility.spread} onClick={handleSpread}>
                            SPREAD
                        </CSToggleButton>
                        <CSToggleButton active={visibility.volume} onClick={handleVolume}>
                            VOL
                        </CSToggleButton>
                        <CSToggleButton active={visibility.liquidity} onClick={handleLiquidity}>
                            LIQ
                        </CSToggleButton>
                        <CSToggleButton active={visibility.book} onClick={handleBook}>
                            BOOK
                        </CSToggleButton>
                    </div>
                </section>

                {visibility.liquidity && (
                    <>
                        <section className={styles.section}>
                            <div className={styles.settingRow}>
                                <span className={styles.label}>Intensity</span>
                                <CSSegmented
                                    onChange={handleIntensity}
                                    options={intensityOptions}
                                    renderLabel={intensityLabel}
                                    value={preferences.intensity}
                                />
                            </div>
                            <div className={styles.settingRow}>
                                <span className={styles.label}>Contrast</span>
                                <CSSegmented
                                    onChange={handleContrast}
                                    options={contrastOptions}
                                    renderLabel={contrastLabel}
                                    value={preferences.contrast}
                                />
                            </div>
                        </section>

                        <section className={styles.section}>
                            <label className={styles.label} htmlFor={`liq-threshold-${panelId}`}>
                                Minimum notional
                            </label>
                            <div className={styles.notionalInput}>
                                <span className={styles.prefix}>$</span>
                                <input
                                    id={`liq-threshold-${panelId}`}
                                    inputMode="decimal"
                                    max={MAX_MIN_NOTIONAL}
                                    min={0}
                                    onBlur={handleBlur}
                                    onChange={handleThreshold}
                                    onFocus={handleFocus}
                                    step={increment}
                                    type="number"
                                    value={thresholdText}
                                />
                                <span className={styles.arrows}>
                                    <button
                                        aria-label="Increase minimum notional"
                                        onClick={handleIncrement}
                                        type="button"
                                    >
                                        ▲
                                    </button>
                                    <button
                                        aria-label="Decrease minimum notional"
                                        onClick={handleDecrement}
                                        type="button"
                                    >
                                        ▼
                                    </button>
                                </span>
                            </div>
                            <div className={styles.presets}>
                                {presets.map((value, index) => {
                                    const prefix =
                                        index === 0 ? 'ALL' : index === 1 ? 'LOW' : index === 2 ? 'MID' : 'HIGH';
                                    const label = value === 0 ? prefix : `${prefix} ${formatPreset(value)}`;
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
                            <p className={styles.help}>
                                ALL removes the notional threshold; the visual noise floor remains.
                            </p>
                        </section>
                    </>
                )}

                <CSButton className={styles.done} onClick={onClose} variant={CSButtonVariant.Primary}>
                    Done
                </CSButton>
            </div>
        </CSDrawer>
    );
};

export default TickChartSettings;
