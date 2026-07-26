import type { CSSProperties, Dispatch, ReactNode, RefObject, SetStateAction } from 'react';

import { useDocumentVisibility, useIntersection, useMergedRef, useResizeObserver } from '@mantine/hooks';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { ResetIcon, SettingsIcon } from '@/components/Icons';
import CSPanel from '@/components/Layouts/CSPanel';
import CSButton from '@/components/UI/CSButton';
import CSToggleButton from '@/components/UI/CSToggleButton';
import { DepthFeedStatus } from '@/services/exchanges/types';
import { decimalPlaces, formatCompactNumber, formatPrice } from '@/utils/number';

import type { DomLadderRow } from '../domModel';
import type { DomPreferences, DomQuantityMode } from '../domPreferences';

import { DomRowCoverage, DomRowRole } from '../domModel';
import { defaultDomPreferences, DomQuantityMode as QuantityMode } from '../domPreferences';
import { PanelType } from '../types';
import useChartSeriesStore from '../useChartSeriesStore';
import useDomFeed from '../useDomFeed';
import useResolvedSource from '../useResolvedSource';
import styles from './DepthAndSales.module.css';
import DepthAndSalesSettings from './DepthAndSalesSettings';
import DepthAndSalesTape from './DepthAndSalesTape';
import PanelSource from './PanelSource';

const ROW_HEIGHT = 18;
const DEFAULT_VISIBLE_ROWS = 20;
const TAPE_MIN_WIDTH = 560;
const EMPTY_CELL = '';

const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
});

type Props = { panelId: string; onRemove: () => void };

const BarAnchor = {
    Left: 'left',
    Right: 'right',
} as const;

type BarAnchor = (typeof BarAnchor)[keyof typeof BarAnchor];

const BarKind = {
    Ask: 'ask',
    Bid: 'bid',
    PullStack: 'pullStack',
} as const;

type BarKind = (typeof BarKind)[keyof typeof BarKind];

const CenterMode = {
    Follow: 'follow',
    Manual: 'manual',
    ManualPending: 'manual-pending',
} as const;

type CenterState =
    | { mode: typeof CenterMode.Follow }
    | { mode: typeof CenterMode.Manual; tick: number }
    | { mode: typeof CenterMode.ManualPending };

type InteractionState = {
    autoCenter: boolean;
    center: CenterState;
    groupTicks: number;
    marketCenterTick: number | null;
};

type InteractionRef = RefObject<InteractionState>;

type BarCellProps = {
    anchor: BarAnchor;
    barKind: BarKind;
    children: ReactNode;
    className?: string;
    percentage: number;
    signedValue?: number;
    title: string;
};

type BarCellStyle = CSSProperties & { '--bar-width': string };

type LadderRowProps = {
    priceDecimals: number;
    quantityMode: DomQuantityMode;
    row: DomLadderRow;
    showExecutions: boolean;
    showPullStack: boolean;
};

type LadderProps = {
    activityStartedAt: number;
    ladderRef: RefObject<HTMLDivElement | null>;
    priceDecimals: number;
    quantityMode: DomQuantityMode;
    rows: DomLadderRow[];
    showExecutions: boolean;
    showHeader: boolean;
    showMeter: boolean;
    showPullStack: boolean;
};

const commitCenter = (
    interactionRef: InteractionRef,
    setCenterState: Dispatch<SetStateAction<CenterState>>,
    center: CenterState,
    autoCenter = interactionRef.current.autoCenter,
): void => {
    interactionRef.current = { ...interactionRef.current, autoCenter, center };
    setCenterState(center);
};

const signedCompactNumber = (value: number): string => {
    const formatted = formatCompactNumber(value);
    return formatted === '0' ? formatted : `${value > 0 ? '+' : ''}${formatted}`;
};

const displayQuantity = (value: number, price: number, quantityMode: DomQuantityMode): number =>
    quantityMode === QuantityMode.Notional ? value * price : value;

const summarizeRows = (rows: DomLadderRow[], quantityMode: DomQuantityMode) => {
    let askDepth = 0;
    let askPullStack = 0;
    let bidDepth = 0;
    let bidPullStack = 0;
    for (const row of rows) {
        askDepth += displayQuantity(row.askSize, row.price, quantityMode);
        askPullStack += displayQuantity(row.askPullStack, row.price, quantityMode);
        bidDepth += displayQuantity(row.bidSize, row.price, quantityMode);
        bidPullStack += displayQuantity(row.bidPullStack, row.price, quantityMode);
    }
    const depth = bidDepth + askDepth;
    return {
        askDepth,
        askPercent: depth > 0 ? (askDepth / depth) * 100 : 0,
        askPullStack,
        bidDepth,
        bidPercent: depth > 0 ? (bidDepth / depth) * 100 : 0,
        bidPullStack,
        imbalance: depth > 0 ? (bidDepth - askDepth) / depth : 0,
    };
};

