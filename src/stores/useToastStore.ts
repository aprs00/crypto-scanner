import { create } from 'zustand';

export const ToastType = {
    Success: 'success',
    Error: 'error',
    Info: 'info',
    Warning: 'warning',
} as const;

export type ToastType = (typeof ToastType)[keyof typeof ToastType];

export interface Toast {
    message: string;
    type: ToastType;
}

interface ToastStore {
    toasts: Toast[];
    showToast: (toast: Toast) => void;
    removeToast: (toast: Toast) => void;
}

const TOAST_DURATION = 3000;

export const useToastStore = create<ToastStore>((set, get) => ({
    toasts: [],

    showToast: (toast) => {
        set((state) => ({
            toasts: [...state.toasts, toast],
        }));

        setTimeout(() => {
            get().removeToast(toast);
        }, TOAST_DURATION);
    },

    removeToast: (toast) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t !== toast),
        }));
    },
}));
