const ctx = {
    REFERENCE_YEAR: "2010", // year used as a reference, between 1948 and 2021
    w: 1200,
    h: 900,
    GREY_NULL: "#333",
    STAGE_DURATION: 1000,
    DOUBLE_CLICK_THRESHOLD: 320,
    totalStripPlotHeight: 420,
    totalLinePlotHeight: 900,
    vmargin: 2,
    hmargin: 4,
    timeParser: d3.timeParse("%Y-%m-%d"),
    yearAxisHeight: 20,
    linePlot: false,
    crossSeriesTempExtent: [0, 0],
    season : "2024-25",
    team: "ATL"
};
const config = {
    margin: { top: 60, right: 60, bottom: 80, left: 80 },
    colors: {
        made: '#28a745',
        missed: '#dc3545',
        primary: '#e74c3c',
        secondary: '#3498db',
        accent: '#1abc9c',
        dark: '#2c3e50'
    }
};
// The column names of CITY_NAMES to be exctracted from the dataset

function createCourt(svg, color) {
  // Court boundaries
  svg.append("line")
    .attr("x1", -220).attr("y1", 0)
    .attr("x2", -220).attr("y2", 80)
    .attr("stroke", color).attr("stroke-width", 2);

  svg.append("line")
    .attr("x1", 220).attr("y1", 0)
    .attr("x2", 220).attr("y2", 80)
    .attr("stroke", color).attr("stroke-width", 2);

  // Three-point arc
  svg.append("path")
    .attr("d", d3.arc()
      .innerRadius(220)
      .outerRadius(220)
      .startAngle(Math.PI/2)
      .endAngle(3 * Math.PI /2)
    )
    .attr("transform", "translate(0,80)")
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2);

  // Paint / Key
  svg.append("rect")
    .attr("x", -80)
    .attr("y", 0)
    .attr("width", 160)
    .attr("height", 190)
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2);

  // Inner paint lines (optional)
  svg.append("line").attr("x1", -60).attr("y1", 0).attr("x2", -60).attr("y2", 190)
    .attr("stroke", color).attr("stroke-width", 2);
  svg.append("line").attr("x1", 60).attr("y1", 0).attr("x2", 60).attr("y2", 190)
    .attr("stroke", color).attr("stroke-width", 2);

  // Free throw line
  svg.append("line")
    .attr("x1", -80).attr("y1", 190)
    .attr("x2", 80).attr("y2", 190)
    .attr("stroke", color).attr("stroke-width", 2);

  // Free throw circle
  svg.append("circle")
    .attr("cx", 0).attr("cy", 190).attr("r", 60)
    .attr("fill", "none").attr("stroke", color).attr("stroke-width", 2);

  // Hoop
  svg.append("circle")
    .attr("cx", 0).attr("cy", 60).attr("r", 15)
    .attr("fill", "none").attr("stroke", color).attr("stroke-width", 2);

  // Backboard
  svg.append("line")
    .attr("x1", -30).attr("y1", 40)
    .attr("x2", 30).attr("y2", 40)
    .attr("stroke", color).attr("stroke-width", 2);
}
async function drawShotChart(courtGroup, season, opts = {}, team = "ATL") {
    const path = `data/nba_api/shot_per_season/shot_chart_team_${season}.csv`;
    console.log("Loading shot data from:", path);
    console.log("season:", season);
    team = ctx.abbreviationtoname[team] || team;
    let data;
    try {
        data = await d3.csv(path);
    } catch (e) {
        console.error("Failed to load shot CSV:", path, e);
        return;
    }
    if (team && team !== "All teams") {
        data = data.filter(d => d.TEAM_NAME === team);
    }
    console.log(`Loaded ${data.length} shots for season ${season}` + (team && team !== "All teams" ? ` and team ${team}` : ""));
    // remove previous points layer and create a new one
    courtGroup.selectAll(".shots-layer").remove();
    const shotsG = courtGroup.append("g").attr("class", "shots-layer");

    // use your existing drawShotsPoints function (expects (g, data))
    // drawShotsPoints(shotsG, data);
    drawShotsHex(shotsG, data, opts.width || 200, opts.height || 170, {
        gridsize: opts.gridsize || 20,
        mincount: opts.mincount || 200
    });
}
function createTooltip() {
    return d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 1000);
}
function drawShotsPoints(g, data) {
    const made = data.filter(d => +d.SHOT_MADE_FLAG === 1);
    const missed = data.filter(d => +d.SHOT_MADE_FLAG === 0);

    g.selectAll(".made-shot")
        .data(made)
        .join("circle")
        .attr("class", "made-shot")
        .attr("cx", d => +d.LOC_X)
        .attr("cy", d => +d.LOC_Y + 60)
        .attr("r", 3)
        .attr("fill", config.colors.made)
        .attr("opacity", 0);
    g.selectAll(".made-shot")
        .transition()
        .duration(100)
        .delay((d, i) => i * 2)
        .attr("opacity", 0.6);
    g.selectAll(".missed-shot")
        .data(missed)
        .join("circle")
        .attr("class", "missed-shot")
        .attr("cx", d => +d.LOC_X)
        .attr("cy", d => +d.LOC_Y + 60)
        .attr("r", 3)
        .attr("fill", config.colors.missed)
        .attr("opacity", 0);
    g.selectAll(".missed-shot")
        .transition()
        .duration(100)
        .delay((d, i) => i * 2)
        .attr("opacity", 0.6);
}
function drawShotsHex(g, data, width, height, { gridsize = 25, mincount = 1 } = {}) {
    // remove previous layer
    g.selectAll(".hex-layer").remove();

    if (!data || data.length === 0) return;

    // radius derived from gridsize, clamped to reasonable values
    const rawRadius = Math.max(width, height) / Math.max(8, gridsize);
    const radius = Math.max(6, Math.min(80, rawRadius));

    const hexbin = d3.hexbin()
        .x(d => +d.LOC_X)
        .y(d => +d.LOC_Y + 60) // keep same vertical alignment as points/court
        .radius(radius)
        .extent([[-250, 0], [250, 470]]);

    const bins = hexbin(data);
    if (!bins || bins.length === 0) return;

    // FILTERED BINS (only those we will draw)
    const filteredBins = bins.filter(b => b.length >= mincount);
    if (!filteredBins.length) return; // nothing to draw

    // compute counts and max from the filtered set so colors rescale with mincount
    const counts = filteredBins.map(b => b.length);
    const maxCount = d3.max(counts) || 1;
    const minCount = d3.min(counts) || 1;

    // color mapping: handle single-value and multi-value cases
    const colorInterpolator = d3.interpolatePlasma;
    let fillForCount;
    if (maxCount === minCount) {
        // all visible bins have same count -> use a single color
        const t = 0.7;
        fillForCount = () => colorInterpolator(t);
    } else {
        const logScale = d3.scaleLog().domain([Math.max(1, minCount), Math.max(2, maxCount)]).range([0.15, 1]);
        fillForCount = (c) => colorInterpolator(logScale(Math.max(1, c)));
    }

    const tooltip = createTooltip();

    const hexGroup = g.append("g").attr("class", "hex-layer");

    hexGroup.selectAll("path")
        .data(filteredBins)
        .join(
            enter => enter.append("path")
                .attr("d", () => hexbin.hexagon())
                .attr("transform", d => `translate(${d.x},${d.y})`)
                .attr("fill", d => fillForCount(d.length))
                .attr("stroke", "rgba(0,0,0,0.08)")
                .attr("opacity", 0)
                .transition().duration(350).attr("opacity", 0.95),
            update => update
                .transition().duration(300)
                .attr("transform", d => `translate(${d.x},${d.y})`)
                .attr("fill", d => fillForCount(d.length))
                .attr("opacity", 0.95),
            exit => exit.transition().duration(200).attr("opacity", 0).remove()
        )
        .on("mouseenter", (event, d) => {
            const made = d.reduce((acc, v) => acc + (+v.SHOT_MADE_FLAG || 0), 0);
            const pct = ((made / d.length) * 100).toFixed(1);
            tooltip.style("opacity", 1)
                .html(`Shots: ${d.length}<br>FG%: ${pct}%`)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY + 12) + "px");
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 12) + "px")
                   .style("top", (event.pageY + 12) + "px");
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));
}


