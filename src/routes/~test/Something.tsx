// import React, {useEffect, useRef, useState} from 'react';

// const OrderBookManager = () => {
//     const [orderBook, setOrderBook] = useState({bids: {}, asks: {}, lastUpdateId: 0});
//     const [status, setStatus] = useState('Initializing');
//     const [error, setError] = useState(null);
//     const [connected, setConnected] = useState(false);
//     const [displayedBook, setDisplayedBook] = useState({bids: [], asks: []});

//     const ws = useRef(null);
//     const eventBuffer = useRef([]);
//     const firstEventU = useRef(null);
//     const orderBookRef = useRef({bids: {}, asks: {}, lastUpdateId: 0});
//     const symbol = 'btcusdt';

//     // Keep the ref updated with the latest orderBook state
//     useEffect(() => {
//         orderBookRef.current = orderBook;
//     }, [orderBook]);

//     // Format order book for display
//     useEffect(() => {
//         if (orderBook.lastUpdateId > 0) {
//             // Sort bids in descending order (highest price first)
//             const bids = Object.entries(orderBook.bids)
//                 .map(([price, quantity]) => ({price: parseFloat(price), quantity: parseFloat(quantity)}))
//                 .sort((a, b) => b.price - a.price)
//                 .slice(0, 10); // Show top 10 bids

//             // Sort asks in ascending order (lowest price first)
//             const asks = Object.entries(orderBook.asks)
//                 .map(([price, quantity]) => ({price: parseFloat(price), quantity: parseFloat(quantity)}))
//                 .sort((a, b) => a.price - b.price)
//                 .slice(0, 10); // Show top 10 asks

//             setDisplayedBook({bids, asks});
//         }
//     }, [orderBook]);

//     // Initialize WebSocket connection and setup event handling
//     const initialize = () => {
//         setStatus('Initializing');
//         setError(null);
//         eventBuffer.current = [];
//         firstEventU.current = null;

//         // Reset the order book
//         setOrderBook({bids: {}, asks: {}, lastUpdateId: 0});

//         // Close existing WebSocket if it exists
//         if (ws.current) {
//             ws.current.close();
//         }

//         // Step 1: Open a WebSocket connection
//         ws.current = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@depth@100ms`);

//         ws.current.onopen = () => {
//             setConnected(true);
//             setStatus('WebSocket connected, buffering initial events');
//         };

//         ws.current.onclose = () => {
//             setConnected(false);
//             setStatus('WebSocket disconnected');
//         };

//         ws.current.onerror = (error) => {
//             setError(`WebSocket error: ${error.message}`);
//             setStatus('Error');
//         };

//         // Step 2: Buffer the events received from the stream
//         ws.current.onmessage = (event) => {
//             const data = JSON.parse(event.data);

//             // Always use the ref for the current state, not the closed-over state
//             const currentOrderBook = orderBookRef.current;

//             if (firstEventU.current === null && data.U) {
//                 // Store U of first event
//                 firstEventU.current = data.U;
//                 fetchSnapshot();
//             } else if (currentOrderBook.lastUpdateId === 0) {
//                 // Buffer events until we have a snapshot
//                 eventBuffer.current.push(data);
//                 setStatus(`Buffering events: ${eventBuffer.current.length} events buffered`);
//             } else {
//                 // Process event for established order book
//                 processEvent(data);
//             }
//         };
//     };

//     // Step 3: Get a depth snapshot
//     const fetchSnapshot = async () => {
//         try {
//             setStatus('Fetching order book snapshot');
//             const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=5000`);
//             const data = await response.json();

//             // Step 4: Check if snapshot lastUpdateId is less than first event U
//             if (data.lastUpdateId < firstEventU.current) {
//                 setStatus('Snapshot outdated, fetching a new one');
//                 fetchSnapshot();
//                 return;
//             }

//             // Step 5: Process snapshot and buffered events
//             processSnapshot(data);
//         } catch (error) {
//             setError(`Error fetching snapshot: ${error.message}`);
//             setStatus('Error');
//         }
//     };

