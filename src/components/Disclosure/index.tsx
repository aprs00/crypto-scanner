import {Disclosure} from '@headlessui/react';
import {memo} from 'react';

import type {CustomDisclosurePropsType} from './types';

function CustomDisclosure(props: CustomDisclosurePropsType) {
    const {children, title} = props;
    return (
        <Disclosure>
            <Disclosure.Button className="py-2 text-xl font-medium text-slate-200">{title}</Disclosure.Button>
            <Disclosure.Panel className="text-gray-500">{children}</Disclosure.Panel>
        </Disclosure>
    );
}

export default memo(CustomDisclosure);
