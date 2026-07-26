import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSSelect from '@/components/UI/CSSelect';
import CSSpinner from '@/components/UI/CSSpinner';
import ExchangeSelector from '@/components/UI/ExchangeSelector';
import { formatNumber } from '@/utils/number';

import type {
    CointegrationLiveTableConfig,
    CointegrationLiveTableRow,
    ExchangeChartConfig,
    ExchangeInfo,
    SortDirection,
} from '../types';

import { useCointegrationLiveTable } from '../api';
import { ChartType } from '../types';
import styles from './CointegrationLiveTable.module.css';
import MultiSelectDrawer from './MultiSelectDrawer';

export type CointegrationLiveTableProps = {
    config?: CointegrationLiveTableConfig;
    exchange: string;
    exchanges: ExchangeInfo[];
    defaultSymbols?: string[];
    symbolOptions: string[];
    symbols: string[];
    window?: string;
    sort?: string;
    sortDirection?: SortDirection;
    limit?: number;
    onRemoveClick: () => void;
    onExchangeChange: (exchange: string) => void;
    onConfigChange: (config: ExchangeChartConfig) => void;
};

const sortingEquals = (left: SortingState, right: SortingState) => {
    if (left.length !== right.length) return false;
    if (left.length === 0) return true;
    return left[0]?.id === right[0]?.id && left[0]?.desc === right[0]?.desc;
};

const SortIndicator = ({ state }: { state: false | SortDirection }) => {
    return (
        <span className={styles.sortInd}>
            <span className={state === 'asc' ? 'on' : 'off'}>▲</span>
            <span className={state === 'desc' ? 'on' : 'off'}>▼</span>
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

    const getInitialSorting = (sortKey?: string, direction?: SortDirection): SortingState => {
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

    const [sorting, setSorting] = useState<SortingState>(() => getInitialSorting(resolvedSortKey, sortDirection));

    useEffect(() => {
        const nextSorting = getInitialSorting(resolvedSortKey, sortDirection);
        setSorting((current) => (sortingEquals(current, nextSorting) ? current : nextSorting));
    }, [resolvedSortKey, sortDirection, sortKeyToColumnId, defaultSortDesc, config?.sortable_column_ids]);

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
        const nextSorting: SortingState = [{ desc: nextDesc, id: columnId }];

        setSorting((state) => (sortingEquals(state, nextSorting) ? state : nextSorting));

        const nextSortKey = columnIdToSortKey?.[columnId] ?? columnId;
        const nextDirection = nextDesc ? 'desc' : 'asc';

        if (nextSortKey !== sort || nextDirection !== sortDirection) {
            onConfigChange({ sort: nextSortKey, sortDirection: nextDirection });
        }
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

    const controls = (
        <>
            <CSSelect<string>
                ariaLabel="Window"
                onChange={(nextWindow) => onConfigChange({ window: nextWindow })}
                options={windowOptions}
                value={resolvedWindow}
            />
            <CSSelect<number>
                ariaLabel="Limit"
                onChange={(nextLimit) => onConfigChange({ limit: nextLimit })}
                options={limitOptions}
                value={resolvedLimit}
            />
            <MultiSelectDrawer
                ariaLabel="Symbols"
                classes="w-40"
                defaultValue={resolvedDefaultSymbols}
                onChange={(nextSymbols) => onConfigChange({ symbols: nextSymbols })}
                options={symbolOptions}
                title="Select symbols"
                value={resolvedSymbols}
            />
            <ExchangeSelector exchanges={exchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer chartType={ChartType.CointegrationLiveTable} controls={controls} onRemoveClick={onRemoveClick}>
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
                                                            onClick={() => handleSortClick(header.column.id)}
                                                            title={`Sort by ${String(header.column.columnDef.header)}`}
                                                            type="button"
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
