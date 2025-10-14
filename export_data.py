import sqlite3
import pandas as pd
import json
import os

def export_nba_data():
    """Exporter les données NBA vers des fichiers JSON pour visualisation D3.js"""
    
    # Connexion à la base de données
    conn = sqlite3.connect('data/nba.sqlite')
    
    # Créer le dossier pour les données JSON
    os.makedirs('js/data', exist_ok=True)
    
    # 1. Statistiques des équipes par saison récente
    team_stats_query = """
    SELECT 
        t.full_name as team_name,
        t.abbreviation,
        t.city,
        COUNT(g.game_id) as games_played,
        AVG(g.pts_home) as avg_points_home,
        AVG(g.pts_away) as avg_points_away,
        AVG(CASE WHEN g.team_abbreviation_home = t.abbreviation THEN g.pts_home 
                 WHEN g.team_abbreviation_away = t.abbreviation THEN g.pts_away 
                 END) as avg_points,
        AVG(CASE WHEN g.team_abbreviation_home = t.abbreviation THEN g.reb_home 
                 WHEN g.team_abbreviation_away = t.abbreviation THEN g.reb_away 
                 END) as avg_rebounds,
        AVG(CASE WHEN g.team_abbreviation_home = t.abbreviation THEN g.ast_home 
                 WHEN g.team_abbreviation_away = t.abbreviation THEN g.ast_away 
                 END) as avg_assists,
        SUM(CASE WHEN (g.team_abbreviation_home = t.abbreviation AND g.wl_home = 'W') OR
                      (g.team_abbreviation_away = t.abbreviation AND g.wl_away = 'W') 
                 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN (g.team_abbreviation_home = t.abbreviation AND g.wl_home = 'L') OR
                      (g.team_abbreviation_away = t.abbreviation AND g.wl_away = 'L') 
                 THEN 1 ELSE 0 END) as losses
    FROM team t
    LEFT JOIN game g ON (g.team_abbreviation_home = t.abbreviation OR g.team_abbreviation_away = t.abbreviation)
    WHERE g.season_id IN ('42022', '42021', '42020')
    GROUP BY t.full_name, t.abbreviation, t.city
    HAVING games_played > 10
    ORDER BY avg_points DESC
    """
    
    team_stats = pd.read_sql_query(team_stats_query, conn)
    team_stats['win_percentage'] = team_stats['wins'] / (team_stats['wins'] + team_stats['losses'])
    
    # Sauvegarder en JSON
    team_stats_json = team_stats.round(2).to_dict('records')
    with open('js/data/team_stats.json', 'w') as f:
        json.dump(team_stats_json, f, indent=2)
    
    print(f"✅ Données des équipes exportées: {len(team_stats_json)} équipes")
    
    # 2. Top scoreurs récents
    top_scorers_query = """
    SELECT 
        p.full_name as player_name,
        p.first_name,
        p.last_name,
        cpi.team_abbreviation,
        cpi.team_city,
        cpi.position,
        cpi.height,
        cpi.weight,
        cpi.season_exp as experience,
        cpi.from_year,
        cpi.to_year
    FROM player p
    JOIN common_player_info cpi ON p.id = cpi.person_id
    WHERE cpi.team_abbreviation IS NOT NULL 
    AND cpi.season_exp IS NOT NULL
    ORDER BY cpi.season_exp DESC
    LIMIT 100
    """
    
    top_players = pd.read_sql_query(top_scorers_query, conn)
    top_players_json = top_players.to_dict('records')
    
    with open('js/data/top_players.json', 'w') as f:
        json.dump(top_players_json, f, indent=2)
    
    print(f"✅ Données des joueurs exportées: {len(top_players_json)} joueurs")
    
    # 3. Points par match au fil du temps (exemple simple)
    scoring_trends_query = """
    SELECT 
        SUBSTR(g.game_date, 1, 4) as year,
        AVG(g.pts_home + g.pts_away) as avg_total_points,
        COUNT(*) as games_count
    FROM game g
    WHERE g.game_date IS NOT NULL
    GROUP BY SUBSTR(g.game_date, 1, 4)
    HAVING games_count > 100
    ORDER BY year
    """
    
    scoring_trends = pd.read_sql_query(scoring_trends_query, conn)
    scoring_trends_json = scoring_trends.round(2).to_dict('records')
    
    with open('js/data/scoring_trends.json', 'w') as f:
        json.dump(scoring_trends_json, f, indent=2)
    
    print(f"✅ Tendances de score exportées: {len(scoring_trends_json)} années")
    
    # 4. Données simples pour un premier graphique
    simple_data_query = """
    SELECT 
        t.abbreviation as team,
        t.full_name as name,
        t.city,
        t.year_founded
    FROM team t
    ORDER BY t.year_founded
    """
    
    simple_data = pd.read_sql_query(simple_data_query, conn)
    simple_data_json = simple_data.to_dict('records')
    
    with open('js/data/teams_simple.json', 'w') as f:
        json.dump(simple_data_json, f, indent=2)
    
    print(f"✅ Données simples des équipes exportées: {len(simple_data_json)} équipes")
    
    conn.close()
    print("\n🎉 Toutes les données ont été exportées dans le dossier js/data/")

if __name__ == "__main__":
    export_nba_data()