import type {XIconPropsType} from './types';

const XIcon = (props: XIconPropsType) => {
    const {width = 14, height = 14} = props;
    return (
        <span className="">
            <svg
                className="text-gray-400"
                viewBox="0 0 20 20"
                height={height}
                width={width}
                fill="none"
                stroke="currentColor"
            >
                <path d="M6 18L18 6M6 6l12 12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    );
};

export default XIcon;
