import {createColumnHelper, flexRender, getCoreRowModel, useReactTable} from '@tanstack/react-table';

type ColumnDef = {
    symbol: string;
    v_twa_1m: string;
    v_twa_1h: string;
    t_var_s_15m: string;
};

const columnHelper = createColumnHelper<ColumnDef>();

const columns = [
    columnHelper.accessor('symbol', {
        cell: (info) => info.getValue(),
        header: () => 'Symbol',
    }),
    columnHelper.accessor('v_twa_1m', {
        cell: (info) => info.getValue(),
        header: () => 'V Twa 1m',
    }),
    columnHelper.accessor('t_var_s_15m', {
        cell: (info) => info.getValue(),
        header: () => 'T Var S 15m',
    }),
];

const data = [
    {symbol: 'BTCUSDT', v_twa_1m: '22077.193', v_twa_1h: '7187.5252', t_var_s_15m: '2074.7392'},
    {symbol: 'ETHUSDT', v_twa_1m: '4936.9635', v_twa_1h: '2766.5511', t_var_s_15m: '135.3159'},
    {symbol: 'XRPUSDT', v_twa_1m: '967.1631', v_twa_1h: '558.0892', t_var_s_15m: '6.0758'},
    {symbol: 'BNBUSDT', v_twa_1m: '1082.5641', v_twa_1h: '221.5936', t_var_s_15m: '9.0176'},
    {symbol: 'SOLUSDT', v_twa_1m: '926.1841', v_twa_1h: '359.2124', t_var_s_15m: '14.5093'},
    {symbol: 'DOTUSDT', v_twa_1m: '24.5343', v_twa_1h: '19.2478', t_var_s_15m: '1.6442'},
    {symbol: 'AVAXUSDT', v_twa_1m: '266.0696', v_twa_1h: '112.9887', t_var_s_15m: '10.1955'},
    {symbol: 'ADAUSDT', v_twa_1m: '190.9456', v_twa_1h: '106.1876', t_var_s_15m: '3.32'},
    {symbol: 'MATICUSDT', v_twa_1m: '232.6679', v_twa_1h: '640.9344', t_var_s_15m: '3.8633'},
    {symbol: 'XMRUSDT', v_twa_1m: '0.4436', v_twa_1h: '15.9198', t_var_s_15m: '0.1733'},
    {symbol: 'DOGEUSDT', v_twa_1m: '120.7155', v_twa_1h: '41.3865', t_var_s_15m: '1.0759'},
    {symbol: 'LTCUSDT', v_twa_1m: '326.7782', v_twa_1h: '167.8801', t_var_s_15m: '3.2615'},
    {symbol: 'TRXUSDT', v_twa_1m: '245.3026', v_twa_1h: '148.8306', t_var_s_15m: '4.5216'},
    {symbol: 'LINKUSDT', v_twa_1m: '756.5053', v_twa_1h: '333.5985', t_var_s_15m: '37.0897'},
    {symbol: 'BCHUSDT', v_twa_1m: '305.2945', v_twa_1h: '67.9354', t_var_s_15m: '2.1101'},
    {symbol: 'SHIBUSDT', v_twa_1m: '3.9463', v_twa_1h: '32.372', t_var_s_15m: '0.8567'},
    {symbol: 'LOOMUSDT', v_twa_1m: '560.842', v_twa_1h: '424.0826', t_var_s_15m: '124.0975'},
    {symbol: 'STORJUSDT', v_twa_1m: '82.1311', v_twa_1h: '108.9768', t_var_s_15m: '5.8588'},
    {symbol: 'RUNEUSDT', v_twa_1m: '100.8637', v_twa_1h: '19.7568', t_var_s_15m: '2.8777'},
    {symbol: 'CYBERUSDT', v_twa_1m: '8.4389', v_twa_1h: '40.0949', t_var_s_15m: '3.7216'},
    {symbol: 'AVAXUSDT', v_twa_1m: '266.0696', v_twa_1h: '112.9887', t_var_s_15m: '10.1955'},
    {symbol: 'TRBUSDT', v_twa_1m: '32.3528', v_twa_1h: '59.8692', t_var_s_15m: '7.1277'},
    {symbol: 'OPUSDT', v_twa_1m: '105.2941', v_twa_1h: '41.8916', t_var_s_15m: '2.1641'},
    {symbol: 'STRAXUSDT', v_twa_1m: '117.8128', v_twa_1h: '45.1361', t_var_s_15m: '3.1465'},
    {symbol: 'LEVERUSDT', v_twa_1m: '38.6526', v_twa_1h: '147.1281', t_var_s_15m: '10.0997'},
    {symbol: 'BAKEUSDT', v_twa_1m: '126.3061', v_twa_1h: '67.7991', t_var_s_15m: '25.335'},
    {symbol: 'FRONTUSDT', v_twa_1m: '7.711', v_twa_1h: '39.6409', t_var_s_15m: '20.6616'},
    {symbol: 'ALPACAUSDT', v_twa_1m: '2.2219', v_twa_1h: '8.9424', t_var_s_15m: '3.5091'},
    {symbol: 'LQTYUSDT', v_twa_1m: '424.8325', v_twa_1h: '177.2401', t_var_s_15m: '38.8453'},
    {symbol: 'ZRXUSDT', v_twa_1m: '136.7473', v_twa_1h: '47.6543', t_var_s_15m: '3.8791'},
    {symbol: 'RNDRUSDT', v_twa_1m: '106.4102', v_twa_1h: '15.6047', t_var_s_15m: '0.9952'},
    {symbol: 'MASKUSDT', v_twa_1m: '1529.2927', v_twa_1h: '154.3315', t_var_s_15m: '238.1974'},
    {symbol: 'GLMRUSDT', v_twa_1m: '43.6854', v_twa_1h: '28.4502', t_var_s_15m: '3.0887'},
];

function Table() {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="p-2 pb-32">
            <h1 className="text-yellow-400 text-center my-20" style={{fontSize: '70px'}}>
                IN PROGRESS
            </h1>
            <table className="border border-gray-700 w-full text-left">
                <thead className="bg-slate-900">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th key={header.id} className="capitalize px-3.5 py-2">
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row, i) => (
                            <tr key={row.id} className={`${i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}`}>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="px-3.5 py-2">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr className="text-center h-32">
                            <td colSpan={12}>No Record Found!</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
