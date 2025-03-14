import {Listbox, ListboxButton, Transition} from '@headlessui/react';
import {Dispatch, SetStateAction} from 'react';

import XIcon from './XIcon';

export type MultiSelectProps = {
    options: {
        value: string;
        label: string;
    }[];
    values: string[];
    onChange: Dispatch<SetStateAction<string[]>>;
    label?: string;
};

const MultiSelect = (props: MultiSelectProps) => {
    const {label, onChange = () => {}, options, values = []} = props;

    return (
        <Listbox multiple onChange={onChange} value={values}>
            {({open}) => (
                <>
                    <div>
                        {!!label?.length && <p className="text-lg">{label}</p>}
                        <ListboxButton className="w-full rounded-xs border border-slate-500 px-2 min-h-[28px] h-auto text-left relative">
                            <div className="flex items-center flex-wrap mr-5">
                                {options
                                    ?.filter((option) => values.includes(option.value))
                                    .map((option) => (
                                        <div className="flex items-center gap-1" key={option.value}>
                                            <span className="text-slate-200">{option.label}</span>
                                            <button
                                                className="mr-2 hover:scale-125 self-center"
                                                onClick={() => {
                                                    onChange((prev) => prev.filter((id) => id !== option.value));
                                                }}
                                            >
                                                <XIcon />
                                            </button>
                                        </div>
                                    ))}
                            </div>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <svg
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.5"
                                    />
                                </svg>
                            </span>
                        </ListboxButton>
                    </div>
                    <Transition
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                        show={open}
                    >
                        <div className="relative">
                            <Listbox.Options className="bg-slate-900 rounded-md absolute w-full px-1 py-1 mt-2">
                                {options?.map((item) => (
                                    <Listbox.Option
                                        className="cursor-pointer hover:bg-slate-800 px-4 py-1 rounded-xs"
                                        key={item.value}
                                        value={item.value}
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
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                clipRule="evenodd"
                                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                fillRule="evenodd"
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
                </>
            )}
        </Listbox>
    );
};

export default MultiSelect;
