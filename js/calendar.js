// Calendar visualization for NBA team game results
// Shows a monthly calendar with wins (green), losses (red), and no-game days (last result color)
// Uses real NBA API data from team_schedules_2024-25.json

(function() {
    let currentTeam = null; // No team selected by default
    let currentMonth = 11; // December (0-11)
    let currentYear = 2024;
    let allTeamSchedules = null;
    let teamSchedule = null;
    
    const MONTH_NAMES = [
        'October', 'November', 'Decembre', 'January', 'February', 'March', 'April', 'May'
    ];
    
    // Season months: Oct 2024 to May 2025
    const SEASON_MONTHS = [
        { month: 9, year: 2024, display: 'October' },   // Oct 2024
        { month: 10, year: 2024, display: 'November' }, // Nov 2024
        { month: 11, year: 2024, display: 'December' }, // Dec 2024
        { month: 0, year: 2025, display: 'January' },   // Jan 2025
        { month: 1, year: 2025, display: 'February ' },   // Feb 2025
        { month: 2, year: 2025, display: 'March' },      // Mar 2025
        { month: 3, year: 2025, display: 'April' },     // Apr 2025
        { month: 4, year: 2025, display: 'May' }        // May 2025
    ];
    
    let currentSeasonMonthIndex = 2; // Start at December
    
    function initCalendar() {
        console.log('[calendar] initializing');
        
        // Sync currentTeam with global ctx
        if (window.ctx && window.ctx.team) {
            currentTeam = window.ctx.team;
        }
        
        // Don't show calendar if in comparison mode (two teams selected)
        if (window.ctx && window.ctx.team2) {
            console.log('[calendar] Skipping calendar - in comparison mode');
            if (window.renderWaffleComparison) {
                window.renderWaffleComparison();
            }
            return;
        }
        
        const container = d3.select('#graph-cell-5');
        if (container.empty()) {
            console.warn('[calendar] #graph-cell-5 not found');
            return;
        }
        
        container.selectAll('*').remove();
        
        // Don't show calendar if no team is selected
        if (!currentTeam) {
            console.log('[calendar] No team selected - showing placeholder');
            showPlaceholder(container);
            return;
        }
        
        // Load the schedule data
        d3.json('data/nba_api/team_schedules_2024-25.json').then(data => {
            allTeamSchedules = data;
            console.log('[calendar] loaded schedules for', Object.keys(data).length, 'teams');
            
            if (currentTeam && data[currentTeam]) {
                teamSchedule = processTeamSchedule(data[currentTeam]);
                drawCalendar();
            } else {
                console.error('[calendar] team not found:', currentTeam);
                drawError('Équipe non trouvée');
            }
        }).catch(error => {
            console.error('[calendar] failed to load schedules:', error);
            drawError('Erreur de chargement des données');
        });
    }
    
    function processTeamSchedule(teamData) {
        // Convert games array to a map by date
        const schedule = {};
        
        teamData.games.forEach(game => {
            schedule[game.date] = {
                result: game.result,
                opponent: game.opponent,
                home: game.home,
                points: game.points,
                display_date: game.game_date_display
            };
        });
        
        return {
            games: schedule,
            teamName: teamData.team_name,
            wins: teamData.wins,
            losses: teamData.losses,
            totalGames: teamData.total_games
        };
    }
    
    function drawError(message) {
        const container = d3.select('#graph-cell-5');
        container.selectAll('*').remove();
        
        container.append('div')
            .style('color', '#ff6b6b')
            .style('padding', '20px')
            .style('text-align', 'center')
            .style('font-size', '16px')
            .text(message);
    }
    
    function showPlaceholder(container) {
        container.selectAll('*').remove();
        
        const placeholderDiv = container.append('div')
            .style('display', 'flex')
            .style('flex-direction', 'column')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .style('height', '100%')
            .style('padding', '40px')
            .style('text-align', 'center')
            .style('color', '#95a5a6');
        
        // Icon
        placeholderDiv.append('div')
            .style('font-size', '64px')
            .style('margin-bottom', '20px')
            .style('opacity', '0.3')
            .text('📅');
        
        // Main message
        placeholderDiv.append('div')
            .style('font-size', '18px')
            .style('font-weight', '600')
            .style('margin-bottom', '10px')
            .style('color', '#bdc3c7')
            .text('Sélectionnez une équipe');
        
        // Instruction
        placeholderDiv.append('div')
            .style('font-size', '14px')
            .style('color', '#7f8c8d')
            .html('Cliquez sur une équipe sur la carte pour voir son calendrier<br/><span style="color: #3498db;">Shift + Clic</span> pour comparer deux équipes');
    }
    
    function drawCalendar() {
        const container = d3.select('#graph-cell-5');
        
        if (!teamSchedule) {
            drawError('Pas de données pour cette équipe');
            return;
        }
        
        // Clear existing calendar before drawing new one
        container.selectAll('*').remove();
        
        const containerRect = container.node().getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        
        // Create new SVG with initial opacity 0 (will fade in)
        const svg = container.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('display', 'block')
            .style('opacity', 0);
        
        const margin = { top: 90, right: 20, bottom: 80, left: 20 };
        const calendarWidth = width - margin.left - margin.right;
        const calendarHeight = height - margin.top - margin.bottom;
        
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);
        
        // Title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#fff')
            .text(`Calendrier ${currentTeam} - ${teamSchedule.teamName}`);
        
        // Record
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#ccc')
            .text(`Record: ${teamSchedule.wins}-${teamSchedule.losses}`);
        
        // Month navigation buttons
        const monthGroup = svg.append('g')
            .attr('transform', `translate(0, 55)`);
        
        const buttonWidth = Math.min(90, (width - 40) / SEASON_MONTHS.length - 3);
        const buttonHeight = 25;
        const buttonSpacing = 3;
        const totalButtonWidth = SEASON_MONTHS.length * buttonWidth + (SEASON_MONTHS.length - 1) * buttonSpacing;
        const startX = (width - totalButtonWidth) / 2;
        
        SEASON_MONTHS.forEach((monthInfo, idx) => {
            const monthButton = monthGroup.append('g')
                .attr('transform', `translate(${startX + idx * (buttonWidth + buttonSpacing)}, 0)`)
                .style('cursor', 'pointer')
                .on('click', () => {
                    currentSeasonMonthIndex = idx;
                    currentMonth = monthInfo.month;
                    currentYear = monthInfo.year;
                    drawCalendar();
                })
                .on('mouseover', function() {
                    if (currentSeasonMonthIndex !== idx) {
                        d3.select(this).select('rect')
                            .transition()
                            .duration(200)
                            .attr('fill', '#666')
                            .attr('transform', 'translate(0, -2)');
                    }
                })
                .on('mouseout', function() {
                    if (currentSeasonMonthIndex !== idx) {
                        d3.select(this).select('rect')
                            .transition()
                            .duration(200)
                            .attr('fill', '#555')
                            .attr('transform', 'translate(0, 0)');
                    }
                });
            
            const buttonRect = monthButton.append('rect')
                .attr('width', buttonWidth)
                .attr('height', buttonHeight)
                .attr('rx', 3)
                .attr('fill', currentSeasonMonthIndex === idx ? '#3498db' : '#555')
                .attr('stroke', '#fff')
                .attr('stroke-width', 1);
            
            // Add transition for active state
            if (currentSeasonMonthIndex === idx) {
                buttonRect
                    .transition()
                    .duration(300)
                    .attr('fill', '#3498db');
            }
            
            monthButton.append('text')
                .attr('x', buttonWidth / 2)
                .attr('y', buttonHeight / 2 + 4)
                .attr('text-anchor', 'middle')
                .style('font-size', '11px')
                .style('fill', '#fff')
                .style('pointer-events', 'none')
                .text(monthInfo.display);
        });
        
        // Draw calendar grid
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        
        const cellSize = Math.min(
            (calendarWidth - 50) / 7,
            (calendarHeight - 50) / 6
        );
        
        const calendarStartX = (calendarWidth - (cellSize * 7)) / 2;
        
        // Day labels
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayLabels.forEach((day, idx) => {
            g.append('text')
                .attr('x', calendarStartX + idx * cellSize + cellSize / 2)
                .attr('y', 15)
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('fill', '#ccc')
                .text(day);
        });
        
        // Calculate last result color for off days
        let lastResult = null;
        
        // Get all dates for this month sorted
        const monthDates = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            monthDates.push({ day, dateKey });
        }
        
        // Draw calendar cells
        for (let i = 0; i < monthDates.length; i++) {
            const { day, dateKey } = monthDates[i];
            const dayOfWeek = (firstDay + day - 1) % 7;
            const weekRow = Math.floor((firstDay + day - 1) / 7);
            
            const x = calendarStartX + dayOfWeek * cellSize;
            const y = 30 + weekRow * cellSize;
            
            const gameData = teamSchedule.games[dateKey];
            
            let fillColor = '#444'; // Default no game
            let strokeColor = '#666';
            let displayText = day.toString();
            
            if (gameData) {
                if (gameData.result === 'W') {
                    fillColor = '#28a745'; // Green for win
                    lastResult = 'W';
                } else {
                    fillColor = '#dc3545'; // Red for loss
                    lastResult = 'L';
                }
                strokeColor = '#fff';
            } else {
                // No game: use last result color but faded
                if (lastResult === 'W') {
                    fillColor = '#1a5c2a'; // Darker green
                } else if (lastResult === 'L') {
                    fillColor = '#6b1f2a'; // Darker red
                }
            }
            
            const cellGroup = g.append('g')
                .style('cursor', gameData ? 'pointer' : 'default')
                .style('opacity', 0);
            
            // Animate cell appearance with staggered delay
            cellGroup.transition()
                .delay(i * 15) // Stagger animation: 15ms per cell
                .duration(400)
                .style('opacity', 1);
            
            cellGroup.append('rect')
                .attr('x', x)
                .attr('y', y)
                .attr('width', cellSize - 2)
                .attr('height', cellSize - 2)
                .attr('rx', 3)
                .attr('fill', fillColor)
                .attr('stroke', strokeColor)
                .attr('stroke-width', gameData ? 2 : 1);
            
            // Day number
            cellGroup.append('text')
                .attr('x', x + cellSize / 2)
                .attr('y', y + cellSize / 2 + 5)
                .attr('text-anchor', 'middle')
                .style('font-size', Math.min(14, cellSize / 3) + 'px')
                .style('font-weight', gameData ? 'bold' : 'normal')
                .style('fill', '#fff')
                .style('pointer-events', 'none')
                .text(displayText);
            
            // Add result indicator if game
            if (gameData) {
                cellGroup.append('text')
                    .attr('x', x + cellSize / 2)
                    .attr('y', y + cellSize - 8)
                    .attr('text-anchor', 'middle')
                    .style('font-size', Math.min(10, cellSize / 4) + 'px')
                    .style('font-weight', 'bold')
                    .style('fill', '#fff')
                    .style('pointer-events', 'none')
                    .text(gameData.result);
                
                // Tooltip on hover
                cellGroup.on('mouseover', function(event) {
                    // Scale up the cell on hover
                    d3.select(this).select('rect')
                        .transition()
                        .duration(200)
                        .attr('transform', `translate(${(cellSize - 2) * -0.05}, ${(cellSize - 2) * -0.05})`)
                        .attr('width', (cellSize - 2) * 1.1)
                        .attr('height', (cellSize - 2) * 1.1);
                    
                    const tooltip = svg.append('g')
                        .attr('class', 'calendar-tooltip')
                        .style('opacity', 0);
                    
                    const homeAway = gameData.home ? 'vs' : '@';
                    const tooltipText = [
                        `${gameData.result === 'W' ? 'Victory' : 'Defeat'} ${homeAway} ${gameData.opponent}`,
                        `Score: ${gameData.points} pts`
                    ];
                    
                    const tooltipX = Math.min(event.offsetX, width - 180);
                    const tooltipY = Math.max(event.offsetY - 60, 100);
                    
                    const tooltipBg = tooltip.append('rect')
                        .attr('x', tooltipX - 80)
                        .attr('y', tooltipY)
                        .attr('width', 160)
                        .attr('height', 45)
                        .attr('rx', 5)
                        .attr('fill', '#000')
                        .attr('fill-opacity', 0.95)
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 1);
                    
                    tooltipText.forEach((text, i) => {
                        tooltip.append('text')
                            .attr('x', tooltipX)
                            .attr('y', tooltipY + 18 + i * 18)
                            .attr('text-anchor', 'middle')
                            .style('font-size', '12px')
                            .style('fill', '#fff')
                            .text(text);
                    });
                    
                    // Fade in tooltip
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 1);
                })
                .on('mouseout', function() {
                    // Reset cell scale
                    d3.select(this).select('rect')
                        .transition()
                        .duration(200)
                        .attr('transform', 'translate(0, 0)')
                        .attr('width', cellSize - 2)
                        .attr('height', cellSize - 2);
                    
                    // Fade out and remove tooltip
                    svg.selectAll('.calendar-tooltip')
                        .transition()
                        .duration(150)
                        .style('opacity', 0)
                        .remove();
                });
            }
        }
        
        // Streaks section - ABOVE the legend
        const streaksY = height - 100;
        const streaks = calculateStreaks();
        const rankings = calculateStreakRankings();
        
        // Winning streak
        if (streaks.longestWinStreak.length > 0) {
            const winStreakGroup = svg.append('g')
                .attr('transform', `translate(${margin.left + 20}, ${streaksY})`)
                .style('opacity', 0);
            
            // Animate streak appearance
            winStreakGroup.transition()
                .delay(600)
                .duration(400)
                .style('opacity', 1);
            
            winStreakGroup.append('rect')
                .attr('width', 14)
                .attr('height', 14)
                .attr('rx', 2)
                .attr('fill', '#28a745')
                .attr('stroke', '#fff')
                .attr('stroke-width', 1);
            
            // Title line
            winStreakGroup.append('text')
                .attr('x', 20)
                .attr('y', 10)
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('fill', '#28a745')
                .text('longuest winning streak:');
            
            // Value and ranking on second line
            winStreakGroup.append('text')
                .attr('x', 20)
                .attr('y', 26)
                .style('font-size', '11px')
                .style('fill', '#fff')
                .text(`${streaks.longestWinStreak.length} matchs (${rankings.winRank}e over 30)`);
            
            // Dates on third line
            winStreakGroup.append('text')
                .attr('x', 20)
                .attr('y', 40)
                .style('font-size', '9px')
                .style('fill', '#aaa')
                .text(`${streaks.longestWinStreak.start} → ${streaks.longestWinStreak.end}`);
        }
        
        // Losing streak
        if (streaks.longestLoseStreak.length > 0) {
            const loseStreakGroup = svg.append('g')
                .attr('transform', `translate(${width / 2 + 40}, ${streaksY})`)
                .style('opacity', 0);
            
            // Animate streak appearance with slight delay after win streak
            loseStreakGroup.transition()
                .delay(650)
                .duration(400)
                .style('opacity', 1);
            
            loseStreakGroup.append('rect')
                .attr('width', 14)
                .attr('height', 14)
                .attr('rx', 2)
                .attr('fill', '#dc3545')
                .attr('stroke', '#fff')
                .attr('stroke-width', 1);
            
            // Title line
            loseStreakGroup.append('text')
                .attr('x', 20)
                .attr('y', 10)
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('fill', '#dc3545')
                .text('longuest losing streak:');
            
            // Value and ranking on second line
            loseStreakGroup.append('text')
                .attr('x', 20)
                .attr('y', 26)
                .style('font-size', '11px')
                .style('fill', '#fff')
                .text(`${streaks.longestLoseStreak.length} matchs (${rankings.lossRank}e over 30)`);
            
            // Dates on third line
            loseStreakGroup.append('text')
                .attr('x', 20)
                .attr('y', 40)
                .style('font-size', '9px')
                .style('fill', '#aaa')
                .text(`${streaks.longestLoseStreak.start} → ${streaks.longestLoseStreak.end}`);
        }
        
        // Legend
        const legendY = height - 22;
        const legendGroup = svg.append('g')
            .attr('transform', `translate(${width / 2 - 150}, ${legendY})`)
            .style('opacity', 0);
        
        // Animate legend appearance
        legendGroup.transition()
            .delay(700)
            .duration(400)
            .style('opacity', 1);
        
        const legendData = [
            { label: 'Victory', color: '#28a745' },
            { label: 'Defeat', color: '#dc3545' },
            { label: 'No game', color: '#444' }
        ];
        
        legendData.forEach((item, idx) => {
            const legendItem = legendGroup.append('g')
                .attr('transform', `translate(${idx * 100}, 0)`);
            
            legendItem.append('rect')
                .attr('width', 15)
                .attr('height', 15)
                .attr('rx', 2)
                .attr('fill', item.color)
                .attr('stroke', '#fff')
                .attr('stroke-width', 1);
            
            legendItem.append('text')
                .attr('x', 20)
                .attr('y', 12)
                .style('font-size', '11px')
                .style('fill', '#ccc')
                .text(item.label);
        });
        
        // Month record
        const monthRecord = calculateMonthRecord();
        if (monthRecord.games > 0) {
            svg.append('text')
                .attr('x', width - margin.right - 10)
                .attr('y', legendY + 12)
                .attr('text-anchor', 'end')
                .style('font-size', '12px')
                .style('fill', '#fff')
                .text(`This month: ${monthRecord.wins}-${monthRecord.losses}`);
        }
        
        // Fade in the new calendar
        svg.transition()
            .duration(400)
            .style('opacity', 1);
    }
    
    function calculateMonthRecord() {
        let wins = 0;
        let losses = 0;
        let games = 0;
        
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const game = teamSchedule.games[dateKey];
            
            if (game) {
                games++;
                if (game.result === 'W') wins++;
                else losses++;
            }
        }
        
        return { wins, losses, games };
    }
    
    function calculateStreaks() {
        // Get all games sorted by date
        const allGames = [];
        for (const dateKey in teamSchedule.games) {
            const game = teamSchedule.games[dateKey];
            allGames.push({
                date: dateKey,
                result: game.result,
                display: game.display_date || dateKey
            });
        }
        
        // Sort by date (oldest first)
        allGames.sort((a, b) => a.date.localeCompare(b.date));
        
        // Find longest streaks
        let currentStreak = { type: null, length: 0, games: [] };
        let longestWinStreak = { length: 0, games: [] };
        let longestLoseStreak = { length: 0, games: [] };
        
        for (const game of allGames) {
            if (game.result === currentStreak.type) {
                // Continue current streak
                currentStreak.length++;
                currentStreak.games.push(game);
            } else {
                // New streak starts
                // Check if previous streak was a record
                if (currentStreak.type === 'W' && currentStreak.length > longestWinStreak.length) {
                    longestWinStreak = { ...currentStreak };
                } else if (currentStreak.type === 'L' && currentStreak.length > longestLoseStreak.length) {
                    longestLoseStreak = { ...currentStreak };
                }
                
                // Start new streak
                currentStreak = {
                    type: game.result,
                    length: 1,
                    games: [game]
                };
            }
        }
        
        // Check final streak
        if (currentStreak.type === 'W' && currentStreak.length > longestWinStreak.length) {
            longestWinStreak = { ...currentStreak };
        } else if (currentStreak.type === 'L' && currentStreak.length > longestLoseStreak.length) {
            longestLoseStreak = { ...currentStreak };
        }
        
        // Format streak information
        const formatStreak = (streak) => {
            if (streak.length === 0) return { length: 0, start: '', end: '' };
            
            const startDate = new Date(streak.games[0].date);
            const endDate = new Date(streak.games[streak.games.length - 1].date);
            
            const formatDate = (date) => {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Agu', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${date.getDate()} ${months[date.getMonth()]}`;
            };
            
            return {
                length: streak.length,
                start: formatDate(startDate),
                end: formatDate(endDate)
            };
        };
        
        return {
            longestWinStreak: formatStreak(longestWinStreak),
            longestLoseStreak: formatStreak(longestLoseStreak)
        };
    }
    
    function calculateStreakRankings() {
        if (!allTeamSchedules) {
            return { winRank: '?', lossRank: '?' };
        }
        
        // Calculate streaks for all teams
        const allStreaks = [];
        
        for (const teamAbb in allTeamSchedules) {
            const teamData = allTeamSchedules[teamAbb];
            const games = teamData.games.sort((a, b) => a.date.localeCompare(b.date));
            
            let currentStreak = { type: null, length: 0 };
            let maxWinStreak = 0;
            let maxLossStreak = 0;
            
            for (const game of games) {
                if (game.result === currentStreak.type) {
                    currentStreak.length++;
                } else {
                    if (currentStreak.type === 'W') {
                        maxWinStreak = Math.max(maxWinStreak, currentStreak.length);
                    } else if (currentStreak.type === 'L') {
                        maxLossStreak = Math.max(maxLossStreak, currentStreak.length);
                    }
                    currentStreak = { type: game.result, length: 1 };
                }
            }
            
            // Check final streak
            if (currentStreak.type === 'W') {
                maxWinStreak = Math.max(maxWinStreak, currentStreak.length);
            } else if (currentStreak.type === 'L') {
                maxLossStreak = Math.max(maxLossStreak, currentStreak.length);
            }
            
            allStreaks.push({
                team: teamAbb,
                winStreak: maxWinStreak,
                lossStreak: maxLossStreak
            });
        }
        
        // Get current team streaks
        const currentStreaks = calculateStreaks();
        const currentWinStreak = currentStreaks.longestWinStreak.length;
        const currentLossStreak = currentStreaks.longestLoseStreak.length;
        
        // Sort by win streak (descending) and find rank
        const sortedByWins = [...allStreaks].sort((a, b) => b.winStreak - a.winStreak);
        const winRank = sortedByWins.findIndex(s => s.team === currentTeam) + 1;
        
        // Sort by loss streak (descending) and find rank
        const sortedByLosses = [...allStreaks].sort((a, b) => b.lossStreak - a.lossStreak);
        const lossRank = sortedByLosses.findIndex(s => s.team === currentTeam) + 1;
        
        return {
            winRank: winRank > 0 ? winRank : '?',
            lossRank: lossRank > 0 ? lossRank : '?'
        };
    }
    
    function updateCalendarTeam(teamAbb) {
        console.log('[calendar] updating team to:', teamAbb);
        currentTeam = teamAbb;
        
        // If no team selected, show placeholder
        if (!teamAbb) {
            const container = d3.select('#graph-cell-5');
            container.selectAll('*').remove();
            showPlaceholder(container);
            return;
        }
        
        if (allTeamSchedules && allTeamSchedules[teamAbb]) {
            const container = d3.select('#graph-cell-5');
            
            // Direct update without transition for smooth team switching
            container.selectAll('*').remove();
            teamSchedule = processTeamSchedule(allTeamSchedules[teamAbb]);
            drawCalendar();
        } else if (allTeamSchedules) {
            console.error('[calendar] team not found:', teamAbb);
            drawError('Équipe non trouvée: ' + teamAbb);
        }
        // If allTeamSchedules is null, data is still loading
    }
    
    // Expose functions globally
    window.initCalendar = initCalendar;
    window.updateCalendarTeam = updateCalendarTeam;
    
})();
