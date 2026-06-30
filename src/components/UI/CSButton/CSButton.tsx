import type { ReactNode } from 'react';

import { Link } from '@tanstack/react-router';

import styles from './CSButton.module.css';

export const CSButtonVariant = {
    Default: 'default',
    Primary: 'primary',
} as const;

export type CSButtonVariant = (typeof CSButtonVariant)[keyof typeof CSButtonVariant];

export const CSButtonAs = {
    Button: 'button',
    Link: 'link',
} as const;

export type CSButtonAs = (typeof CSButtonAs)[keyof typeof CSButtonAs];

type CSButtonBaseProps = {
    children: ReactNode;
    variant?: CSButtonVariant;
    square?: boolean;
    className?: string;
};

type CSButtonProps =
    | (CSButtonBaseProps & { as?: typeof CSButtonAs.Button; onClick?: () => void; type?: 'button' | 'submit' })
    | (CSButtonBaseProps & { as: typeof CSButtonAs.Link; to: string });

const CSButton = (props: CSButtonProps) => {
    const { children, variant = CSButtonVariant.Default, square = false, className = '' } = props;

    const classes = [
        styles.btn,
        variant === CSButtonVariant.Primary && styles.primary,
        square && styles.square,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    if (props.as === CSButtonAs.Link) {
        return (
            <Link className={classes} to={props.to}>
                {children}
            </Link>
        );
    }

    return (
        <button className={classes} onClick={props.onClick} type={props.type ?? 'button'}>
            {children}
        </button>
    );
};

export default CSButton;
