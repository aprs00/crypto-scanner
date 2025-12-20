type XIconProps = {
    width?: number;
    height?: number;
    className?: string;
};

const XIcon = ({ height = 14, width = 14, className = 'text-gray-400' }: XIconProps) => (
    <svg
        className={className}
        fill="none"
        height={height}
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        width={width}
    >
        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default XIcon;
