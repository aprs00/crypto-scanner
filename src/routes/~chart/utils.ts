import {SetStateAction} from 'react';

import type {OrderBookResponseType, StreamTickerResponseType} from './types';

const findTargetPriceIndex = (bids: [string, string][], price: string, ascending: boolean) => {
    let low = 0;
    let high = bids.length - 1;
    const parsedPrice = parseFloat(price);

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const midPrice = parseFloat(bids[mid][0]);

        if (midPrice === parsedPrice) return {exactMatch: true, index: mid};
        else if ((ascending && midPrice < parsedPrice) || (!ascending && midPrice > parsedPrice)) low = mid + 1;
        else high = mid - 1;
    }

    return {exactMatch: false, index: low};
};

const updateOrderBook = (getter: [string, string][], stream: [string, string][], ascending: boolean) => {
    for (const [price, quantity] of stream) {
        const {exactMatch, index} = findTargetPriceIndex(getter, price, ascending);
        if (quantity === '0.00000000') {
            if (exactMatch) getter.splice(index, 1);
        } else {
            if (exactMatch) getter[index][1] = quantity;
            else getter.splice(index, 0, [price, quantity]);
        }
    }

    return {getter};
};

const groupOrders = (getter: [string, string][], groupByVal: number, isBid: boolean, numOfRows: number) => {
    const groupedGetter = new Map();

    const makeCalculateRoundedPrice = (isBid: boolean) =>
        isBid
            ? (orderPrice: number) => Math.ceil(orderPrice / groupByVal) * groupByVal
            : (orderPrice: number) => Math.floor(orderPrice / groupByVal) * groupByVal;

    const calculateRoundedPrice = makeCalculateRoundedPrice(isBid);

    for (let i = 0; i < getter.length; i++) {
        const [priceStr, quantityStr] = getter[i];
        const orderPrice = parseFloat(priceStr);
        const quantity = parseFloat(quantityStr);
        const roundedPrice = calculateRoundedPrice(orderPrice);

        if (groupedGetter.has(roundedPrice))
            groupedGetter.set(roundedPrice, groupedGetter.get(roundedPrice) + quantity);
        else groupedGetter.set(roundedPrice, quantity);
    }

    const roundedGetter = [];

    for (let i = 0; i < numOfRows; i++) {
        roundedGetter.push(Array.from(groupedGetter)[i]);
    }

    return roundedGetter;
};

const isEventValid = (
    depthSnapshot: OrderBookResponseType,
    streamData: StreamTickerResponseType,
    firstEventProcessed: boolean,
    setFirstEventProcessed: (value: SetStateAction<boolean>) => void,
) => {
    if (!depthSnapshot) return false;
    if (streamData.u <= depthSnapshot.lastUpdateId) return false;

    if (!firstEventProcessed) {
        if (!(streamData.U <= depthSnapshot.lastUpdateId + 1)) return false;
        if (!(streamData.u >= depthSnapshot.lastUpdateId + 1)) return false;
        setFirstEventProcessed(true);
    }

    return streamData.U <= depthSnapshot.lastUpdateId + 1;
};

const tableBackgroundStyle = (type: string, tableAlignment: string, percentage: number) => {
    const linearGradingDegVal = {
        asks: {
            H: '90deg',
            V: '90deg',
            color: 'rgba(198, 6, 6, 0.55)',
        },
        bids: {
            H: '270deg',
            V: '90deg',
            color: 'rgba(0, 185, 9, 0.55)',
        },
    };
    return `linear-gradient(${linearGradingDegVal[type as 'asks' | 'bids'][tableAlignment as 'V' | 'H']}, ${
        linearGradingDegVal[type as 'asks' | 'bids'].color
    } ${percentage}%, rgba(255, 255, 255, 0) 0%)`;
};

export {findTargetPriceIndex, groupOrders, isEventValid, tableBackgroundStyle, updateOrderBook};