//     // Process the snapshot and initialize the order book
//     const processSnapshot = (snapshot) => {
//         setStatus('Processing snapshot and buffered events');

//         // Step 6: Set local order book to snapshot
//         const newOrderBook = {
//             bids: {},
//             asks: {},
//             lastUpdateId: snapshot.lastUpdateId,
//         };

//         // Format the snapshot data
//         snapshot.bids.forEach(([price, quantity]) => {
//             if (parseFloat(quantity) > 0) {
//                 newOrderBook.bids[price] = quantity;
//             }
//         });

//         snapshot.asks.forEach(([price, quantity]) => {
//             if (parseFloat(quantity) > 0) {
//                 newOrderBook.asks[price] = quantity;
//             }
//         });

//         // Filter buffered events
//         const validEvents = eventBuffer.current.filter((event) => event.u > snapshot.lastUpdateId);

//         // Check if first event is within range
//         if (validEvents.length > 0) {
//             const firstEvent = validEvents[0];
//             if (firstEvent.U <= snapshot.lastUpdateId + 1 && firstEvent.u >= snapshot.lastUpdateId + 1) {
//                 // Apply all valid buffered events
//                 let currentBook = {...newOrderBook};

//                 validEvents.forEach((event) => {
//                     currentBook = applyEvent(currentBook, event);
//                 });

//                 // Update the state with the processed order book
//                 setOrderBook(currentBook);
//                 setStatus(
//                     `Order book initialized with ${Object.keys(currentBook.bids).length} bids and ${Object.keys(currentBook.asks).length} asks`,
//                 );

//                 // Clear buffer
//                 eventBuffer.current = [];
//             } else {
//                 // Something went wrong, restart
//                 setStatus('Event sequence mismatch, restarting');
//                 setTimeout(initialize, 1000);

//                 // Still set the initial snapshot
//                 setOrderBook(newOrderBook);
//             }
//         } else {
//             // No valid events to process
//             setOrderBook(newOrderBook);
//             setStatus(
//                 `Order book initialized with ${Object.keys(newOrderBook.bids).length} bids and ${Object.keys(newOrderBook.asks).length} asks`,
//             );
//         }
//     };

//     // Process a single update event
//     const processEvent = (event) => {
//         // Always use the ref for the current state
//         const currentOrderBook = orderBookRef.current;

//         // Apply the event to the order book
//         const updatedBook = applyEvent(currentOrderBook, event);

//         // Only update state if something changed
//         if (updatedBook.lastUpdateId !== currentOrderBook.lastUpdateId) {
//             setOrderBook(updatedBook);
//         }
//     };

//     // Apply a single event to the order book
//     const applyEvent = (book, event) => {
//         // Step 1: If event.u < book.lastUpdateId, ignore
//         if (event.u <= book.lastUpdateId) {
//             return book;
//         }

//         // Step 2: If event.U > book.lastUpdateId, discard and restart
//         if (event.U > book.lastUpdateId + 1) {
//             setStatus('Event sequence gap detected, restarting');
//             setTimeout(initialize, 1000); // Restart after a delay
//             return book; // Return unchanged book for now
//         }

//         // Step 3: Apply the updates
//         const updatedBook = {
//             bids: {...book.bids},
//             asks: {...book.asks},
//             lastUpdateId: event.u,
//         };

//         // Update bids
//         event.b.forEach(([price, quantity]) => {
//             if (parseFloat(quantity) === 0) {
//                 delete updatedBook.bids[price];
//             } else {
//                 updatedBook.bids[price] = quantity;
//             }
//         });

//         // Update asks
//         event.a.forEach(([price, quantity]) => {
//             if (parseFloat(quantity) === 0) {
//                 delete updatedBook.asks[price];
//             } else {
//                 updatedBook.asks[price] = quantity;
//             }
//         });

//         return updatedBook;
//     };

