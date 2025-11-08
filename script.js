// Script principal pour la visualisation NBA avec D3.js
console.log("🏀 Script NBA D3.js chargé");

// Configuration générale
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

// draw a simple SVG court (coordinates already used by your python code)
function createCourt(g, color) {
    // group is already translated by margins; shift half-court by +60 to match Python
    g.append("line").attr("x1", -220).attr("y1", 0).attr("x2", -220).attr("y2", 140).attr("stroke", color).attr("stroke-width", 2);
    g.append("line").attr("x1", 220).attr("y1", 0).attr("x2", 220).attr("y2", 140).attr("stroke", color).attr("stroke-width", 2);
    // elliptical arc (top of key)
    g.append("path")
        .attr("d", "M -220 140 A 220 157.5 0 0 1 220 140")
        .attr("fill", "none").attr("stroke", color).attr("stroke-width", 2);
    g.append("line").attr("x1", -80).attr("y1", 0).attr("x2", -80).attr("y2", 190).attr("stroke", color).attr("stroke-width", 2);
    g.append("line").attr("x1", 80).attr("y1", 0).attr("x2", 80).attr("y2", 190).attr("stroke", color).attr("stroke-width", 2);
    g.append("line").attr("x1", -60).attr("y1", 0).attr("x2", -60).attr("y2", 190).attr("stroke", color).attr("stroke-width", 2);
    g.append("line").attr("x1", 60).attr("y1", 0).attr("x2", 60).attr("y2", 190).attr("stroke", color).attr("stroke-width", 2);
    g.append("line").attr("x1", -80).attr("y1", 190).attr("x2", 80).attr("y2", 190).attr("stroke", color).attr("stroke-width", 2);
    g.append("circle").attr("cx", 0).attr("cy", 190).attr("r", 60).attr("stroke", color).attr("fill", "none").attr("stroke-width", 2);
    g.append("circle").attr("cx", 0).attr("cy", 60).attr("r", 15).attr("stroke", color).attr("fill", "none").attr("stroke-width", 2);
    g.append("line").attr("x1", -30).attr("y1", 40).attr("x2", 30).attr("y2", 40).attr("stroke", color).attr("stroke-width", 2);

    // apply same vertical shift as Python (+60)
    g.attr("transform", `translate(0,60)`);
}

// Draw raw points (optional)
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
        .attr("opacity", 0.7);

    g.selectAll(".missed-shot")
        .data(missed)
        .join("circle")
        .attr("class", "missed-shot")
        .attr("cx", d => +d.LOC_X)
        .attr("cy", d => +d.LOC_Y + 60)
        .attr("r", 3)
        .attr("fill", config.colors.missed)
        .attr("opacity", 0.6);
}

// Hexbin heatmap (translates draw_shots_hex logic)
function drawShotsHex(g, data, width, height, { gridsize = 25, mincount = 10 } = {}) {
    // d3-hexbin uses radius; derive from gridsize so number of hexes fits like Python gridsize
    const radius = Math.max(width, height) / gridsize;
    const hexbin = d3.hexbin()
        .x(d => +d.LOC_X)
        .y(d => +d.LOC_Y + 60)
        .radius(radius)
        .extent([[-250, 0], [250, 470]]);

    const bins = hexbin(data);

    // compute counts and max
    const counts = bins.map(b => b.length);
    const maxCount = d3.max(counts) || 1;

    // color scale: log-scale mapped to [0,1] for sequential interpolator
    const colorScale = d3.scaleLog().domain([Math.max(1, d3.min(counts) || 1), Math.max(1, maxCount)]).range([0,1]);

    const tooltip = createTooltip();

    const hexGroup = g.append("g").attr("class", "hex-layer");
    hexGroup.selectAll("path")
        .data(bins.filter(b => b.length >= mincount))
        .join("path")
        .attr("d", d => hexbin.hexagon())
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("fill", d => d3.interpolatePlasma(colorScale(Math.max(1, d.length))))
        .attr("stroke", "none")
        .attr("opacity", 0.9)
        .on("mouseenter", (event, d) => {
            const made = d.reduce((acc, v) => acc + (+v.SHOT_MADE_FLAG || 0), 0);
            const pct = ((made / d.length) * 100).toFixed(1);
            tooltip.style("opacity", 1)
                .html(`<strong>Shots:</strong> ${d.length}<br><strong>FG%:</strong> ${pct}%`)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY + 12) + "px");
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 12) + "px")
                   .style("top", (event.pageY + 12) + "px");
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));
}