async function createPassingChordInSvg(svgEl, csvPath, teamnameabbr, opts = {}) {
    const width = opts.width || 800;
    const height = opts.height || 800;
    const innerRadius = opts.innerRadius || Math.min(width, height) * 0.35;
    const outerRadius = opts.outerRadius || innerRadius + 16;
    const cx = opts.cx ?? width / 2;
    const cy = opts.cy ?? height / 2;
    const color = d3.scaleOrdinal(d3.schemeTableau10);
    
    console.log("Drawing passing chord for teametc:", teamnameabbr);
    
    svgEl.selectAll(".pass-group").remove();
    const gRoot = svgEl.append("g")
        .attr("class", "pass-group")
        .attr("transform", `translate(${cx},${cy})`);
    console.log(csvPath);
    let data;
    try {
        console.log("Loading passing data from:", csvPath);
        data = await d3.csv(csvPath);
        console.log("Loaded passing data:", data.length, "rows");
        data = data.filter(d => d.Team === teamnameabbr);
    } catch (err) {
        console.error("Failed to load CSV:", err);
        gRoot.append("text").text("Failed to load CSV").attr("text-anchor", "middle");
        return;
    }

    const players = Array.from(new Set(data.flatMap(d => [d.Passer, d.Receiver])));
    const n = players.length;
    if (n === 0) {
        gRoot.append("text").text("No pass data").attr("text-anchor", "middle");
        return;
    }

    // Directed matrix
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    data.forEach(d => {
        const i = players.indexOf(d.Passer);
        const j = players.indexOf(d.Receiver);
        if (i >= 0 && j >= 0) matrix[i][j] += +d.Passes || 0;
    });

    // Combine pairs
    const combined = Array.from({ length: n }, () => Array(n).fill(0));
    const proportions = {};
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const aToB = matrix[i][j];
            const bToA = matrix[j][i];
            const total = aToB + bToA;
            if (total > 0) {
                combined[i][j] = combined[j][i] = total;
                proportions[`${i}-${j}`] = { aToB, bToA, total, ratio: aToB / total };
            }
        }
    }

    const chord = d3.chord().padAngle(0.03).sortSubgroups(d3.descending)(combined);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    const ribbon = d3.ribbon().radius(innerRadius - 2);
    const defs = gRoot.append("defs");

    // --- Gradients per ribbon ---
    chord.forEach(d => {
        const i = Math.min(d.source.index, d.target.index);
        const j = Math.max(d.source.index, d.target.index);
        const info = proportions[`${i}-${j}`];
        if (!info) return;

        const id = `grad-${i}-${j}`;
        const grad = defs.append("linearGradient")
            .attr("id", id)
            .attr("gradientUnits", "userSpaceOnUse"); // align gradient in SVG coords

        // compute ribbon endpoint coordinates in local gRoot coords (center = 0,0)
        const aSrc = (d.source.startAngle + d.source.endAngle) / 2 - Math.PI / 2;
        const aTgt = (d.target.startAngle + d.target.endAngle) / 2 - Math.PI / 2;
        const x1 = Math.cos(aSrc) * innerRadius;
        const y1 = Math.sin(aSrc) * innerRadius;
        const x2 = Math.cos(aTgt) * innerRadius;
        const y2 = Math.sin(aTgt) * innerRadius;
        grad.attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2);

        // choose colors according to the ribbon orientation (source -> target)
        const srcColor = color(players[d.source.index]);
        const tgtColor = color(players[d.target.index]);

        // compute stop offset according to proportions object (which is keyed by min/max indices)
        // if the chord's source corresponds to the stored 'i' then ratio = aToB, otherwise invert
        const pairInfo = info; // { aToB, bToA, total, ratio } where ratio = aToB/total for i->j
        const storedI = i, storedJ = j;
        let ratioForThisOrientation;
        if (d.source.index === storedI && d.target.index === storedJ) {
            ratioForThisOrientation = pairInfo.ratio; // a->b
        } else {
            ratioForThisOrientation = 1 - pairInfo.ratio; // b->a
        }
        const stop = Math.max(0, Math.min(100, Math.round(ratioForThisOrientation * 100)));

        // create a small hard transition between colors to make the split visible
        grad.append("stop").attr("offset", "0%").attr("stop-color", srcColor);
        grad.append("stop").attr("offset", `${stop}%`).attr("stop-color", srcColor);
        grad.append("stop").attr("offset", `${Math.min(100, stop + 0.5)}%`).attr("stop-color", tgtColor);
        grad.append("stop").attr("offset", "100%").attr("stop-color", tgtColor);
    });

    // --- Arcs ---
    const arcs = gRoot.append("g")
        .selectAll("path")
        .data(chord.groups)
        .join("path")
        .attr("fill", d => color(players[d.index]))
        .attr("d", arc);

    // --- Ribbons ---
    const ribbons = gRoot.append("g")
        .attr("class", "ribbons")
        .selectAll("path")
        .data(chord)
        .join("path")
        .attr("d", ribbon)
        .attr("fill", d => {
            const i = Math.min(d.source.index, d.target.index);
            const j = Math.max(d.source.index, d.target.index);
            return `url(#grad-${i}-${j})`;
        })
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.2)
        // set initial opacity via style (use a single property everywhere)
        .style("opacity", 0.5)
        .on("mouseenter", function (event, d) {
            // stop running transitions
            ribbons.interrupt();
            arcs.interrupt();

            // dim all ribbons & arcs
            ribbons.style("opacity", 0.1);
            arcs.style("opacity", 0.2);

            // highlight current ribbon and its two arcs
            d3.select(this).raise().style("opacity", 1);
            const i = Math.min(d.source.index, d.target.index);
            const j = Math.max(d.source.index, d.target.index);
            arcs.filter(a => a.index === i || a.index === j).style("opacity", 1);
        })
        .on("mouseleave", function () {
            // restore everything with a smooth transition
            ribbons.interrupt().transition().duration(180).style("opacity", 0.5);
            d3.select(this).interrupt().transition().duration(180).style("opacity", 0.5);
            arcs.interrupt().transition().duration(180).style("opacity", 0.9);
        })
        .append("title")
        .text(d => {
            const i = Math.min(d.source.index, d.target.index);
            const j = Math.max(d.source.index, d.target.index);
            const info = proportions[`${i}-${j}`];
            if (!info) return '';
            const a = players[i], b = players[j];
            const { aToB, bToA, total } = info;
            return `${a} ↔ ${b}\nTotal: ${total}\n${a}→${b}: ${aToB} (${(aToB/total*100).toFixed(1)}%)\n${b}→${a}: ${bToA} (${(bToA/total*100).toFixed(1)}%)`;
        });

    // --- Labels ---
    gRoot.append("g")
        .selectAll("text")
        .data(chord.groups)
        .join("text")
        .attr("dy", "0.35em")
        .attr("transform", d => {
            const angle = (d.startAngle + d.endAngle) / 2;
            const rotate = angle * 180 / Math.PI - 90;
            const flip = angle > Math.PI ? "rotate(180)" : "";
            return `rotate(${rotate}) translate(${outerRadius + 22}) ${flip}`;
        })
        .attr("text-anchor", d => {
            const angle = (d.startAngle + d.endAngle) / 2;
            return angle > Math.PI ? "end" : "start";
        })
        .text(d => players[d.index])
        .style("font-size", "11px");
}

