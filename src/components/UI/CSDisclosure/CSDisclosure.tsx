import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react';
import { ReactNode } from 'react';

export type CustomDisclosurePropsType = {
    title: string;
    children: ReactNode;
};

function CustomDisclosure(props: CustomDisclosurePropsType) {
    const { children, title } = props;

    return (
        <Disclosure>
            <DisclosureButton className="py-2 text-xl font-medium text-slate-200">{title}</DisclosureButton>
            <Transition
                enter="transition ease-out duration-120"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <DisclosurePanel className="text-gray-500">{children}</DisclosurePanel>
            </Transition>
        </Disclosure>
    );
}

export default CustomDisclosure;
