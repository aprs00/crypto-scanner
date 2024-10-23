export type XIconPropsType = {
    width?: number;
    height?: number;
};

const XIcon = (props: XIconPropsType) => {
    const {height = 14, width = 14} = props;

    return (
        <span>
            <svg
                className="text-gray-400"
                fill="none"
                height={height}
                stroke="currentColor"
                viewBox="0 0 20 20"
                width={width}
            >
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
        </span>
    );
};

export default XIcon;
