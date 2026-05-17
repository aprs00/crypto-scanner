import { useState } from 'react';

import { XIcon } from '@/components/Icons';
import CSDrawer from '@/components/UI/CSDrawer';
import selectStyles from '@/components/UI/CSSelect/CSSelect.module.css';

import styles from './MultiSelectDrawer.module.css';

type OptionItemProps = {
    option: string;
    selected: boolean;
    disabled?: boolean;
    onToggle: () => void;
};

const OptionItem = ({ option, selected, disabled, onToggle }: OptionItemProps) => (
    <button
        className={[selectStyles.option, selected && selectStyles.selected, disabled && selectStyles.disabled]
            .filter(Boolean)
            .join(' ')}
        disabled={disabled}
        onClick={onToggle}
        type="button"
    >
        <span className={selectStyles.check}>{selected ? '✓' : ''}</span>
        <span className="truncate">{option}</span>
    </button>
);

const SectionLabel = ({ label }: { label: string }) => <div className={styles.section}>{label}</div>;

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
    const { classes = '', defaultValue, maxSelected, onChange, options, value, title } = props;

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

    const handleOpen = () => setIsOpen(true);

    const handleClose = () => {
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClearSearch = () => setSearchQuery('');

    const isEmpty = value.length === 0;
    const buttonLabel = isEmpty ? 'SELECT…' : value.length === 1 ? String(value[0]) : `${value.length} SEL`;

    return (
        <>
            <div className={`${selectStyles.select} ${classes}`.trim()}>
                <button className={selectStyles.btn} onClick={handleOpen} type="button">
                    <span className={[selectStyles.label, isEmpty && selectStyles.empty].filter(Boolean).join(' ')}>
                        {buttonLabel}
                    </span>
                    <span className={selectStyles.caret}>▾</span>
                </button>
            </div>

            <CSDrawer isOpen={isOpen} onClose={handleClose} title={title}>
                <div className={styles.root}>
                    <div className={styles.searchWrap}>
                        <input
                            className={selectStyles.search}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="SEARCH…"
                            type="text"
                            value={searchQuery}
                        />
                        {searchQuery && (
                            <button className={styles.clear} onClick={handleClearSearch} type="button">
                                <XIcon className="icon-md" />
                            </button>
                        )}
                    </div>

                    <div className={styles.actions}>
                        <span className={styles.count}>
                            <span className="num">{value.length}</span>
                            <span className="dim">{maxSelected ? `/${maxSelected}` : ` / ${options.length}`}</span>
                            {isAtMax && <span className="ac"> · MAX</span>}
                        </span>
                        <div className={styles.actionButtons}>
                            {defaultValue && (
                                <button className="btn" onClick={handleResetToDefaults} type="button">
                                    Defaults
                                </button>
                            )}
                            {!maxSelected && (
                                <button className="btn" onClick={handleSelectAll} type="button">
                                    Select all
                                </button>
                            )}
                            <button className="btn" onClick={handleDeselectAll} type="button">
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className={`${styles.list} scroll`} data-drag-scroll>
                        {filteredSelected.length > 0 && (
                            <div className={styles.group}>
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

                        {filteredUnselected.length > 0 && (
                            <div className={styles.group}>
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

                        {filteredOptions.length === 0 && <div className={styles.empty}>No matches found</div>}
                    </div>

                    <div className={styles.foot}>
                        <button className="btn primary" onClick={handleClose} type="button">
                            Done
                        </button>
                    </div>
                </div>
            </CSDrawer>
        </>
    );
};

export default MultiSelectDrawer;
