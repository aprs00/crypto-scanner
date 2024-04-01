import {useState} from 'react';

import Spinner from '@/components/Spinner';

import {useStreamTable} from './api';
import Filters from './components/Filters';

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

    const {data} = useStreamTable(selectedAggregations) as any;

    return (
        <div className="p-2 pb-32">
            <Filters
                aggregationOptions={aggregationOptions}
                dataTypes={dataTypes}
                selectedAggregations={selectedAggregations}
                setSelectedAggregations={setSelectedAggregations}
                timeFrameOptions={timeFrameOptions}
            />

            <table className="border border-slate-700 w-full text-left text-slate-200 text-sm">
                <thead>
                    <tr>
                        <th>Symbol</th>
                        {selectedAggregations.map((key: string) => (
                            <th className="p-1 border border-slate-800" key={key}>
                                {key
                                    .split('_')
                                    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
                                    .join(' ') ?? null}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data?.map((row: any, i: number) => (
                        <tr key={i}>
                            {Object.values(row).map((value: any, j) => (
                                <td className="p-1 border border-slate-800" key={i + j}>
                                    {value}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {!data?.length && (
                        <tr className="relative h-32 w-full">
                            <td className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" colSpan={12}>
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
