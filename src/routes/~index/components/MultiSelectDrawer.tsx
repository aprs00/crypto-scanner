import { useState } from 'react';

import { XIcon, SelectIcon } from '@/components/Icons';
import CSDrawer from '@/components/UI/CSDrawer';

type OptionItemProps = {
    option: string;
    selected: boolean;
    disabled?: boolean;
    onToggle: () => void;
};

const OptionItem = ({ option, selected, disabled, onToggle }: OptionItemProps) => (
    <button
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xs text-left ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'}`}
        disabled={disabled}
        onClick={onToggle}
        type="button"
    >
        <input
            checked={selected}
            className={`w-4 h-4 ${disabled ? 'pointer-events-none' : 'cursor-pointer'} ${selected ? 'accent-blue-500' : ''}`}
            readOnly
            type="checkbox"
        />
        <span className={`truncate ${selected ? 'text-slate-200' : 'text-slate-400'}`}>{option}</span>
    </button>
);

const SectionLabel = ({ label }: { label: string }) => <div className="text-xs text-slate-500 px-2 pb-1">{label}</div>;

export type MultiSelectDrawerProps<T = string> = {
    options: T[];
    value: T[];
    classes?: string;
    defaultValue?: T[];
    maxSelected?: number;
    onChange: (value: T[]) => void;
    title: string;
};

const MultiSelectDrawer = <T extends string>(props: MultiSelectDrawerProps<T>) => {
    const { classes = 'w-32', defaultValue, maxSelected, onChange, options, value, title } = props;

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOptions = searchQuery
        ? options.filter((option) => String(option).toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    const selectedSet = new Set(value);
    const filteredSelected = filteredOptions.filter((opt) => selectedSet.has(opt));
    const filteredUnselected = filteredOptions.filter((opt) => !selectedSet.has(opt));
    const isAtMax = maxSelected !== undefined && value.length >= maxSelected;

    const handleToggle = (option: T) => {
        if (selectedSet.has(option)) {
            onChange(value.filter((v) => v !== option));
        } else {
            if (isAtMax) return;
            onChange([...value, option]);
        }
    };

    const handleSelectAll = () => {
        onChange([...value, ...filteredUnselected] as T[]);
    };

    const handleDeselectAll = () => {
        onChange(value.filter((v) => !filteredSelected.includes(v)));
    };

    const handleResetToDefaults = () => {
        if (!defaultValue) return;
        onChange([...defaultValue]);
    };

    const handleOpen = () => {
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const displayValue = (value.length === 0 && <span className="text-slate-400">Select...</span>) ||
        (value.length === 1 && <span className="text-slate-200 truncate">{value[0]}</span>) || (
            <span className="text-slate-200 truncate">{value.length} selected</span>
        );

    return (
        <>
            <button
                className={`${classes} rounded-xs border border-slate-500 px-2 h-8 text-left relative focus:outline-none`}
                onClick={handleOpen}
                type="button"
            >
                <div className="flex items-center pr-3.5">{displayValue}</div>
                <span className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                    <SelectIcon />
                </span>
            </button>

            <CSDrawer isOpen={isOpen} onClose={handleClose} title={title}>
                <div className="flex flex-col h-full">
                    {/* Fixed search bar */}
                    <div className="shrink-0 border-b border-slate-700 px-4 py-3">
                        <div className="relative">
                            <input
                                className="w-full px-3 py-2 pr-8 bg-slate-900 border border-slate-600 rounded-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                type="text"
                                value={searchQuery}
                            />
                            {searchQuery && (
                                <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                                    onClick={handleClearSearch}
                                    type="button"
                                >
                                    <XIcon className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Fixed action buttons */}
                    <div className="shrink-0 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                            {value.length}
                            {maxSelected ? `/${maxSelected}` : ` of ${options.length}`} selected
                            {isAtMax && <span className="text-amber-400 ml-1">(max)</span>}
                        </span>
                        <div className="flex gap-3">
                            {defaultValue && (
                                <button
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-150"
                                    onClick={handleResetToDefaults}
                                    type="button"
                                >
                                    Defaults
                                </button>
                            )}
                            {!maxSelected && (
                                <button
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-150"
                                    onClick={handleSelectAll}
                                    type="button"
                                >
                                    Select all
                                </button>
                            )}
                            <button
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-150"
                                onClick={handleDeselectAll}
                                type="button"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Scrollable options list */}
                    <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {filteredSelected.length > 0 && (
                            <div className="p-2">
                                <SectionLabel label="Selected" />
                                {filteredSelected.map((option) => (
                                    <OptionItem
                                        key={option}
                                        onToggle={() => handleToggle(option)}
                                        option={option}
                                        selected
                                    />
                                ))}
                            </div>
                        )}

                        {filteredSelected.length > 0 && filteredUnselected.length > 0 && (
                            <div className="border-t border-slate-700 mx-4" />
                        )}

                        {filteredUnselected.length > 0 && (
                            <div className="p-2">
                                <SectionLabel label="Available" />
                                {filteredUnselected.map((option) => (
                                    <OptionItem
                                        disabled={isAtMax}
                                        key={option}
                                        onToggle={() => handleToggle(option)}
                                        option={option}
                                        selected={false}
                                    />
                                ))}
                            </div>
                        )}

                        {filteredOptions.length === 0 && (
                            <div className="p-8 text-center text-slate-500">No matches found</div>
                        )}
                    </div>

                    {/* Fixed footer with Done button */}
                    <div className="shrink-0 px-4 py-3 border-t border-slate-700">
                        <button
                            className="w-full sm:w-auto sm:float-right px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xs transition-colors duration-150"
                            onClick={handleClose}
                            type="button"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </CSDrawer>
        </>
    );
};

export default MultiSelectDrawer;
