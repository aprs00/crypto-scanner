import {binanceInstance} from '@/lib/api';
import {OrderBookResponseType, StreamTickerResponseType} from '@/routes/~chart/types';

export default class BinanceOrderBookService {
    private ws: WebSocket | null = null;
    private eventBuffer: StreamTickerResponseType[] = [];
    private firstEventU: number | null = null;
    private orderBook: OrderBookResponseType = {bids: [], asks: [], lastUpdateId: 0};
    private symbol: string;
    private onOrderBookUpdate: (orderBook: OrderBookResponseType) => void;

    constructor(symbol: string, onOrderBookUpdate: (orderBook: OrderBookResponseType) => void) {
        this.symbol = symbol.toLowerCase();
        this.onOrderBookUpdate = onOrderBookUpdate;
    }

    public initialize(): void {
        this.eventBuffer = [];
        this.firstEventU = null;
        this.orderBook = {bids: [], asks: [], lastUpdateId: 0};

        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${this.symbol}@depth@100ms`);

        this.ws.onopen = () => {};
        this.ws.onclose = () => {};
        this.ws.onerror = () => {};

        this.ws.onmessage = (event) => {
            const data: StreamTickerResponseType = JSON.parse(event.data);

            if (this.firstEventU === null && data.U) {
                this.firstEventU = data.U;
                this.fetchSnapshot();
            } else if (this.orderBook.lastUpdateId === 0) {
                this.eventBuffer.push(data);
            } else {
                this.processEvent(data);
            }
        };
    }

    public groupOrders = (orderBook: OrderBookResponseType, groupByVal: number, numOfRows: number) => {
        return {
            bids: this.groupOrdersByPrice(orderBook.bids, groupByVal, false, numOfRows),
            asks: this.groupOrdersByPrice(orderBook.asks, groupByVal, true, numOfRows),
        };
    };

    public close(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    private async fetchSnapshot(): Promise<void> {
        try {
            const {data} = await binanceInstance.get<OrderBookResponseType>(
                `api/v3/depth?symbol=${this.symbol.toUpperCase()}&limit=5000`,
            );

            if (data.lastUpdateId < (this.firstEventU ?? 0)) {
                this.fetchSnapshot();
                return;
            }

            this.processSnapshot(data);
        } catch (error) {
            /* empty */
        }
    }

    private processSnapshot(snapshot: OrderBookResponseType): void {
        const newOrderBook = {
            bids: snapshot.bids,
            asks: snapshot.asks,
            lastUpdateId: snapshot.lastUpdateId,
        };

        const validEvents = this.eventBuffer.filter((event) => event.u > snapshot.lastUpdateId);

        if (validEvents.length > 0) {
            const firstEvent: StreamTickerResponseType = validEvents[0];
            if (firstEvent.U <= snapshot.lastUpdateId + 1 && firstEvent.u >= snapshot.lastUpdateId + 1) {
                let currentBook = {...newOrderBook};

                validEvents.forEach((event) => {
                    currentBook = this.applyEvent(currentBook, event);
                });

                this.orderBook = currentBook;
                this.onOrderBookUpdate(currentBook);
                this.eventBuffer = [];
            } else {
                setTimeout(() => this.initialize(), 1000);
                this.orderBook = newOrderBook;
                this.onOrderBookUpdate(newOrderBook);
            }
        } else {
            this.orderBook = newOrderBook;
            this.onOrderBookUpdate(newOrderBook);
        }
    }

    private processEvent(event: StreamTickerResponseType): void {
        const updatedBook = this.applyEvent(this.orderBook, event);

        if (updatedBook.lastUpdateId !== this.orderBook.lastUpdateId) {
            this.orderBook = updatedBook;
            this.onOrderBookUpdate(updatedBook);
        }
    }

    private applyEvent(book: OrderBookResponseType, event: StreamTickerResponseType): OrderBookResponseType {
        if (event.u <= book.lastUpdateId) {
            return book;
        }

        if (event.U > book.lastUpdateId + 1) {
            setTimeout(() => this.initialize(), 1000);
        }

        const updatedAsks = this.updateOrderBook(book.asks, event.a, true);
        const updatedBids = this.updateOrderBook(book.bids, event.b, false);

        return {
            asks: updatedAsks,
            bids: updatedBids,
            lastUpdateId: event.u,
        };
    }

    private updateOrderBook = (getter: [string, string][], stream: [string, string][], ascending: boolean) => {
        for (const [price, quantity] of stream) {
            const {exactMatch, index} = this.findTargetPriceIndex(getter, price, ascending);
            if (quantity === '0.00000000') {
                if (exactMatch) getter.splice(index, 1);
            } else {
                if (exactMatch) getter[index][1] = quantity;
                else getter.splice(index, 0, [price, quantity]);
            }
        }

        return getter;
    };

    private groupOrdersByPrice = (
        getter: [string, string][],
        groupByVal: number,
        isBid: boolean,
        numOfRows: number,
    ) => {
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

    private findTargetPriceIndex = (bids: [string, string][], price: string, ascending: boolean) => {
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
}
