"""
Fetch playoff and standings data for all NBA teams
"""
from nba_api.stats.endpoints import leaguestandingsv3, teamyearbyyearstats
from nba_api.stats.static import teams
import pandas as pd
import time
import json

SEASON = '2024-25'

print(f"Fetching standings for {SEASON}...")
standings = leaguestandingsv3.LeagueStandingsV3(
    season=SEASON,
    season_type='Regular Season'
).get_data_frames()[0]

# Simplifier les colonnes importantes
standings_simple = standings[[
    'TeamID', 'TeamName', 'TeamSlug', 'Conference', 
    'WINS', 'LOSSES', 'WinPCT', 'PlayoffRank', 'ConferenceRecord'
]].copy()

# Sauvegarder le classement
standings_simple.to_csv('data/nba_api/standings_2024-25.csv', index=False)
print(f"✅ Saved standings: {len(standings_simple)} teams")
print(standings_simple.head(10))

print("\n" + "="*60)
print("Fetching playoff history for all teams...")
print("="*60)

all_teams = teams.get_teams()
playoff_history = []

for idx, team in enumerate(all_teams, 1):
    team_name = team['full_name']
    team_id = team['id']
    team_abb = team['abbreviation']
    
    print(f"[{idx}/30] {team_abb:3s}", end=' ')
    
    try:
        history = teamyearbyyearstats.TeamYearByYearStats(
            team_id=team_id
        ).get_data_frames()[0]
        
        # Garder seulement les saisons récentes avec données playoffs
        recent = history[history['YEAR'].str.contains('20')].copy()
        recent['TEAM_ABB'] = team_abb
        
        # Réorganiser les colonnes
        recent = recent[[
            'TEAM_ABB', 'TEAM_NAME', 'YEAR', 'WINS', 'LOSSES', 
            'PO_WINS', 'PO_LOSSES', 'NBA_FINALS_APPEARANCE', 'CONF_RANK'
        ]]
        
        playoff_history.append(recent)
        print(f"✓ ({len(recent)} seasons)")
        time.sleep(0.6)
    except Exception as e:
        print(f"✗ {e}")

# Combiner toutes les données
df_playoff_history = pd.concat(playoff_history, ignore_index=True)
df_playoff_history.to_csv('data/nba_api/playoff_history.csv', index=False)

print(f"\n✅ Saved playoff history: {len(df_playoff_history)} records")
print(f"\nSample for recent playoffs:")
recent_playoffs = df_playoff_history[
    (df_playoff_history['YEAR'].isin(['2022-23', '2023-24', '2024-25'])) &
    (df_playoff_history['PO_WINS'] > 0)
].sort_values(['YEAR', 'PO_WINS'], ascending=[False, False])
print(recent_playoffs.head(15))

# Créer un JSON simplifié pour utilisation dans le frontend
print("\n" + "="*60)
print("Creating simplified JSON for frontend...")
print("="*60)

# Créer un mapping TeamSlug -> Team ABB
slug_to_abb = {
    'cavaliers': 'CLE', 'thunder': 'OKC', 'celtics': 'BOS', 'rockets': 'HOU',
    'lakers': 'LAL', 'knicks': 'NYK', 'nuggets': 'DEN', 'pacers': 'IND',
    'bucks': 'MIL', 'clippers': 'LAC', 'magic': 'ORL', 'grizzlies': 'MEM',
    'mavericks': 'DAL', 'heat': 'MIA', 'timberwolves': 'MIN', 'warriors': 'GSW',
    'kings': 'SAC', 'suns': 'PHX', 'spurs': 'SAS', 'pelicans': 'NOP',
    'nets': 'BKN', 'hawks': 'ATL', 'raptors': 'TOR', '76ers': 'PHI',
    'bulls': 'CHI', 'pistons': 'DET', 'hornets': 'CHA', 'wizards': 'WAS',
    'blazers': 'POR', 'jazz': 'UTA'
}

# Merge standings avec playoff history pour la saison actuelle
current_year_playoffs = df_playoff_history[df_playoff_history['YEAR'] == SEASON].copy()

# Convertir en format JSON
teams_data = {}
for _, row in standings_simple.iterrows():
    team_slug = row['TeamSlug']
    team_abb = slug_to_abb.get(team_slug, team_slug.upper()[:3])
    
    # Trouver les données de playoffs correspondantes
    playoff_row = current_year_playoffs[current_year_playoffs['TEAM_ABB'] == team_abb]
    
    teams_data[team_abb] = {
        'name': row['TeamName'],
        'conference': row['Conference'],
        'wins': int(row['WINS']),
        'losses': int(row['LOSSES']),
        'win_pct': float(row['WinPCT']),
        'playoff_rank': int(row['PlayoffRank']) if pd.notna(row['PlayoffRank']) else None,
        'conf_record': row['ConferenceRecord'],
        'playoff_wins': int(playoff_row.iloc[0]['PO_WINS']) if len(playoff_row) > 0 and pd.notna(playoff_row.iloc[0]['PO_WINS']) else 0,
        'playoff_losses': int(playoff_row.iloc[0]['PO_LOSSES']) if len(playoff_row) > 0 and pd.notna(playoff_row.iloc[0]['PO_LOSSES']) else 0,
        'finals_appearance': playoff_row.iloc[0]['NBA_FINALS_APPEARANCE'] if len(playoff_row) > 0 and pd.notna(playoff_row.iloc[0]['NBA_FINALS_APPEARANCE']) else ''
    }

with open('data/nba_api/team_season_summary.json', 'w') as f:
    json.dump(teams_data, f, indent=2)

print("✅ Created team_season_summary.json")
print(f"\nSample entries:")
for abb in ['BOS', 'OKC', 'GSW']:
    if abb in teams_data:
        print(f"\n{abb}:")
        print(json.dumps(teams_data[abb], indent=2))