// main
async function drawShotChart(year, opts = {}) {
    const data = await d3.csv(`data/nba_api/shot_per_season/shot_chart_team_${year}.csv`);
    const container = d3.select("#shot-chart");
    const containerRect = container.node().getBoundingClientRect();
    const width = containerRect.width - config.margin.left - config.margin.right;
    const height = 470 - config.margin.top - config.margin.bottom;

    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("width", width + config.margin.left + config.margin.right)
        .attr("height", height + config.margin.top + config.margin.bottom);

    const g = svg.append("g")
        .attr("transform", `translate(${config.margin.left},${config.margin.top})`);

    createCourt(g, config.colors.dark);

    // choose either points or hex (hex is default)
    if (opts.show === 'points') {
        drawShotsPoints(g, data);
    } else {
        drawShotsHex(g, data, width, height, { gridsize: opts.gridsize || 25, mincount: opts.mincount || 1 });
    }
}

function setupSeasonSelector(defaultSeason = "2024-25") {
    const seasons = [
        "2000-01","2001-02","2002-03","2003-04","2004-05","2005-06","2006-07",
        "2007-08","2008-09","2009-10","2010-11","2011-12","2012-13","2013-14",
        "2014-15","2015-16","2016-17","2017-18","2018-19","2019-20","2020-21",
        "2021-22","2022-23","2023-24","2024-25"
    ];
    const sel = d3.select("#season-select");
    sel.selectAll("option").data(seasons).join("option")
        .attr("value", d => d)
        .text(d => d);
    sel.property("value", defaultSeason);
    sel.on("change", (event) => {
        const season = event.target.value;
        drawShotChart(season, { gridsize: 30, mincount: 3 });
    });
    // initial draw
    drawShotChart(defaultSeason, { gridsize: 30, mincount: 3 });
}

document.addEventListener('DOMContentLoaded', function() {
    // populate season selector and draw initial chart
    setupSeasonSelector("2024-25");

    // initialize other visualizations if present
    if (typeof createTeamsTimeline === 'function') createTeamsTimeline();
    if (typeof createScoringTrends === 'function') createScoringTrends();
});

// Fonction pour afficher des informations dans le panneau info
function updateInfoPanel(content) {
    d3.select("#info-panel").html(content);
}

