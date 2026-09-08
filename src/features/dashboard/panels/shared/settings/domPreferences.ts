export const DomQuantityMode = {
    Base: 'base',
    Notional: 'notional',
} as const;

export type DomQuantityMode = (typeof DomQuantityMode)[keyof typeof DomQuantityMode];

export type DomPreferences = {
    autoCenter: boolean;
    groupTicks: number;
    pullStackRows: number;
    quantityMode: DomQuantityMode;
    showExecutions: boolean;
    showHeader: boolean;
    showMeter: boolean;
    showPullStack: boolean;
    showTape: boolean;
    tapeMinNotional: number;
    visibleRowsPerSide: number;
};

export const DOM_PREFERENCE_LIMITS = {
    groupTicks: { max: 1_000, min: 1 },
    pullStackRows: { max: 500, min: 1 },
    tapeMinNotional: { max: 1_000_000_000_000, min: 0 },
    visibleRowsPerSide: { max: 250, min: 1 },
} as const;

export const defaultDomPreferences: DomPreferences = {
    autoCenter: true,
    groupTicks: 50,
    pullStackRows: 10,
    quantityMode: DomQuantityMode.Base,
    showExecutions: true,
    showHeader: true,
    showMeter: true,
    showPullStack: true,
    showTape: true,
    tapeMinNotional: 0,
    visibleRowsPerSide: 20,
};

type NumberRange = Readonly<{ max: number; min: number }>;

const boundedNumber = (value: unknown, fallback: number, range: NumberRange, integer = false): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    const normalized = integer ? Math.floor(value) : value;
    return Math.max(range.min, Math.min(range.max, normalized));
};

const booleanValue = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);

export const sanitizeDomPreferences = (value: unknown): DomPreferences => {
    const candidate = value as Partial<DomPreferences> | null;

    return {
        autoCenter: booleanValue(candidate?.autoCenter, defaultDomPreferences.autoCenter),
        groupTicks: boundedNumber(
            candidate?.groupTicks,
            defaultDomPreferences.groupTicks,
            DOM_PREFERENCE_LIMITS.groupTicks,
            true,
        ),
        pullStackRows: boundedNumber(
            candidate?.pullStackRows,
            defaultDomPreferences.pullStackRows,
            DOM_PREFERENCE_LIMITS.pullStackRows,
            true,
        ),
        quantityMode:
            candidate?.quantityMode === DomQuantityMode.Notional
                ? DomQuantityMode.Notional
                : defaultDomPreferences.quantityMode,
        showExecutions: booleanValue(candidate?.showExecutions, defaultDomPreferences.showExecutions),
        showHeader: booleanValue(candidate?.showHeader, defaultDomPreferences.showHeader),
        showMeter: booleanValue(candidate?.showMeter, defaultDomPreferences.showMeter),
        showPullStack: booleanValue(candidate?.showPullStack, defaultDomPreferences.showPullStack),
        showTape: booleanValue(candidate?.showTape, defaultDomPreferences.showTape),
        tapeMinNotional: boundedNumber(
            candidate?.tapeMinNotional,
            defaultDomPreferences.tapeMinNotional,
            DOM_PREFERENCE_LIMITS.tapeMinNotional,
        ),
        visibleRowsPerSide: boundedNumber(
            candidate?.visibleRowsPerSide,
            defaultDomPreferences.visibleRowsPerSide,
            DOM_PREFERENCE_LIMITS.visibleRowsPerSide,
            true,
        ),
    };
};
