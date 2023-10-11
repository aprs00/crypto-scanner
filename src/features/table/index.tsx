import {useMemo} from 'react';
import {createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable} from '@tanstack/react-table';

import Spinner from '@/components/Spinner';
import {useStreamTable} from './api';

type ColumnDef = {
    symbol: string;
    p_twa_15m: string;
    v_sum_30s: string;
    t_sum_30s: string;
    v_twa_1m: string;
    v_twa_5m: string;
    v_sum_5m: string;
    t_sum_5m: string;
    v_var_s_5m: string;
    v_var_p_5m: string;
    t_var_p_5m: string;
};

const columnHelper = createColumnHelper<ColumnDef>();

const columns = [
    columnHelper.accessor('symbol', {
        cell: (info) => info.getValue(),
        header: () => 'Symbol',
        id: 'symbol',
    }),
    columnHelper.accessor('v_sum_30s', {
        cell: (info) => info.getValue(),
        header: () => 'v sum 30s',
        id: 'v_sum_30s',
    }),
    columnHelper.accessor('t_sum_30s', {
        cell: (info) => info.getValue(),
        header: () => 't sum 30s',
        id: 't_sum_30s',
    }),
    columnHelper.accessor('v_twa_1m', {
        cell: (info) => info.getValue(),
        header: () => 'v twa 1m',
        id: 'v_twa_1m',
    }),
    columnHelper.accessor('v_twa_5m', {
        cell: (info) => info.getValue(),
        header: () => 'v twa 5m',
        id: 'v_twa_5m',
    }),
    columnHelper.accessor('v_sum_5m', {
        cell: (info) => info.getValue(),
        header: () => 'v sum 5m',
        id: 'v_sum_5m',
    }),
    columnHelper.accessor('t_sum_5m', {
        cell: (info) => info.getValue(),
        header: () => 't sum 5m',
        id: 't_sum_5m',
    }),
    columnHelper.accessor('v_var_s_5m', {
        cell: (info) => info.getValue(),
        header: () => 'v var s 5m',
        id: 'v_var_s_5m',
    }),
    columnHelper.accessor('v_var_p_5m', {
        cell: (info) => info.getValue(),
        header: () => 'v var p 5m',
        id: 'v_var_p_5m',
    }),
    columnHelper.accessor('t_var_p_5m', {
        cell: (info) => info.getValue(),
        header: () => 't var p 5m',
        id: 't_var_p_5m',
    }),
];

function Table() {
    const streamTableData = useStreamTable() || {};

    const data = useMemo(() => streamTableData?.data || [], [streamTableData]);

    const table = useReactTable({
        data,
        columns,
        // columnResizeMode: 'onChange',
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        defaultColumn: {
            minSize: 150,
            size: Number.MAX_SAFE_INTEGER,
            maxSize: Number.MAX_SAFE_INTEGER,
        },
    });

    return (
        <div className="p-2 pb-32">
            <table className="border border-slate-700 w-full text-left text-slate-200 text-sm">
                <thead className="bg-slate-900">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className="capitalize p-1 border border-slate-800"
                                    colSpan={header.colSpan}
                                >
                                    {header.isPlaceholder ? null : (
                                        <div
                                            {...{
                                                className: header.column.getCanSort()
                                                    ? 'cursor-pointer select-none'
                                                    : '',
                                                onClick: header.column.getToggleSortingHandler(),
                                            }}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {{
                                                asc: ' ↑',
                                                desc: ' ↓',
                                            }[header.column.getIsSorted() as string] ?? null}
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="w-full">
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row, i) => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        style={{
                                            width:
                                                cell.column.getSize() === Number.MAX_SAFE_INTEGER
                                                    ? 'auto'
                                                    : cell.column.getSize(),
                                        }}
                                        key={cell.id}
                                        className="p-1 border border-slate-800"
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr className="relative h-32 w-full">
                            <td colSpan={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                <Spinner />
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
