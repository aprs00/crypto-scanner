import {memo, useEffect, useMemo, useState} from 'react';

import {useKlines} from '../../api';
import type {TickerCalculationsType} from '../../types';

const betaTickersList = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT'];

const BetaTable = () => {
    const results = useKlines(betaTickersList);
    const [betaTickersListPercentages, setBetaTickersListPercentages] = useState<TickerCalculationsType[]>(
        new Array(betaTickersList.length).fill({
            percentages: [],
            sum: 0,
            sumSq: 0,
        }),
    );

    const [betaTickersListCorrelation, setBetaTickersListCorrelation] = useState<number[]>([]);

    const calculatePearsonCorrelation = (arr1: TickerCalculationsType, arr2: TickerCalculationsType) => {
        const pSum = arr1.percentages.reduce((acc, _, idx) => acc + arr1.percentages[idx] * arr2.percentages[idx], 0);

        const num = pSum - (arr1.sum * arr2.sum) / arr1.percentages.length;

        const den = Math.sqrt(
            (arr1.sumSq - Math.pow(arr1.sum, 2) / arr1.percentages.length) *
                (arr2.sumSq - Math.pow(arr2.sum, 2) / arr1.percentages.length),
        );

        return num / den;
    };

    useEffect(() => {
        if (!results.length) return;
        for (let i = 0; i < results?.length; i++) {
            const percentagePrices: number[] = [];
            for (let j = 0; j < results[i]?.data?.length; j++) {
                percentagePrices.push(
                    ((Number(results[i].data[j][4]) - Number(results[i].data[j][1])) / Number(results[i].data[j][1])) *
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
    }, [JSON.stringify(results)]);

    useEffect(() => {
        const tableArr: number[] = [];
        betaTickersList.map((_, index) => {
            betaTickersList.map((_, index2) => {
                const correlation = calculatePearsonCorrelation(
                    betaTickersListPercentages[index],
                    betaTickersListPercentages[index2],
                );
                tableArr.push(correlation);
            });
        });
        setBetaTickersListCorrelation(tableArr);
    }, [JSON.stringify(results)]);

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
                                            <td key={index} className="bg-slate-800 p-2 text-center">
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
    }, [JSON.stringify(results)]);

    return <div>{betaTable}</div>;
};

export default memo(BetaTable);

// const calculateStandardDeviation = (arr: number[]): number => Math.sqrt(calculateVariance(arr) / (arr.length - 1));
// const calculateVariance = (arr: number[]): number =>
//     arr.reduce((acc, val) => acc + Math.pow(val - calculateMean(arr), 2), 0);
// const calculateCovariance = (arr1: number[], arr2: number[]): number => {
//     const mean1 = calculateMean(arr1);
//     const mean2 = calculateMean(arr2);

//     return arr1.reduce((acc, _, idx) => acc + (arr1[idx] - mean1) * (arr2[idx] - mean2), 0) / (arr1.length - 1);
// };
// const calculateMean = (arr: number[]): number => arr.reduce((acc, val) => acc + val, 0) / arr.length;

// for (let i = 0; i < betaTickersListPercentages[betaTickersList[i]]?.percentages.length; i++) {
//     for (let j = 0; j < betaTickersListPercentages[betaTickersList[j]]?.percentages.length; j++) {
//         const correlation = calculatePearsonCorrelation(
//             betaTickersListPercentages[betaTickersList[i]],
//             betaTickersListPercentages[betaTickersList[j]],
//         );
//         tableArr.push(correlation);
//     }
// }
