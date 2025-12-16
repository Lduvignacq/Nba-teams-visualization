// Radar chart for comparing two teams (used when ctx.team2 is set)
// Data source: data/nba_api/game_statistics/per_100.csv (same as team_stats.js)

(function() {
	'use strict';

	async function createRadarChart(containerSel, season, team1, team2) {
		const container = containerSel ? containerSel : d3.select('#passing-chart-cell');
		if (container.empty()) {
			console.warn('[radar] container not found');
			return;
		}

		const width = 700;
		const height = 600;
		const margin = 80;
		const radius = Math.min(width, height) / 2 - margin;

		const svg = container.append('svg')
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('viewBox', `0 0 ${width} ${height}`)
			.attr('preserveAspectRatio', 'xMidYMid meet');

		const g = svg.append('g')
			.attr('transform', `translate(${width / 2}, ${height / 2})`);

		let data;
		try {
			data = await d3.csv('data/nba_api/game_statistics/per_100.csv');
		} catch (err) {
			console.error('[radar] failed to load per_100.csv', err);
			container.append('div')
				.style('color', '#f66')
				.style('padding', '12px')
				.text('Failed to load radar data');
			return;
		}

		const seasonData = data.filter(d => d.Season === season && d.abb);
		const teamRow1 = seasonData.find(d => d.abb === team1);
		const teamRow2 = seasonData.find(d => d.abb === team2);

		if (!teamRow1 || !teamRow2) {
			container.append('div')
				.style('color', '#f6d55c')
				.style('padding', '12px')
				.text('Radar unavailable: team data missing for this season');
			return;
		}

		// Metrics chosen for balance (offense/defense/pace/efficiency)
		const metrics = [
			'W_PCT',
			'E_OFF_RATING',
			'E_DEF_RATING',
			'E_NET_RATING',
			'E_REB_PCT',
			'E_TM_TOV_PCT'
		].filter(m => m in teamRow1 && m in teamRow2);

		if (!metrics.length) {
			container.append('div')
				.style('color', '#f6d55c')
				.style('padding', '12px')
				.text('Radar unavailable: metrics not found');
			return;
		}

		// Compute per-metric domain across season for fair scaling
		const domains = {};
		metrics.forEach(metric => {
			const vals = seasonData
				.map(d => +d[metric])
				.filter(v => Number.isFinite(v));
			const min = d3.min(vals);
			const max = d3.max(vals);
			const pad = (max - min) * 0.05 || 1;
			domains[metric] = [min - pad, max + pad];
		});

		const angleSlice = (Math.PI * 2) / metrics.length;

		function pointFor(teamRow, i) {
			const metric = metrics[i];
			const value = +teamRow[metric];
			const [min, max] = domains[metric];
			const scale = d3.scaleLinear().domain([min, max]).range([0, radius]);
			const r = scale(value);
			const angle = angleSlice * i - Math.PI / 2;
			return {
				x: r * Math.cos(angle),
				y: r * Math.sin(angle)
			};
		}

		// Grid
		const levels = 5;
		for (let l = 1; l <= levels; l++) {
			const levelFactor = (radius / levels) * l;
			g.append('circle')
				.attr('class', 'grid-circle')
				.attr('r', levelFactor)
				.attr('fill', 'none')
				.attr('stroke', '#555')
				.attr('stroke-width', 0.6)
				.attr('opacity', 0.4);
		}

		// Axes and labels
		const axis = g.selectAll('.axis')
			.data(metrics)
			.enter()
			.append('g')
			.attr('class', 'axis');

		axis.append('line')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2))
			.attr('y2', (d, i) => radius * Math.sin(angleSlice * i - Math.PI / 2))
			.attr('stroke', '#777')
			.attr('stroke-width', 1)
			.attr('opacity', 0.6);

		axis.append('text')
			.attr('class', 'legend')
			.attr('text-anchor', 'middle')
			.attr('dy', '0.35em')
			.attr('x', (d, i) => (radius + 18) * Math.cos(angleSlice * i - Math.PI / 2))
			.attr('y', (d, i) => (radius + 18) * Math.sin(angleSlice * i - Math.PI / 2))
			.style('font-size', '11px')
			.style('fill', '#ddd')
			.text(d => d.replace(/_/g, ' '));

		// Axis max labels to give a sense of scale per metric
		axis.append('text')
			.attr('class', 'axis-max')
			.attr('text-anchor', 'middle')
			.attr('dy', '0.35em')
			.attr('x', (d, i) => (radius + 4) * Math.cos(angleSlice * i - Math.PI / 2))
			.attr('y', (d, i) => (radius + 4) * Math.sin(angleSlice * i - Math.PI / 2))
			.style('font-size', '9px')
			.style('fill', '#aaa')
			.text(d => domains[d][1].toFixed(2));

		const color1 = '#ffeb3b';
		const color2 = '#e74c3c';

		function buildPath(teamRow) {
			return d3.line()
				.x((d, i) => pointFor(teamRow, i).x)
				.y((d, i) => pointFor(teamRow, i).y)
				.curve(d3.curveLinearClosed)(metrics);
		}

		// Area & stroke for team 1
		g.append('path')
			.attr('class', 'radar-area team1')
			.attr('d', buildPath(teamRow1))
			.attr('fill', color1)
			.attr('fill-opacity', 0.15)
			.attr('stroke', color1)
			.attr('stroke-width', 2.5);

		// Area & stroke for team 2
		g.append('path')
			.attr('class', 'radar-area team2')
			.attr('d', buildPath(teamRow2))
			.attr('fill', color2)
			.attr('fill-opacity', 0.12)
			.attr('stroke', color2)
			.attr('stroke-width', 2.5);

		const tooltip = d3.select('body').append('div')
			.attr('class', 'radar-tooltip')
			.style('position', 'absolute')
			.style('pointer-events', 'none')
			.style('padding', '8px 10px')
			.style('background', 'rgba(0,0,0,0.85)')
			.style('color', '#fff')
			.style('border-radius', '4px')
			.style('font-size', '12px')
			.style('opacity', 0)
			.style('z-index', 1000);

		// Dots with hover tooltip
		[
			{ row: teamRow1, color: color1, label: team1 },
			{ row: teamRow2, color: color2, label: team2 }
		].forEach(({ row, color, label }) => {
			g.selectAll(`.radar-dot-${color.replace('#', '')}`)
				.data(metrics)
				.enter()
				.append('circle')
				.attr('r', 4.5)
				.attr('fill', color)
				.attr('cx', (d, i) => pointFor(row, i).x)
				.attr('cy', (d, i) => pointFor(row, i).y)
				.attr('stroke', '#111')
				.attr('stroke-width', 1)
				.on('mouseenter', function(event, metric) {
					const value = +row[metric];
					d3.select(this).transition().duration(120).attr('r', 6);
					tooltip.style('opacity', 1)
						.html(`<strong>${label}</strong><br>${metric.replace(/_/g,' ')}: ${value.toFixed(3)}`);
				})
				.on('mousemove', function(event) {
					tooltip.style('left', (event.pageX + 12) + 'px')
						   .style('top', (event.pageY + 12) + 'px');
				})
				.on('mouseleave', function() {
					d3.select(this).transition().duration(120).attr('r', 4.5);
					tooltip.style('opacity', 0);
				});
		});

		// Legend
		const legend = svg.append('g')
			.attr('transform', `translate(${margin * 0.8}, ${margin * 0.8})`);

		const legendItems = [
			{ label: team1, color: color1 },
			{ label: team2, color: color2 }
		];

		const li = legend.selectAll('.legend-item')
			.data(legendItems)
			.enter()
			.append('g')
			.attr('class', 'legend-item')
			.attr('transform', (d, i) => `translate(0, ${i * 18})`);

		li.append('rect')
			.attr('width', 14)
			.attr('height', 14)
			.attr('rx', 3)
			.attr('ry', 3)
			.attr('fill', d => d.color);

		li.append('text')
			.attr('x', 20)
			.attr('y', 10.5)
			.style('fill', '#eee')
			.style('font-size', '12px')
			.text(d => d.label);

		// Title
		svg.append('text')
			.attr('x', width / 2)
			.attr('y', margin * 0.6)
			.attr('text-anchor', 'middle')
			.style('fill', '#fff')
			.style('font-size', '16px')
			.style('font-weight', '700')
			.text(`${team1} vs ${team2} — ${season}`);
	}

	// expose globally
	window.createRadarChart = createRadarChart;
})();
