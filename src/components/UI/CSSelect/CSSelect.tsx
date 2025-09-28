import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { Dispatch, SetStateAction } from 'react';

import SelectIcon from './SelectIcon';

export type SelectProps<T = string> = {
    options: Record<string, string> | T[];
    value: T;
    classes?: string;
    onChange: Dispatch<SetStateAction<T>> | ((value: T) => void);
};

const CSSelect = <T = string,>(props: SelectProps<T>) => {
    const { classes = 'w-20', onChange, options, value } = props;

    const normalizedOptions = Array.isArray(options)
        ? options.map((item) => ({ label: String(item), value: item }))
        : Object.entries(options).map(([key, val]) => ({ label: key, value: val.toString() as T }));

    return (
        <Listbox onChange={onChange} value={value}>
            {({ open }) => (
                <div className={classes}>
                    <ListboxButton className="w-full rounded-xs border border-slate-500 px-2 h-8 text-left relative cursor-pointer">
                        <div className="flex items-center">
                            {normalizedOptions
                                ?.filter((option) => value === option.value)
                                .map((option) => (
                                    <div className="flex items-center" key={String(option.value)}>
                                        <span className="text-slate-200">{option.label}</span>
                                    </div>
                                ))}
                        </div>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                            <SelectIcon />
                        </span>
                    </ListboxButton>

                    <Transition
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                        show={open}
                    >
                        <div className="relative z-99">
                            <ListboxOptions className="bg-slate-800 rounded-xs absolute w-full px-1 py-1 mt-2 border border-slate-600 flex flex-col gap-0.5">
                                {normalizedOptions.map((item) => (
                                    <ListboxOption
                                        className="cursor-pointer hover:bg-slate-900 rounded-xs gap-2"
                                        key={String(item.value)}
                                        value={item.value}
                                    >
                                        {({ selected }) => {
                                            return (
                                                <div
                                                    className={`${
                                                        selected ? 'bg-slate-900' : ''
                                                    } px-2 py-0.5 rounded-sm grow`}
                                                >
                                                    <div className="flex justify-between">
                                                        <span className={`block truncate relative`}>{item.label}</span>
                                                        {/* <span>{selected ? <CheckIcon /> : null}</span> */}
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    </ListboxOption>
                                ))}
                            </ListboxOptions>
                        </div>
                    </Transition>
                </div>
            )}
        </Listbox>
    );
};

export default CSSelect;
