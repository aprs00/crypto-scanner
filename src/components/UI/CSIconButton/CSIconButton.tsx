const IconButton = (props: { onClick: () => void; label: string }) => {
    return (
        <button
            className="text-white border border-slate-500 rounded-sm px-2 font-bold hover:bg-slate-700 size-8"
            onClick={props.onClick}
        >
            {props.label}
        </button>
    );
};

export default IconButton;
