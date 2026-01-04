import { Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';

import { XIcon } from '@/components/Icons';
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from '@/components/Icons';
import { Toast, ToastType } from '@/stores/useToastStore';

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
            enter="transform transition ease-out duration-300"
            enterFrom="-translate-x-full opacity-0"
            enterTo="translate-x-0 opacity-100"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0 opacity-100"
            leaveTo="-translate-x-full opacity-0"
            show={show}
        >
            <div
                className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-slate-800 border border-slate-700 shadow-lg"
                role="status"
            >
                <div className="p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">{toastIcons[toast.type]}</div>

                        <div className="ml-3 w-0 flex-1 pt-0.5">
                            <p className="text-sm font-medium text-white">{toast.message}</p>
                        </div>

                        <div className="ml-4 flex flex-shrink-0">
                            <button
                                className="inline-flex rounded-md text-slate-400 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 cursor-pointer"
                                onClick={onClose}
                                type="button"
                            >
                                <span className="sr-only">Close</span>

                                <XIcon className="size-5 text-slate-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    );
};

export default CSToast;
