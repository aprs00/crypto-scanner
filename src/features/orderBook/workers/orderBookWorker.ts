onmessage = (event) => {
    function findTargetPriceIndex(bids: [string, string][], price: string, ascending: boolean) {
        let low = 0;
        let high = bids.length - 1;
        const parsedPrice = parseFloat(price);

        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            let midPrice = parseFloat(bids[mid][0]);

            if (midPrice === parsedPrice) return {exactMatch: true, index: mid};
            else if ((ascending && midPrice < parsedPrice) || (!ascending && midPrice > parsedPrice)) low = mid + 1;
            else high = mid - 1;
        }

        return {exactMatch: false, index: low};
    }

    const {type, payload, groupByNum} = event.data;
    if (type === 'UPDATE_ORDER_BOOK') {
        const {bidsGetter, asksGetter, bidsStream, asksStream} = payload;
        let counter = 0;

        const updateOrderBook = (getter: [string, string][], stream: [string, string][], ascending: boolean) => {
            for (const [price, quantity] of stream) {
                counter++;
                if (quantity === '0.00000000') {
                    const {exactMatch, index} = findTargetPriceIndex(getter, price, ascending);
                    if (exactMatch) getter.splice(index, 1);
                    continue;
                } else {
                    const {exactMatch, index} = findTargetPriceIndex(getter, price, ascending);
                    if (exactMatch) getter[index][1] = quantity;
                    else getter.splice(index, 0, [price, quantity]);
                }
            }

            return getter;
        };

        const groupOrders = (ordersGetter: [string, string][], groupByNum: number, isBid: boolean): Float32Array[] => {
            const result = new Map<number, number>();
            const groupedOrders = new Array(Math.ceil(ordersGetter.length / 2 / groupByNum))
                .fill(null)
                .map(() => new Float32Array(2));

            for (const order of ordersGetter) {
                const orderPrice = parseFloat(order[0]);
                const roundedPrice = isBid
                    ? Math.floor(orderPrice / groupByNum) * groupByNum
                    : Math.ceil(orderPrice / groupByNum) * groupByNum;

                const currentQuantity = result.get(roundedPrice) || 0;
                const newQuantity = currentQuantity + parseFloat(order[1]);
                result.set(roundedPrice, newQuantity);
            }

            let index = 0;
            for (const [price, quantity] of result) {
                groupedOrders[index][0] = price;
                groupedOrders[index][1] = quantity;
                index++;
            }

            return groupedOrders;
        };

        const updatedAsks = updateOrderBook(asksGetter, asksStream, true);
        const updatedBids = updateOrderBook(bidsGetter, bidsStream, false);

        const groupedAsks = groupOrders(updatedAsks, groupByNum, false);
        const groupedBids = groupOrders(updatedBids, groupByNum, true);

        postMessage({
            type: 'ORDER_BOOK_UPDATED',
            payload: {
                updatedAsks,
                updatedBids,
                groupedAsks,
                groupedBids,
            },
        });
    }
};