const cellValue = (value: number, price: number, quantityMode: DomQuantityMode, signed = false): string => {
    if (value === 0) return EMPTY_CELL;
    const displayed = displayQuantity(value, price, quantityMode);
    const formatted = signed ? signedCompactNumber(displayed) : formatCompactNumber(displayed);
    return formatted === '0' ? EMPTY_CELL : formatted;
};

const coveredCellValue = (
    value: number,
    price: number,
    quantityMode: DomQuantityMode,
    coverage: DomRowCoverage,
    applicable: boolean,
    signed = false,
): string => {
    if (!applicable || coverage === DomRowCoverage.Unavailable) return EMPTY_CELL;
    return cellValue(value, price, quantityMode, signed);
};

const coverageSuffix = (coverage: DomRowCoverage): string =>
    coverage === DomRowCoverage.Partial
        ? ' — partial source coverage'
        : coverage === DomRowCoverage.Unavailable
          ? ' — outside available source depth'
          : '';

const activityTitle = (
    label: string,
    value: number,
    price: number,
    quantityMode: DomQuantityMode,
    signed = false,
): string => {
    const displayed = displayQuantity(value, price, quantityMode);
    const unit = quantityMode === QuantityMode.Notional ? 'quote notional' : 'base quantity';
    const formatted = signed ? signedCompactNumber(displayed) : formatCompactNumber(displayed);
    return `${label}: ${formatted} ${unit}`;
};

const coveredActivityTitle = (
    label: string,
    value: number,
    price: number,
    quantityMode: DomQuantityMode,
    coverage: DomRowCoverage,
    signed = false,
): string => `${activityTitle(label, value, price, quantityMode, signed)}${coverageSuffix(coverage)}`;

const BarCell = ({ anchor, barKind, children, className = '', percentage, signedValue = 0, title }: BarCellProps) => {
    const normalizedPercentage = Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : 0;
    const visiblePercentage = children === EMPTY_CELL ? 0 : normalizedPercentage;
    const classes = [
        styles.cell,
        styles.barCell,
        anchor === BarAnchor.Left ? styles.leftAlignedCell : styles.rightAlignedBar,
        barKind === BarKind.Bid && styles.bidBar,
        barKind === BarKind.Ask && styles.askBar,
        barKind === BarKind.PullStack && (signedValue >= 0 ? styles.addedBar : styles.pulledBar),
        className,
    ]
        .filter(Boolean)
        .join(' ');
    const style: BarCellStyle = {
        '--bar-width': visiblePercentage > 0 ? `max(2px, ${visiblePercentage}%)` : '0px',
    };

    return (
        <td className={classes} style={style} title={title}>
            {children}
        </td>
    );
};

const ladderRowClasses = (row: DomLadderRow): string =>
    [
        styles.row,
        row.isBestAsk && styles.insideAsk,
        row.isBestBid && styles.insideBid,
        row.isLastTrade && styles.lastTrade,
    ]
        .filter(Boolean)
        .join(' ');

