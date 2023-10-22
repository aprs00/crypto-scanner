import {Fragment} from 'react';

import Toggle from '@/components/Toggle';
import Disclosure from '@/components/Disclosure';

import type {FiltersPropsType} from '../types';

function Filters(props: FiltersPropsType) {
    const {
        dataTypes,
        timeFrameOptions,
        aggregationOptions,
        formattedAggregationOptions,
        isAggregationSelected,
        toggleSwitch,
    } = props;

    return (
        <div className="mb-8">
            {dataTypes.map((dataType) => (
                <span key={dataType.label} className="mr-4">
                    <Disclosure title={dataType.label}>
                        <section className="flex flex-col gap-5 mt-5 text-slate-200 mr-10">
                            {timeFrameOptions.map((timeFrame) => (
                                <Fragment key={`${timeFrame}_${dataType.label}`}>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-lg leading-none">{timeFrame}</h2>
                                        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
                                            {aggregationOptions.map((aggregation) => (
                                                <Toggle
                                                    key={`${aggregation}_${timeFrame}_${dataType.label}`}
                                                    label={formattedAggregationOptions[aggregation]}
                                                    enabled={isAggregationSelected(
                                                        `${dataType.value}_${aggregation}_${timeFrame}`,
                                                    )}
                                                    setEnabled={() =>
                                                        toggleSwitch(`${dataType.value}_${aggregation}_${timeFrame}`)
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-gray-700 h-0.5 rounded-lg" />
                                </Fragment>
                            ))}
                        </section>
                    </Disclosure>
                </span>
            ))}
        </div>
    );
}

export default Filters;
