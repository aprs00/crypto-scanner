// import {fetchDepthSnapshot, useDepthSnapshot, useStreamTicker, useStreamAggTrade} from '../api';
// import {renderHook} from '@testing-library/react-hooks';

// describe('fetchDepthSnapshot', () => {
//     it('returns the expected data', async () => {
//         const symbol = 'BTCUSDT';
//         const limit = 5000;
//         const expectedData = {bids: [], asks: []};
//         const data = await fetchDepthSnapshot(symbol, limit);
//         expect(data).toEqual(expectedData);
//     });
// });

// describe('useDepthSnapshot', () => {
//     it('returns data when symbol and streamedEvent are truthy', async () => {
//         const symbol = 'BTCUSDT';
//         const streamedEvent = true;
//         const {result, waitFor} = renderHook(() => useDepthSnapshot(symbol, streamedEvent));
//         await waitFor(() => result.current.isSuccess);
//         expect(result.current.data).toBeDefined();
//     });

//     it('does not return data when symbol is falsy', async () => {
//         const symbol = '';
//         const streamedEvent = true;
//         const {result, waitFor} = renderHook(() => useDepthSnapshot(symbol, streamedEvent));
//         await waitFor(() => result.current.isError);
//         expect(result.current.data).toBeUndefined();
//     });

//     it('does not return data when streamedEvent is falsy', async () => {
//         const symbol = 'BTCUSDT';
//         const streamedEvent = false;
//         const {result, waitFor} = renderHook(() => useDepthSnapshot(symbol, streamedEvent));
//         await waitFor(() => result.current.isError);
//         expect(result.current.data).toBeUndefined();
//     });
// });

// describe('useStreamTicker', () => {
//     it('returns data when symbol is truthy', async () => {
//         const symbol = 'BTCUSDT';
//         const {result, waitFor} = renderHook(() => useStreamTicker(symbol));
//         await waitFor(() => result.current.isSuccess);
//         expect(result.current.data).toBeDefined();
//     });

//     it('does not return data when symbol is falsy', async () => {
//         const symbol = '';
//         const {result, waitFor} = renderHook(() => useStreamTicker(symbol));
//         await waitFor(() => result.current.isError);
//         expect(result.current.data).toBeUndefined();
//     });
// });

// describe('useStreamAggTrade', () => {
//     it('returns data when symbol is truthy', async () => {
//         const symbol = 'BTCUSDT';
//         const {result, waitFor} = renderHook(() => useStreamAggTrade(symbol));
//         await waitFor(() => result.current.isSuccess);
//         expect(result.current.data).toBeDefined();
//     });

//     it('does not return data when symbol is falsy', async () => {
//         const symbol = '';
//         const {result, waitFor} = renderHook(() => useStreamAggTrade(symbol));
//         await waitFor(() => result.current.isError);
//         expect(result.current.data).toBeUndefined();
//     });
// });
