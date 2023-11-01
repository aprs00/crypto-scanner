import {useMemo, useState} from 'react';
import {createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable} from '@tanstack/react-table';

import Spinner from '@/components/Spinner';
import Filters from '@/features/table/components/Filters';
import {useStreamTable} from '@/features/table//api';
import type {ColumnDefType} from '@/features/table//types';

const columnHelper = createColumnHelper<ColumnDefType>();

const aggregationOptions = ['avg', 'sum', 'std_p', 'std_s', 'var_p', 'var_s', 'twa'];
const timeFrameOptions = ['30s', '1m', '5m', '15m'];
const dataTypes = [
    {value: 'p', label: 'Price'},
    {value: 'v', label: 'Volume'},
    {value: 't', label: 'Trade'},
];

const Table = () => {
    const [selectedAggregations, setSelectedAggregations] = useState<string[]>([
        'p_twa_15m',
        'v_avg_30s',
        'v_avg_5m',
        'v_avg_15m',
        't_avg_30s',
        't_avg_5m',
        't_avg_15m',
        't_std_p_15m',
    ]);

    const columns = useMemo(() => {
        const parsed = selectedAggregations.map((aggregation) => {
            const [dataType, aggregationType, timeFrame] = aggregation.split('_');
            const label = `${dataType} ${aggregationType} ${timeFrame}`;

            return {
                accessorKey: aggregation,
                cell: ({getValue}: {getValue: () => void}) => getValue(),
                header: () => label,
                id: aggregation,
            };
        });

        return [
            columnHelper.accessor('symbol', {
                cell: (info) => info.getValue(),
                header: () => 'Symbol',
                id: 'symbol',
            }),
            ...parsed,
        ];
    }, [selectedAggregations]);

    const streamTableData = useStreamTable(selectedAggregations) || {};
    const data = useMemo(() => streamTableData?.data || [], [streamTableData]);

    const table = useReactTable({
        data,
        columns,
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
            <Filters
                dataTypes={dataTypes}
                timeFrameOptions={timeFrameOptions}
                aggregationOptions={aggregationOptions}
                selectedAggregations={selectedAggregations}
                setSelectedAggregations={setSelectedAggregations}
            />

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
                                            boxShadow: 'inset 5px 5px 10px rgba(0, 0, 0, 1)',
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
};

export default Table;
