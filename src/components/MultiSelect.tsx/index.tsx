import {memo, useState} from 'react';
import {Listbox, Transition} from '@headlessui/react';

import XIcon from './XIcon';
import type {MultiSelectPropsType} from './types';

const MultiSelect = (props: MultiSelectPropsType) => {
    const {options, values = [], onChange = () => {}, label} = props;

    console.log(options);

    // const [parsedOptions, setParsedOptions] = useState<OptionsObjectType[]>();

    // ["avg", "sum", "std_p", "std_s", "var_p", "var_s", "twa"]
    // ["30s", "1m", "5m", "15m"]

    // v_var_p_5m

    // if (Array.isArray(options)) {
    //     const parsedOptions = options.map((option) => ({
    //         label: option,
    //         value: option,
    //     }));

    //     setParsedOptions(parsedOptions as OptionsObjectType[]);
    // } else setParsedOptions(options);

    return (
        <Listbox value={values} onChange={onChange} multiple>
            {({open}) => (
                <div>
                    <div>
                        {!!label?.length && <p className="text-lg">{label}</p>}
                        <Listbox.Button className="w-full rounded-sm border border-slate-500 px-2 min-h-[28px] h-auto text-left relative">
                            <div className="flex items-center flex-wrap mr-5">
                                {options
                                    ?.filter((option) => values.includes(option.value))
                                    .map((option) => (
                                        <div className="flex items-center gap-1" key={option.value}>
                                            <span className="text-slate-200">{option.label}</span>
                                            <span
                                                className="mr-2 hover:scale-125 self-center"
                                                onClick={() => {
                                                    onChange((prev) => prev.filter((id) => id !== option.value));
                                                }}
                                            >
                                                <XIcon />
                                            </span>
                                        </div>
                                    ))}
                            </div>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <svg
                                    className="h-5 w-5 text-gray-400"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path
                                        d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
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
                            <Listbox.Options className="bg-slate-900 rounded-md absolute w-full px-1 py-1 mt-2">
                                {options?.map((item) => (
                                    <Listbox.Option
                                        key={item.value}
                                        value={item.value}
                                        className="cursor-pointer hover:bg-slate-800 px-4 py-1 rounded-sm"
                                    >
                                        {({selected}) => (
                                            <div className="flex items-center">
                                                {selected}
                                                <span
                                                    className={`${
                                                        selected ? 'font-semibold' : 'font-normal'
                                                    } block truncate`}
                                                >
                                                    {item.label}
                                                </span>
                                                {selected && (
                                                    <span className="text-slate-200 ml-3">
                                                        <svg
                                                            className="h-5 w-5"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                        )}
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

export default memo(MultiSelect);
