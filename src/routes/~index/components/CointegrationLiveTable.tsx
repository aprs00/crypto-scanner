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
import MultiSelectDrawer from './MultiSelectDrawer';

export type CointegrationLiveTableProps = {
    config?: CointegrationLiveTableConfig;
    exchange: string;
    exchanges: ExchangeInfo[];
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
    const upClass = state === 'asc' ? 'text-amber-200' : 'text-slate-500';
    const downClass = state === 'desc' ? 'text-amber-200' : 'text-slate-500';

    return (
        <span className="flex flex-col text-[9px] leading-none">
            <span className={upClass}>▲</span>
            <span className={downClass}>▼</span>
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
    return absZ >= 3 ? 'text-amber-300' : absZ >= 2 ? 'text-blue-300' : 'text-slate-200';
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
            cell: ({ row }) => <span className="text-slate-200 font-medium">{row.original.pair}</span>,
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
                <span className="text-slate-200">
                    {formatMetric(row.original.half_life, { maximumFractionDigits: 2 })}
                </span>
            ),
            enableSorting: true,
            header: 'Half-life',
        },
        {
            accessorKey: 'adf_t',
            cell: ({ row }) => (
                <span className="text-slate-200">{formatMetric(row.original.adf_t, { maximumFractionDigits: 3 })}</span>
            ),
            enableSorting: true,
            header: 'ADF t',
        },
        {
            accessorKey: 'hedge_ratio',
            cell: ({ row }) => (
                <span className="text-slate-200">
                    {formatMetric(row.original.hedge_ratio, { maximumFractionDigits: 6 })}
                </span>
            ),
            enableSorting: false,
            header: 'Hedge',
        },
        {
            accessorKey: 'spread_std',
            cell: ({ row }) => (
                <span className="text-slate-200">
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
            cell: ({ row }) => <span className="text-slate-400">{formatTimestamp(row.original.updated_at)}</span>,
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
                onChange={(nextWindow) => onConfigChange({ window: nextWindow })}
                options={windowOptions}
                value={resolvedWindow}
            />
            <CSSelect<number>
                onChange={(nextLimit) => onConfigChange({ limit: nextLimit })}
                options={limitOptions}
                value={resolvedLimit}
            />
            <MultiSelectDrawer
                classes="w-40"
                defaultValue={symbolOptions}
                onChange={(nextSymbols) => onConfigChange({ symbols: nextSymbols })}
                options={symbolOptions}
                title="Select symbols"
                value={resolvedSymbols}
            />
            <ExchangeSelector exchanges={exchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer
            controls={controls}
            onRemoveClick={onRemoveClick}
            title="Cointegration (Pairs / Mean-Reversion)"
        >
            <div className="relative h-[calc(100%-40px)]">
                {cointegration.isLoading && <CSSpinner />}

                <div className="h-full overflow-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {!cointegration.isError && rows.length === 0 && !cointegration.isLoading && (
                        <div className="flex items-center justify-center h-full text-sm text-slate-500">
                            No cointegration data available for this window.
                        </div>
                    )}

                    {!cointegration.isError && rows.length > 0 && (
                        <table className="min-w-full text-xs">
                            <thead className="sticky top-0 bg-slate-900 z-10 text-slate-400">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr className="border-b border-slate-800" key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            if (header.isPlaceholder) {
                                                return <th className="px-3 py-2" key={header.id} />;
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
                                                    className={`px-3 py-2 font-medium ${isRightAligned ? 'text-right' : 'text-left'}`}
                                                    key={header.id}
                                                >
                                                    {canSort ? (
                                                        <button
                                                            className={`flex w-full items-center gap-2 text-slate-300 hover:text-slate-100 ${isRightAligned ? 'justify-end' : 'justify-start'} select-none`}
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
                                                        <span className="text-slate-500">
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
                                    <tr className="border-b border-slate-800/60 hover:bg-slate-800/60" key={row.id}>
                                        {row.getVisibleCells().map((cell) => {
                                            const isRightAligned = rightAlignedColumns.has(cell.column.id);
                                            return (
                                                <td
                                                    className={`px-3 py-2 ${isRightAligned ? 'text-right' : 'text-left'}`}
                                                    key={cell.id}
                                                >
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
