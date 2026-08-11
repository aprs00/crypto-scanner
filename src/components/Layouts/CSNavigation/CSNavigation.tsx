import type { ParsedLocation } from '@tanstack/react-router';

import { Link, useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import type { TopBarPrice } from '@/hooks/useTopBarTicker';

import { headerLinks } from '@/config/links';
import useTopBarTicker from '@/hooks/useTopBarTicker';
import { formatUSD } from '@/utils/number';

import styles from './CSNavigation.module.css';

const selectPathname = (loc: ParsedLocation) => loc.pathname;

const formatClock = (d: Date) =>
    `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(
        d.getUTCSeconds(),
    ).padStart(2, '0')} UTC`;

const initialClock = '--:--:-- UTC';

const PriceCell = ({ label, data }: { label: string; data?: TopBarPrice }) => {
    const isUp = (data?.changePercent ?? 0) >= 0;
    return (
        <span>
            <span className="dim">{label}</span>{' '}
            <span className={`num ${styles.value}`}>{data ? formatUSD(data.price) : '— —'}</span>{' '}
            <span className={`num ${isUp ? 'up' : 'down'}`}>
                {data ? `${isUp ? '+' : ''}${data.changePercent.toFixed(2)}%` : '—'}
            </span>
        </span>
    );
};

const CSNavigation = () => {
    const path = useLocation({ select: selectPathname });
    const [clock, setClock] = useState(initialClock);
    const ticker = useTopBarTicker();

    useEffect(() => {
        const updateClock = () => setClock(formatClock(new Date()));
        updateClock();
        const id = window.setInterval(updateClock, 1000);
        return () => window.clearInterval(id);
    }, []);

    return (
        <div className={styles.bar}>
            <div className={styles.tabs}>
                {headerLinks.map((link) => {
                    const isOn = link.path === '/' ? path === '/' : path.startsWith(link.path);
                    return (
                        <Link
                            className={[styles.tab, isOn && styles.on].filter(Boolean).join(' ')}
                            key={link.path}
                            to={link.path}
                        >
                            {link.label.toUpperCase()}
                        </Link>
                    );
                })}
            </div>
            <div className={styles.right}>
                <PriceCell data={ticker.btc} label="BTC" />
                <span>
                    <span className="dim">FEAR/GREED</span>{' '}
                    <span className={`num ${styles.value}`}>{ticker.fearGreed ? ticker.fearGreed.value : '—'}</span>
                </span>
                <span className="num">
                    {clock}
                    <span className="blink"> ▮</span>
                </span>
            </div>
        </div>
    );
};

export default CSNavigation;
