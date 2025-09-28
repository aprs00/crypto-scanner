import { OrderbookType, TableAlignment } from './types';

const tableBackgroundStyle = (type: OrderbookType, tableAlignment: TableAlignment, percentage: number) => {
    const linearGradingDegVal = {
        [OrderbookType.Asks]: {
            [TableAlignment.H]: '90deg',
            [TableAlignment.V]: '90deg',
            color: 'rgba(198, 6, 6, 0.55)',
        },
        [OrderbookType.Bids]: {
            [TableAlignment.H]: '270deg',
            [TableAlignment.V]: '90deg',
            color: 'rgba(0, 185, 9, 0.55)',
        },
    };
    return `linear-gradient(${linearGradingDegVal[type][tableAlignment]}, ${
        linearGradingDegVal[type].color
    } ${percentage}%, rgba(255, 255, 255, 0) 0%)`;
};

export { tableBackgroundStyle };
