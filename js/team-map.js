// Team Map (D3 v7) — integrates with nbajs.js via window.setTeamSelection(teamName)
// Data sources: data/map_data/US-states.csv, data/map_data/US-geo.json, data/map_data/NBA-teams.csv

(function(){
  function initMap(){
    console.log('[team-map] initializing');
    const container = d3.select('#team-map');
    if (container.empty()) {
      console.warn('[team-map] #team-map not found at init time.');
      return;
    }
    // const width = Math.max(1000, container.node().clientWidth || 900);
    // const height = Math.max(1000, container.node().clientHeight || 600);
    const width = 600;
    const height = 600;
    container.selectAll('*').remove();

    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height)
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
        .on('click',(event,d)=>{const name = d.abb; if(window.setTeamSelection){window.setTeamSelection(name);}});
      nodes.append('circle')
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
