import { KeyboardEvent, useRef, useState } from 'react';

import { type ChartGroup } from '@/routes/~index/types';

import GroupTab from './GroupTab';

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
        <div className="relative flex items-end gap-1 overflow-x-auto border-b border-slate-700">
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
            {isCreating ? (
                <div className="flex items-center gap-1.5 px-3 py-2 text-slate-200">
                    <input
                        className="bg-transparent border-none outline-none w-24 min-w-0 text-sm"
                        onBlur={handleCreateBlur}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        placeholder="Group name"
                        ref={inputRef}
                        type="text"
                        value={newGroupName}
                    />
                </div>
            ) : (
                <button
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-400 border-b-2 border-transparent hover:text-slate-200 hover:border-slate-600 transition-colors whitespace-nowrap"
                    onClick={handleCreateClick}
                    type="button"
                >
                    <span>+</span>
                    <span>New Group</span>
                </button>
            )}
        </div>
    );
};

export default GroupTabs;
