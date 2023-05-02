const orderBookReducer = (state: any, action: any) => {
    switch (action.type) {
        case 'updatePreviousUpdateId':
            return {
                ...state,
                previousUpdateId: action.payload,
            };
        case 'updateFirstEventProcessed':
            return {
                ...state,
                firstEventProcessed: action.payload,
            };
        case 'updategroupByVal':
            return {
                ...state,
                groupByVal: action.payload,
            };
        case 'updateTempData':
            return {
                ...state,
                tempData: {
                    ...state.tempData,
                    ...action.payload,
                },
            };
        case 'updateTempDataConsumed':
            return {
                ...state,
                tempDataConsumed: action.payload,
            };
        case 'updateAsks':
            return {
                ...state,
                asks: action.payload,
            };
        case 'updateBids':
            return {
                ...state,
                bids: action.payload,
            };
        case 'updateGroupedAsks':
            return {
                ...state,
                groupedAsks: action.payload,
            };
        case 'updateGroupedBids':
            return {
                ...state,
                groupedBids: action.payload,
            };
        default:
            return state;
    }
};

export default orderBookReducer;