const DomLadderRowView = ({ priceDecimals, quantityMode, row, showExecutions, showPullStack }: LadderRowProps) => {
    const priceLabel = formatPrice(row.price, priceDecimals);
    return (
        <tr className={ladderRowClasses(row)}>
            {showPullStack && (
                <BarCell
                    anchor={BarAnchor.Right}
                    barKind={BarKind.PullStack}
                    percentage={row.bidPullStackPercent}
                    signedValue={row.bidPullStack}
                    title={coveredActivityTitle(
                        'Estimated bid pull/stack',
                        row.bidPullStack,
                        row.price,
                        quantityMode,
                        row.bidCoverage,
                        true,
                    )}
                >
                    {coveredCellValue(
                        row.bidPullStack,
                        row.price,
                        quantityMode,
                        row.bidCoverage,
                        row.role !== DomRowRole.Ask,
                        true,
                    )}
                </BarCell>
            )}
            <BarCell
                anchor={BarAnchor.Right}
                barKind={BarKind.Bid}
                percentage={row.bidDepthPercent}
                title={coveredActivityTitle('Resting bid', row.bidSize, row.price, quantityMode, row.bidCoverage)}
            >
                {coveredCellValue(row.bidSize, row.price, quantityMode, row.bidCoverage, row.role !== DomRowRole.Ask)}
            </BarCell>
            {showExecutions && (
                <td
                    className={[styles.cell, styles.sell].join(' ')}
                    title={activityTitle('Sell-aggressor executions', row.sellVolume, row.price, quantityMode)}
                >
                    {cellValue(row.sellVolume, row.price, quantityMode)}
                </td>
            )}
            <td className={styles.price} title={`Grouped price ${priceLabel}`}>
                {priceLabel}
            </td>
            {showExecutions && (
                <td
                    className={[styles.cell, styles.buy].join(' ')}
                    title={activityTitle('Buy-aggressor executions', row.buyVolume, row.price, quantityMode)}
                >
                    {cellValue(row.buyVolume, row.price, quantityMode)}
                </td>
            )}
            <BarCell
                anchor={BarAnchor.Left}
                barKind={BarKind.Ask}
                percentage={row.askDepthPercent}
                title={coveredActivityTitle('Resting ask', row.askSize, row.price, quantityMode, row.askCoverage)}
            >
                {coveredCellValue(row.askSize, row.price, quantityMode, row.askCoverage, row.role !== DomRowRole.Bid)}
            </BarCell>
            {showPullStack && (
                <BarCell
                    anchor={BarAnchor.Left}
                    barKind={BarKind.PullStack}
                    percentage={row.askPullStackPercent}
                    signedValue={row.askPullStack}
                    title={coveredActivityTitle(
                        'Estimated ask pull/stack',
                        row.askPullStack,
                        row.price,
                        quantityMode,
                        row.askCoverage,
                        true,
                    )}
                >
                    {coveredCellValue(
                        row.askPullStack,
                        row.price,
                        quantityMode,
                        row.askCoverage,
                        row.role !== DomRowRole.Bid,
                        true,
                    )}
                </BarCell>
            )}
        </tr>
    );
};