// 1. Graphique: Timeline des équipes NBA par année de fondation
async function createTeamsTimeline() {
    console.log("📊 Création du graphique timeline des équipes...");
    
    try {
        const data = await d3.json("data/teams_simple.json");
        console.log("Données équipes chargées:", data);
        
        const container = d3.select("#teams-timeline");
        const containerRect = container.node().getBoundingClientRect();
        const width = containerRect.width - config.margin.left - config.margin.right;
        const height = 400 - config.margin.top - config.margin.bottom;
        
        // Nettoyer le conteneur
        container.selectAll("*").remove();
        
        // Créer le SVG
        const svg = container
            .append("svg")
            .attr("width", width + config.margin.left + config.margin.right)
            .attr("height", height + config.margin.top + config.margin.bottom);
            
        const g = svg.append("g")
            .attr("transform", `translate(${config.margin.left},${config.margin.top})`);
        
        // Échelles
        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.year_founded))
            .range([0, width]);
            
        const yScale = d3.scaleBand()
            .domain(data.map(d => d.abbreviation))
            .range([0, height])
            .padding(0.1);
        
        // Créer le tooltip
        const tooltip = createTooltip();
        
        // Axes
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(yScale);
        
        g.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", 40)
            .style("text-anchor", "middle")
            .text("Année de fondation");
            
        g.append("g")
            .attr("class", "axis")
            .call(yAxis)
            .append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -height / 2)
            .style("text-anchor", "middle")
            .text("Équipes");
        
        // Barres
        g.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => yScale(d.abbreviation))
            .attr("width", d => xScale(d.year_founded))
            .attr("height", yScale.bandwidth())
            .attr("fill", config.colors.primary)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", config.colors.dark);
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`
                    <strong>${d.name}</strong><br/>
                    Ville: ${d.city}<br/>
                    Fondée en: ${d.year_founded}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
                
                updateInfoPanel(`
                    <h3>🏀 ${d.name}</h3>
                    <p><strong>Ville:</strong> ${d.city}</p>
                    <p><strong>Abréviation:</strong> ${d.abbreviation}</p>
                    <p><strong>Année de fondation:</strong> ${d.year_founded}</p>
                `);
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("fill", config.colors.primary);
                tooltip.transition().duration(500).style("opacity", 0);
            });
            
        // Titre
        g.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Équipes NBA par Année de Fondation");
            
    } catch (error) {
        console.error("Erreur lors du chargement des données équipes:", error);
        d3.select("#teams-timeline").html(`
            <p style="color: red; text-align: center; margin-top: 50px;">
                ❌ Erreur lors du chargement des données des équipes
            </p>
        `);
    }
}

// 2. Graphique: Évolution des scores au fil du temps
async function createScoringTrends() {
    console.log("📈 Création du graphique d'évolution des scores...");
    
    try {
        const data = await d3.json("data/scoring_trends.json");
        console.log("Données tendances chargées:", data);
        
        const container = d3.select("#scoring-trends");
        const containerRect = container.node().getBoundingClientRect();
        const width = containerRect.width - config.margin.left - config.margin.right;
        const height = 400 - config.margin.top - config.margin.bottom;
        
        // Nettoyer le conteneur
        container.selectAll("*").remove();
        
        // Créer le SVG
        const svg = container
            .append("svg")
            .attr("width", width + config.margin.left + config.margin.right)
            .attr("height", height + config.margin.top + config.margin.bottom);
            
        const g = svg.append("g")
            .attr("transform", `translate(${config.margin.left},${config.margin.top})`);
        
        // Convertir les années en nombres et trier
        data.forEach(d => {
            d.year = +d.year;
            d.avg_total_points = +d.avg_total_points;
        });
        data.sort((a, b) => a.year - b.year);
        
        // Échelles
        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.year))
            .range([0, width]);
            
        const yScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.avg_total_points))
            .range([height, 0]);
        
        // Créer le tooltip
        const tooltip = createTooltip();
        
        // Ligne
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.avg_total_points))
            .curve(d3.curveMonotoneX);
        
        // Axes
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(yScale);
        
        g.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", 40)
            .style("text-anchor", "middle")
            .text("Année");
            
        g.append("g")
            .attr("class", "axis")
            .call(yAxis)
            .append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -height / 2)
            .style("text-anchor", "middle")
            .text("Points moyens par match");
        
        // Dessiner la ligne
        g.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", config.colors.secondary)
            .attr("stroke-width", 3);
        
        // Points sur la ligne
        g.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.year))
            .attr("cy", d => yScale(d.avg_total_points))
            .attr("r", 4)
            .attr("fill", config.colors.accent)
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("r", 6).attr("fill", config.colors.primary);
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`
                    <strong>Année: ${d.year}</strong><br/>
                    Points moyens: ${d.avg_total_points.toFixed(1)}<br/>
                    Matchs analysés: ${d.games_count}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
                
                updateInfoPanel(`
                    <h3>📊 Statistiques ${d.year}</h3>
                    <p><strong>Points moyens par match:</strong> ${d.avg_total_points.toFixed(1)}</p>
                    <p><strong>Nombre de matchs:</strong> ${d.games_count}</p>
                `);
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("r", 4).attr("fill", config.colors.accent);
                tooltip.transition().duration(500).style("opacity", 0);
            });
            
        // Titre
        g.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Évolution des Scores NBA au Fil du Temps");
            
    } catch (error) {
        console.error("Erreur lors du chargement des tendances:", error);
        d3.select("#scoring-trends").html(`
            <p style="color: red; text-align: center; margin-top: 50px;">
                ❌ Erreur lors du chargement des données de tendances
            </p>
        `);
    }
}

