import {memo, useState} from 'react';

import Heatmap from '@/components/Heatmap';
import CustomSelect from '@/components/Select';

import {useBetaHeatmapData} from '../api';
import type {BetaHeatmapPropsType} from '../types';
import ChartContainer from './ChartContainer';

const BetaHeatmap = (props: BetaHeatmapPropsType) => {
    const {timeFrameOptions, tf} = props;

    const [selectedTf, setSelectedTf] = useState(tf);

    const betaHeatmap = useBetaHeatmapData(selectedTf);

    // const headerMemo = useMemo(
    //     () => (
    //         <>
    //             <h3 className="text-gray-300">Pearson correlation</h3>
    //             <div className="z-50">
    //                 <CustomSelect options={timeFrameOptions} value={selectedTf} onChange={setSelectedTf} />
    //             </div>
    //         </>
    //     ),
    //     [],
    // );

    // const bodyMemo = useMemo(
    //     () => <ReactEcharts option={option} style={{width: '100%', height: '92%'}}></ReactEcharts>,
    //     [],
    // );

    return (
        <>
            <ChartContainer
                header={
                    <>
                        <h3 className="text-gray-300">Pearson correlation</h3>
                        <div className="z-50">
                            <CustomSelect options={timeFrameOptions} value={selectedTf} onChange={setSelectedTf} />
                        </div>
                    </>
                }
                body={<Heatmap data={betaHeatmap} />}
            />
        </>
    );
};

export default memo(BetaHeatmap);
