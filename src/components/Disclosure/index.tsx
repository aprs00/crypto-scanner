import {Disclosure, Transition} from '@headlessui/react';
import {memo} from 'react';

import type {CustomDisclosurePropsType} from './types';

function CustomDisclosure(props: CustomDisclosurePropsType) {
    const {children, title} = props;

    return (
        <Disclosure>
            <Disclosure.Button className="py-2 text-xl font-medium text-slate-200">{title}</Disclosure.Button>
            <Transition
                enter="transition ease-out duration-120"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Disclosure.Panel className="text-gray-500">{children}</Disclosure.Panel>
            </Transition>
        </Disclosure>
    );
}

export default memo(CustomDisclosure);
