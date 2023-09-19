// import {useState} from 'react';
import {Link} from '@tanstack/react-router';

// import CustomSelect from '../Select';

// import {useFetchTickersOptions} from './api';

const Navigation = () => {
    // const tickersOptions = useFetchTickersOptions();

    // const [selectedTicker, setSelectedTicker] = useState('BTCUSDT');

    return (
        <div className="flex items-center justify-between py-3 mx-3">
            <div className="flex gap-3 text-lg">
                <Link
                    to="/"
                    activeProps={{
                        className: 'font-bold',
                    }}
                >
                    Chart
                </Link>
                <Link
                    to="/stats"
                    activeProps={{
                        className: 'font-bold',
                    }}
                >
                    Stats
                </Link>
                <Link
                    to="/heatmap"
                    activeProps={{
                        className: 'font-bold',
                    }}
                >
                    Heatmap
                </Link>
            </div>
            {/* <div className="z-50">
                <CustomSelect
                    options={tickersOptions?.data || []}
                    value={selectedTicker}
                    onChange={setSelectedTicker}
                    classes="w-32"
                />
            </div> */}
        </div>
    );
};

export default Navigation;
