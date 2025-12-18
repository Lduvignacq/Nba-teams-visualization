// Team Starting Five & Bench Visualization
// Shows starting lineup positioned on a basketball court + bench players list
// Integrates with nbajs.js context (ctx.team, ctx.season)

(function() {
    'use strict';

    // Position mappings to court coordinates
    // Court layout reference:
    //   Baseline: y=0, Hoop: (0,60), Paint: x=[-80,80] y=[0,190]
    //   Free throw line: y=190, Three-point arc: centered at (0,60) radius 220
    //   Sidelines: x=[-220,220], Half-court: y=230
    // Positions prédéfinies pour les 5 joueurs sur le terrain
    const COURT_POSITIONS = [
        { x: 0, y: 350, label: 'PG' },        // Position 1: Point Guard - haut de clé (reculé)
        { x: 150, y: 300, label: 'SG' },      // Position 2: Shooting Guard - ailier droit (reculé)
        { x: -150, y: 300, label: 'SG' },     // Position 3: Guard - ailier gauche (reculé)
        { x: 170, y: 120, label: 'SF' },      // Position 4: Small Forward - coin droit
        { x: 0, y: 100, label: 'C' }          // Position 5: Center - poste bas
    ];

    // Simple: assigne les 5 positions dans l'ordre
    function getCourtPosition(position, positionIndex, allPositions) {
        const pos = COURT_POSITIONS[positionIndex] || COURT_POSITIONS[4]; // Default au center si hors limites
        console.log(`[players] Position ${positionIndex}: ${position} → (${pos.x}, ${pos.y})`);
        return pos;
    }

    async function createStartingFiveViz(containerId = 'graph-cell-6') {
        const container = d3.select(`#${containerId}`);
        if (container.empty()) {
            console.warn(`[players] Container #${containerId} not found`);
            return;
        }

        container.selectAll('*').remove();

        const width = 700;
        const height = 800; // Increased for playoff bracket
        const margin = { top: 50, right: 200, bottom: 40, left: 40 };
        const courtWidth = width - margin.left - margin.right - 200;  // Leave space for bench list
        const courtHeight = height - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('display', 'block')
            .style('background', 'rgba(255, 255, 255, 0.02)');

        // Title
        const titleGroup = svg.append('g')
            .attr('class', 'title-group')
            .attr('transform', `translate(${width / 2}, 25)`);

        titleGroup.append('text')
            .attr('class', 'viz-title')
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#fff')
            .text('Starting Lineup');

        // Court group - aligned with top margin
        const courtGroup = svg.append('g')
            .attr('class', 'court-group')
            .attr('transform', `translate(${margin.left + courtWidth / 2 + 30}, ${margin.top + 10}) scale(0.85)`);

        // Draw court (reuse from nbajs.js)
        createCourtHalfCourt(courtGroup, '#fff');

        // Players group
        const playersGroup = courtGroup.append('g')
            .attr('class', 'players-group');

        // Bench list group - positioned below season summary
        const benchGroup = svg.append('g')
            .attr('class', 'bench-group')
            .attr('transform', `translate(${width - margin.right + 10}, ${margin.top + 50})`);

        benchGroup.append('text')
            .attr('class', 'bench-title')
            .attr('x', 0)
            .attr('y', 0)
            .style('font-size', '16px')
            .style('font-weight', '600')
            .style('fill', '#f39c12')
            .text('Bench');

        // Playoff Bracket group (below court, centered)
        const bracketGroup = svg.append('g')
            .attr('class', 'playoff-bracket-group')
            .attr('transform', `translate(${width / 2}, ${margin.top + 360})`);

        // Separator line between court and bracket
        svg.append('line')
            .attr('x1', 0)
            .attr('y1', margin.top + 350)
            .attr('x2', width)
            .attr('y2', margin.top + 350)
            .attr('stroke', '#444')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '5,5');

        // Season Summary group (below title, centered)
        const summaryGroup = svg.append('g')
            .attr('class', 'season-summary-group')
            .attr('transform', `translate(${width / 2}, 45)`);

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'players-tooltip')
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('padding', '10px 14px')
            .style('background', 'rgba(0, 0, 0, 0.9)')
            .style('color', '#fff')
            .style('border-radius', '4px')
            .style('font-size', '13px')
            .style('opacity', 0)
            .style('z-index', 1000);

        async function updateViz() {
            const currentTeam = ctx.team || 'ATL';
            const currentSeason = ctx.season || '2024-25';

            // Update background logo on entire page
            const logoPath = `data/logo/${currentTeam}_logo.svg`;
            document.body.style.setProperty('--team-logo', `url('${logoPath}')`);

            // Update title
            const teamName = ctx.abbreviationtoname[currentTeam] || currentTeam;
            titleGroup.select('.viz-title')
                .text(`${teamName} - ${currentSeason}`);

            // Load player data
            const rosterPath = `data/nba_api/player_rosters/rosters_${currentSeason}.csv`;
            console.log(`[players] Loading roster from: ${rosterPath}`);

            let rosterData;
            try {
                rosterData = await d3.csv(rosterPath);
                rosterData = rosterData.filter(d => d.team_abb === currentTeam);
                
                // Parse numbers
                rosterData.forEach(d => {
                    d.minutes_per_game = +d.minutes_per_game || 0;
                    d.games = +d.games || 0;
                });

                // Sort by minutes
                rosterData.sort((a, b) => b.minutes_per_game - a.minutes_per_game);

                console.log(`[players] Loaded ${rosterData.length} players for ${currentTeam}`);
            } catch (err) {
                console.error('[players] Failed to load roster data:', err);
                playersGroup.selectAll('*').remove();
                playersGroup.append('text')
                    .attr('text-anchor', 'middle')
                    .style('fill', '#f66')
                    .style('font-size', '12px')
                    .text('No roster data available');
                return;
            }

            if (rosterData.length === 0) {
                playersGroup.selectAll('*').remove();
                playersGroup.append('text')
                    .attr('text-anchor', 'middle')
                    .style('fill', '#f66')
                    .style('font-size', '12px')
                    .text(`No data for ${currentTeam}`);
                return;
            }

            // Split into starters (top 5 by MPG, filtering out players with 0 minutes) and bench
            // FIX: Some teams have players with 0 MPG in the roster, so we filter them out first
            const playersWithMinutes = rosterData.filter(d => d.minutes_per_game > 0);
            const starters = playersWithMinutes.slice(0, Math.min(5, playersWithMinutes.length));
            const bench = playersWithMinutes.slice(5);
            
            console.log(`[players] ${currentTeam}: ${starters.length} starters, ${bench.length} bench players`);

            // Assign court positions to starters
            const allPositions = starters.map(p => p.position);
            const startersWithCoords = starters.map((player, idx) => {
                const coords = getCourtPosition(player.position, idx, allPositions);
                
                console.log(`[players] ${player.player}: ${player.position} → (${coords.x}, ${coords.y})`);
                
                return {
                    ...player,
                    courtX: coords.x,
                    courtY: coords.y,
                    posLabel: coords.label
                };
            });

            // Draw starting 5 players
            const playerCircles = playersGroup.selectAll('.player-circle')
                .data(startersWithCoords, d => d.player);

            playerCircles.exit()
                .transition()
                .duration(400)
                .attr('r', 0)
                .style('opacity', 0)
                .remove();

            const playerEnter = playerCircles.enter()
                .append('g')
                .attr('class', 'player-circle')
                .attr('transform', d => `translate(${d.courtX}, ${d.courtY})`);  // FIX: Remove negative sign on Y

            // Circle
            playerEnter.append('circle')
                .attr('r', 0)
                .attr('fill', '#e74c3c')
                .attr('stroke', '#fff')
                .attr('stroke-width', 2.5)
                .style('cursor', 'pointer');

            // Position label inside circle
            playerEnter.append('text')
                .attr('class', 'pos-label')
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .style('font-size', '13px')
                .style('font-weight', 'bold')
                .style('fill', '#fff')
                .style('pointer-events', 'none')
                .text(d => d.posLabel);

            // Player name below
            playerEnter.append('text')
                .attr('class', 'player-name')
                .attr('text-anchor', 'middle')
                .attr('y', 28)
                .style('font-size', '12px')
                .style('fill', '#ddd')
                .style('pointer-events', 'none')
                .text(d => {
                    const parts = d.player.split(' ');
                    return parts.length > 1 ? parts[parts.length - 1] : d.player;
                });

            // Update existing + new
            const allPlayers = playerCircles.merge(playerEnter);

            allPlayers.transition()
                .duration(600)
                .attr('transform', d => `translate(${d.courtX}, ${d.courtY})`);

            allPlayers.select('circle')
                .transition()
                .duration(600)
                .attr('r', 18);

            allPlayers.select('.pos-label')
                .text(d => d.posLabel);

            allPlayers.select('.player-name')
                .text(d => {
                    const parts = d.player.split(' ');
                    return parts.length > 1 ? parts[parts.length - 1] : d.player;
                });

            // Hover effects
            allPlayers
                .on('mouseenter', function(event, d) {
                    d3.select(this).select('circle')
                        .transition()
                        .duration(150)
                        .attr('r', 22);

                    tooltip.style('opacity', 1)
                        .html(`
                            <strong>${d.player}</strong><br/>
                            Position: ${d.position}<br/>
                            MPG: <strong>${d.minutes_per_game.toFixed(1)}</strong><br/>
                            Games: ${d.games}
                        `);
                })
                .on('mousemove', event => {
                    tooltip
                        .style('left', (event.pageX + 12) + 'px')
                        .style('top', (event.pageY - 12) + 'px');
                })
                .on('mouseleave', function() {
                    d3.select(this).select('circle')
                        .transition()
                        .duration(150)
                        .attr('r', 18);

                    tooltip.style('opacity', 0);
                });

            // Draw bench list
            benchGroup.selectAll('.bench-player').remove();

            const benchItems = benchGroup.selectAll('.bench-player')
                .data(bench.slice(0, 10), d => d.player);  // Show top 10 bench players

            const benchEnter = benchItems.enter()
                .append('g')
                .attr('class', 'bench-player')
                .attr('transform', (d, i) => `translate(0, ${25 + i * 22})`)
                .style('opacity', 0);

            // Rank number
            benchEnter.append('text')
                .attr('class', 'bench-rank')
                .attr('x', -5)
                .attr('y', 0)
                .attr('text-anchor', 'end')
                .style('font-size', '12px')
                .style('fill', '#888')
                .text((d, i) => `${i + 6}.`);

            // Player name
            benchEnter.append('text')
                .attr('class', 'bench-name')
                .attr('x', 0)
                .attr('y', 0)
                .style('font-size', '13px')
                .style('fill', '#ccc')
                .text(d => {
                    const name = d.player.length > 16 ? d.player.substring(0, 14) + '...' : d.player;
                    return name;
                });

            // MPG
            benchEnter.append('text')
                .attr('class', 'bench-mpg')
                .attr('x', 130)
                .attr('y', 0)
                .style('font-size', '12px')
                .style('fill', '#3498db')
                .style('font-weight', '600')
                .text(d => `${d.minutes_per_game.toFixed(1)}`);

            benchEnter.append('text')
                .attr('x', 160)
                .attr('y', 0)
                .style('font-size', '11px')
                .style('fill', '#777')
                .text('mpg');

            benchItems.merge(benchEnter)
                .transition()
                .duration(500)
                .delay((d, i) => i * 50)
                .style('opacity', 1);

            benchItems.exit()
                .transition()
                .duration(300)
                .style('opacity', 0)
                .remove();

            // Load and display season summary and playoff bracket
            try {
                const summaryData = await d3.json('data/nba_api/team_season_summary.json');
                const teamData = summaryData[currentTeam];
                
                if (teamData) {
                    updateSeasonSummary(teamData);
                }
                
                // Load playoff bracket
                const bracketData = await d3.json(`data/nba_api/playoff_bracket_${currentSeason}.json`);
                if (bracketData) {
                    drawPlayoffBracket(bracketData, currentTeam);
                }
            } catch (error) {
                console.warn('[players] Could not load season summary:', error);
            }
        }

        function updateSeasonSummary(data) {
            // Clear existing
            summaryGroup.selectAll('*').remove();
            
            // Single line compact summary
            const line = summaryGroup.append('g')
                .attr('class', 'summary-line')
                .attr('transform', 'translate(0, 0)');
            
            let xOffset = -250;
            
            // Regular season label
            line.append('text')
                .attr('x', xOffset)
                .attr('y', 0)
                .attr('text-anchor', 'start')
                .style('font-size', '13px')
                .style('fill', '#aaa')
                .style('font-weight', '600')
                .text('Regular Season:');
            
            xOffset += 120;
            
            // W-L record
            line.append('text')
                .attr('x', xOffset)
                .attr('y', 0)
                .attr('text-anchor', 'start')
                .style('font-size', '13px')
                .style('fill', '#fff')
                .style('font-weight', 'bold')
                .text(`${data.wins}-${data.losses}`);
            
            xOffset += 50;
            
            // Conference rank
            line.append('text')
                .attr('x', xOffset)
                .attr('y', 0)
                .attr('text-anchor', 'start')
                .style('font-size', '12px')
                .style('fill', '#3498db')
                .text(`(${data.conference} #${data.playoff_rank || 'N/A'})`);
            
            xOffset += 80;
            
            // Playoffs section (if applicable)
            if (data.playoff_wins > 0 || data.playoff_losses > 0) {
                line.append('text')
                    .attr('x', xOffset)
                    .attr('y', 0)
                    .attr('text-anchor', 'start')
                    .style('font-size', '13px')
                    .style('fill', '#aaa')
                    .style('font-weight', '600')
                    .text('Playoffs:');
                
                xOffset += 70;
                
                // Determine elimination stage and color
                let eliminationText = '';
                let statusColor = '#888';
                
                if (data.finals_appearance === 'LEAGUE CHAMPION') {
                    eliminationText = '🏆 Champion';
                    statusColor = '#f39c12';
                } else if (data.finals_appearance === 'FINALS APPEARANCE') {
                    eliminationText = 'Finale';
                    statusColor = '#e74c3c';
                } else if (data.playoff_wins >= 8) {
                    eliminationText = 'Finale de conférence';
                    statusColor = '#9b59b6';
                } else if (data.playoff_wins >= 4) {
                    eliminationText = 'Demi-finale de conférence';
                    statusColor = '#3498db';
                } else if (data.playoff_wins > 0) {
                    eliminationText = 'Premier tour';
                    statusColor = '#1abc9c';
                } else {
                    eliminationText = 'Play-in';
                    statusColor = '#888';
                }
                
                // Playoff elimination stage
                line.append('text')
                    .attr('x', xOffset)
                    .attr('y', 0)
                    .attr('text-anchor', 'start')
                    .style('font-size', '13px')
                    .style('fill', statusColor)
                    .style('font-weight', 'bold')
                    .text(eliminationText);
            }
        }

        function drawPlayoffBracket(bracket, focusTeam) {
            // Clear existing bracket
            bracketGroup.selectAll('*').remove();
            
            const bracketViz = bracketGroup.append('g')
                .attr('class', 'bracket-viz')
                .attr('transform', 'translate(-300, 10)');
            
            // Title
            bracketViz.append('text')
                .attr('x', 300)
                .attr('y', 0)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .style('font-weight', 'bold')
                .style('fill', '#fff')
                .text('Playoff');
            
            const roundSpacing = 80;
            const matchupHeight = 40;
            const teamHeight = 18;
            const verticalSpacing = 50; // Space between matchups in same round

            // Draw a matchup
            function drawMatchup(x, y, matchup, round, isHighlighted, iswest = true) {
                const g = bracketViz.append('g')
                    .attr('transform', `translate(${x}, ${y})`);
                
                const strokeColor = isHighlighted ? '#27ae60' : '#444';
                const strokeWidth = isHighlighted ? 3 : 1.5;
                
                // Bracket line
                g.append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', 60)
                    .attr('height', matchupHeight)
                    .attr('fill', 'none')
                    .attr('stroke', strokeColor)
                    .attr('stroke-width', strokeWidth)
                    .attr('rx', 3);
                
                // Teams
                matchup.teams.forEach((team, idx) => {
                    const teamY = idx * teamHeight + 3;
                    const isWinner = team === matchup.winner;
                    const isInPath = isHighlighted && (team === focusTeam || isWinner);
                    
                    // Logo (small circle)
                    g.append('circle')
                        .attr('cx', 8)
                        .attr('cy', teamY + 8)
                        .attr('r', 6)
                        .attr('fill', isInPath ? '#27ae60' : '#555')
                        .attr('stroke', isWinner ? '#f39c12' : '#666')
                        .attr('stroke-width', isWinner ? 2 : 1);
                    
                    // Team abbreviation
                    g.append('text')
                        .attr('x', 18)
                        .attr('y', teamY + 12)
                        .style('font-size', '10px')
                        .style('font-weight', isWinner ? 'bold' : 'normal')
                        .style('fill', isInPath ? '#27ae60' : (isWinner ? '#fff' : '#aaa'))
                        .text(team);
                });
                
                // Connector line to next round
                if(iswest){
                    if (round < 3) {
                        const nextX = 60;
                        const nextY = matchupHeight / 2;
                        g.append('line')
                            .attr('x1', nextX)
                            .attr('y1', nextY)
                            .attr('x2', nextX +20)
                            .attr('y2', nextY)
                            .attr('stroke', strokeColor)
                            .attr('stroke-width', strokeWidth);
                    }
                }
                else{
                    
                    if (round < 3) {
                        const nextX = 60;
                        const nextY = matchupHeight / 2;
                        g.append('line')
                            .attr('x1', nextX - 80)
                            .attr('y1', nextY)
                            .attr('x2', nextX - 60)
                            .attr('y2', nextY)
                            .attr('stroke', strokeColor)
                            .attr('stroke-width', strokeWidth);
                    }}
                return { centerY: y + matchupHeight / 2 };
                }
    
            // Draw West Conference (left side)
            const westX = 10;
            bracketViz.append('text')
                .attr('x', westX)
                .attr('y', 25)
                .style('font-size', '12px')
                .style('font-weight', '600')
                .style('fill', '#3498db')
                .text('WEST');
            
            // West First Round (4 matchups)
            const westR1Y = 40;
            const westR1Positions = [];
            bracket.west.first_round.forEach((matchup, idx) => {
                const isHighlighted = matchup.teams.includes(focusTeam) || matchup.winner === focusTeam;
                const y = westR1Y + idx * (matchupHeight + verticalSpacing);
                const result = drawMatchup(westX, y, matchup, 1, isHighlighted);
                westR1Positions.push(result.centerY);
            });
            
            // West Semifinals (2 matchups) - centered between first round matchups
            const westR2X = westX + roundSpacing;
            const westR2Positions = [];
            bracket.west.semifinals.forEach((matchup, idx) => {
                const isHighlighted = matchup.teams.includes(focusTeam) || matchup.winner === focusTeam;
                // Center between the two corresponding R1 matchups
                const y = (westR1Positions[idx * 2] + westR1Positions[idx * 2 + 1]) / 2 - matchupHeight / 2;
                const result = drawMatchup(westR2X, y, matchup, 2, isHighlighted);
                westR2Positions.push(result.centerY);
                
                // Draw vertical connector from R1 to R2
                const x1 = westX + 80;
                const y1Top = westR1Positions[idx * 2];
                const y1Bottom = westR1Positions[idx * 2 + 1];
                const y2 = result.centerY;
                
                bracketViz.append('line')
                    .attr('x1', x1)
                    .attr('y1', y1Top)
                    .attr('x2', x1)
                    .attr('y2', y1Bottom)
                    .attr('stroke', isHighlighted ? '#27ae60' : '#444')
                    .attr('stroke-width', isHighlighted ? 3 : 1.5);
                
                bracketViz.append('line')
                    .attr('x1', x1)
                    .attr('y1', y2)
                    .attr('x2', westR2X)
                    .attr('y2', y2)
                    .attr('stroke', isHighlighted ? '#27ae60' : '#444')
                    .attr('stroke-width', isHighlighted ? 3 : 1.5);
            });
            
            // West Finals (1 matchup) - centered between semifinals
            const westR3X = westR2X + roundSpacing;
            const westFinalsHighlight = bracket.west.finals.teams.includes(focusTeam) || bracket.west.finals.winner === focusTeam;
            const westFinalsY = (westR2Positions[0] + westR2Positions[1]) / 2 - matchupHeight / 2;
            const westFinalsResult = drawMatchup(westR3X, westFinalsY, bracket.west.finals, 3, westFinalsHighlight);
            
            // Draw vertical connector from R2 to R3
            const x2 = westR2X + 80;
            bracketViz.append('line')
                .attr('x1', x2)
                .attr('y1', westR2Positions[0])
                .attr('x2', x2)
                .attr('y2', westR2Positions[1])
                .attr('stroke', westFinalsHighlight ? '#27ae60' : '#444')
                .attr('stroke-width', westFinalsHighlight ? 3 : 1.5);
            
            bracketViz.append('line')
                .attr('x1', x2)
                .attr('y1', westFinalsResult.centerY)
                .attr('x2', westR3X)
                .attr('y2', westFinalsResult.centerY)
                .attr('stroke', westFinalsHighlight ? '#27ae60' : '#444')
                .attr('stroke-width', westFinalsHighlight ? 3 : 1.5);
            
            // Draw East Conference (right side - mirror of West)
            const eastX = 530;
            bracketViz.append('text')
                .attr('x', eastX + 50)
                .attr('y', 25)
                .style('font-size', '12px')
                .style('font-weight', '600')
                .style('fill', '#e74c3c')
                .text('EAST');
            
            // East First Round
            const eastR1Y = 40;
            const eastR1Positions = [];
            bracket.east.first_round.forEach((matchup, idx) => {
                const isHighlighted = matchup.teams.includes(focusTeam) || matchup.winner === focusTeam;
                const y = eastR1Y + idx * (matchupHeight + verticalSpacing);
                const result = drawMatchup(eastX, y, matchup, 1, isHighlighted, false);
                eastR1Positions.push(result.centerY);
            });
            
            // East Semifinals - centered
            const eastR2X = eastX - roundSpacing;
            const eastR2Positions = [];
            bracket.east.semifinals.forEach((matchup, idx) => {
                const isHighlighted = matchup.teams.includes(focusTeam) || matchup.winner === focusTeam;
                const y = (eastR1Positions[idx * 2] + eastR1Positions[idx * 2 + 1]) / 2 - matchupHeight / 2;
                const result = drawMatchup(eastR2X, y, matchup, 2, isHighlighted, false);
                eastR2Positions.push(result.centerY);
                
                // Connectors
                const x1 = eastX - 20;
                const y1Top = eastR1Positions[idx * 2];
                const y1Bottom = eastR1Positions[idx * 2 + 1];
                const y2 = result.centerY;
                
                bracketViz.append('line')
                    .attr('x1', x1)
                    .attr('y1', y1Top)
                    .attr('x2', x1)
                    .attr('y2', y1Bottom)
                    .attr('stroke', isHighlighted ? '#27ae60' : '#444')
                    .attr('stroke-width', isHighlighted ? 3 : 1.5);
                
                bracketViz.append('line')
                    .attr('x1', x1- 60)
                    .attr('y1', y2)
                    .attr('x2', eastR2X - 20 )
                    .attr('y2', y2)
                    .attr('stroke', isHighlighted ? '#27ae60' : '#444')
                    .attr('stroke-width', isHighlighted ? 3 : 1.5);
            });
            
            // East Finals - centered
            const eastR3X = eastR2X - roundSpacing;
            const eastFinalsHighlight = bracket.east.finals.teams.includes(focusTeam) || bracket.east.finals.winner === focusTeam;
            const eastFinalsY = (eastR2Positions[0] + eastR2Positions[1]) / 2 - matchupHeight / 2;
            const eastFinalsResult = drawMatchup(eastR3X, eastFinalsY, bracket.east.finals, 3, eastFinalsHighlight, false);
            
            // Connectors
            const x3 = eastR2X - 20;
            bracketViz.append('line')
                .attr('x1', x3)
                .attr('y1', eastR2Positions[0])
                .attr('x2', x3)
                .attr('y2', eastR2Positions[1])
                .attr('stroke', eastFinalsHighlight ? '#27ae60' : '#444')
                .attr('stroke-width', eastFinalsHighlight ? 3 : 1.5);
            
            bracketViz.append('line')
                .attr('x1', x3)
                .attr('y1', eastFinalsResult.centerY + 50)
                .attr('x2', eastR3X + 60)
                .attr('y2', eastFinalsResult.centerY + 50)
                .attr('stroke', eastFinalsHighlight ? '#27ae60' : '#444')
                .attr('stroke-width', eastFinalsHighlight ? 3 : 1.5);
            
            // NBA Finals (center) - between West and East finals
            const finalsX = 270;
            const finalsY = (westFinalsResult.centerY + eastFinalsResult.centerY) / 2 - matchupHeight / 2;
            const finalsHighlight = bracket.finals.teams.includes(focusTeam);
            
            const finalsG = bracketViz.append('g')
                .attr('transform', `translate(${finalsX}, ${finalsY - 20})`);
            
            finalsG.append('text')
                .attr('x', 30)
                .attr('y', 0)
                .attr('text-anchor', 'middle')
                .style('font-size', '11px')
                .style('font-weight', 'bold')
                .style('fill', '#f39c12')
                .text('NBA FINALS');
            
            drawMatchup(finalsX, finalsY, bracket.finals, 4, finalsHighlight);
            
            // Connectors to finals
            const finalsConnectY = finalsY + matchupHeight / 2;
            
            // West to Finals - line should touch the West Finals box
            bracketViz.append('line')
                .attr('x1', westR3X + 60)
                .attr('y1', westFinalsResult.centerY)
                .attr('x2', finalsX)
                .attr('y2', finalsConnectY)
                .attr('stroke', westFinalsHighlight || finalsHighlight ? '#27ae60' : '#444')
                .attr('stroke-width', westFinalsHighlight || finalsHighlight ? 3 : 1.5);
            
            // East to Finals - line should touch the East Finals box
            bracketViz.append('line')
                .attr('x1', eastR3X)
                .attr('y1', eastFinalsResult.centerY)
                .attr('x2', finalsX)
                .attr('y2', finalsConnectY)
                .attr('stroke', eastFinalsHighlight || finalsHighlight ? '#27ae60' : '#444')
                .attr('stroke-width', eastFinalsHighlight || finalsHighlight ? 3 : 1.5);
            
            // Champion trophy (lowered below finals box)
            if (bracket.champion) {
                finalsG.append('text')
                    .attr('x', 30)
                    .attr('y', finalsY - finalsY + matchupHeight + 50)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '16px')
                    .text('🏆');
                
                finalsG.append('text')
                    .attr('x', 30)
                    .attr('y', finalsY - finalsY + matchupHeight + 65)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '11px')
                    .style('font-weight', 'bold')
                    .style('fill', bracket.champion === focusTeam ? '#27ae60' : '#f39c12')
                    .text(bracket.champion);
            }
        }

        // Initial render
        updateViz();

        // Store update function globally
        window.updateStartingFiveViz = updateViz;
    }

    // Helper: Draw half-court basketball court
    function createCourtHalfCourt(svg, color) {
        // Half-court simplified view (from baseline to half-court line)
        
        // Baseline
        svg.append('line')
            .attr('x1', -220).attr('y1', 0)
            .attr('x2', 220).attr('y2', 0)
            .attr('stroke', color).attr('stroke-width', 2);

        // Sidelines
        svg.append('line')
            .attr('x1', -220).attr('y1', 0)
            .attr('x2', -220).attr('y2', 230)
            .attr('stroke', color).attr('stroke-width', 2);

        svg.append('line')
            .attr('x1', 220).attr('y1', 0)
            .attr('x2', 220).attr('y2', 230)
            .attr('stroke', color).attr('stroke-width', 2);

        // Three-point arc (arc from left to right, behind the paint)
        // Arc starts at y=200 on both sides, radius of 240 to create realistic arc
        svg.append('path')
            .attr('d', 'M -220 200 A 240 240 0 0 0 220 200')
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2);

        // Paint / Key
        svg.append('rect')
            .attr('x', -80)
            .attr('y', 0)
            .attr('width', 160)
            .attr('height', 190)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2);

        // Free throw line
        svg.append('line')
            .attr('x1', -80).attr('y1', 190)
            .attr('x2', 80).attr('y2', 190)
            .attr('stroke', color).attr('stroke-width', 2);

        // Free throw circle
        svg.append('circle')
            .attr('cx', 0).attr('cy', 190).attr('r', 60)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2);

        // Hoop
        svg.append('circle')
            .attr('cx', 0).attr('cy', 60).attr('r', 15)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2.5);

        // Backboard
        svg.append('line')
            .attr('x1', -30).attr('y1', 40)
            .attr('x2', 30).attr('y2', 40)
            .attr('stroke', color)
            .attr('stroke-width', 3);
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => createStartingFiveViz(), 600);
        });
    } else {
        setTimeout(() => createStartingFiveViz(), 600);
    }

    // Integrate with team selection from other visualizations
    const originalSetTeam = window.setTeamSelection;
    if (originalSetTeam) {
        window.setTeamSelection = function(teamName) {
            originalSetTeam(teamName);
            if (window.updateStartingFiveViz) {
                setTimeout(() => window.updateStartingFiveViz(), 100);
            }
        };
    }

})();
