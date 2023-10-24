import {memo} from 'react';
import {Switch} from '@headlessui/react';

import type {MyTogglePropsType} from './types';

function MyToggle(props: MyTogglePropsType) {
    const {enabled, setEnabled, label} = props;

    return (
        <div className="flex gap-2 items-center">
            <Switch
                checked={enabled}
                onChange={setEnabled}
                className={`${
                    enabled ? 'bg-sky-600' : 'bg-gray-700'
                } relative inline-flex h-5 w-10 items-center rounded-full`}
            >
                <span className="sr-only">Enable notifications</span>
                <span
                    className={`${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-3 w-3 transform rounded-full bg-white transition`}
                />
            </Switch>
            <p className="text-slate-200">{label}</p>
        </div>
    );
}

export default memo(MyToggle);
