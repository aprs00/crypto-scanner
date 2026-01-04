const XIcon = ({ className = 'text-gray-400' }: { className?: string }) => (
    <svg className={`text-gray-400 ${className}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default XIcon;
