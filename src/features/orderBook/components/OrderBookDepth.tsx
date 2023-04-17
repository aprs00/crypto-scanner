import React, {useEffect, useRef} from 'react';
import * as d3 from 'd3';

const DepthChart = (props) => {
    const svgRef = useRef(null);
    const {groupedAsks, groupedBids} = props;
    const consolidatedData = [...groupedAsks, ...groupedBids];

    useEffect(() => {
        const svg = d3.select(svgRef.current);

        // Define dimensions and margins
        const width = 600;
        const height = 400;
        const margin = {top: 20, right: 20, bottom: 50, left: 50};
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Set up scales
        const maxQuantity = d3.max(consolidatedData, (d) => d3.max(d));
        const xScale = d3
            .scaleLinear()
            .domain([0, maxQuantity])
            .range([0, chartWidth / 2]);

        const yScale = d3.scaleBand().domain(d3.range(consolidatedData.length)).range([0, chartHeight]).padding(0.1);

        // Draw axes
        const xAxis = d3.axisBottom(xScale);
        svg.select('.x-axis-bids')
            .attr('transform', `translate(${margin.left},${chartHeight + margin.top})`)
            .call(xAxis);

        svg.select('.x-axis-asks')
            .attr('transform', `translate(${margin.left + chartWidth / 2},${chartHeight + margin.top})`)
            .call(xAxis);

        const yAxis = d3.axisLeft(yScale).tickFormat((d) => consolidatedData[d][0]);
        svg.select('.y-axis').attr('transform', `translate(${margin.left},${margin.top})`).call(yAxis);

        // Draw bids line
        const bidsLineGenerator = d3
            .line()
            .x((d) => xScale(d[1]) + margin.left + chartWidth / 2)
            .y((d, i) => yScale(i) + yScale.bandwidth() / 2 + margin.top);

        svg.select('.bids-line')
            .datum(groupedBids)
            .attr('d', bidsLineGenerator)
            .attr('fill', 'none')
            .attr('stroke', 'green')
            .attr('stroke-width', 2);

        // Draw asks line
        const asksLineGenerator = d3
            .line()
            .x((d) => xScale(d[1]) + margin.left)
            .y((d, i) => yScale(i) + yScale.bandwidth() / 2 + margin.top);

        svg.select('.asks-line')
            .datum(groupedAsks)
            .attr('d', asksLineGenerator)
            .attr('fill', 'none')
            .attr('stroke', 'red')
            .attr('stroke-width', 2);
    }, [groupedAsks, groupedBids]);

    return (
        <svg ref={svgRef} width={600} height={400}>
            <g className="x-axis-bids" />
            <g className="x-axis-asks" />
            <g className="y-axis" />
            <path className="bids-line" />
            <path className="asks-line" />
        </svg>
    );
};

export default DepthChart;
