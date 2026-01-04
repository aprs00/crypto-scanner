import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { useState } from 'react';

import { SelectIcon } from '@/components/Icons';

export type SelectProps<T = string> =
    | {
          options: Record<string, string> | T[];
          value: T;
          classes?: string;
          onChange: (value: T) => void;
          multiple?: false;
      }
    | {
          options: Record<string, string> | T[];
          value: T[];
          classes?: string;
          onChange: (value: T[]) => void;
          multiple: true;
      };

const SHOW_SEARCH_LIMIT = 16;

const CSSelect = <T = string,>(props: SelectProps<T>) => {
    const { classes = 'w-20', onChange, options, value, multiple = false } = props;
    const [searchQuery, setSearchQuery] = useState('');

    const normalizedOptions = Array.isArray(options)
        ? options.map((item) => ({ label: String(item), value: item }))
        : Object.entries(options).map(([key, val]) => ({ label: key, value: val.toString() as T }));

    const showSearch = normalizedOptions.length > SHOW_SEARCH_LIMIT;
    const filteredOptions = showSearch
        ? normalizedOptions.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : normalizedOptions;

    const displayValue = () => {
        if (multiple && Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="text-slate-400">Select...</span>;
            }
            if (value.length === 1) {
                const option = normalizedOptions.find((opt) => opt.value === value[0]);
                return <span className="text-slate-200 truncate">{option?.label}</span>;
            }
            return <span className="text-slate-200 truncate">{value.length} selected</span>;
        } else {
            const option = normalizedOptions.find((opt) => opt.value === value);
            return <span className="text-slate-200 truncate">{option?.label}</span>;
        }
    };

    return (
        <Listbox multiple={multiple} onChange={onChange as (value: T | T[]) => void} value={value}>
            {({ open }) => (
                <div className={classes}>
                    <ListboxButton className="w-full rounded-xs border border-slate-500 px-2 h-8 text-left relative focus:outline-none">
                        <div className="flex items-center pr-3.5">{displayValue()}</div>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                            <SelectIcon />
                        </span>
                    </ListboxButton>

                    <Transition
                        afterLeave={() => setSearchQuery('')}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                        show={open}
                    >
                        <div className="relative z-99">
                            <ListboxOptions
                                className={`bg-slate-800 rounded-xs absolute right-0 w-fit min-w-full px-1 mt-2 border border-slate-600 flex flex-col gap-0.5 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full focus:outline-none ${showSearch ? 'py-0' : 'py-1'}`}
                            >
                                {showSearch && (
                                    <div className="px-1 pb-1 pt-1 sticky top-0 bg-slate-800 z-10 -mx-1 -mt-1 mb-0.5">
                                        <input
                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search..."
                                            type="text"
                                            value={searchQuery}
                                        />
                                    </div>
                                )}
                                {filteredOptions.map((item) => (
                                    <ListboxOption
                                        className="cursor-pointer hover:bg-slate-900 rounded-xs gap-2"
                                        key={String(item.value)}
                                        value={item.value}
                                    >
                                        {({ selected }) => {
                                            const optionClass = `${selected ? 'bg-slate-900' : ''} px-2 py-0.5 rounded-sm grow`;

                                            return (
                                                <div className={optionClass}>
                                                    <div className="flex justify-between items-center">
                                                        {multiple && (
                                                            <input
                                                                checked={selected}
                                                                className="mr-2 cursor-pointer"
                                                                readOnly
                                                                type="checkbox"
                                                            />
                                                        )}
                                                        <span className={`block truncate relative`}>{item.label}</span>
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
