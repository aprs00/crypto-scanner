const ResetIcon = ({ className = '' }: { className?: string }) => (
    <svg className={className || 'icon-md'} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default ResetIcon;
