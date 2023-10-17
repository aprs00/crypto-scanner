import {memo} from 'react';
import {Listbox, Transition} from '@headlessui/react';

import type {SelectPropsType} from './types';

import SelectIcon from './SelectIcon';

const CustomSelect = (props: SelectPropsType) => {
    const {options, value, onChange, classes = 'w-20'} = props;

    return (
        <Listbox value={value} onChange={onChange}>
            {({open}) => (
                <div className={`${classes}`}>
                    <div>
                        <Listbox.Button
                            className="w-full rounded-sm border border-slate-500 px-2 h-7 text-left relative"
                            // style={{boxShadow: 'inset 1px 1px 10px rgba(2, 6, 23, 0.7)'}}
                        >
                            <div className="flex items-center">
                                {options
                                    ?.filter((option) => value === option.value)
                                    .map((option) => (
                                        <div className="flex items-center" key={option.value.toString()}>
                                            <span className="text-slate-100">{option.label}</span>
                                        </div>
                                    ))}
                            </div>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                                <SelectIcon />
                            </span>
                        </Listbox.Button>
                    </div>
                    <Transition
                        show={open}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <div className="relative">
                            <Listbox.Options className="bg-slate-800 rounded-sm absolute w-full px-1 py-1 mt-2 border border-slate-600 flex flex-col gap-0.5">
                                {options.map((item) => (
                                    <Listbox.Option
                                        key={item.value.toString()}
                                        value={item.value}
                                        className="cursor-pointer hover:bg-slate-900 rounded-sm gap-2"
                                    >
                                        {({selected}) => {
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
                                    </Listbox.Option>
                                ))}
                            </Listbox.Options>
                        </div>
                    </Transition>
                </div>
            )}
        </Listbox>
    );
};

export default memo(CustomSelect);
