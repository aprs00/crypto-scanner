import { KeyboardEvent, useRef, useState } from 'react';

import { XIcon } from '@/components/Icons';
import { DEFAULT_GROUP_ID, type ChartGroup } from '@/routes/~index/types';

interface GroupTabProps {
    group: ChartGroup;
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

    return (
        <div
            className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors cursor-pointer select-none whitespace-nowrap border-b-2 outline-none ${
                isActive
                    ? 'text-blue-400 border-blue-400'
                    : 'text-slate-300 border-transparent hover:text-slate-100 hover:border-slate-600 focus-visible:border-slate-600'
            }`}
            onClick={() => !isEditing && onSelect(group.id)}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleTabKeyDown}
            role="button"
            style={{ scrollSnapAlign: 'none' }}
            tabIndex={0}
        >
            {isEditing ? (
                <input
                    className="bg-transparent border-none outline-none w-20 min-w-0 text-inherit"
                    onBlur={finishEditing}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    ref={inputRef}
                    type="text"
                    value={editValue}
                />
            ) : (
                <span>{group.name}</span>
            )}
            {!isDefault && !isEditing && (
                <button
                    className="p-0.5 rounded hover:bg-slate-500/30 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(group.id);
                    }}
                    type="button"
                >
                    <XIcon className="size-3.5" />
                </button>
            )}
            <span className="text-xs opacity-60">({group.chartIds.length})</span>
        </div>
    );
};

export default GroupTab;
