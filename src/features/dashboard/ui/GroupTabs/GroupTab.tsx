import { type ChangeEvent, type KeyboardEvent, type MouseEvent, useRef, useState } from 'react';

import { XIcon } from '@/components/Icons';

import { DEFAULT_GROUP_ID, type DashboardGroup } from '../../model/panelTypes';
import styles from './GroupTabs.module.css';

interface GroupTabProps {
    group: DashboardGroup;
    isActive: boolean;
    onSelect: (groupId: string) => void;
    onRename: (groupId: string, name: string) => void;
    onDelete: (groupId: string) => void;
}

const GroupTab = (props: GroupTabProps) => {
    const { group, isActive, onSelect, onRename, onDelete } = props;
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(group.name);
    const inputRef = useRef<HTMLInputElement>(null);

    const isDefault = group.id === DEFAULT_GROUP_ID;

    const handleDoubleClick = () => {
        setEditValue(group.name);
        setIsEditing(true);
        setTimeout(() => inputRef.current?.select(), 0);
    };

    const finishEditing = () => {
        setIsEditing(false);
        if (editValue.trim() && editValue !== group.name) {
            onRename(group.id, editValue.trim());
        } else {
            setEditValue(group.name);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            finishEditing();
        } else if (e.key === 'Escape') {
            setEditValue(group.name);
            setIsEditing(false);
        }
    };

    const handleTabKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isEditing) {
                onSelect(group.id);
            }
        }
    };

    const handleSelect = () => {
        if (!isEditing) onSelect(group.id);
    };

    const handleEditValueChange = (event: ChangeEvent<HTMLInputElement>) => {
        setEditValue(event.target.value);
    };

    const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onDelete(group.id);
    };

    return (
        <div
            className={[styles.tab, isActive && styles.on].filter(Boolean).join(' ')}
            onClick={handleSelect}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleTabKeyDown}
            role="button"
            tabIndex={0}
        >
            {isEditing ? (
                <input
                    className={styles.input}
                    onBlur={finishEditing}
                    onChange={handleEditValueChange}
                    onKeyDown={handleKeyDown}
                    ref={inputRef}
                    type="text"
                    value={editValue}
                />
            ) : (
                <span>{group.name}</span>
            )}
            <span className={styles.count}>{group.panelIds.length}</span>
            {!isDefault && !isEditing && (
                <button className={styles.close} onClick={handleDelete} type="button">
                    <XIcon className="icon-sm" />
                </button>
            )}
        </div>
    );
};

export default GroupTab;
