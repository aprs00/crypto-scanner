const formatNumber = (n: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat('en-US', options).format(n);

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

export { formatNumber, formatPrice, formatUSD };
