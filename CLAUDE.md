# crypto-scanner — agent guide

This project follows a **Bloomberg-terminal** visual language. The guidance below is for AI coding agents touching UI in this repo. Honor it unless the user explicitly overrides.

## Visual language

The look is data-first, dense, monospaced, dark. Inspired by Bloomberg Terminal: amber accents on black, cream foreground text, hairline borders, no decorative rounding, no shadows or glow effects, no emojis.

### Palette (single source of truth)

The palette lives in `src/lib/theme.ts` (TS) and is mirrored as CSS variables in `src/styles/tokens.css`. **Both must stay in sync** when colors are added or changed.

| Role           | TS                | CSS               | Notes                                         |
| -------------- | ----------------- | ----------------- | --------------------------------------------- |
| Background     | `palette.bg`      | `var(--bg)`       | App canvas (#0a0a0a)                          |
| Panel bg       | `palette.bgPanel` | `var(--bg-panel)` |                                               |
| Inset bg       | `palette.bgInset` | `var(--bg-inset)` | Track/inset shapes                            |
| Border         | `palette.bd`      | `var(--bd)`       | Hairline 1px separators                       |
| Foreground     | `palette.fg`      | `var(--fg)`       | Cream text, primary values (#d4c5a0)          |
| Dim            | `palette.fgDim`   | `var(--fg-dim)`   | Labels, secondary text                        |
| Mute           | `palette.fgMute`  | `var(--fg-mute)`  | Tertiary text, neutral midpoints in gradients |
| Accent         | `palette.ac`      | `var(--ac)`       | Amber for keys/active state (#ff9e1f)         |
| Accent 2       | `palette.ac2`     | `var(--ac2)`      | Hover/highlighted amber                       |
| Positive / bid | `palette.up`      | `var(--up)`       | Green (#9bca3e)                               |
| Negative / ask | `palette.down`    | `var(--down)`     | Red (#e8413f)                                 |

**Semantic rules:** positive/bid is always `--up` (green); negative/ask is always `--down` (red). The diverging heatmap (`heatmapGradient`) anchors on `palette.down → mid → palette.up`. The treemap uses a stepwise ramp instead (`treemapColorFor(change)`): magnitude buckets keyed off `|change|` map through `treemapRampNeg` / `treemapRampPos` so a -0.9% reads visibly different from a -4%. Do not use cream (`--fg`) as a gradient midpoint — values near zero become indistinguishable from the chart background and adjacent stops. Use `--fg-mute` (dim brown) instead.

### Typography

- All numeric values are monospaced — `JetBrains Mono` via `TERMINAL_FONT` (TS) or `'JetBrains Mono', ui-monospace, monospace` (CSS).
- Numbers always use `font-variant-numeric: tabular-nums` and `letter-spacing: -0.01em` for tighter columns.
- Labels are ALLCAPS with `letter-spacing: 0.10em–0.14em`, `font-size: 9–11px`, `color: var(--fg-dim)`.
- Primary values: 12–14px, semibold (600), `color: var(--fg)`.
- Secondary values (percentages, units, deltas): 10–12px, semibold, dim or semantic color.
- Never use serif fonts.

### Density & layout

- Tight padding: 6–12px rows, 8–14px section gutters. Avoid generous whitespace — terminals pack info.
- Hairline 1px borders in `var(--bd)` for row/section separators. No box-shadows.
- Border-radius: 0 by default. 2px max for input fields. No pill shapes, no fully-rounded buttons.
- Grids over flex when columns need to align across rows (e.g. label column + value column).
- Status bars / indicators: prefer thin (4–8px), full-opacity, solid color over translucent. Add a center tick (`var(--fg-dim)` 1px) for 50% reference where comparison matters.
- No gradients on UI surfaces — gradients are reserved for diverging chart palettes (heatmap, treemap).

### Iconography

- Use only the icons in `src/components/Icons/` (monoline SVGs styled with `currentColor`). Do not introduce decorative icons, illustrations, or emojis.
- Active/selected affordances use `var(--ac)` (amber), never blue/purple/etc.

### CSS conventions

CSS lives in two places:

1. **Global**, in `src/styles/`, imported once via `src/index.css`:
    - `tokens.css` — `:root` palette + sizing variables (mirrors `src/lib/theme.ts`).
    - `base.css` — font import, resets, `html`/`body`/`#root`.
    - `atoms.css` — one-line typography/color helpers used everywhere: `.mono`, `.num`, `.up`, `.down`, `.dim`, `.ac`, `.ac2`, `.blink`.
    - `utilities.css` — layout (`.flex`, `.items-center`, …), sizing (`.w-24`, `.icon-md`, `.h-body`, …), `.scroll`, `.truncate`, `.sr-only`, `.center-overlay`, page chrome (`.page-body`, `.grid-host`, `.grid-card`).
    - `controls.css` — the shared `.btn` primitive (with `.btn.primary`, `.btn.square`). Used by `CSIconButton` and any ad-hoc button that needs the terminal look.
    - `transitions.css` — HeadlessUI `<Transition>` class strings (`.transition`, `.ease-in/out`, `.dur-*`, `.opacity-*`, `.scale-*`, `.translate-*`, `.slide-in-left`, `.slide-rest`). Must stay global because they're passed as className strings.
    - `vendor.css` — `react-grid-layout` and TradingView widget overrides.

2. **Component-scoped**, as `*.module.css` next to the component (CSS Modules). Each module owns the classes for one component. Inside a module, use short local names (`.panel`, `.head`, `.body`); the module is the namespace. Import as `import styles from './Component.module.css'` and use `styles.panel`.

Rules:

- Author new component styles as a co-located CSS Module. Only add to the global files when the style is genuinely cross-cutting (used by three or more components, or by HeadlessUI string slots).
- Don't reintroduce a `tk-` (or any other) prefix on module classes — the module already namespaces them.
- Compose state via flat classes joined in JSX, not compound selectors:
    ```tsx
    <button className={[styles.btn, isPrimary && styles.primary].filter(Boolean).join(' ')} />
    ```
- Inline `style={...}` is acceptable only for dynamic per-row values (e.g. a percentage width).
- Reference palette through CSS variables (`var(--up)`) — do not hard-code hexes in component CSS.

### Charts (ECharts)

- Always read colors and the font stack from `@/lib/theme` (`palette`, `TERMINAL_FONT`). Do not hex-code chart colors at call sites.
- Axis labels: `palette.fgDim`, `TERMINAL_FONT`.
- Grid lines: `palette.grid` (very faint amber).
- Diverging visual maps: import `heatmapGradient` (smooth, for heatmaps). The min end of the array is `palette.down` (negative red), the max end is `palette.up` (positive green) — this matches the bar-chart price-change semantics. For the treemap, use `treemapColorFor(change)` per data item — it returns a calibrated stepwise color so a -0.9% tile looks different from a -4% tile.
- Tooltips inherit from `ECHARTS_THEME`; do not override unless adding semantic markers.

## Writing & content tone

- Labels are short and uppercase: `TOTAL MARKET`, `VISIBLE`, `EXCHANGE`. Avoid sentence-case marketing copy.
- Units use compact notation: `$38.36M`, `$1.67M`, `175.51K`. Use `formatNumber(x, { notation: 'compact', maximumFractionDigits: 2 })`.
- No exclamation points, no emojis, no friendly microcopy. The interface speaks like a trading terminal.

## When you change colors or fonts

1. Edit `src/lib/theme.ts` (palette / gradient / `TERMINAL_FONT`).
2. Mirror any palette entry change into the CSS variables in `src/styles/tokens.css` (`:root { --bg: …; ... }`).
3. Check that `heatmapGradient` still places `palette.down` at the min end and `palette.up` at the max end. For treemap, verify `treemapColorFor` still maps largest negative magnitudes to the deepest red end of `treemapRampNeg` and largest positive to the deepest green end of `treemapRampPos`.

## Code style

- **Prefer inline `&&` / `||` chains over `if`-return ladders** for small bucket/lookup functions. Example: write
    ```ts
    return (abs >= 1000 && 2) || (abs >= 1 && 4) || (abs >= 0.01 && 6) || 8;
    ```
    instead of a 4-line `if (...) return ...;` stack. Falls back to the final value when every guard is falsy. Only safe when none of the values can themselves be falsy (`0`, `''`, `null`).

## What to avoid

- Generic SaaS look: pastel palettes, soft shadows, large border-radius, full-width hero cards.
- Decorative gradients on UI chrome (buttons, panels, headers).
- Emojis, illustrations, mascots.
- Hex literals scattered through components — always go through `theme.ts` / CSS vars.
- Cream/beige as a midpoint in diverging palettes (see palette section).
- Stacking layouts when a denser table/grid would carry the same data.