// 3. Graphique: Statistiques des équipes (points moyens)
async function createTeamStats() {
    console.log("🏆 Création du graphique des statistiques d'équipes...");
    
    try {
        const data = await d3.json("data/team_stats.json");
        console.log("Données team_stats chargées:", data);
        
        if (!data || data.length === 0) {
            throw new Error("Aucune donnée d'équipe disponible");
        }
        
        const container = d3.select("#team-stats");
        const containerRect = container.node().getBoundingClientRect();
        const width = containerRect.width - config.margin.left - config.margin.right;
        const height = 400 - config.margin.top - config.margin.bottom;
        
        // Nettoyer le conteneur
        container.selectAll("*").remove();
        
        // Créer le SVG
        const svg = container
            .append("svg")
            .attr("width", width + config.margin.left + config.margin.right)
            .attr("height", height + config.margin.top + config.margin.bottom);
            
        const g = svg.append("g")
            .attr("transform", `translate(${config.margin.left},${config.margin.top})`);
        
        // Filtrer les données valides et trier par points moyens
        const validData = data.filter(d => d.avg_points != null && !isNaN(d.avg_points))
                               .sort((a, b) => b.avg_points - a.avg_points);
        
        // Échelles
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(validData, d => d.avg_points)])
            .range([0, width]);
            
        const yScale = d3.scaleBand()
            .domain(validData.map(d => d.abbreviation))
            .range([0, height])
            .padding(0.1);
        
        // Créer le tooltip
        const tooltip = createTooltip();
        
        // Axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);
        
        g.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", 40)
            .style("text-anchor", "middle")
            .text("Points moyens par match");
            
        g.append("g")
            .attr("class", "axis")
            .call(yAxis)
            .append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -height / 2)
            .style("text-anchor", "middle")
            .text("Équipes");
        
        // Barres
        g.selectAll(".bar")
            .data(validData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => yScale(d.abbreviation))
            .attr("width", d => xScale(d.avg_points))
            .attr("height", yScale.bandwidth())
            .attr("fill", config.colors.accent)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", config.colors.primary);
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`
                    <strong>${d.team_name}</strong><br/>
                    Ville: ${d.city}<br/>
                    Points moyens: ${d.avg_points ? d.avg_points.toFixed(1) : 'N/A'}<br/>
                    Victoires: ${d.wins || 0}<br/>
                    Défaites: ${d.losses || 0}<br/>
                    % Victoires: ${d.win_percentage ? (d.win_percentage * 100).toFixed(1) : 0}%
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
                
                updateInfoPanel(`
                    <h3>🏆 ${d.team_name}</h3>
                    <p><strong>Ville:</strong> ${d.city}</p>
                    <p><strong>Points moyens:</strong> ${d.avg_points ? d.avg_points.toFixed(1) : 'N/A'}</p>
                    <p><strong>Bilan:</strong> ${d.wins || 0}V - ${d.losses || 0}D</p>
                    <p><strong>% Victoires:</strong> ${d.win_percentage ? (d.win_percentage * 100).toFixed(1) : 0}%</p>
                    <p><strong>Matchs joués:</strong> ${d.games_played || 0}</p>
                `);
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("fill", config.colors.accent);
                tooltip.transition().duration(500).style("opacity", 0);
            });
            
        // Titre
        g.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Performance des Équipes NBA (Points Moyens)");
            
    } catch (error) {
        console.error("Erreur lors du chargement des team_stats:", error);
        d3.select("#team-stats").html(`
            <div style="text-align: center; padding: 50px; color: #333;">
                <h3>🚧 Données en cours de chargement</h3>
                <p>Les statistiques détaillées des équipes sont maintenant disponibles.</p>
                <p style="color: red;">Erreur: ${error.message}</p>
            </div>
        `);
    }
}

// Fonction principale d'initialisation
async function initializeVisualizations() {
    console.log("🚀 Initialisation des visualisations NBA...");
    
    // Créer les graphiques
    await createTeamsTimeline();
    await createScoringTrends();
    await createTeamStats();
    
    // Message d'accueil
    updateInfoPanel(`
        <h3>🏀 Bienvenue dans l'analyse NBA</h3>
        <p>Explorez les données en survolant les graphiques avec votre souris.</p>
        <p>Les visualisations sont basées sur votre base de données SQLite.</p>
        <p><strong>Données disponibles:</strong> 30 équipes, 76 années d'historique, statistiques récentes</p>
    `);
    
    console.log("✅ Toutes les visualisations sont prêtes!");
}

// Fonction de redimensionnement responsive
function handleResize() {
    // Redessiner les graphiques lors du redimensionnement
    initializeVisualizations();
}

// Démarrer l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 DOM chargé, initialisation...");
    initializeVisualizations();
    
    // Gérer le redimensionnement
    window.addEventListener('resize', debounce(handleResize, 300));
});

// Fonction debounce pour optimiser les performances
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