//     // Connect/disconnect button handler
//     const toggleConnection = () => {
//         if (connected) {
//             ws.current.close();
//             setStatus('Disconnected');
//             setConnected(false);
//         } else {
//             initialize();
//         }
//     };

//     // Initialize on component mount
//     useEffect(() => {
//         initialize();

//         // Cleanup on unmount
//         return () => {
//             if (ws.current) {
//                 ws.current.close();
//             }
//         };
//     }, []);

//     // Format a price number with appropriate precision
//     const formatPrice = (price) => {
//         return parseFloat(price).toFixed(8);
//     };

//     // Format a quantity number with appropriate precision
//     const formatQuantity = (quantity) => {
//         return parseFloat(quantity).toFixed(6);
//     };

//     return (
//         <div className="p-4 max-w-4xl mx-auto">
//             <div className="mb-4 flex justify-between items-center">
//                 <h1 className="text-2xl font-bold">BTC/USDT Order Book</h1>
//                 <div>
//                     <button
//                         className={`px-4 py-2 rounded ${connected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
//                         onClick={toggleConnection}
//                     >
//                         {connected ? 'Disconnect' : 'Connect'}
//                     </button>
//                 </div>
//             </div>

//             <div className="mb-4 p-3 rounded">
//                 <p>
//                     <strong>Status:</strong> {status}
//                 </p>
//                 {error && (
//                     <p className="text-red-500">
//                         <strong>Error:</strong> {error}
//                     </p>
//                 )}
//                 <p>
//                     <strong>Last Update ID:</strong> {orderBook.lastUpdateId}
//                 </p>
//                 <p>
//                     <strong>Bids:</strong> {Object.keys(orderBook.bids).length}
//                 </p>
//                 <p>
//                     <strong>Asks:</strong> {Object.keys(orderBook.asks).length}
//                 </p>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//                 <div className="p-4 rounded">
//                     <h2 className="font-bold mb-2 text-green-800">Bids (Buy)</h2>
//                     <table className="w-full">
//                         <thead>
//                             <tr className="border-b border-green-200">
//                                 <th className="text-left p-2">Price</th>
//                                 <th className="text-right p-2">Quantity</th>
//                                 <th className="text-right p-2">Total</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {displayedBook.bids.map((bid) => (
//                                 <tr className="border-b border-green-100" key={`bid-${bid.price}`}>
//                                     <td className="text-left p-2 text-green-600">{formatPrice(bid.price)}</td>
//                                     <td className="text-right p-2">{formatQuantity(bid.quantity)}</td>
//                                     <td className="text-right p-2">{formatQuantity(bid.price * bid.quantity)}</td>
//                                 </tr>
//                             ))}
//                             {displayedBook.bids.length === 0 && (
//                                 <tr>
//                                     <td className="text-center p-4" colSpan="3">
//                                         Loading bids...
//                                     </td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 <div className="p-4 rounded">
//                     <h2 className="font-bold mb-2 text-red-800">Asks (Sell)</h2>
//                     <table className="w-full">
//                         <thead>
//                             <tr className="border-b border-red-200">
//                                 <th className="text-left p-2">Price</th>
//                                 <th className="text-right p-2">Quantity</th>
//                                 <th className="text-right p-2">Total</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {displayedBook.asks.map((ask) => (
//                                 <tr className="border-b border-red-100" key={`ask-${ask.price}`}>
//                                     <td className="text-left p-2 text-red-600">{formatPrice(ask.price)}</td>
//                                     <td className="text-right p-2">{formatQuantity(ask.quantity)}</td>
//                                     <td className="text-right p-2">{formatQuantity(ask.price * ask.quantity)}</td>
//                                 </tr>
//                             ))}
//                             {displayedBook.asks.length === 0 && (
//                                 <tr>
//                                     <td className="text-center p-4" colSpan="3">
//                                         Loading asks...
//                                     </td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default OrderBookManager;

const SomethingTest = () => {
    return <div>SomethingTest</div>;
};

export default SomethingTest;
