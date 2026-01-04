import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { useMediaQuery } from '@mantine/hooks';
import { Fragment, ReactNode } from 'react';

import { XIcon } from '@/components/Icons';
import { useDragToClose } from '@/hooks/useDragToClose';

interface CSDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

const CSDrawer = (props: CSDrawerProps) => {
    const { isOpen, onClose, title, children } = props;
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const { handleTouchStart, handleTouchMove, handleTouchEnd, panelStyle, backdropStyle } = useDragToClose({
        isOpen,
        onClose,
    });

    return (
        <Transition appear as={Fragment} show={isOpen}>
            <Dialog className="relative z-50" onClose={onClose}>
                {/* Backdrop */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50" style={backdropStyle} />
                </TransitionChild>

                {/* Panel */}
                <div className="fixed inset-0 overflow-hidden">
                    <div className={`flex h-full ${isDesktop ? 'justify-end' : 'items-end'}`}>
                        <TransitionChild
                            as={Fragment}
                            enter="transform transition ease-out duration-300"
                            enterFrom={isDesktop ? 'translate-x-full' : 'translate-y-full'}
                            enterTo={isDesktop ? 'translate-x-0' : 'translate-y-0'}
                            leave="transform transition ease-in duration-200"
                            leaveFrom={isDesktop ? 'translate-x-0' : 'translate-y-0'}
                            leaveTo={isDesktop ? 'translate-x-full' : 'translate-y-full'}
                        >
                            <DialogPanel
                                className={`bg-slate-800 flex flex-col overflow-hidden ${
                                    isDesktop ? 'w-full max-w-md h-full' : 'w-full h-[80vh] rounded-t-2xl'
                                }`}
                                style={panelStyle}
                            >
                                {/* Drag handle for mobile */}
                                {!isDesktop && (
                                    <div
                                        className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none shrink-0"
                                        onTouchEnd={handleTouchEnd}
                                        onTouchMove={handleTouchMove}
                                        onTouchStart={handleTouchStart}
                                    >
                                        <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
                                    </div>
                                )}

                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                                    <button
                                        className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                        onClick={onClose}
                                        type="button"
                                    >
                                        <XIcon className="text-slate-400 size-6" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto">{children}</div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CSDrawer;
