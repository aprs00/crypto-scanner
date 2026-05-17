import styles from './CSFloatingButton.module.css';

interface CSFloatingButtonProps {
    label: string;
    onClick: () => void;
}

const CSFloatingButton = (props: CSFloatingButtonProps) => {
    const { label, onClick } = props;

    return (
        <button className={styles.fab} onClick={onClick} type="button">
            {label}
        </button>
    );
};

export default CSFloatingButton;
