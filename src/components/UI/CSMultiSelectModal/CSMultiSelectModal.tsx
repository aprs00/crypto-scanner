import { Dialog, DialogBackdrop, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { useState } from 'react';

import { SelectIcon, XIcon } from '@/components/Icons';

type OptionsSectionProps<T> = {
    label: string;
    options: T[];
    isSelected: boolean;
    disabled?: boolean;
    onToggle: (option: T) => void;
};

const OptionsSection = <T extends string>({
    label,
    options,
    isSelected,
    disabled,
    onToggle,
}: OptionsSectionProps<T>) => (
    <div className="p-2">
        <div className="text-xs text-slate-500 px-2 pb-1">{label}</div>
        {options.map((option) => (
            <button
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xs text-left ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'}`}
                disabled={disabled}
                key={String(option)}
                onClick={() => onToggle(option)}
                type="button"
            >
                <input
                    checked={isSelected}
                    className={`w-4 h-4 ${disabled ? 'pointer-events-none' : 'cursor-pointer'} ${isSelected ? 'accent-blue-500' : ''}`}
                    readOnly
                    type="checkbox"
                />
                <span className={`truncate ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>{String(option)}</span>
            </button>
        ))}
    </div>
);

export type CSMultiSelectModalProps<T = string> = {
    options: T[];
    value: T[];
    classes?: string;
    defaultValue?: T[];
    maxSelected?: number;
    onChange: (value: T[]) => void;
    title: string;
};

const CSMultiSelectModal = <T extends string>(props: CSMultiSelectModalProps<T>) => {
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
        onChange([...defaultValue!]);
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
            {/* Trigger button */}
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

            {/* Modal */}
            <Transition appear show={isOpen}>
                <Dialog className="relative z-50" onClose={handleClose}>
                    <TransitionChild
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <DialogBackdrop className="fixed inset-0 bg-black/60" />
                    </TransitionChild>

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <TransitionChild
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-lg bg-slate-800 rounded-md border border-slate-600 shadow-xl flex flex-col h-[80vh]">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-600">
                                    <h3 className="text-lg font-medium text-slate-200">{title}</h3>
                                    <button
                                        className="text-slate-400 hover:text-slate-200 transition-colors duration-150"
                                        onClick={handleClose}
                                        type="button"
                                    >
                                        <XIcon className="size-5" />
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="px-4 py-3 border-b border-slate-600">
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

                                {/* Actions bar */}
                                <div className="px-4 py-2 border-b border-slate-600 flex items-center justify-between">
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

                                {/* Options list */}
                                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                                    <OptionsSection
                                        isSelected={true}
                                        label="Selected"
                                        onToggle={handleToggle}
                                        options={filteredSelected}
                                    />

                                    {/* Divider if both sections have items */}
                                    {filteredSelected.length > 0 && filteredUnselected.length > 0 && (
                                        <div className="border-t border-slate-700 mx-4" />
                                    )}

                                    <OptionsSection
                                        disabled={isAtMax}
                                        isSelected={false}
                                        label="Available"
                                        onToggle={handleToggle}
                                        options={filteredUnselected}
                                    />

                                    {/* Empty state */}
                                    {filteredOptions.length === 0 && (
                                        <div className="p-8 text-center text-slate-500">No matches found</div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-4 py-3 border-t border-slate-600 flex justify-end">
                                    <button
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xs transition-colors duration-150"
                                        onClick={handleClose}
                                        type="button"
                                    >
                                        Done
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};

export default CSMultiSelectModal;
