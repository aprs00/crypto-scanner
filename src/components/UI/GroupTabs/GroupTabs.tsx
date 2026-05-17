import { KeyboardEvent, useRef, useState } from 'react';

import { type ChartGroup } from '@/routes/~index/types';

import GroupTab from './GroupTab';
import styles from './GroupTabs.module.css';

interface GroupTabsProps {
    groups: ChartGroup[];
    activeGroupId: string;
    onSelectGroup: (groupId: string) => void;
    onCreateGroup: (name: string) => void;
    onRenameGroup: (groupId: string, name: string) => void;
    onDeleteGroup: (groupId: string) => void;
}

const GroupTabs = (props: GroupTabsProps) => {
    const { groups, activeGroupId, onSelectGroup, onCreateGroup, onRenameGroup, onDeleteGroup } = props;
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleCreateClick = () => {
        setIsCreating(true);
        setNewGroupName('');
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleCreateBlur = () => {
        setIsCreating(false);
        if (newGroupName.trim()) {
            onCreateGroup(newGroupName.trim());
        }
        setNewGroupName('');
    };

    const handleCreateKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'Enter':
                handleCreateBlur();
                break;

            case 'Escape':
                setIsCreating(false);
                setNewGroupName('');
                break;
        }
    };

    return (
        <div className={styles.tabs}>
            {groups.map((group) => (
                <GroupTab
                    group={group}
                    isActive={group.id === activeGroupId}
                    key={group.id}
                    onDelete={onDeleteGroup}
                    onRename={onRenameGroup}
                    onSelect={onSelectGroup}
                />
            ))}
            {(isCreating && (
                <div className={styles.tab}>
                    <input
                        className={`${styles.input} ac`}
                        onBlur={handleCreateBlur}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        placeholder="GROUP"
                        ref={inputRef}
                        type="text"
                        value={newGroupName}
                    />
                </div>
            )) || (
                <button className={styles.add} onClick={handleCreateClick} type="button">
                    <span>+ NEW GROUP</span>
                </button>
            )}
        </div>
    );
};

export default GroupTabs;
