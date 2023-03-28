onmessage = (event) => {
    const {type, payload, groupByNum} = event.data;
    if (type === 'UPDATE_ORDER_BOOK') {
        const {asksGetter, bidsGetter, asksStream, bidsStream} = payload;
        const updatedAsks = {...asksGetter};
        const updatedBids = {...bidsGetter};
        for (const [price, quantity] of bidsStream) {
            if (quantity === '0.00000000') {
                delete updatedBids[price];
                continue;
            }
            updatedBids[price] = quantity;
        }
        for (const [price, quantity] of asksStream) {
            if (quantity === '0.00000000') {
                delete updatedAsks[price];
                continue;
            }
            updatedAsks[price] = quantity;
        }
        const groupedOrderBookAsks = () => {
            const result: Record<string, string> = {};
            const sortedEntries = Object.entries(updatedAsks).sort(([a], [b]) => Number(a) - Number(b));
            for (const [priceStr, value] of sortedEntries) {
                const price = Math.ceil(parseFloat(priceStr) / groupByNum) * groupByNum;
                result[price] = (Number(result[price] || 0) + Number(value)).toString();
            }
            return result;
        };

        const groupedOrderBookBids = () => {
            const result: Record<string, string> = {};
            const sortedEntries = Object.entries(updatedBids).sort(([a], [b]) => Number(b) - Number(a));
            for (const [priceStr, value] of sortedEntries) {
                const price = Math.floor(parseFloat(priceStr) / groupByNum) * groupByNum;
                result[price] = (Number(result[price] || 0) + Number(value)).toString();
            }
            return result;
        };

        postMessage({
            type: 'ORDER_BOOK_UPDATED',
            payload: {
                updatedAsks,
                updatedBids,
                groupedOrderBookAsks: groupedOrderBookAsks(),
                groupedOrderBookBids: groupedOrderBookBids(),
            },
        });
    }
};
