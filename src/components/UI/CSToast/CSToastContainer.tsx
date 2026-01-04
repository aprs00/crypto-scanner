import { useToastStore } from '@/stores/useToastStore';

import CSToast from './CSToast';

const ToastContainer = () => {
    const toasts = useToastStore((state) => state.toasts);
    const removeToast = useToastStore((state) => state.removeToast);

    return (
        <div
            aria-live="assertive"
            className="pointer-events-none fixed inset-0 flex items-start justify-start px-4 py-6 z-[90]"
        >
            <div className="flex w-full flex-col items-start space-y-2">
                {toasts.map((toast, idx) => (
                    <CSToast key={idx} onClose={() => removeToast(toast)} show={true} toast={toast} />
                ))}
            </div>
        </div>
    );
};

export default ToastContainer;
