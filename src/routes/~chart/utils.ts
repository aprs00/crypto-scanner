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

export { tableBackgroundStyle };
