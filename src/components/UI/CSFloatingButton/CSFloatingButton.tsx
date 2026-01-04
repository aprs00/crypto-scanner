interface CSFloatingButtonProps {
    label: string;
    onClick: () => void;
}

const CSFloatingButton = (props: CSFloatingButtonProps) => {
    const { label, onClick } = props;

    return (
        <button
            className="fixed bottom-6 right-6 size-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110 z-40"
            onClick={onClick}
            type="button"
        >
            {label}
        </button>
    );
};

export default CSFloatingButton;
