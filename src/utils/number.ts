const NUMBER_FORMATTER_CACHE_LIMIT = 32;

const numberFormatters = new Map<string, Intl.NumberFormat>();

/**
 * Reuses formatters because constructing `Intl.NumberFormat` for every rendered
 * cell is expensive and creates native ICU allocation pressure. Callers usually
 * create a fresh options object, so object-keyed Maps would miss even when the
 * option values are identical. The serialized value provides a stable key, and
 * the small limit prevents uncommon option combinations from growing forever.
 */
const getNumberFormatter = (options: Intl.NumberFormatOptions = {}): Intl.NumberFormat => {
    const key = JSON.stringify(options);
    const cached = numberFormatters.get(key);
    if (cached) return cached;

    const formatter = new Intl.NumberFormat('en-US', options);
    if (numberFormatters.size >= NUMBER_FORMATTER_CACHE_LIMIT) {
        const oldestKey = numberFormatters.keys().next().value;
        if (oldestKey !== undefined) numberFormatters.delete(oldestKey);
    }
    numberFormatters.set(key, formatter);
    return formatter;
};

const formatNumber = (n: number, options?: Intl.NumberFormatOptions) => getNumberFormatter(options).format(n);

const decimalPlaces = (value: number): number => {
    if (!Number.isFinite(value) || value === 0) return 0;

    const absoluteValue = Math.abs(value);
    const tolerance = Number.EPSILON * absoluteValue * 8;
    for (let decimals = 0; decimals <= 12; decimals += 1) {
        const rounded = Number(absoluteValue.toFixed(decimals));
        if (Math.abs(absoluteValue - rounded) <= tolerance) return decimals;
    }
    return 12;
};

const priceDecimals = (n: number) => {
    const abs = Math.abs(n);
    return (abs >= 1000 && 2) || (abs >= 1 && 4) || (abs >= 0.01 && 6) || 8;
};

const formatPrice = (n: number, decimals?: number) => {
    const d = decimals ?? priceDecimals(n);
    return formatNumber(n, { minimumFractionDigits: d, maximumFractionDigits: d });
};

const formatUSD = (n: number) => {
    const compact = Math.abs(n) >= 1e6;
    const d = compact ? 2 : priceDecimals(n);
    return formatNumber(n, {
        style: 'currency',
        currency: 'USD',
        notation: compact ? 'compact' : 'standard',
        minimumFractionDigits: d,
        maximumFractionDigits: d,
    });
};

const formatCompactUSD = (n: number) =>
    Math.abs(n) >= 1_000
        ? formatNumber(n, {
              currency: 'USD',
              maximumFractionDigits: 2,
              notation: 'compact',
              style: 'currency',
          })
        : formatUSD(n);

const COMPACT_NUMBER_UNITS = [
    [1e12, 't'],
    [1e9, 'b'],
    [1e6, 'm'],
    [1e3, 'k'],
] as const;

const formatCompactNumber = (value: number): string => {
    if (!Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    for (const [threshold, suffix] of COMPACT_NUMBER_UNITS) {
        if (abs < threshold) continue;
        const scaled = value / threshold;
        const digits = Math.abs(scaled) >= 100 ? 0 : Math.abs(scaled) >= 10 ? 1 : 2;
        return `${scaled.toFixed(digits).replace(/\.0+$|(?<=\.[0-9])0+$/u, '')}${suffix}`;
    }
    const formatted = formatNumber(value, { maximumFractionDigits: 8, minimumFractionDigits: 0 });
    return formatted === '-0' ? '0' : formatted;
};

export { decimalPlaces, formatCompactNumber, formatCompactUSD, formatNumber, formatPrice, formatUSD };
