// Team Statistics Scatter Plot with Distribution Visualization
// Integrates with nbajs.js context (ctx.team, ctx.season)

async function createTeamStatsScatter(containerId = 'graph-cell-4') {
    const container = d3.select(`#${containerId}`);
    if (container.empty()) {
        console.warn(`[team-stats] Container #${containerId} not found`);
        return;
    }

    container.selectAll('*').remove();

    const width = 600;
    const height = 550;
    const margin = { top: 60, right: 40, bottom: 80, left: 80 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('display', 'block')
        .style('background', 'rgba(255, 255, 255, 0.02)');

    // Title
    // svg.append('text')
    //     .attr('class', 'scatter-title')
    //     .attr('x', width / 2)
    //     .attr('y', 20)
    //     .attr('text-anchor', 'middle')
    //     .style('font-size', '16px')
    //     .style('font-weight', 'bold')
    //     .style('fill', '#fff')
    //     .text('Team Statistics Comparison');

    // Control panel
    const controlPanel = svg.append('g')
        .attr('class', 'control-panel')
        .attr('transform', `translate(${margin.left}, 35)`);

    // Load data
    let teamData;
    try {
        teamData = await d3.csv('data/nba_api/game_statistics/per_100.csv');
        console.log(`[team-stats] Loaded ${teamData.length} team records`);
    } catch (err) {
        console.error('[team-stats] Failed to load data:', err);
        container.append('div')
            .style('color', '#f66')
            .style('padding', '12px')
            .text('Failed to load team statistics data');
        return;
    }

    // Extract numeric columns dynamically from data
    const numericColumns = Object.keys(teamData[0]).filter(key => {
        const val = teamData[0][key];
        return !isNaN(parseFloat(val)) && isFinite(val) && 
               key !== 'TEAM_ID' && key !== 'GP' && key !== 'W' && key !== 'L' &&
               !key.includes('RANK');
    });

    console.log('[team-stats] Available numeric columns:', numericColumns);

    // Use actual column names as labels
    const metricLabels = {};
    numericColumns.forEach(col => {
        metricLabels[col] = col.replace(/_/g, ' ')
            .replace(/E /g, '')
            .replace(/PCT/g, '%')
            .replace(/RATING/g, 'Rating')
            .replace(/RATIO/g, 'Ratio')
            .replace(/TOV/g, 'Turnover')
            .replace(/OREB/g, 'Off Reb')
            .replace(/DREB/g, 'Def Reb')
            .replace(/REB/g, 'Rebound')
            .replace(/AST/g, 'Assist')
            .replace(/DEF/g, 'Defensive')
            .replace(/OFF/g, 'Offensive')
            .replace(/TM/g, 'Team')
            .trim();
    });

    // Set defaults to first available metrics, or fallback to specific ones
    let selectedXMetric = numericColumns.includes('E_OFF_RATING') ? 'E_OFF_RATING' : numericColumns[0] || 'W_PCT';
    let selectedYMetric = numericColumns.includes('E_DEF_RATING') ? 'E_DEF_RATING' : numericColumns[1] || 'MIN';
    
    console.log('[team-stats] Default X metric:', selectedXMetric);
    console.log('[team-stats] Default Y metric:', selectedYMetric);

    // Create dropdowns
    const xLabel = controlPanel.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .style('font-size', '12px')
        .style('fill', '#fff')
        .style('font-weight', '600')
        .text('X-Axis:');

    const xSelectFO = controlPanel.append('foreignObject')
        .attr('x', 50)
        .attr('y', -110)
        .attr('width', 155)
        .attr('height', 28)
        .style('overflow', 'visible');
    
    const xSelect = xSelectFO.append('xhtml:select')
        .attr('id', 'x-metric-select')
        .style('width', '150px')
        .style('font-size', '11px')
        .style('background', '#444')
        .style('color', '#fff')
        .style('border', '1px solid #666')
        .style('border-radius', '3px')
        .style('padding', '3px 5px')
        .style('cursor', 'pointer');

    xSelect.selectAll('option')
        .data(numericColumns)
        .join('option')
        .attr('value', d => d)
        .text(d => metricLabels[d] || d);

    xSelect.property('value', selectedXMetric);
    
    xSelect.node().addEventListener('change', function() {
        selectedXMetric = this.value;
        console.log('[team-stats] X-axis changed to:', selectedXMetric);
        updatePlot(true);
    });

    const yLabel = controlPanel.append('text')
        .attr('x', 220)
        .attr('y', 0)
        .style('font-size', '12px')
        .style('fill', '#fff')
        .style('font-weight', '600')
        .text('Y-Axis:');

    const ySelectFO = controlPanel.append('foreignObject')
        .attr('x', 270)
        .attr('y', -110)
        .attr('width', 155)
        .attr('height', 28)
        .style('overflow', 'visible');
    
    const ySelect = ySelectFO.append('xhtml:select')
        .attr('id', 'y-metric-select')
        .style('width', '150px')
        .style('font-size', '11px')
        .style('background', '#444')
        .style('color', '#fff')
        .style('border', '1px solid #666')
        .style('border-radius', '3px')
        .style('padding', '3px 5px')
        .style('cursor', 'pointer');

    ySelect.selectAll('option')
        .data(numericColumns)
        .join('option')
        .attr('value', d => d)
        .text(d => metricLabels[d] || d);

    ySelect.property('value', selectedYMetric);
    
    ySelect.node().addEventListener('change', function() {
        selectedYMetric = this.value;
        console.log('[team-stats] Y-axis changed to:', selectedYMetric);
        updatePlot(true);
    });

    // Main plot group
    const plotGroup = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Axes groups
    const xAxisGroup = plotGroup.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${plotHeight})`);

    const yAxisGroup = plotGroup.append('g')
        .attr('class', 'y-axis');

    // Axis labels
    const xAxisLabel = svg.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', margin.left + plotWidth / 2)
        .attr('y', height - 25)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#ccc');

    const yAxisLabel = svg.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(margin.top + plotHeight / 2))
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#ccc');

    // Distribution groups (marginal plots)
    const xDistGroup = svg.append('g')
        .attr('class', 'x-distribution')
        .attr('transform', `translate(${margin.left}, ${margin.top + plotHeight + 5})`);

    const yDistGroup = svg.append('g')
        .attr('class', 'y-distribution')
        .attr('transform', `translate(${margin.left - 45}, ${margin.top})`);

    // Tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'scatter-tooltip')
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('padding', '8px 12px')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', '#fff')
        .style('border-radius', '4px')
        .style('font-size', '11px')
        .style('opacity', 0)
        .style('z-index', 1000);

    // Scales
    let xScale = d3.scaleLinear().range([0, plotWidth]);
    let yScale = d3.scaleLinear().range([plotHeight, 0]);

    function updatePlot(animated = false) {
        const currentTeam = window.ctx?.team || ctx?.team || 'ATL';
        const currentTeam2 = window.ctx?.team2 || ctx?.team2 || null;
        const currentSeason = window.ctx?.season || ctx?.season || '2024-25';
        const duration = animated ? 800 : 500;
        
        // Log comparison mode status
        if (currentTeam2) {
            console.log(`[team-stats] Comparison mode: ${currentTeam} vs ${currentTeam2}`);
        } else {
            console.log(`[team-stats] Single team mode: ${currentTeam}`);
        }

        // Filter data for current season
        const seasonData = teamData.filter(d => d.Season === currentSeason && d.abb);
        
        if (seasonData.length === 0) {
            console.warn('[team-stats] No data for season:', currentSeason);
            return;
        }

        // Parse numeric values
        seasonData.forEach(d => {
            d[selectedXMetric] = +d[selectedXMetric] || 0;
            d[selectedYMetric] = +d[selectedYMetric] || 0;
        });

        // Update scales
        const xValues = seasonData.map(d => d[selectedXMetric]);
        const yValues = seasonData.map(d => d[selectedYMetric]);

        const newXDomain = [
            d3.min(xValues) * 0.98,
            d3.max(xValues) * 1.02
        ];
        
        const newYDomain = [
            d3.min(yValues) * 0.98,
            d3.max(yValues) * 1.02
        ];

        // Update scales immediately - no interpolation needed
        xScale.domain(newXDomain);
        yScale.domain(newYDomain);

        // Update axes with transition
        const xAxis = d3.axisBottom(xScale).ticks(6);
        const yAxis = d3.axisLeft(yScale).ticks(6);

        xAxisGroup.transition().duration(duration)
            .call(xAxis)
            .selectAll('text')
            .style('fill', '#ccc')
            .style('font-size', '10px');

        xAxisGroup.selectAll('path, line')
            .style('stroke', '#555');

        yAxisGroup.transition().duration(duration)
            .call(yAxis)
            .selectAll('text')
            .style('fill', '#ccc')
            .style('font-size', '10px');

        yAxisGroup.selectAll('path, line')
            .style('stroke', '#555');

        // Update axis labels with animation
        xAxisLabel.transition().duration(duration)
            .style('opacity', 0)
            .transition().duration(duration)
            .text(metricLabels[selectedXMetric] || selectedXMetric)
            .style('opacity', 1);
            
        yAxisLabel.transition().duration(duration)
            .style('opacity', 0)
            .transition().duration(duration)
            .text(metricLabels[selectedYMetric] || selectedYMetric)
            .style('opacity', 1);

        // Draw grid with animation
        const gridXLines = plotGroup.selectAll('.grid-x')
            .data(xScale.ticks(6), d => d);

        gridXLines.exit()
            .transition().duration(duration)
            .style('opacity', 0)
            .remove();

        gridXLines.enter()
            .append('line')
            .attr('class', 'grid-line grid-x')
            .attr('x1', d => xScale(d))
            .attr('x2', d => xScale(d))
            .attr('y1', 0)
            .attr('y2', plotHeight)
            .style('stroke', '#333')
            .style('stroke-width', 0.5)
            .style('stroke-dasharray', '2,2')
            .style('opacity', 0)
            .transition().duration(duration)
            .style('opacity', 1);

        gridXLines.transition().duration(duration)
            .attr('x1', d => xScale(d))
            .attr('x2', d => xScale(d));

        const gridYLines = plotGroup.selectAll('.grid-y')
            .data(yScale.ticks(6), d => d);

        gridYLines.exit()
            .transition().duration(duration)
            .style('opacity', 0)
            .remove();

        gridYLines.enter()
            .append('line')
            .attr('class', 'grid-line grid-y')
            .attr('x1', 0)
            .attr('x2', plotWidth)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
            .style('stroke', '#333')
            .style('stroke-width', 0.5)
            .style('stroke-dasharray', '2,2')
            .style('opacity', 0)
            .transition().duration(duration)
            .style('opacity', 1);

        gridYLines.transition().duration(duration)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d));

        // Draw mean lines with animation
        const meanX = d3.mean(xValues);
        const meanY = d3.mean(yValues);

        let meanXLine = plotGroup.select('.mean-x');
        if (meanXLine.empty()) {
            meanXLine = plotGroup.append('line')
                .attr('class', 'mean-line mean-x')
                .attr('y1', 0)
                .attr('y2', plotHeight)
                .style('stroke', '#f39c12')
                .style('stroke-width', 1.5)
                .style('stroke-dasharray', '4,4')
                .style('opacity', 0.4);
        }
        meanXLine.transition().duration(duration)
            .attr('x1', xScale(meanX))
            .attr('x2', xScale(meanX));

        let meanYLine = plotGroup.select('.mean-y');
        if (meanYLine.empty()) {
            meanYLine = plotGroup.append('line')
                .attr('class', 'mean-line mean-y')
                .attr('x1', 0)
                .attr('x2', plotWidth)
                .style('stroke', '#f39c12')
                .style('stroke-width', 1.5)
                .style('stroke-dasharray', '4,4')
                .style('opacity', 0.4);
        }
        meanYLine.transition().duration(duration)
            .attr('y1', yScale(meanY))
            .attr('y2', yScale(meanY));

        // Draw points
        const points = plotGroup.selectAll('.team-point')
            .data(seasonData, d => d.abb);

        points.exit()
            .transition()
            .duration(duration * 0.4)
            .attr('r', 0)
            .remove();

        const pointsEnter = points.enter()
            .append('circle')
            .attr('class', 'team-point')
            .attr('cx', d => xScale(d[selectedXMetric]))
            .attr('cy', d => yScale(d[selectedYMetric]))
            .attr('r', 0);

        const allPoints = points.merge(pointsEnter);
        
        allPoints
            .style('cursor', 'pointer')
            .on('mouseenter', function(event, d) {
                const isSelected = d.abb === currentTeam || (currentTeam2 && d.abb === currentTeam2);
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('r', isSelected ? 12 : 8)
                    .style('stroke-width', 3);

                tooltip.style('opacity', 1)
                    .html(`
                        <strong>${d.TEAM_NAME || d.abb}</strong><br/>
                        ${metricLabels[selectedXMetric]}: <strong>${d[selectedXMetric].toFixed(2)}</strong><br/>
                        ${metricLabels[selectedYMetric]}: <strong>${d[selectedYMetric].toFixed(2)}</strong><br/>
                        <span style="color: #aaa; font-size: 10px;">Win%: ${(+d.W_PCT * 100).toFixed(1)}%</span>
                    `);
            })
            .on('mousemove', event => {
                tooltip
                    .style('left', (event.pageX + 12) + 'px')
                    .style('top', (event.pageY - 12) + 'px');
            })
            .on('mouseleave', function(event, d) {
                const isSelected = d.abb === currentTeam || (currentTeam2 && d.abb === currentTeam2);
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('r', isSelected ? 9 : 5)
                    .style('stroke-width', isSelected ? 2.5 : 1.5);

                tooltip.style('opacity', 0);
            })
            .on('click', (event, d) => {
                if (window.setTeamSelection) {
                    window.setTeamSelection(d.abb);
                }
            });

        // Animate points to new positions with dual highlighting
        allPoints
            .transition()
            .duration(duration)
            .ease(d3.easeCubicInOut)
            .attr('cx', d => xScale(d[selectedXMetric]))
            .attr('cy', d => yScale(d[selectedYMetric]))
            .attr('r', d => {
                if (d.abb === currentTeam || (currentTeam2 && d.abb === currentTeam2)) return 9;
                return 5;
            })
            .attr('fill', d => {
                if (d.abb === currentTeam) return '#ffeb3b'; // Primary team - yellow
                if (currentTeam2 && d.abb === currentTeam2) return '#e74c3c'; // Second team - red
                return '#3498db'; // Other teams - blue
            })
            .style('stroke', d => {
                if (d.abb === currentTeam || (currentTeam2 && d.abb === currentTeam2)) return '#fff';
                return '#2c3e50';
            })
            .style('stroke-width', d => {
                if (d.abb === currentTeam || (currentTeam2 && d.abb === currentTeam2)) return 2.5;
                return 1.5;
            })
            .style('opacity', d => {
                if (d.abb === currentTeam || (currentTeam2 && d.abb === currentTeam2)) return 1;
                return 0.5;
            });

        // Draw X-axis distribution (histogram) with animation
        drawDistribution(xDistGroup, xValues, xScale, plotWidth, 30, 'vertical', currentTeam, currentTeam2, seasonData, selectedXMetric, duration);
        
        // Draw Y-axis distribution (histogram) with animation
        drawDistribution(yDistGroup, yValues, yScale, 35, plotHeight, 'horizontal', currentTeam, currentTeam2, seasonData, selectedYMetric, duration);
    }

    function drawDistribution(g, values, scale, width, height, orientation, currentTeam, currentTeam2, data, metric, duration = 500) {
        const oldBins = g.selectAll('.dist-bar').data();

        const bins = d3.bin()
            .domain(scale.domain())
            .thresholds(15)(values);

        if (orientation === 'vertical') {
            const xBinScale = d3.scaleBand()
                .domain(d3.range(bins.length))
                .range([0, width])
                .padding(0.1);

            const yBinScale = d3.scaleLinear()
                .domain([0, d3.max(bins, d => d.length)])
                .range([height, 0]);

            const bars = g.selectAll('.dist-bar')
                .data(bins);

            bars.exit()
                .transition()
                .duration(duration * 0.5)
                .attr('height', 0)
                .attr('y', height)
                .style('opacity', 0)
                .remove();

            const barsEnter = bars.enter()
                .append('rect')
                .attr('class', 'dist-bar')
                .attr('x', (d, i) => {
                    const binCenter = (d.x0 + d.x1) / 2;
                    return scale(binCenter) - xBinScale.bandwidth() / 2;
                })
                .attr('y', height)
                .attr('width', xBinScale.bandwidth())
                .attr('height', 0)
                .attr('fill', '#1abc9c')
                .attr('opacity', 0);

            bars.merge(barsEnter)
                .transition()
                .duration(duration)
                .attr('x', (d, i) => {
                    const binCenter = (d.x0 + d.x1) / 2;
                    return scale(binCenter) - xBinScale.bandwidth() / 2;
                })
                .attr('y', d => yBinScale(d.length))
                .attr('width', xBinScale.bandwidth())
                .attr('height', d => height - yBinScale(d.length))
                .attr('opacity', 0.6);

            // Highlight both teams' bins with animation
            const teamsToHighlight = [
                { data: data.find(d => d.abb === currentTeam), color: '#ffeb3b', className: 'highlight-bar-team1' },
                currentTeam2 ? { data: data.find(d => d.abb === currentTeam2), color: '#e74c3c', className: 'highlight-bar-team2' } : null
            ].filter(t => t && t.data);

            teamsToHighlight.forEach(({ data: teamData, color, className }) => {
                const highlightBars = g.selectAll(`.${className}`).data([teamData]);

                highlightBars.exit()
                    .transition()
                    .duration(duration * 0.5)
                    .style('opacity', 0)
                    .remove();

                const teamValue = teamData[metric];
                const teamBin = bins.find(bin => teamValue >= bin.x0 && teamValue < bin.x1);
                if (teamBin) {
                    const binCenter = (teamBin.x0 + teamBin.x1) / 2;
                    
                    const highlightEnter = highlightBars.enter()
                        .append('rect')
                        .attr('class', className)
                        .attr('x', scale(binCenter) - xBinScale.bandwidth() / 2)
                        .attr('y', height)
                        .attr('width', xBinScale.bandwidth())
                        .attr('height', 0)
                        .attr('fill', color)
                        .attr('opacity', 0);

                    highlightBars.merge(highlightEnter)
                        .transition()
                        .duration(duration)
                        .attr('x', scale(binCenter) - xBinScale.bandwidth() / 2)
                        .attr('y', yBinScale(teamBin.length))
                        .attr('width', xBinScale.bandwidth())
                        .attr('height', height - yBinScale(teamBin.length))
                        .attr('fill', color)
                        .attr('opacity', 0.9);
                }
            });

            // Clean up old highlight bars
            g.selectAll('.highlight-bar').remove();

        } else { // horizontal
            const yBinScale = d3.scaleBand()
                .domain(d3.range(bins.length))
                .range([height, 0])
                .padding(0.1);

            const xBinScale = d3.scaleLinear()
                .domain([0, d3.max(bins, d => d.length)])
                .range([0, width]);

            const bars = g.selectAll('.dist-bar')
                .data(bins);

            bars.exit()
                .transition()
                .duration(duration * 0.5)
                .attr('width', 0)
                .style('opacity', 0)
                .remove();

            const barsEnter = bars.enter()
                .append('rect')
                .attr('class', 'dist-bar')
                .attr('x', 0)
                .attr('y', d => {
                    const binCenter = (d.x0 + d.x1) / 2;
                    return scale(binCenter) - yBinScale.bandwidth() / 2;
                })
                .attr('width', 0)
                .attr('height', yBinScale.bandwidth())
                .attr('fill', '#1abc9c')
                .attr('opacity', 0);

            bars.merge(barsEnter)
                .transition()
                .duration(duration)
                .attr('x', 0)
                .attr('y', d => {
                    const binCenter = (d.x0 + d.x1) / 2;
                    return scale(binCenter) - yBinScale.bandwidth() / 2;
                })
                .attr('width', d => xBinScale(d.length))
                .attr('height', yBinScale.bandwidth())
                .attr('opacity', 0.6);

            // Highlight both teams' bins with animation
            const teamsToHighlight = [
                { data: data.find(d => d.abb === currentTeam), color: '#ffeb3b', className: 'highlight-bar-team1' },
                currentTeam2 ? { data: data.find(d => d.abb === currentTeam2), color: '#e74c3c', className: 'highlight-bar-team2' } : null
            ].filter(t => t && t.data);

            teamsToHighlight.forEach(({ data: teamData, color, className }) => {
                const highlightBars = g.selectAll(`.${className}`).data([teamData]);

                highlightBars.exit()
                    .transition()
                    .duration(duration * 0.5)
                    .style('opacity', 0)
                    .remove();

                const teamValue = teamData[metric];
                const teamBin = bins.find(bin => teamValue >= bin.x0 && teamValue < bin.x1);
                if (teamBin) {
                    const binCenter = (teamBin.x0 + teamBin.x1) / 2;
                    
                    const highlightEnter = highlightBars.enter()
                        .append('rect')
                        .attr('class', className)
                        .attr('x', 0)
                        .attr('y', scale(binCenter) - yBinScale.bandwidth() / 2)
                        .attr('width', 0)
                        .attr('height', yBinScale.bandwidth())
                        .attr('fill', color)
                        .attr('opacity', 0);

                    highlightBars.merge(highlightEnter)
                        .transition()
                        .duration(duration)
                        .attr('x', 0)
                        .attr('y', scale(binCenter) - yBinScale.bandwidth() / 2)
                        .attr('width', xBinScale(teamBin.length))
                        .attr('height', yBinScale.bandwidth())
                        .attr('fill', color)
                        .attr('opacity', 0.9);
                }
            });

            // Clean up old highlight bars
            g.selectAll('.highlight-bar').remove();
        }
    }

    // Initial plot
    updatePlot();

    // Store update function globally so other components can trigger updates
    window.updateTeamStatsScatter = updatePlot;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof createViz === 'function') {
            // Wait a bit for createViz to complete
            setTimeout(() => createTeamStatsScatter(), 500);
        } else {
            createTeamStatsScatter();
        }
    });
} else {
    if (typeof createViz === 'function') {
        setTimeout(() => createTeamStatsScatter(), 500);
    } else {
        createTeamStatsScatter();
    }
}
