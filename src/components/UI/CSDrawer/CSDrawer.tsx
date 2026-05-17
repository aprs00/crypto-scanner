import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { useMediaQuery } from '@mantine/hooks';
import { Fragment, ReactNode } from 'react';

import { XIcon } from '@/components/Icons';
import { useDragToClose } from '@/hooks/useDragToClose';

import styles from './CSDrawer.module.css';

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
                <TransitionChild
                    as={Fragment}
                    enter="transition ease-out dur-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition ease-in dur-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className={styles.backdrop} style={backdropStyle} />
                </TransitionChild>

                <div className="fixed inset-0 overflow-hidden">
                    <div className={`flex h-full ${isDesktop ? 'justify-end' : 'items-end'}`}>
                        <TransitionChild
                            as={Fragment}
                            enter="transition ease-out dur-300"
                            enterFrom={isDesktop ? 'translate-x-full' : 'translate-y-full'}
                            enterTo={isDesktop ? 'translate-x-0' : 'translate-y-0'}
                            leave="transition ease-in dur-200"
                            leaveFrom={isDesktop ? 'translate-x-0' : 'translate-y-0'}
                            leaveTo={isDesktop ? 'translate-x-full' : 'translate-y-full'}
                        >
                            <DialogPanel
                                className={[styles.panel, isDesktop && styles.desktop].filter(Boolean).join(' ')}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchMove}
                                onTouchStart={handleTouchStart}
                                style={panelStyle}
                            >
                                {!isDesktop && (
                                    <div className={styles.handle}>
                                        <div className={styles.handleBar} />
                                    </div>
                                )}

                                <div className={styles.head}>
                                    <div className={styles.headLeft}>
                                        <span className={styles.grip}>
                                            <i />
                                            <i />
                                            <i />
                                        </span>
                                        <h2 className={styles.title}>{title}</h2>
                                    </div>
                                    <button className={styles.close} onClick={onClose} type="button">
                                        <XIcon className="icon-md" />
                                    </button>
                                </div>

                                <div className={`${styles.body} scroll`} data-drag-scroll>
                                    {children}
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CSDrawer;
