import {Switch} from '@headlessui/react';

export type ToggleProps = {
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
    label: string;
};

const Toggle = (props: ToggleProps) => {
    const {enabled, label, setEnabled} = props;

    return (
        <div className="flex gap-2 items-center">
            <Switch
                checked={enabled}
                className={`${
                    enabled ? 'bg-sky-600' : 'bg-gray-700'
                } relative inline-flex h-5 w-10 items-center rounded-full`}
                onChange={setEnabled}
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
};

export default Toggle;
