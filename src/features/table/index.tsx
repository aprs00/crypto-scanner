import {useEffect, useRef, useMemo} from 'react';
import * as echarts from 'echarts';
import type {EChartsOption} from 'echarts';

import {useStreamTable} from './api';

const Table = () => {
    const table = useStreamTable();

    console.log(table);

    return (
        <div>
            <h1>TABLE COMING SOON</h1>
        </div>
    );
};

export default Table;
