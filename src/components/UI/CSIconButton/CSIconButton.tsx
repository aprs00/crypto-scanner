const IconButton = (props: { onClick: () => void; label: string }) => {
    return (
        <button className="btn square" onClick={props.onClick} type="button">
            {props.label}
        </button>
    );
};

export default IconButton;
