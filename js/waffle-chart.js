(function() {
    let scoringData = null;
    
    // Fixed color palette for scoring categories
    const CATEGORY_COLORS = {
        'paint': '#FF6B6B',        // Red - Paint points
        'free_throws': '#4ECDC4',  // Teal - Free throws
        'mid_range': '#FFE66D',    // Yellow - Mid-range
        'three_pt': '#95E1D3',     // Mint - Three-pointers
        'second_chance': '#A8E6CF' // Light green - Second chance (optional)
    };
    
    // Category display order (bottom to top in waffle)
    const CATEGORY_ORDER = ['paint', 'free_throws', 'mid_range', 'three_pt'];
    
    const CATEGORY_LABELS = {
        'paint': 'Paint',
        'free_throws': 'Free Throws',
        'mid_range': 'Mid-range',
        'three_pt': 'Three-pointers',
        'second_chance': 'Second Chance'
    };
    
    // Team abbreviation to full name mapping (from scoring data)
    const TEAM_ABB_TO_FULL = {
        'ATL': 'Atlanta Hawks',
        'BOS': 'Boston Celtics',
        'BKN': 'Brooklyn Nets',
        'CHA': 'Charlotte Hornets',
        'CHI': 'Chicago Bulls',
        'CLE': 'Cleveland Cavaliers',
        'DAL': 'Dallas Mavericks',
        'DEN': 'Denver Nuggets',
        'DET': 'Detroit Pistons',
        'GSW': 'Golden State Warriors',
        'HOU': 'Houston Rockets',
        'IND': 'Indiana Pacers',
        'LAC': 'LA Clippers',  // Corrected: "LA Clippers" in data
        'LAL': 'Los Angeles Lakers',
        'MEM': 'Memphis Grizzlies',
        'MIA': 'Miami Heat',
        'MIL': 'Milwaukee Bucks',
        'MIN': 'Minnesota Timberwolves',
        'NOP': 'New Orleans Pelicans',
        'NYK': 'New York Knicks',
        'OKC': 'Oklahoma City Thunder',
        'ORL': 'Orlando Magic',
        'PHI': 'Philadelphia 76ers',
        'PHX': 'Phoenix Suns',
        'POR': 'Portland Trail Blazers',
        'SAC': 'Sacramento Kings',
        'SAS': 'San Antonio Spurs',
        'TOR': 'Toronto Raptors',
        'UTA': 'Utah Jazz',
        'WAS': 'Washington Wizards'
    };
    
    function loadScoringData() {
        if (scoringData) {
            return Promise.resolve(scoringData);
        }
        return d3.json('data/nba_api/scoring_breakdown_with_ft_2024-25.json').then(data => {
            scoringData = data;
            return data;
        });
    }
    
    /**
     * Calculate percentages for waffle chart (100 cells total)
     * Returns array of {category, count, percentage} objects
     */
    function calculateWaffleData(teamData) {
        if (!teamData || !teamData.field_goal_points) {
            return [];
        }
        
        const points = teamData.field_goal_points;
        
        // Calculate actual field goal total (sum of categories)
        const fieldGoalTotal = (points.paint || 0) + (points.mid_range || 0) + (points.three_pt || 0);
        
        // Get real free throw data if available
        let freeThrowPoints = 0;
        if (teamData.free_throws && teamData.free_throws.ft_points) {
            // Use real free throw data from API
            freeThrowPoints = teamData.free_throws.ft_points;
            console.log('[waffle-chart] Using real FT data:', freeThrowPoints);
        } else {
            // Fallback: check if included in total field
            freeThrowPoints = (points.total || fieldGoalTotal) - fieldGoalTotal;
            
            // If still 0, estimate (shouldn't happen with new data)
            if (freeThrowPoints <= 0) {
                freeThrowPoints = fieldGoalTotal * 0.20;
                console.warn('[waffle-chart] Estimating FT at 20%:', freeThrowPoints);
            }
        }
        
        // True total including free throws
        const trueTotal = fieldGoalTotal + freeThrowPoints;
        
        // Calculate raw percentages based on TRUE total
        const categories = [
            { category: 'paint', points: points.paint || 0 },
            { category: 'mid_range', points: points.mid_range || 0 },
            { category: 'three_pt', points: points.three_pt || 0 },
            { category: 'free_throws', points: freeThrowPoints }
        ];
        
        // Calculate percentages and round to integers
        let waffleData = categories.map(cat => {
            const pct = (cat.points / trueTotal) * 100;
            return {
                category: cat.category,
                points: cat.points,
                percentage: pct,
                count: Math.round(pct)
            };
        });
        
        // Adjust to ensure exactly 100 cells
        const totalCells = waffleData.reduce((sum, d) => sum + d.count, 0);
        const diff = 100 - totalCells;
        
        console.log('  Initial cells:', totalCells, 'Diff:', diff);
        
        if (diff !== 0) {
            // Sort by remainder (percentage - count) to find best candidate for adjustment
            const withRemainder = waffleData.map((d, i) => ({
                index: i,
                remainder: d.percentage - d.count,
                count: d.count
            }));
            
            if (diff > 0) {
                // Need to add cells - give to categories with highest positive remainder
                withRemainder.sort((a, b) => b.remainder - a.remainder);
                for (let i = 0; i < diff; i++) {
                    waffleData[withRemainder[i % withRemainder.length].index].count++;
                }
            } else {
                // Need to remove cells - take from categories with lowest remainder (most over-rounded)
                withRemainder.sort((a, b) => a.remainder - b.remainder);
                for (let i = 0; i < Math.abs(diff); i++) {
                    const idx = withRemainder[i % withRemainder.length].index;
                    if (waffleData[idx].count > 0) {
                        waffleData[idx].count--;
                    }
                }
            }
        }
        
        // Final verification
        const finalTotal = waffleData.reduce((sum, d) => sum + d.count, 0);
        console.log('  Final cells:', finalTotal, waffleData.map(d => `${d.category}:${d.count}`).join(', '));
        
        // Filter out categories with 0 cells
        return waffleData.filter(d => d.count > 0);
    }
    
    /**
     * Generate array of cells in fill order (bottom-to-top, left-to-right)
     * Each cell has: row, col, category
     */
    function generateWaffleCells(waffleData) {
        const cells = [];
        let cellIndex = 0;
        
        // Sort data by category order, but include ALL categories that have cells
        const orderedData = [];
        
        // First, add categories in the defined order
        CATEGORY_ORDER.forEach(category => {
            const catData = waffleData.find(d => d.category === category);
            if (catData && catData.count > 0) {
                orderedData.push(catData);
            }
        });
        
        // Then add any remaining categories not in CATEGORY_ORDER
        waffleData.forEach(catData => {
            if (catData.count > 0 && !CATEGORY_ORDER.includes(catData.category)) {
                orderedData.push(catData);
            }
        });
        
        // Fill cells for each category
        orderedData.forEach(catData => {
            for (let i = 0; i < catData.count; i++) {
                // Fill bottom-to-top, left-to-right
                const row = 9 - Math.floor(cellIndex / 10); // Start from bottom (row 9)
                const col = cellIndex % 10;
                cells.push({
                    row,
                    col,
                    category: catData.category,
                    percentage: catData.percentage
                });
                cellIndex++;
            }
        });
        
        console.log('[waffle-chart] Generated', cellIndex, 'cells');
        
        return cells;
    }
    
    /**
     * Draw a single waffle chart
     */
    function drawWaffleChart(container, teamData, teamName, x, y, cellSize = 16) {
        const waffleData = calculateWaffleData(teamData);
        const cells = generateWaffleCells(waffleData);
        
        const chartGroup = container.append('g')
            .attr('class', 'waffle-chart')
            .attr('transform', `translate(${x}, ${y})`);
        
        // Title
        chartGroup.append('text')
            .attr('x', cellSize * 5)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', '600')
            .style('fill', '#fff')
            .text(teamName);
        
        // Tooltip
        const tooltip = d3.select('body').selectAll('.waffle-tooltip').data([null]);
        const tooltipEnter = tooltip.enter().append('div').attr('class', 'waffle-tooltip');
        const tooltipEl = tooltipEnter.merge(tooltip)
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.9)')
            .style('color', 'white')
            .style('padding', '8px 12px')
            .style('border-radius', '4px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 1000)
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.3)');
        
        // Draw cells
        const cellGroup = chartGroup.append('g').attr('class', 'cells');
        
        cellGroup.selectAll('rect')
            .data(cells)
            .join('rect')
            .attr('x', d => d.col * (cellSize + 1))
            .attr('y', d => d.row * (cellSize + 1))
            .attr('width', cellSize)
            .attr('height', cellSize)
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('fill', d => {
                const color = CATEGORY_COLORS[d.category];
                if (!color) {
                    console.warn('[waffle-chart] Missing color for category:', d.category);
                    return '#999'; // Fallback color
                }
                return color;
            })
            .attr('stroke', 'rgba(255,255,255,0.1)')
            .attr('stroke-width', 0.5)
            .style('cursor', 'pointer')
            .on('mouseenter', function(event, d) {
                // Highlight all cells of same category
                cellGroup.selectAll('rect')
                    .transition()
                    .duration(150)
                    .attr('opacity', cell => cell.category === d.category ? 1 : 0.3)
                    .attr('stroke-width', cell => cell.category === d.category ? 2 : 0.5)
                    .attr('stroke', cell => cell.category === d.category ? '#fff' : 'rgba(255,255,255,0.1)');
                
                // Show tooltip
                tooltipEl
                    .style('opacity', 1)
                    .html(`
                        <div style="font-weight: 600; margin-bottom: 4px;">${CATEGORY_LABELS[d.category]}</div>
                        <div>${d.percentage.toFixed(1)}% of points</div>
                    `)
                    .style('left', (event.pageX + 12) + 'px')
                    .style('top', (event.pageY + 12) + 'px');
            })
            .on('mousemove', function(event) {
                tooltipEl
                    .style('left', (event.pageX + 12) + 'px')
                    .style('top', (event.pageY + 12) + 'px');
            })
            .on('mouseleave', function() {
                // Reset all cells
                cellGroup.selectAll('rect')
                    .transition()
                    .duration(150)
                    .attr('opacity', 1)
                    .attr('stroke-width', 0.5)
                    .attr('stroke', 'rgba(255,255,255,0.1)');
                
                tooltipEl.style('opacity', 0);
            });
        
        // Add legend below the waffle
        const legendY = cellSize * 10 + 30;
        const legendGroup = chartGroup.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(0, ${legendY})`);
        
        waffleData.forEach((cat, i) => {
            const legendItem = legendGroup.append('g')
                .attr('transform', `translate(0, ${i * 20})`);
            
            legendItem.append('rect')
                .attr('width', 12)
                .attr('height', 12)
                .attr('rx', 2)
                .attr('fill', CATEGORY_COLORS[cat.category]);
            
            legendItem.append('text')
                .attr('x', 18)
                .attr('y', 9)
                .style('font-size', '11px')
                .style('fill', '#ccc')
                .text(`${CATEGORY_LABELS[cat.category]}: ${cat.percentage.toFixed(1)}%`);
        });
    }
    
    function renderWaffleComparison() {
        const container = d3.select('#graph-cell-5');
        if (container.empty()) {
            console.warn('[waffle-chart] Container #graph-cell-5 not found');
            return;
        }
        
        // Check if we're in comparison mode
        if (!window.ctx || !window.ctx.team2) {
            // Show calendar instead
            if (window.initCalendar) {
                window.initCalendar();
            }
            return;
        }
        
        const team1Abb = window.ctx.team;
        const team2Abb = window.ctx.team2;
        
        console.log('[waffle-chart] Rendering comparison:', team1Abb, 'vs', team2Abb);
        
        loadScoringData().then(data => {
            // Clear container
            container.selectAll('*').remove();
            
            // Get team full names
            const team1Full = TEAM_ABB_TO_FULL[team1Abb];
            const team2Full = TEAM_ABB_TO_FULL[team2Abb];
            
            const team1Data = data[team1Full];
            const team2Data = data[team2Full];
            
            if (!team1Data || !team2Data) {
                console.error('[waffle-chart] Missing data for teams:', team1Full, team2Full);
                container.append('div')
                    .style('color', '#fff')
                    .style('padding', '20px')
                    .style('text-align', 'center')
                    .text('Scoring data not available for selected teams');
                return;
            }
            
            // Create SVG
            const containerRect = container.node().getBoundingClientRect();
            const width = containerRect.width;
            const height = containerRect.height;
            
            const svg = container.append('svg')
                .attr('width', width)
                .attr('height', height);
            
            // Title
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', 25)
                .attr('text-anchor', 'middle')
                .style('font-size', '18px')
                .style('font-weight', '700')
                .style('fill', '#fff')
                .text('Scoring Breakdown Comparison');
            
            // Calculate positions for two waffle charts
            const cellSize = 15;
            const waffleWidth = cellSize * 10 + 9; // 10 cells + 9 gaps
            const waffleHeight = cellSize * 10 + 9 + 110; // +110 for legend
            
            const spacing = 60;
            const totalWidth = waffleWidth * 2 + spacing;
            const startX = (width - totalWidth) / 2;
            const startY = 60;
            
            // Draw team 1 waffle
            drawWaffleChart(
                svg,
                team1Data,
                team1Abb,
                startX,
                startY,
                cellSize
            );
            
            // Draw team 2 waffle
            drawWaffleChart(
                svg,
                team2Data,
                team2Abb,
                startX + waffleWidth + spacing,
                startY,
                cellSize
            );
            
            // Add note about data
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height - 10)
                .attr('text-anchor', 'middle')
                .style('font-size', '10px')
                .style('fill', '#888')
                .text('Each square = 1% of total points scored • 2024-25 season');
            
        }).catch(err => {
            console.error('[waffle-chart] Failed to load data:', err);
            container.append('div')
                .style('color', '#f66')
                .style('padding', '20px')
                .text('Failed to load scoring data');
        });
    }
    
    // Expose global function
    window.renderWaffleComparison = renderWaffleComparison;
    
    // Listen for team selection changes
    if (window.ctx) {
        console.log('[waffle-chart] initialized');
    }
    
})();
