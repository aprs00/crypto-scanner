import {memo} from 'react';

import type {OrderBookFiltersPropsType} from '../types';

const OrderBookFilters = (props: OrderBookFiltersPropsType) => {
    const {groupByVal, setGroupByVal} = props;

    return (
        <div className="flex space-x-4">
            {/* <div>
                <label htmlFor="num_of_rows" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Number of rows
                </label>
                <input
                    type="number"
                    id="num_of_rows"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg mb-10 focus:ring-blue-500 focus:border-blue-500 block p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 w-32"
                    value={numOfOrderBookRows}
                    onChange={(e) => setNumOfOrderBookRows(Number(e.target.value))}
                    placeholder="Number of rows"
                />
            </div> */}
            <div>
                <label htmlFor="num_of_rows" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Group By
                </label>
                <input
                    type="number"
                    id="num_of_rows"
                    className=" border border-gray-300 text-sm rounded-lg mb-10 block p-1.5 dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-900 dark:focus:border-blue-900 w-32"
                    value={groupByVal}
                    onChange={(e) => setGroupByVal(Number(e.target.value))}
                    placeholder="Group by"
                />
            </div>
        </div>
    );
};

export default memo(OrderBookFilters);
