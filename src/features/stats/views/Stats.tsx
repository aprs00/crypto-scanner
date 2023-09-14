import BetaHeatmap from '../components/BetaHeatmap';
import PriceChangePerDayOfWeek from '../components/PriceChangePerDayOfWeek';

import {useStatsSelectOptions} from '../api';

const Beta = () => {
    const statsSelectOptions = useStatsSelectOptions();
    console.log(statsSelectOptions);
    return (
        <div className="grid grid-cols-1 md:grid-cols-2">
            <BetaHeatmap />
            <PriceChangePerDayOfWeek tf="2w" />
            <PriceChangePerDayOfWeek tf="1m" />
            <PriceChangePerDayOfWeek tf="6m" />
        </div>
    );
};

export default Beta;
