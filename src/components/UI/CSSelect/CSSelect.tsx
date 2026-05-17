import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { useState } from 'react';

import styles from './CSSelect.module.css';

export type SelectProps<T = string> =
    | {
          options: Record<string, string> | T[];
          value: T | undefined;
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
    const { classes = '', onChange, options, value, multiple = false } = props;
    const [searchQuery, setSearchQuery] = useState('');

    const normalizedOptions = Array.isArray(options)
        ? options.map((item) => ({ label: String(item), value: item }))
        : Object.entries(options).map(([key, val]) => ({ label: key, value: val.toString() as T }));

    const showSearch = normalizedOptions.length > SHOW_SEARCH_LIMIT;
    const filteredOptions = showSearch
        ? normalizedOptions.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : normalizedOptions;

    const isEmpty = multiple ? Array.isArray(value) && value.length === 0 : value === undefined || value === null;

    const displayText = (() => {
        if (multiple && Array.isArray(value)) {
            if (value.length === 0) return 'SELECT…';
            if (value.length === 1) {
                const option = normalizedOptions.find((opt) => opt.value === value[0]);
                return option?.label ?? '';
            }
            return `${value.length} SEL`;
        }
        if (value === undefined || value === null) return 'SELECT…';
        const option = normalizedOptions.find((opt) => opt.value === value);
        return option?.label ?? 'SELECT…';
    })();

    return (
        <Listbox multiple={multiple} onChange={onChange as (value: T | T[]) => void} value={value}>
            {({ open }) => (
                <div className={`${styles.select} ${classes}`.trim()}>
                    <ListboxButton className={[styles.btn, open && styles.open].filter(Boolean).join(' ')}>
                        <span className={[styles.label, isEmpty && styles.empty].filter(Boolean).join(' ')}>
                            {displayText}
                        </span>
                        <span className={styles.caret}>▾</span>
                    </ListboxButton>

                    <Transition
                        afterLeave={() => setSearchQuery('')}
                        enter="transition ease-out dur-100"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="transition ease-in dur-75"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                        show={open}
                    >
                        <div className="relative z-99">
                            <ListboxOptions
                                anchor="bottom end"
                                className={`${styles.options} ${
                                    showSearch ? styles.hasSearch : styles.noSearch
                                } scroll`}
                            >
                                {showSearch && (
                                    <div className={styles.searchWrap}>
                                        <input
                                            className={styles.search}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="SEARCH…"
                                            type="text"
                                            value={searchQuery}
                                        />
                                    </div>
                                )}
                                {filteredOptions.map((item) => (
                                    <ListboxOption key={String(item.value)} value={item.value}>
                                        {({ selected, focus }) => (
                                            <div
                                                className={[
                                                    styles.option,
                                                    focus && styles.focus,
                                                    selected && styles.selected,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ')}
                                            >
                                                <span className={styles.check}>{selected ? '✓' : ''}</span>
                                                <span className="truncate">{item.label}</span>
                                            </div>
                                        )}
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
