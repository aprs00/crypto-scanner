// Single source of truth for the Bloomberg-terminal palette.
// CSS-variable counterparts live in src/index.css and must stay in sync.

export const palette = {
    bg: '#0a0a0a',
    bgAlt: '#111111',
    bgPanel: '#0d0d0d',
    bgInset: '#070707',
    bd: '#1f1f1f',
    bdHi: '#2a2a2a',
    fg: '#d4c5a0',
    fgDim: '#7a6f56',
    fgMute: '#4d4639',
    ac: '#ff9e1f',
    ac2: '#ffb84d',
    up: '#9bca3e',
    down: '#e8413f',
    neu: '#7a6f56',
    heatHi: '#e8413f',
    heatLo: '#3b82c4',
    heatMid: '#1a1a1a',
    grid: 'rgba(255,158,31,0.08)',
    axis: 'rgba(212,197,160,0.35)',
} as const;

export const TERMINAL_FONT = "'JetBrains Mono', ui-monospace, monospace";

export const spacing = { 1: 4, 2: 6, 3: 8, 4: 10, 5: 12, 6: 14, 7: 16, 8: 24 } as const;

const rgb = (hex: string) => {
    const h = hex.replace('#', '');
    const v =
        h.length === 3
            ? h
                  .split('')
                  .map((c) => c + c)
                  .join('')
            : h;
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)] as const;
};

export const withAlpha = (hex: string, alpha: number) => {
    const [r, g, b] = rgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Diverging heatmap gradient: palette.down (red) → fgMute (dim brown) → palette.up (green).
// Mirrors the bar-chart price-change palette so up/down semantics carry across charts:
// negative values render red, positive render green. The dim brown midpoint keeps
// near-zero values visually distinct from both red and green sides.
export const heatmapGradient = [
    '#5a0a0a',
    '#c92e2c',
    palette.down,
    '#ff8585',
    palette.fgMute,
    '#bce070',
    palette.up,
    '#5e9024',
    '#1f4a08',
] as const;

// Calibrated stepwise treemap ramp. Each ramp is ordered deepest → lightest, so the
// index for the most extreme magnitude is 0 and the index for the smallest non-zero
// magnitude is the last slot. Tile color is picked by `|change|` bucket via
// `treemapColorFor(change)` — this keeps a -0.9% tile visibly distinct from a -4%.
export const treemapRampNeg = ['#3a1416', '#5e1b1f', '#8a2329', '#b82a32', '#dc3545', '#e55a63', '#ec8088'] as const;
export const treemapRampPos = ['#1a2a08', '#2d4a0e', '#456f15', '#5e8f1c', '#84cc16', '#a3d652', '#bfe18a'] as const;
export const treemapNeutral = '#2a2522';

export const treemapColorFor = (change: number) => {
    const a = Math.abs(change);
    if (a < 0.05) return treemapNeutral;
    const ramp = change < 0 ? treemapRampNeg : treemapRampPos;
    const idx = a < 0.5 ? 6 : a < 1 ? 5 : a < 2 ? 4 : a < 3 ? 3 : a < 5 ? 2 : a < 8 ? 1 : 0;
    return ramp[idx];
};
