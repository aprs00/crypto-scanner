import { useEffect, useRef, useState } from 'react';

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
    const startYRef = useRef(0);
    const startTimeRef = useRef(0);
    const dragOffsetRef = useRef(0);
    const isTouchingRef = useRef(false);
    const activeScrollableRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setDragOffset(0);
            setIsDragging(false);
            dragOffsetRef.current = 0;
            isTouchingRef.current = false;
            activeScrollableRef.current = null;
        }
    }, [isOpen]);

    const setDragOffsetValue = (value: number) => {
        dragOffsetRef.current = value;
        setDragOffset(value);
    };

    const getScrollableTarget = (target: EventTarget | null) => {
        if (!target || !(target instanceof Element)) return null;
        return target.closest('[data-drag-scroll]') as HTMLElement | null;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!enabled) return;
        const touchY = e.touches[0].clientY;
        startYRef.current = touchY;
        startTimeRef.current = Date.now();
        isTouchingRef.current = true;
        activeScrollableRef.current = getScrollableTarget(e.target);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!enabled || !isTouchingRef.current) return;

        const touchY = e.touches[0].clientY;
        const delta = touchY - startYRef.current;

        if (delta <= 0) {
            if (dragOffsetRef.current > 0) {
                setDragOffsetValue(0);
                setIsDragging(false);
            }
            return;
        }

        const scrollableElement = activeScrollableRef.current;
        if (scrollableElement && scrollableElement.scrollTop > 0) {
            startYRef.current = touchY;
            startTimeRef.current = Date.now();
            if (dragOffsetRef.current > 0) {
                setDragOffsetValue(0);
                setIsDragging(false);
            }
            return;
        }

        if (!isDragging) {
            setIsDragging(true);
        }

        e.preventDefault();
        setDragOffsetValue(delta);
    };

    const handleTouchEnd = () => {
        if (!isTouchingRef.current) return;

        isTouchingRef.current = false;

        if (dragOffsetRef.current <= 0) {
            activeScrollableRef.current = null;
            return;
        }

        const dragDuration = Math.max(1, Date.now() - startTimeRef.current);
        const velocity = dragOffsetRef.current / dragDuration;

        const shouldClose = dragOffsetRef.current > threshold || velocity > velocityThreshold;

        if (shouldClose) {
            onClose();
        } else {
            setDragOffsetValue(0);
        }

        setIsDragging(false);
        activeScrollableRef.current = null;
    };

    const panelStyle: React.CSSProperties | undefined =
        isDragging || dragOffset > 0
            ? {
                  transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  touchAction: isDragging ? 'none' : undefined,
              }
            : undefined;

    const backdropStyle = dragOffset > 0 ? { opacity: Math.max(0.2, 1 - dragOffset / 500) } : undefined;

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
