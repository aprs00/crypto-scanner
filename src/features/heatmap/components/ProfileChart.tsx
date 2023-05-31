import React from 'react';
import Plotly from 'plotly.js-dist';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

const TPOChart = ({data}) => {
    // Prepare the data for the TPO chart
    const x = data.map((item) => item.time);
    const y = data.map((item) => item.price);
    const z = data.map((item) => item.volume);

    // Set up the layout for the TPO chart
    const layout = {
        title: 'TPO Chart',
        scene: {
            xaxis: {title: 'Time'},
            yaxis: {title: 'Price'},
            zaxis: {title: 'Volume'},
        },
    };

    return <Plot data={[{x, y, z, type: 'bar'}]} layout={layout} />;
};

export default TPOChart;