function setupSeasonteamSelector(defaultSeason = "2024-25") {
    const seasons = [
        "2000-01","2001-02","2002-03","2003-04","2004-05","2005-06","2006-07",
        "2007-08","2008-09","2009-10","2010-11","2011-12","2012-13","2013-14",
        "2014-15","2015-16","2016-17","2017-18","2018-19","2019-20","2020-21",
        "2021-22","2022-23","2023-24","2024-25"
    ];
    ctx.nametoabbreviation = {'Atlanta Hawks': 'ATL', 'Boston Celtics': 'BOS', 'Cleveland Cavaliers': 'CLE', 'New Orleans Pelicans': 'NOP', 'Chicago Bulls': 'CHI', 'Dallas Mavericks': 'DAL', 'Denver Nuggets': 'DEN', 'Golden State Warriors': 'GSW', 'Houston Rockets': 'HOU', 'Los Angeles Clippers': 'LAC', 'Los Angeles Lakers': 'LAL', 'Miami Heat': 'MIA', 'Milwaukee Bucks': 'MIL', 'Minnesota Timberwolves': 'MIN', 'Brooklyn Nets': 'BKN', 'New York Knicks': 'NYK', 'Orlando Magic': 'ORL', 'Indiana Pacers': 'IND', 'Philadelphia 76ers': 'PHI', 'Phoenix Suns': 'PHX', 'Portland Trail Blazers': 'POR', 'Sacramento Kings': 'SAC', 'San Antonio Spurs': 'SAS', 'Oklahoma City Thunder': 'OKC', 'Toronto Raptors': 'TOR', 'Utah Jazz': 'UTA', 'Memphis Grizzlies': 'MEM', 'Washington Wizards': 'WAS', 'Detroit Pistons': 'DET', 'Charlotte Hornets': 'CHA'};
    ctx.abbreviationtoname = {
    'ATL': 'Atlanta Hawks',
    'BOS': 'Boston Celtics',
    'CLE': 'Cleveland Cavaliers',
    'NOP': 'New Orleans Pelicans',
    'CHI': 'Chicago Bulls',
    'DAL': 'Dallas Mavericks',
    'DEN': 'Denver Nuggets',
    'GSW': 'Golden State Warriors',
    'HOU': 'Houston Rockets',
    'LAC': 'Los Angeles Clippers',
    'LAL': 'Los Angeles Lakers',
    'MIA': 'Miami Heat',
    'MIL': 'Milwaukee Bucks',
    'MIN': 'Minnesota Timberwolves',
    'BKN': 'Brooklyn Nets',
    'NYK': 'New York Knicks',
    'ORL': 'Orlando Magic',
    'IND': 'Indiana Pacers',
    'PHI': 'Philadelphia 76ers',
    'PHX': 'Phoenix Suns',
    'POR': 'Portland Trail Blazers',
    'SAC': 'Sacramento Kings',
    'SAS': 'San Antonio Spurs',
    'OKC': 'Oklahoma City Thunder',
    'TOR': 'Toronto Raptors',
    'UTA': 'Utah Jazz',
    'MEM': 'Memphis Grizzlies',
    'WAS': 'Washington Wizards',
    'DET': 'Detroit Pistons',
    'CHA': 'Charlotte Hornets'
};
    const teams = ["All teams", 'Atlanta Hawks', 'Boston Celtics', 'Cleveland Cavaliers', 'New Orleans Pelicans', 
 'Chicago Bulls', 'Dallas Mavericks', 'Denver Nuggets', 'Golden State Warriors', 
 'Houston Rockets', 'Los Angeles Clippers', 'Los Angeles Lakers', 'Miami Heat', 
 'Milwaukee Bucks', 'Minnesota Timberwolves', 'Brooklyn Nets', 'New York Knicks', 
 'Orlando Magic', 'Indiana Pacers', 'Philadelphia 76ers', 'Phoenix Suns', 
 'Portland Trail Blazers', 'Sacramento Kings', 'San Antonio Spurs', 'Oklahoma City Thunder', 
 'Toronto Raptors', 'Utah Jazz', 'Memphis Grizzlies', 'Washington Wizards', 'Detroit Pistons', 
 'Charlotte Hornets'];
    const sel = d3.select("#season-select");
    sel.selectAll("option").data(seasons).join("option")
        .attr("value", d => d)
        .text(d => d);
    sel.property("value", defaultSeason);
    sel.on("change", (event) => {
        ctx.season = event.target.value;
        // drawShotChart(ctx.season, { gridsize: 30, mincount: 3 });
    });
    // const teamSel = d3.select("#team-select");
    // teamSel.selectAll("option").data(teams).join("option")
    //     .attr("value", d => d)
    //     .text(d => d);
    // teamSel.property("value", "All teams");
    // teamSel.on("change", (event) => {
    //     ctx.team = event.target.value;
    //     console.log("Selected team:", ctx.team);
    //     // drawShotChart(ctx.season, { gridsize: 30, mincount: 3, team: team });
    // });
    // initial draw
    // drawShotChart(defaultSeason, { gridsize: 30, mincount: 3 });
    // createViz();
}
function createViz() {
    console.log("Using D3 v" + d3.version);
    const container = d3.select("#graphs");
    // let svgEl = d3.select("#main").append("svg");
    let svgEl = container.select("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);

    const courtGroup = svgEl.append("g")
        .attr("id", "g-court")
        // .attr("transform", `translate(${ctx.w / 4},60)`);
    ctx.courtGroup = courtGroup;
    // Passing chord group (position independently)
    const passGroup = svgEl.append("g")
        .attr("id", "g-pass")
        // .attr("transform", `translate(${1*ctx.w / 4},250)`);
    ctx.passGroup = passGroup;
    createCourt(courtGroup, "#ffffffff");

    // draw points for season (change season string as needed)
    drawShotChart(courtGroup, ctx.season, {
        mincount: ctx.hexMinCount || 50 }, ctx.team);
     // draw passing chord inside the same SVG (uses separate reusable function)
    if (typeof createPassingChordInSvg === "function") {
        createPassingChordInSvg(ctx.passGroup, `data/nba_api/passing_data/team${ctx.season}.csv`, ctx.team, {
            width: 400, height: 400, cx: 1*ctx.w / 2, cy: 250
        });
    }
    // loadData(svgEl);
    // tu peux decommenter si tu veux scaler le terrain
    // courtGroup.attr("transform", `translate(${ctx.w / 2},60) scale(0.5)`);

};
function applyControls() {
    const sel = d3.select("#season-select");
    const season = sel.empty() ? ctx.season : sel.node().value;
    const minInput = d3.select("#minbins");
    const mincount = !minInput.empty() ? Math.max(0, parseInt(minInput.node().value) || 0) : (ctx.hexMinCount || 50);
    ctx.hexMinCount = mincount;
    team = ctx.team || "ATL";
    console.log("Applying controls: season =", season, ", mincount =", mincount, ", team =", team);
    ctx.season = season;
    drawShotChart(ctx.courtGroup, ctx.season, {
        mincount: ctx.hexMinCount || 50 }, ctx.team);
    // console.log(`data\\nba_api\\passing_data\\${ctx.season}\\team${ctx.season}.csv`)
    if (typeof createPassingChordInSvg === "function") {
        createPassingChordInSvg(ctx.courtGroup, `data/nba_api/passing_data/team${ctx.season}.csv`, ctx.team, {
            width: 500, height: 500, cx: 1*ctx.w / 2, cy: 250
        });
    }
    }

// function loadData(svgEl) {
//     // data source: https://www.kaggle.com/datasets/garrickhague/temp-data-of-prominent-us-CITY_NAMES-from-1948-to-2022
//     d3.csv("data/US_City_Temp_Data.csv").then(function (data) {
//         createStrips(transformData(data), svgEl);
//     }).catch(function (error) { console.log(error) });
// };

/* ---- utilities ---- */

function formatCity(cityName) {
    let tokens = cityName.split("_");
    for (let i = 0; i < tokens.length; i++) {
        tokens[i] = tokens[i].charAt(0).toUpperCase() + tokens[i].slice(1);
    }
    return tokens.join(" ");
}

function getMonth(time) {
    return parseInt(time.substring(5, 7));
};

function getReferenceTemp(city, month) {
    return ctx.cityRefTemps[city][month - 1];
};
document.addEventListener('DOMContentLoaded', function() {
    // ensure #main exists
    if (d3.select('#main').empty()) {
        d3.select('body').append('div').attr('id', 'main');
    }

    // create season select if missing
    if (d3.select('#season-select').empty()) {
        d3.select('#main').insert('label', ':first-child').attr('for', 'season-select').text('Season ');
        d3.select('#main').insert('select', ':first-child').attr('id', 'season-select');
    }

    // wire the selector and initialize the viz
    setupSeasonteamSelector("2024-25");

    // optional additional init
    // initializeVisualizations && initializeVisualizations();
});

// Expose a helper so the map can set the selected team programmatically
window.setTeamSelection = function(teamName) {
    try {
        console.log("Setting team from map:", teamName);
        if (teamName && typeof teamName === 'string') {
            ctx.team = teamName;
            applyControls();
        }
    } catch (e) {
        console.error('Failed to set team from map:', e);
    }
};