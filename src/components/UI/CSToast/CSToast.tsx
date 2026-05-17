import { Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';

import { XIcon } from '@/components/Icons';
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from '@/components/Icons';
import { Toast, ToastType } from '@/stores/useToastStore';

import styles from './CSToast.module.css';

interface CSToastProps {
    toast: Toast;
    onClose: () => void;
    show: boolean;
}

const toastIcons: Record<ToastType, ReactNode> = {
    [ToastType.Success]: <SuccessIcon />,
    [ToastType.Error]: <ErrorIcon />,
    [ToastType.Warning]: <WarningIcon />,
    [ToastType.Info]: <InfoIcon />,
};

const CSToast = (props: CSToastProps) => {
    const { toast, onClose, show } = props;

    return (
        <Transition
            appear
            as={Fragment}
            enter="transition ease-out dur-300"
            enterFrom="slide-in-left"
            enterTo="slide-rest"
            leave="transition ease-in dur-200"
            leaveFrom="slide-rest"
            leaveTo="slide-in-left"
            show={show}
        >
            <div className={styles.toast} role="status">
                <div className={styles.icon}>{toastIcons[toast.type]}</div>
                <p className={styles.msg}>{toast.message}</p>
                <button className={styles.close} onClick={onClose} type="button">
                    <span className="sr-only">Close</span>
                    <XIcon className="icon-md" />
                </button>
            </div>
        </Transition>
    );
};

export default CSToast;