const DomLadder = ({
    activityStartedAt,
    ladderRef,
    priceDecimals,
    quantityMode,
    rows,
    showExecutions,
    showHeader,
    showMeter,
    showPullStack,
}: LadderProps) => {
    const summary = summarizeRows(rows, quantityMode);
    const resetTitle = activityStartedAt
        ? `Activity since ${TIME_FORMATTER.format(activityStartedAt)}`
        : 'Activity is waiting for a synchronized baseline';
    const bidMeterStyle: CSSProperties = { width: `${summary.bidPercent}%` };

    return (
        <section aria-label="Depth of market price ladder" className={styles.ladder}>
            <div className={styles.tableWrap} ref={ladderRef}>
                <table className={styles.table}>
                    <caption className="sr-only">
                        Live depth, executions, and estimated pulled or added liquidity by price
                    </caption>
                    <colgroup>
                        {showPullStack && <col className={styles.colPullStack} />}
                        <col className={styles.colDepth} />
                        {showExecutions && <col className={styles.colExecution} />}
                        <col className={styles.colPrice} />
                        {showExecutions && <col className={styles.colExecution} />}
                        <col className={styles.colDepth} />
                        {showPullStack && <col className={styles.colPullStack} />}
                    </colgroup>
                    {showHeader && (
                        <thead>
                            <tr>
                                {showPullStack && (
                                    <th scope="col" title="Estimated net bid liquidity added (+) or pulled (-)">
                                        P/S-B
                                    </th>
                                )}
                                <th scope="col" title="Resting bid quantity">
                                    Bid
                                </th>
                                {showExecutions && (
                                    <th scope="col" title="Sell-aggressor executions">
                                        Sell ↓
                                    </th>
                                )}
                                <th className={styles.priceHead} scope="col">
                                    Price
                                </th>
                                {showExecutions && (
                                    <th scope="col" title="Buy-aggressor executions">
                                        Buy ↑
                                    </th>
                                )}
                                <th scope="col" title="Resting ask quantity">
                                    Ask
                                </th>
                                {showPullStack && (
                                    <th scope="col" title="Estimated net ask liquidity added (+) or pulled (-)">
                                        P/S-A
                                    </th>
                                )}
                            </tr>
                        </thead>
                    )}
                    <tbody>
                        {rows.map((row) => (
                            <DomLadderRowView
                                key={row.key}
                                priceDecimals={priceDecimals}
                                quantityMode={quantityMode}
                                row={row}
                                showExecutions={showExecutions}
                                showPullStack={showPullStack}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {showMeter && (
                <footer className={styles.footer} title={resetTitle}>
                    <span className={styles.footerMetric}>
                        P/S-B
                        <strong className={summary.bidPullStack < 0 ? styles.negative : styles.positive}>
                            {signedCompactNumber(summary.bidPullStack)}
                        </strong>
                    </span>
                    <span className={styles.footerMetric}>
                        Vis Bid
                        <strong>{formatCompactNumber(summary.bidDepth)}</strong>
                    </span>
                    <span className={styles.meter}>
                        <span className={styles.meterLabels}>
                            <span>{summary.bidPercent.toFixed(0)}%</span>
                            <span>
                                {summary.imbalance > 0 ? '+' : ''}
                                {(summary.imbalance * 100).toFixed(0)}%
                            </span>
                            <span>{summary.askPercent.toFixed(0)}%</span>
                        </span>
                        <span className={styles.meterTrack}>
                            <span className={styles.meterBid} style={bidMeterStyle} />
                            {summary.askPercent > 0 && <span className={styles.meterAsk} />}
                        </span>
                    </span>
                    <span className={styles.footerMetric}>
                        Vis Ask
                        <strong>{formatCompactNumber(summary.askDepth)}</strong>
                    </span>
                    <span className={styles.footerMetric}>
                        P/S-A
                        <strong className={summary.askPullStack < 0 ? styles.negative : styles.positive}>
                            {signedCompactNumber(summary.askPullStack)}
                        </strong>
                    </span>
                </footer>
            )}
        </section>
    );
};

const DepthAndSales = ({ panelId, onRemove }: Props) => {
    const { exchange, symbol, tickSize } = useResolvedSource(panelId, PanelType.DepthAndSales);
    const preferences = useChartSeriesStore((state) => state.dom[panelId]) ?? defaultDomPreferences;
    const setDomPreferences = useChartSeriesStore((state) => state.setDomPreferences);
    const { entry, ref: intersectionRef } = useIntersection<HTMLDivElement>();
    const documentVisibility = useDocumentVisibility();
    const [workspaceSizeRef, workspaceRect] = useResizeObserver<HTMLDivElement>();
    const workspaceRef = useMergedRef(intersectionRef, workspaceSizeRef);
    const [ladderRef, ladderRect] = useResizeObserver<HTMLDivElement>();
    const [centerState, setCenterState] = useState<CenterState>(() =>
        preferences.autoCenter ? { mode: CenterMode.Follow } : { mode: CenterMode.ManualPending },
    );
    const [settingsOpen, setSettingsOpen] = useState(false);
    const isVisible = (entry?.isIntersecting ?? true) && documentVisibility === 'visible';
    const showTape = preferences.showTape && workspaceRect.width > TAPE_MIN_WIDTH;
    const measuredRows =
        ladderRect.height > 0
            ? Math.max(1, Math.floor((ladderRect.height - (preferences.showHeader ? ROW_HEIGHT : 0)) / ROW_HEIGHT))
            : DEFAULT_VISIBLE_ROWS;
    const visibleLadderRowCount = Math.min(measuredRows, preferences.visibleRowsPerSide * 2);
    const { clearActivity, snapshot } = useDomFeed({
        active: isVisible,
        centerTick: centerState.mode === CenterMode.Manual ? centerState.tick : null,
        exchange,
        groupTicks: preferences.groupTicks,
        includeTape: showTape,
        pullStackRowCount: preferences.pullStackRows,
        rowCount: visibleLadderRowCount,
        symbol,
        tickSize,
    });

    const marketCenterTick = snapshot.marketCenterTick;
    const interactionRef = useRef<InteractionState>({
        autoCenter: preferences.autoCenter,
        center: centerState,
        groupTicks: preferences.groupTicks,
        marketCenterTick,
    });
    const ladderPriceDecimals = decimalPlaces(tickSize * preferences.groupTicks);

    useLayoutEffect(() => {
        interactionRef.current = {
            autoCenter: preferences.autoCenter,
            center: centerState,
            groupTicks: preferences.groupTicks,
            marketCenterTick,
        };
    }, [centerState, marketCenterTick, preferences.autoCenter, preferences.groupTicks]);

    useEffect(() => {
        const nextCenter: CenterState = interactionRef.current.autoCenter
            ? { mode: CenterMode.Follow }
            : { mode: CenterMode.ManualPending };
        commitCenter(interactionRef, setCenterState, nextCenter);
    }, [exchange, symbol, tickSize]);

    useEffect(() => {
        if (centerState.mode === CenterMode.ManualPending && marketCenterTick !== null) {
            commitCenter(interactionRef, setCenterState, { mode: CenterMode.Manual, tick: marketCenterTick });
        }
    }, [centerState.mode, marketCenterTick]);

    useEffect(() => {
        const element = ladderRef.current;
        if (!element) return;
        const handleWheel = (event: WheelEvent) => {
            if (event.ctrlKey || event.deltaY === 0 || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
            const interaction = interactionRef.current;
            const currentCenter =
                interaction.center.mode === CenterMode.Manual ? interaction.center.tick : interaction.marketCenterTick;
            if (currentCenter === null) return;
            event.preventDefault();
            const direction = event.deltaY > 0 ? -1 : 1;
            const tick = currentCenter + direction * interaction.groupTicks;
            if (!Number.isSafeInteger(tick)) return;
            commitCenter(interactionRef, setCenterState, { mode: CenterMode.Manual, tick }, false);
            if (interaction.autoCenter) setDomPreferences(panelId, { autoCenter: false });
        };
        element.addEventListener('wheel', handleWheel, { passive: false });
        return () => element.removeEventListener('wheel', handleWheel);
    }, [ladderRef, panelId, setDomPreferences]);

    const handleCenter = () => {
        if (interactionRef.current.autoCenter) return;
        const nextCenter: CenterState =
            marketCenterTick === null
                ? { mode: CenterMode.ManualPending }
                : { mode: CenterMode.Manual, tick: marketCenterTick };
        commitCenter(interactionRef, setCenterState, nextCenter);
    };

    const handleAutoCenter = () => {
        const next = !interactionRef.current.autoCenter;
        const nextCenter: CenterState = next
            ? { mode: CenterMode.Follow }
            : marketCenterTick === null
              ? { mode: CenterMode.ManualPending }
              : { mode: CenterMode.Manual, tick: marketCenterTick };
        commitCenter(interactionRef, setCenterState, nextCenter, next);
        setDomPreferences(panelId, { autoCenter: next });
    };

    const handleSettingsChange = (patch: Partial<DomPreferences>) => setDomPreferences(panelId, patch);
    const openSettings = () => setSettingsOpen(true);
    const closeSettings = () => setSettingsOpen(false);

    const statusLabel =
        snapshot.status === DepthFeedStatus.Stale ? 'Depth feed stale — waiting to resync' : 'Synchronizing depth feed';
    const panelControls = (
        <>
            <PanelSource panelId={panelId} panelType={PanelType.DepthAndSales} />
            <CSButton
                ariaLabel="Center ladder"
                onClick={handleCenter}
                square
                title="Center ladder on the inside market"
            >
                C
            </CSButton>
            <CSToggleButton
                active={preferences.autoCenter}
                ariaLabel="Toggle automatic ladder centering"
                onClick={handleAutoCenter}
                title="Follow the inside market automatically"
            >
                AC
            </CSToggleButton>
            <CSButton
                ariaLabel="Reset accumulated activity"
                onClick={clearActivity}
                square
                title="Reset executions and pull/stack"
            >
                <ResetIcon />
            </CSButton>
            <CSButton ariaLabel="Settings" onClick={openSettings} square title="Settings">
                <SettingsIcon />
            </CSButton>
        </>
    );

    return (
        <>
            <CSPanel bodyClassName={styles.panelBody} className="h-full" controls={panelControls} onRemove={onRemove}>
                <div
                    aria-busy={snapshot.status !== DepthFeedStatus.Healthy}
                    className={[styles.workspace, !showTape && styles.noTape].filter(Boolean).join(' ')}
                    ref={workspaceRef}
                >
                    {snapshot.status !== DepthFeedStatus.Healthy && (
                        <div
                            className={[styles.status, snapshot.status === DepthFeedStatus.Stale && styles.statusStale]
                                .filter(Boolean)
                                .join(' ')}
                            role="status"
                        >
                            {statusLabel}
                        </div>
                    )}

                    <DomLadder
                        activityStartedAt={snapshot.activityStartedAt}
                        ladderRef={ladderRef}
                        priceDecimals={ladderPriceDecimals}
                        quantityMode={preferences.quantityMode}
                        rows={snapshot.rows}
                        showExecutions={preferences.showExecutions}
                        showHeader={preferences.showHeader}
                        showMeter={preferences.showMeter}
                        showPullStack={preferences.showPullStack}
                    />

                    {showTape && (
                        <DepthAndSalesTape
                            minNotional={preferences.tapeMinNotional}
                            quantityMode={preferences.quantityMode}
                            rowCount={measuredRows}
                            showHeader={preferences.showHeader}
                            showMeter={preferences.showMeter}
                            tickSize={tickSize}
                            trades={snapshot.recentTrades}
                        />
                    )}
                </div>
            </CSPanel>
            <DepthAndSalesSettings
                isOpen={settingsOpen}
                onChange={handleSettingsChange}
                onClose={closeSettings}
                preferences={preferences}
            />
        </>
    );
};

export default DepthAndSales;
