import {Fragment, memo, useCallback, useMemo} from 'react';

import Toggle from '@/components/Toggle';
import Disclosure from '@/components/Disclosure';

import type {FiltersPropsType} from '../types';

const Filters = (props: FiltersPropsType) => {
    const {dataTypes, timeFrameOptions, aggregationOptions, selectedAggregations, setSelectedAggregations} = props;

    const isAggregationSelected = useCallback(
        (aggregation: string) => selectedAggregations.includes(aggregation),
        [selectedAggregations],
    );

    const toggleSwitch = useCallback(
        (aggregation: string) => {
            const isSelected = selectedAggregations.includes(aggregation);

            isSelected
                ? setSelectedAggregations(selectedAggregations.filter((agg: string) => agg !== aggregation))
                : setSelectedAggregations([...selectedAggregations, aggregation]);
        },
        [selectedAggregations],
    );

    const formatAggregationOption = useCallback((aggregation: string) => {
        const parsed = aggregation
            .split('_')
            .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
            .join(' ');

        return parsed;
    }, []);

    const formattedAggregationOptions = useMemo(
        () =>
            aggregationOptions.reduce((acc, curr) => {
                const parsed = formatAggregationOption(curr);
                acc[curr] = parsed;
                return acc;
            }, {} as Record<string, string>),
        [],
    );

    return (
        <div className="mb-8">
            {dataTypes.map((dataType) => (
                <span key={dataType.label} className="mr-4">
                    <Disclosure title={dataType.label}>
                        <section className="flex flex-col gap-5 mt-5 text-slate-200 max-w-4xl">
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
};

export default memo(Filters);
