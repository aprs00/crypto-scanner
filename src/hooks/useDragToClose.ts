import { useCallback, useEffect, useRef, useState } from 'react';

interface UseDragToCloseOptions {
    isOpen: boolean;
    onClose: () => void;
    enabled?: boolean;
    threshold?: number;
    velocityThreshold?: number;
}

interface UseDragToCloseReturn {
    dragOffset: number;
    isDragging: boolean;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    panelStyle: React.CSSProperties | undefined;
    backdropStyle: React.CSSProperties | undefined;
}

export const useDragToClose = (options: UseDragToCloseOptions): UseDragToCloseReturn => {
    const { isOpen, onClose, enabled = true, threshold = 100, velocityThreshold = 0.5 } = options;

    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef(0);
    const dragStartTime = useRef(0);
    const lastY = useRef(0);

    useEffect(() => {
        if (!isOpen) {
            setDragOffset(0);
            setIsDragging(false);
        }
    }, [isOpen]);

    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (!enabled) return;

            const touchY = e.touches[0].clientY;
            dragStartY.current = touchY;
            dragStartTime.current = Date.now();
            lastY.current = touchY;
            setIsDragging(true);
        },
        [enabled],
    );

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!enabled || !isDragging) return;

            const touchY = e.touches[0].clientY;
            const delta = touchY - dragStartY.current;
            lastY.current = touchY;

            if (delta > 0) {
                e.preventDefault();
                setDragOffset(delta);
            } else {
                setDragOffset(0);
            }
        },
        [enabled, isDragging],
    );

    const handleTouchEnd = useCallback(() => {
        if (!enabled || !isDragging) return;

        const dragDuration = Date.now() - dragStartTime.current;
        const velocity = dragOffset / dragDuration;

        const shouldClose = dragOffset > threshold || velocity > velocityThreshold;

        if (shouldClose) {
            onClose();
        } else {
            setDragOffset(0);
        }

        setIsDragging(false);
    }, [enabled, isDragging, dragOffset, threshold, velocityThreshold, onClose]);

    const panelStyle: React.CSSProperties | undefined =
        enabled && (isDragging || dragOffset > 0)
            ? {
                  transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  touchAction: isDragging ? 'none' : undefined,
              }
            : undefined;

    const backdropStyle = enabled && dragOffset > 0 ? { opacity: Math.max(0.2, 1 - dragOffset / 500) } : undefined;

    return {
        dragOffset,
        isDragging,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        panelStyle,
        backdropStyle,
    };
};
