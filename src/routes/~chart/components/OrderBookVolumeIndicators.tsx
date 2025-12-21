import { formatNumber } from '@/utils/number';

import { OrderBookResponseType } from '../types';

export type OrderBookVolumeIndicatorsPropsType = {
    groupedOrderBook: {
        bids: [number, number][];
        asks: [number, number][];
    };
    orderBook: OrderBookResponseType;
};

const OrderBookVolumeIndicators = ({ groupedOrderBook, orderBook }: OrderBookVolumeIndicatorsPropsType) => {
    const bestBidPrice = orderBook.bids.length > 0 ? parseFloat(orderBook.bids[0][0]) : 0;
    const bestAskPrice = orderBook.asks.length > 0 ? parseFloat(orderBook.asks[0][0]) : 0;
    const midPrice = (bestBidPrice + bestAskPrice) / 2;

    const totalAskVolume = orderBook.asks.reduce((sum, ask) => sum + (ask?.[1] ? parseFloat(ask[1]) : 0), 0);
    const totalBidVolume = orderBook.bids.reduce((sum, bid) => sum + (bid?.[1] ? parseFloat(bid[1]) : 0), 0);
    const totalVolume = totalBidVolume + totalAskVolume;

    const totalAskVolumeUSD = totalAskVolume * midPrice;
    const totalBidVolumeUSD = totalVolume > 0 ? (totalVolume - totalAskVolume) * midPrice : 0;

    const askPercentage = totalVolume > 0 ? (totalAskVolume / totalVolume) * 100 : 0;
    const bidPercentage = totalVolume > 0 ? 100 - askPercentage : 0;

    const visibleBidVolume = groupedOrderBook.bids.reduce((sum, bid) => sum + (bid?.[1] ?? 0), 0);
    const visibleAskVolume = groupedOrderBook.asks.reduce((sum, ask) => sum + (ask?.[1] ?? 0), 0);
    const visibleTotalVolume = visibleBidVolume + visibleAskVolume;

    const visibleBidVolumeUSD = visibleBidVolume * midPrice;
    const visibleAskVolumeUSD = visibleAskVolume * midPrice;

    const visibleBidPercentage = visibleTotalVolume > 0 ? (visibleBidVolume / visibleTotalVolume) * 100 : 0;
    const visibleAskPercentage = visibleTotalVolume > 0 ? (visibleAskVolume / visibleTotalVolume) * 100 : 0;

    const renderBarSegment = (side: 'bid' | 'ask', percentage: number, volumeUSD?: number) => {
        const isBid = side === 'bid';

        return (
            <div
                className={`bg-gradient-to-r ${isBid ? 'from-emerald-500 to-emerald-400 justify-start rounded-l-lg' : 'from-orange-500 to-orange-400 justify-end rounded-r-lg'} transition-all duration-300 flex items-center gap-1 overflow-visible`}
                style={{ width: `${percentage}%` }}
            >
                <div className={`relative z-10 flex items-center gap-1 whitespace-nowrap ${isBid ? 'pl-4' : 'pr-4'}`}>
                    <div className={`text-xs font-medium ${isBid ? 'text-emerald-950' : 'text-orange-950'}`}>
                        {percentage.toFixed(1)}%
                    </div>
                    {volumeUSD !== undefined && (
                        <div className={`text-xs ${isBid ? 'text-emerald-950' : 'text-orange-950'}`}>
                            ${formatNumber(volumeUSD, { notation: 'compact', maximumFractionDigits: 2 })}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderPercentageIndicator = (
        label: string,
        bidPct: number,
        askPct: number,
        bidVolumeUSD?: number,
        askVolumeUSD?: number,
    ) => (
        <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-300">{label}</h4>
            <div className="h-6 bg-gradient-to-r font-medium from-slate-800 to-slate-700 rounded-lg overflow-visible flex shadow-sm">
                {renderBarSegment('bid', bidPct, bidVolumeUSD)}
                {renderBarSegment('ask', askPct, askVolumeUSD)}
            </div>
        </div>
    );

    return (
        <div className="space-y-2 mb-3 px-1">
            {renderPercentageIndicator(
                'Total Market',
                bidPercentage,
                askPercentage,
                totalBidVolumeUSD,
                totalAskVolumeUSD,
            )}
            {renderPercentageIndicator(
                'Visible',
                visibleBidPercentage,
                visibleAskPercentage,
                visibleBidVolumeUSD,
                visibleAskVolumeUSD,
            )}
        </div>
    );
};

export default OrderBookVolumeIndicators;
