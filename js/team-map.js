// Team Map (D3 v7) — integrates with nbajs.js via window.setTeamSelection(teamName)
// Data sources: data/map_data/US-states.csv, data/map_data/US-geo.json, data/map_data/NBA-teams.csv
(function(){
  function initMap(){
    console.log('[team-map] initializing');
    const container = d3.select('#team-map-cell');
    if (container.empty()) {
      console.warn('[team-map] #team-map-cell not found at init time.');
      return;
    }
    container.selectAll('*').remove();
    
    const width = 600;
    const height = 600;

    const svg = container.append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('display', 'block');
    const g = svg.append('g').attr('class','map-root');
    const projection = d3.geoAlbersUsa()
      .translate([250, 200])
      .scale(Math.min(width, height) * 1.0);
    const path = d3.geoPath().projection(projection);
    const opacityScale = d3.scaleLinear().range([0.25,0.95]);
    const sizeScale = d3.scaleLinear().range([3,18]);

    // Disable zoom/pan per user request (keep static map)
    // If needed later, restore: const zoom = d3.zoom()... svg.call(zoom)

    const tip = d3.select('body').append('div')
      .attr('class','tooltip team-map-tip')
      .style('position','absolute')
      .style('pointer-events','none')
      .style('padding','8px 10px')
      .style('background','rgba(0,0,0,0.8)')
      .style('color','#fff')
      .style('border-radius','4px')
      .style('font-size','12px')
      .style('opacity',0);
    const EAST_COLOR='#3a7bd5';
    const WEST_COLOR='#e94e77';
    let selectedTeamAbb = null;
    let selectedTeamAbb2 = null;
    
    // Function to highlight selected team(s)
    function highlightSelectedTeam(teamAbb, teamAbb2 = null) {
      selectedTeamAbb = teamAbb;
      selectedTeamAbb2 = teamAbb2;
      
      // Remove all highlights first
      g.selectAll('.team .highlight-ring').attr('opacity', 0);
      g.selectAll('.team .team-circle')
        .attr('stroke', '#222')
        .attr('stroke-width', 1);
      g.selectAll('.team text')
        .attr('fill', '#ddd')
        .style('font-size', '11px');
      
      // Apply highlight to first selected team (yellow)
      if (teamAbb) {
        const selectedTeam = g.select(`.team-${teamAbb.toLowerCase()}`);
        selectedTeam.select('.highlight-ring')
          .transition().duration(300)
          .attr('opacity', 0.9)
          .attr('stroke', '#ffeb3b');
        selectedTeam.select('.team-circle')
          .transition().duration(300)
          .attr('stroke', '#ffeb3b')
          .attr('stroke-width', 2.5);
        selectedTeam.select('text')
          .transition().duration(300)
          .attr('fill', '#ffeb3b')
          .style('font-size', '13px')
          .style('font-weight', '700');
      }
      
      // Apply highlight to second selected team (red)
      if (teamAbb2) {
        const selectedTeam2 = g.select(`.team-${teamAbb2.toLowerCase()}`);
        selectedTeam2.select('.highlight-ring')
          .transition().duration(300)
          .attr('opacity', 0.9)
          .attr('stroke', '#e74c3c');
        selectedTeam2.select('.team-circle')
          .transition().duration(300)
          .attr('stroke', '#e74c3c')
          .attr('stroke-width', 2.5);
        selectedTeam2.select('text')
          .transition().duration(300)
          .attr('fill', '#e74c3c')
          .style('font-size', '13px')
          .style('font-weight', '700');
      }
    }
    
    // Expose function for external updates
    window.highlightTeamOnMap = highlightSelectedTeam;
    
    const isFileProtocol = location.protocol==='file:';
    if (isFileProtocol){
      console.warn('[team-map] file:// detected. Use a local server for data loading.');
      container.append('div')
        .style('color','#ffb3b3')
        .style('padding','8px')
        .style('font','14px sans-serif')
        .text('Warning: start a local server (python -m http.server) for map data.');
    }

    Promise.all([
      d3.csv('data/map_data/US-states.csv'),
      d3.json('data/map_data/US-geo.json'),
      d3.csv('data/map_data/NBA-teams.csv')
    ]).then(([statesMeta, statesGeo, teams])=>{
      console.log('[team-map] data loaded', {states:statesMeta?.length, features:statesGeo?.features?.length, teams:teams?.length});
      const regionByState = new Map(statesMeta.map(d=>[d.state,d.EASTorWEST]));
      statesGeo.features.forEach(f=>{const name=f.properties&&f.properties.name; f.properties=f.properties||{}; f.properties.EASTorWEST=regionByState.get(name)||null;});
      g.selectAll('path.state')
        .data(statesGeo.features)
        .join('path')
        .attr('class', d=>`state ${d.properties.postal||''}`)
        .attr('d', path)
        .attr('fill', d=>{const r=d.properties.EASTorWEST; if(!r) return '#999'; return r==='East'?d3.color(EAST_COLOR).brighter(1.2):d3.color(WEST_COLOR).brighter(1.2);})
        .attr('stroke','#fff')
        .attr('stroke-width',1.2);
      const winrates = teams.map(d=>+d.winrate||0);
      const ranks = teams.map(d=>+d.rank||0);
      opacityScale.domain([d3.min(winrates)||0, d3.max(winrates)||1]);
      sizeScale.domain([d3.min(ranks)||0, d3.max(ranks)||30]);
      const teamG = g.append('g').attr('class','teams-layer');
      const safeProject = d => {const c = projection([+d.lon,+d.lat]); return c || [null,null];};
      const nodes = teamG.selectAll('g.team')
        .data(teams)
        .join('g')
        .attr('class', d=>`team team-${(d.abb||'').toLowerCase()}`)
        .attr('transform', d=>{const p=safeProject(d); return (p[0]==null)?'translate(-1000,-1000)':`translate(${p[0]},${p[1]})`;})
        .style('cursor','pointer')
        .on('mouseenter',(event,d)=>{
          // tooltip
          tip.style('opacity',1)
             .html(`<strong>${d.teamname||d.team||d.abb}</strong><br>Win%: ${(+d.winrate||0).toFixed(1)}%`)
             .style('left',(event.pageX+12)+'px')
             .style('top',(event.pageY+12)+'px');
          // large hover logo (similar to index.js behavior)
          g.selectAll('image.hover-logo').remove();
          const p = safeProject(d);
          if (p[0] != null){
            g.append('image')
              .attr('class','hover-logo')
              .attr('href', `data/logo/${(d.abb||'').toUpperCase()}_logo.svg`)
              .attr('xlink:href', `data/logo/${(d.abb||'').toUpperCase()}_logo.svg`)
              .attr('width', 200)
              .attr('height', 200)
              .attr('x', p[0] + 5)
              .attr('y', p[1] + 5)
              .on('error', function(){ d3.select(this).remove(); });
          }
        })
        .on('mousemove',(event)=>{tip.style('left',(event.pageX+12)+'px').style('top',(event.pageY+12)+'px');})
        .on('mouseleave',()=>{
          tip.style('opacity',0);
          g.selectAll('image.hover-logo').remove();
        })
        .on('click',(event,d)=>{
          const name = d.abb;
          
          // Hold "+" (shift+click) to pick the second comparison team
          if (event.shiftKey) {
            if (window.ctx) {
              window.ctx.team2 = name;
              console.log('[team-map] Second team selected:', name);
            }
            highlightSelectedTeam(selectedTeamAbb, name);
            // Update scatter plot if available
            if (window.updateTeamStatsScatter) {
              window.updateTeamStatsScatter();
            }
            if (window.renderPassingOrRadar) {
              window.renderPassingOrRadar();
            }
            // Show waffle chart comparison
            if (window.renderWaffleComparison) {
              window.renderWaffleComparison();
            }
          } else {
            // Regular click - select first team and clear second
            if (window.ctx) {
              window.ctx.team2 = null;
            }
            if(window.setTeamSelection){window.setTeamSelection(name);} 
            highlightSelectedTeam(d.abb, null);
            if (window.renderPassingOrRadar) {
              window.renderPassingOrRadar();
            }
            // Show calendar (not waffle)
            if (window.initCalendar) {
              window.initCalendar();
            }
          }
        });
      // Highlight ring (drawn first, under the circle)
      nodes.append('circle')
        .attr('class', 'highlight-ring')
        .attr('r', d=>{const r=+d.winrate||0; return d3.scaleLinear().domain([0,d3.max(winrates)||1]).range([4,16])(r) + 6;})
        .attr('fill', 'none')
        .attr('stroke', '#ffeb3b')
        .attr('stroke-width', 3)
        .attr('opacity', 0)
        .style('filter', 'drop-shadow(0 0 8px #ffeb3b)');
      
      nodes.append('circle')
        .attr('class', 'team-circle')
        .attr('r', d=>{const r=+d.winrate||0; return d3.scaleLinear().domain([0,d3.max(winrates)||1]).range([4,16])(r);})
        .attr('fill', d=> (d.EASTorWEST==='East'?EAST_COLOR:WEST_COLOR))
        .attr('opacity', d=> opacityScale(+d.winrate||0))
        .attr('stroke','#222')
        .attr('stroke-width',1);
      // Removed small static logos; using hover instead
      nodes.append('text')
        .attr('dx',8)
        .attr('dy','0.35em')
        .attr('fill','#ddd')
        .style('font-weight','600')
        .style('font-size','11px')
        .text(d=> d.abb || '');

      // Auto-select Golden State Warriors on load
      const defaultTeam = 'GSW';
      requestAnimationFrame(() => {
        const target = g.select(`.team-${defaultTeam.toLowerCase()}`).node();
        if (target) target.dispatchEvent(new Event('click', { bubbles: true }));
      });
    }).catch(err=>{
      console.error('Failed to initialize team map:', err);
      container.append('div')
        .style('color','#f66')
        .style('padding','12px')
        .text('Failed to load map data. If you opened the file directly, please run a local server.');
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
