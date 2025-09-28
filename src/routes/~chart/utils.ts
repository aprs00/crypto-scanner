import { TableAlignment } from './types';

const tableBackgroundStyle = (type: string, tableAlignment: TableAlignment, percentage: number) => {
    const linearGradingDegVal = {
        asks: {
            [TableAlignment.H]: '90deg',
            [TableAlignment.V]: '90deg',
            color: 'rgba(198, 6, 6, 0.55)',
        },
        bids: {
            [TableAlignment.H]: '270deg',
            [TableAlignment.V]: '90deg',
            color: 'rgba(0, 185, 9, 0.55)',
        },
    };
    return `linear-gradient(${linearGradingDegVal[type as 'asks' | 'bids'][tableAlignment]}, ${
        linearGradingDegVal[type as 'asks' | 'bids'].color
    } ${percentage}%, rgba(255, 255, 255, 0) 0%)`;
};

export { tableBackgroundStyle };
