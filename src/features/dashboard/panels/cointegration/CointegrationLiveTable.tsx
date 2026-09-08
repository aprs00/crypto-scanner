import type { MouseEvent } from 'react';

import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { format } from 'date-fns';

import CSSelect from '@/components/UI/CSSelect';
import CSSpinner from '@/components/UI/CSSpinner';
import { formatNumber } from '@/utils/number';

import type {
    CointegrationLiveTableConfig,
    CointegrationLiveTableRow,
    ExchangeChartConfig,
    ExchangeInfo,
    SortDirection,
} from '../shared/data/types';

import ChartContainer from '../shared/charting/ChartContainer';
import { useCointegrationLiveTable } from '../shared/data/api';
import ExchangeSelector from '../shared/ExchangeSelector';
import MultiSelectDrawer from '../shared/MultiSelectDrawer/MultiSelectDrawer';
import styles from './CointegrationLiveTable.module.css';

type CointegrationLiveTableProps = {
    config?: CointegrationLiveTableConfig;
    exchange: string;
    exchanges: ExchangeInfo[];
    defaultSymbols?: string[];
    symbolOptions: string[];
    symbols: string[];
    title: string;
    window?: string;
    sort?: string;
    sortDirection?: SortDirection;
    limit?: number;
    onRemoveClick: () => void;
    onExchangeChange: (exchange: string) => void;
    onConfigChange: (config: ExchangeChartConfig) => void;
};

const SortIndicator = ({ state }: { state: false | SortDirection }) => {
    return (
        <span className={styles.sortInd}>
            <span className={state === 'asc' ? styles.on : styles.off}>▲</span>
            <span className={state === 'desc' ? styles.on : styles.off}>▼</span>
        </span>
    );
};

const formatMetric = (value: number | null, options: Intl.NumberFormatOptions) =>
    value === null || value === undefined || Number.isNaN(value) ? '-' : formatNumber(value, options);

const formatTimestamp = (value: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return format(date, 'M/d HH:mm');
};

const getZScoreClass = (value: number) => {
    const absZ = Math.abs(value);
    return absZ >= 3 ? styles.zHi : absZ >= 2 ? styles.zMid : styles.zLo;
};

const sanitizeSelectedSymbols = (selectedSymbols: string[], options: string[]) => {
    const optionSet = new Set(options);
    const seen = new Set<string>();
    const cleanedSymbols: string[] = [];

    for (const symbol of selectedSymbols) {
        if (!symbol || !optionSet.has(symbol) || seen.has(symbol)) {
            continue;
        }
        seen.add(symbol);
        cleanedSymbols.push(symbol);
    }

    return cleanedSymbols;
};

