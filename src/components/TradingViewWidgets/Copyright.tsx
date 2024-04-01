import React from 'react';

import type {CopyrightStyles} from './types';

export type CopyrightProps = {
    copyrightStyles?: CopyrightStyles;
    href?: string;
    spanText?: string;
    text?: string;
    children?: never;
};

const Copyright: React.FC<CopyrightProps> = ({copyrightStyles, href, spanText, text = 'By TradingView'}) => {
    const defaultStyles: CopyrightStyles = {
        link: {
            color: '#9db2bd',
            textDecoration: 'none',
        },
        parent: {
            color: '#9db2bd',
            fontFamily: 'Trebuchet MS, Arial, sans-serif',
            fontSize: '13px',
            lineHeight: '32px',
            textAlign: 'center',
            verticalAlign: 'center',
        },
        span: {
            color: '#2962FF',
        },
    };

    return (
        <div style={Object.assign({}, defaultStyles.parent, copyrightStyles?.parent)}>
            <a
                href={href}
                rel="noreferrer"
                style={Object.assign({}, defaultStyles.link, copyrightStyles?.link)}
                target="_blank"
            >
                <span style={Object.assign({}, defaultStyles.span, copyrightStyles?.span)}>{spanText} </span>
            </a>
            {text}
        </div>
    );
};

export default Copyright;
