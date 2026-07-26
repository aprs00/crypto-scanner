export type UiUpdateGate = Readonly<{
    cancel: () => void;
    flush: () => void;
    request: () => void;
}>;

export const createUiUpdateGate = (publish: () => void, intervalMs: number): UiUpdateGate => {
    const normalizedIntervalMs = Number.isFinite(intervalMs) ? Math.max(0, intervalMs) : 0;
    let lastPublishedAt = Number.NEGATIVE_INFINITY;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cancel = () => {
        if (timer === null) return;

        clearTimeout(timer);
        timer = null;
    };

    const publishNow = () => {
        lastPublishedAt = performance.now();
        publish();
    };

    const flush = () => {
        cancel();
        publishNow();
    };

    const request = () => {
        if (timer !== null) return;

        const elapsedMs = performance.now() - lastPublishedAt;
        const remainingMs = normalizedIntervalMs - elapsedMs;

        if (remainingMs <= 0) {
            publishNow();
            return;
        }

        timer = setTimeout(() => {
            timer = null;
            publishNow();
        }, remainingMs);
    };

    return { cancel, flush, request };
};
