import BetaHeatmap from '../components/BetaHeatmap';
import PriceChangePerDayOfWeek from '../components/PriceChangePerDayOfWeek';

const Beta = () => {
    return (
        <>
            <BetaHeatmap />
            <div className="my-10"></div>
            <PriceChangePerDayOfWeek />
        </>
    );
};

export default Beta;