const CointegrationLiveTable = (props: CointegrationLiveTableProps) => {
    const {
        config,
        exchange,
        exchanges,
        defaultSymbols,
        symbolOptions,
        symbols,
        title,
        window: windowMinutes,
        sort,
        sortDirection,
        limit,
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const windowOptions = config?.window_options ?? {};
    const limitOptions = config?.limit_options ?? [];
    const sortKeyToColumnId = config?.sort_key_to_column_id;
    const columnIdToSortKey = config?.column_id_to_sort_key;
    const defaultSortDesc = config?.default_sort_desc;
    const rightAlignedColumns = new Set(config?.right_aligned_columns ?? []);
    const sortableColumnIds = new Set(config?.sortable_column_ids ?? []);

    const defaultWindow = Object.values(windowOptions)[0];
    const defaultLimit = limitOptions[0];
    const defaultSortKey = (() => {
        const firstSortableColumnId = config?.sortable_column_ids?.[0];
        if (!firstSortableColumnId) return undefined;
        return columnIdToSortKey?.[firstSortableColumnId] ?? firstSortableColumnId;
    })();

    const resolvedWindow = windowMinutes ?? defaultWindow;
    const resolvedLimit = limit ?? defaultLimit;
    const resolvedSortKey = sort ?? defaultSortKey;
    const resolvedSymbols = sanitizeSelectedSymbols(symbols, symbolOptions);
    const resolvedDefaultSymbols = sanitizeSelectedSymbols(defaultSymbols ?? [], symbolOptions);

    const resolveSortDesc = (columnId: string, direction?: SortDirection) => {
        if (direction === 'asc') return false;
        if (direction === 'desc') return true;
        return defaultSortDesc?.[columnId] ?? true;
    };

    const resolveSorting = (sortKey?: string, direction?: SortDirection): SortingState => {
        if (!sortKey) return [];
        const columnId = sortKeyToColumnId?.[sortKey] ?? sortKey;
        if (!columnId || !sortableColumnIds.has(columnId)) return [];
        return [{ desc: resolveSortDesc(columnId, direction), id: columnId }];
    };

    const resolvedSortDirection = (() => {
        const columnId = sortKeyToColumnId?.[resolvedSortKey ?? ''] ?? resolvedSortKey;
        return columnId ? (resolveSortDesc(columnId, sortDirection) ? 'desc' : 'asc') : sortDirection;
    })();

    const cointegration = useCointegrationLiveTable({
        exchange,
        limit: resolvedLimit,
        offset: 0,
        sort: resolvedSortKey,
        sortDirection: resolvedSortDirection,
        symbols: resolvedSymbols,
        window: resolvedWindow,
    });

    const rows = cointegration.data?.data || [];
    const sorting = resolveSorting(resolvedSortKey, sortDirection);

    const columns: ColumnDef<CointegrationLiveTableRow>[] = [
        {
            accessorKey: 'pair',
            cell: ({ row }) => <span className={styles.pair}>{row.original.pair}</span>,
            enableSorting: false,
            header: 'Pair',
        },
        {
            accessorKey: 'spread_z',
            cell: ({ row }) => (
                <span className={getZScoreClass(row.original.spread_z)}>
                    {formatMetric(row.original.spread_z, { maximumFractionDigits: 3 })}
                </span>
            ),
            enableSorting: true,
            header: 'Z',
        },
        {
            accessorKey: 'half_life',
            cell: ({ row }) => (
                <span className={styles.zLo}>{formatMetric(row.original.half_life, { maximumFractionDigits: 2 })}</span>
            ),
            enableSorting: true,
            header: 'Half-life',
        },
        {
            accessorKey: 'adf_t',
            cell: ({ row }) => (
                <span className={styles.zLo}>{formatMetric(row.original.adf_t, { maximumFractionDigits: 3 })}</span>
            ),
            enableSorting: true,
            header: 'ADF t',
        },
        {
            accessorKey: 'hedge_ratio',
            cell: ({ row }) => (
                <span className={styles.zLo}>
                    {formatMetric(row.original.hedge_ratio, { maximumFractionDigits: 6 })}
                </span>
            ),
            enableSorting: false,
            header: 'Hedge',
        },
        {
            accessorKey: 'spread_std',
            cell: ({ row }) => (
                <span className={styles.zLo}>
                    {formatMetric(row.original.spread_std, { maximumFractionDigits: 6 })}
                </span>
            ),
            enableSorting: false,
            header: 'Spread Std',
        },
        {
            accessorFn: (row) => {
                const timestamp = new Date(row.updated_at).getTime();
                return Number.isNaN(timestamp) ? 0 : timestamp;
            },
            cell: ({ row }) => <span className="dim">{formatTimestamp(row.original.updated_at)}</span>,
            enableSorting: true,
            header: 'Updated',
            id: 'updated_at',
        },
    ];

    const handleSortClick = (columnId: string) => {
        if (!sortableColumnIds.has(columnId)) return;

        const current = sorting[0];
        const isSameColumn = current?.id === columnId;
        const nextDesc = isSameColumn ? !current?.desc : resolveSortDesc(columnId, sortDirection);

        const nextSortKey = columnIdToSortKey?.[columnId] ?? columnId;
        const nextDirection = nextDesc ? 'desc' : 'asc';

        if (nextSortKey !== sort || nextDirection !== sortDirection) {
            onConfigChange({ sort: nextSortKey, sortDirection: nextDirection });
        }
    };

    const handleSortButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
        handleSortClick(event.currentTarget.value);
    };

    const table = useReactTable({
        columns,
        data: rows,
        enableMultiSort: false,
        enableSortingRemoval: false,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => `${row.pair}-${row.updated_at}`,
        manualSorting: true,
        state: { sorting },
    });

    const handleWindowChange = (nextWindow: string) => onConfigChange({ window: nextWindow });
    const handleLimitChange = (nextLimit: number) => onConfigChange({ limit: nextLimit });
    const handleSymbolsChange = (nextSymbols: string[]) => onConfigChange({ symbols: nextSymbols });

    const controls = (
        <>
            <CSSelect<string>
                ariaLabel="Window"
                onChange={handleWindowChange}
                options={windowOptions}
                value={resolvedWindow}
            />
            <CSSelect<number>
                ariaLabel="Limit"
                onChange={handleLimitChange}
                options={limitOptions}
                value={resolvedLimit}
            />
            <MultiSelectDrawer
                ariaLabel="Symbols"
                classes="w-40"
                defaultValue={resolvedDefaultSymbols}
                onChange={handleSymbolsChange}
                options={symbolOptions}
                title="Select symbols"
                value={resolvedSymbols}
            />
            <ExchangeSelector exchanges={exchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer controls={controls} onRemoveClick={onRemoveClick} title={title}>
            <div className="relative h-body">
                {cointegration.isLoading && <CSSpinner />}

                <div className="h-full overflow-auto scroll">
                    {!cointegration.isError && rows.length === 0 && !cointegration.isLoading && (
                        <div className={styles.emptyRow}>No cointegration data available for this window.</div>
                    )}

                    {!cointegration.isError && rows.length > 0 && (
                        <table className={styles.table}>
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            if (header.isPlaceholder) {
                                                return <th key={header.id} />;
                                            }

                                            const isRightAligned = rightAlignedColumns.has(header.column.id);
                                            const sortingState = header.column.getIsSorted();
                                            const canSort = header.column.getCanSort();
                                            const ariaSort =
                                                sortingState === 'asc'
                                                    ? 'ascending'
                                                    : sortingState === 'desc'
                                                      ? 'descending'
                                                      : 'none';

                                            return (
                                                <th
                                                    aria-sort={canSort ? ariaSort : undefined}
                                                    className={isRightAligned ? styles.right : ''}
                                                    key={header.id}
                                                >
                                                    {canSort ? (
                                                        <button
                                                            className={[styles.sortBtn, isRightAligned && styles.right]
                                                                .filter(Boolean)
                                                                .join(' ')}
                                                            onClick={handleSortButtonClick}
                                                            title={`Sort by ${String(header.column.columnDef.header)}`}
                                                            type="button"
                                                            value={header.column.id}
                                                        >
                                                            {flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext(),
                                                            )}
                                                            <SortIndicator state={sortingState} />
                                                        </button>
                                                    ) : (
                                                        <span>
                                                            {flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext(),
                                                            )}
                                                        </span>
                                                    )}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id}>
                                        {row.getVisibleCells().map((cell) => {
                                            const isRightAligned = rightAlignedColumns.has(cell.column.id);
                                            return (
                                                <td className={isRightAligned ? styles.right : ''} key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </ChartContainer>
    );
};

export default CointegrationLiveTable;
