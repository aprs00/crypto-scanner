// Epoch-shaped time backed by the monotonic performance clock. This keeps chart
// ordering stable if the wall clock is adjusted while the application is open.
const hasPerformanceClock = typeof performance !== 'undefined' && Number.isFinite(performance.timeOrigin);
const epochOrigin = hasPerformanceClock ? performance.timeOrigin : Date.now();
let lastReceipt = 0;

export const observedNow = (): number => {
    const candidate = hasPerformanceClock ? epochOrigin + performance.now() : Date.now();
    return Number.isFinite(candidate) ? Math.max(candidate, lastReceipt) : lastReceipt;
};

export const receiptTimestamp = (): number => {
    const candidate = observedNow();
    const next = Math.max(candidate, lastReceipt + 0.001);
    lastReceipt = next;
    return next;
};
