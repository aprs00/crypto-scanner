import styles from './CSFloatingButton.module.css';

interface CSFloatingButtonProps {
    ariaLabel: string;
    label: string;
    onClick: () => void;
}

const CSFloatingButton = (props: CSFloatingButtonProps) => {
    const { ariaLabel, label, onClick } = props;

    return (
        <button aria-label={ariaLabel} className={styles.fab} onClick={onClick} title={ariaLabel} type="button">
            {label}
        </button>
    );
};

export default CSFloatingButton;
