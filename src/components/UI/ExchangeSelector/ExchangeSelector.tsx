import CSSelect from '@/components/UI/CSSelect';
import { Exchange } from '@/routes/~index/types';

export type ExchangeSelectorProps = {
    value: Exchange;
    onChange: (exchange: Exchange) => void;
};

const exchangeOptions: Record<string, string> = {
    Binance: Exchange.Binance,
    Hyperliquid: Exchange.Hyperliquid,
};

const ExchangeSelector = ({ value, onChange }: ExchangeSelectorProps) => {
    return <CSSelect<Exchange> classes="w-32" onChange={onChange} options={exchangeOptions} value={value} />;
};

export default ExchangeSelector;
