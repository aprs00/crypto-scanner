import { useToastStore } from '@/stores/useToastStore';

import CSToast from './CSToast';
import styles from './CSToast.module.css';

const ToastContainer = () => {
    const toasts = useToastStore((state) => state.toasts);
    const removeToast = useToastStore((state) => state.removeToast);

    return (
        <div aria-live="assertive" className={styles.container}>
            <div className={styles.stack}>
                {toasts.map((toast, idx) => (
                    <CSToast key={idx} onClose={() => removeToast(toast)} show={true} toast={toast} />
                ))}
            </div>
        </div>
    );
};

export default ToastContainer;
