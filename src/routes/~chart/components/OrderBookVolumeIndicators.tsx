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

    const renderPercentageIndicator = (
        label: string,
        bidPct: number,
        askPct: number,
        bidVolumeUSD?: number,
        askVolumeUSD?: number,
    ) => (
        <div className="px-2 pb-1.5">
            <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">{label}</span>
                <div className="h-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg overflow-hidden flex shadow-sm">
                    <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300 flex items-center justify-center gap-1"
                        style={{ width: `${bidPct}%` }}
                    >
                        {bidPct > 10 && (
                            <div className="flex items-center gap-1">
                                <div className="text-xs font-medium text-emerald-950">{bidPct.toFixed(1)}%</div>
                                {bidVolumeUSD !== undefined && (
                                    <div className="text-xs text-emerald-950">
                                        ${formatNumber(bidVolumeUSD, { notation: 'compact', maximumFractionDigits: 2 })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div
                        className="bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300 flex items-center justify-center gap-1"
                        style={{ width: `${askPct}%` }}
                    >
                        {askPct > 10 && (
                            <div className="flex items-center gap-1">
                                <div className="text-xs font-medium text-orange-950">{askPct.toFixed(1)}%</div>
                                {askVolumeUSD !== undefined && (
                                    <div className="text-xs text-orange-950">
                                        ${formatNumber(askVolumeUSD, { notation: 'compact', maximumFractionDigits: 2 })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
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
        </>
    );
};

export default OrderBookVolumeIndicators;
