import CSSelect from '@/components/UI/CSSelect';

import type { ExchangeInfo } from '../types';

type ExchangeSelectorProps = {
    value: string;
    onChange: (exchange: string) => void;
    exchanges: ExchangeInfo[];
};

const ExchangeSelector = ({ value, onChange, exchanges }: ExchangeSelectorProps) => {
    const exchangeOptions: Record<string, string> = Object.fromEntries(exchanges.map((e) => [e.name, e.id]));

    return (
        <CSSelect<string>
            ariaLabel="Exchange"
            classes="w-32"
            onChange={onChange}
            options={exchangeOptions}
            value={value}
        />
    );
};

export default ExchangeSelector;
