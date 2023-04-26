import {memo, useEffect, useMemo, useState} from 'react';

import Spinner from '@/components/Spinner';
import {useKlines} from '../api';
import type {TickerCalculationsType, KlinesResponseType} from '../types';

const betaTickersList = [
    'BTCUSDT',
    'ETHUSDT',
    'SOLUSDT',
    'ARBUSDT',
    'DOGEUSDT',
    'DOTUSDT',
    'ADAUSDT',
    'BNBUSDT',
    'LTCUSDT',
    'LINKUSDT',
    'XRPUSDT',
    'UNIUSDT',
    'BCHUSDT',
    'VETUSDT',
];

const colors = {
    positive: ['#8FC58F', '#64B964', '#3D8E3D', '#2D6B2D', '#1F4D1F', '#143114', '#0C210C'],
    negative: ['#FF9999', '#FF6666', '#FF4D4D', '#FF3333', '#FF1A1A', '#FF0000', '#CC0000'],
    perfect: '#701a75',
};

const BetaTable = () => {
    const klines = useKlines(betaTickersList) as {data: KlinesResponseType; isLoading: boolean}[];
    const [betaTickersListCorrelation, setBetaTickersListCorrelation] = useState<number[]>([]);
    const [betaTickersListPercentages, setBetaTickersListPercentages] = useState<TickerCalculationsType[]>(
        new Array(betaTickersList.length).fill({
            percentages: [],
            sum: 0,
            sumSq: 0,
        }),
    );

    const calculatePearsonCorrelation = (arr1: TickerCalculationsType, arr2: TickerCalculationsType) => {
        const pSum = arr1.percentages.reduce((acc, _, idx) => acc + arr1.percentages[idx] * arr2.percentages[idx], 0);

        const num = pSum - (arr1.sum * arr2.sum) / arr1.percentages.length;

        const den = Math.sqrt(
            (arr1.sumSq - Math.pow(arr1.sum, 2) / arr1.percentages.length) *
                (arr2.sumSq - Math.pow(arr2.sum, 2) / arr1.percentages.length),
        );

        return num / den;
    };

    const filteredBetaTickersListCorrelation = useMemo(
        () => betaTickersListCorrelation.filter((val) => val !== 1),
        [betaTickersListCorrelation],
    );

    const minBetaTickersListCorrelation = useMemo(
        () => Math.min(...filteredBetaTickersListCorrelation),
        [filteredBetaTickersListCorrelation],
    );

    const maxBetaTickersListCorrelation = useMemo(
        () => Math.max(...filteredBetaTickersListCorrelation),
        [filteredBetaTickersListCorrelation],
    );

    const colorScale = (val: number) => {
        if (val === 1) return colors.perfect;
        const isPositive = val >= 0;
        const index = Math.round(
            (Math.abs(val - minBetaTickersListCorrelation) /
                (maxBetaTickersListCorrelation - minBetaTickersListCorrelation)) *
                (colors[isPositive ? 'positive' : 'negative'].length - 1),
        );
        return colors[isPositive ? 'positive' : 'negative'][index];
    };

    useEffect(() => {
        if (klines.length !== betaTickersList.length) return;
        for (let i = 0; i < klines?.length; i++) {
            const percentagePrices: number[] = [];
            for (let j = 0; j < klines[i]?.data?.length; j++) {
                percentagePrices.push(
                    ((Number(klines[i]?.data?.[j][4]) - Number(klines[i].data[j][1])) / Number(klines[i].data[j][1])) *
                        100,
                );
            }

            setBetaTickersListPercentages((prevState) => {
                const newState = [...prevState];
                newState[i] = {
                    percentages: percentagePrices,
                    sum: percentagePrices.reduce((acc, val) => acc + val, 0),
                    sumSq: percentagePrices.reduce((acc, val) => acc + Math.pow(val, 2), 0),
                };
                return newState;
            });
        }
    }, [klines]);

    useEffect(() => {
        if (klines.length !== betaTickersList.length) return;
        const tableArr: number[] = [];
        betaTickersList.map((_, index) =>
            betaTickersList.map((_, index2) =>
                tableArr.push(
                    calculatePearsonCorrelation(betaTickersListPercentages[index], betaTickersListPercentages[index2]),
                ),
            ),
        );
        setBetaTickersListCorrelation(tableArr);
    }, [betaTickersListPercentages]);

    const betaTable = useMemo(() => {
        if (betaTickersListCorrelation.length === 0) return null;
        return (
            <table className="table-auto">
                <thead>
                    <tr>
                        <th>USDT</th>
                        {betaTickersList.map((ticker, index) => {
                            return <th key={index}>{ticker.slice(0, -4)}</th>;
                        })}
                    </tr>
                </thead>
                <tbody>
                    {betaTickersListCorrelation.reduce((acc: JSX.Element[], _, index) => {
                        if (index % betaTickersList.length === 0) {
                            const row = (
                                <tr key={index}>
                                    <td>{betaTickersList[index / betaTickersList.length].slice(0, -4)}</td>

                                    {betaTickersListCorrelation
                                        .slice(index, index + betaTickersList.length)
                                        .map((item, index) => (
                                            <td
                                                key={index}
                                                className="p-1.5 text-center"
                                                style={{backgroundColor: colorScale(item)}}
                                            >
                                                {item.toString().slice(0, 5)}
                                            </td>
                                        ))}
                                </tr>
                            );
                            acc.push(row);
                        }
                        return acc;
                    }, [])}
                </tbody>
            </table>
        );
    }, [betaTickersListCorrelation]);

    const isAllFetched = useMemo(() => {
        return klines.every((item) => item.isLoading === false);
    }, [klines]);

    return (
        <div className="relative">
            {/* <MultiSelect
                options={[
                    {id: 1, name: 'BTCUSDT'},
                    {id: 2, name: 'ETHUSDT'},
                ]}
                values={selectedPeople}
                onChange={setSelectedPeople}
            /> */}
            {isAllFetched ? (
                <div className="mt-10 flex justify-center">{betaTable}</div>
            ) : (
                <div className="absolute left-1/2 -translate-x-1/2 translate-y-1/2">
                    <Spinner />
                </div>
            )}
        </div>
    );
};

export default memo(BetaTable);
