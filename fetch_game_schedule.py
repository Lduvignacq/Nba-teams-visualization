"""
Fetch game-by-game schedule and results for all NBA teams for 2024-25 season
This will create a comprehensive calendar of wins/losses for each team
"""
from nba_api.stats.endpoints import teamgamelog
from nba_api.stats.static import teams
import pandas as pd
import time
import json
from datetime import datetime

SEASON = '2024-25'

print(f"Fetching game schedules for {SEASON} season...")
print("="*60)

# Get all NBA teams
all_teams = teams.get_teams()

# Mapping for team abbreviations
team_games = {}

for idx, team in enumerate(all_teams, 1):
    team_name = team['full_name']
    team_id = team['id']
    team_abb = team['abbreviation']
    
    print(f"[{idx}/30] {team_abb:3s} {team_name:30s}", end=' ')
    
    try:
        # Get team game log for the season
        gamelog = teamgamelog.TeamGameLog(
            team_id=team_id,
            season=SEASON,
            season_type_all_star='Regular Season'
        )
        
        games_df = gamelog.get_data_frames()[0]
        
        if len(games_df) > 0:
            # Process each game
            team_schedule = []
            
            for _, game in games_df.iterrows():
                game_date = game['GAME_DATE']
                matchup = game['MATCHUP']
                wl = game['WL']  # 'W' or 'L'
                pts = game['PTS']
                pts_opponent = game['PTS']  # This is team's points
                
                # Extract opponent from matchup (e.g., "GSW vs. LAL" or "GSW @ LAL")
                if ' vs. ' in matchup:
                    opponent = matchup.split(' vs. ')[1]
                    home = True
                elif ' @ ' in matchup:
                    opponent = matchup.split(' @ ')[1]
                    home = False
                else:
                    opponent = 'UNK'
                    home = None
                
                # Parse date
                try:
                    date_obj = datetime.strptime(game_date, '%b %d, %Y')
                    date_key = date_obj.strftime('%Y-%m-%d')
                except:
                    date_key = game_date
                
                team_schedule.append({
                    'date': date_key,
                    'game_date_display': game_date,
                    'result': wl,
                    'opponent': opponent,
                    'home': home,
                    'points': int(pts) if pd.notna(pts) else 0,
                })
            
            team_games[team_abb] = {
                'team_name': team_name,
                'games': team_schedule,
                'total_games': len(team_schedule),
                'wins': len([g for g in team_schedule if g['result'] == 'W']),
                'losses': len([g for g in team_schedule if g['result'] == 'L'])
            }
            
            print(f"✓ {len(team_schedule)} games ({team_games[team_abb]['wins']}-{team_games[team_abb]['losses']})")
        else:
            print(f"⚠ No games found")
            team_games[team_abb] = {
                'team_name': team_name,
                'games': [],
                'total_games': 0,
                'wins': 0,
                'losses': 0
            }
        
        # Be nice to the API
        time.sleep(0.6)
        
    except Exception as e:
        print(f"✗ Error: {e}")
        team_games[team_abb] = {
            'team_name': team_name,
            'games': [],
            'total_games': 0,
            'wins': 0,
            'losses': 0,
            'error': str(e)
        }

# Save to JSON
output_file = 'data/nba_api/team_schedules_2024-25.json'
with open(output_file, 'w') as f:
    json.dump(team_games, f, indent=2)

print("\n" + "="*60)
print(f"✅ Saved game schedules to {output_file}")
print(f"\nTotal teams processed: {len(team_games)}")

# Print summary
print("\nSample teams:")
for team_abb in ['GSW', 'LAL', 'BOS', 'MIA', 'CHI']:
    if team_abb in team_games:
        team_data = team_games[team_abb]
        print(f"\n{team_abb} ({team_data['team_name']}):")
        print(f"  Record: {team_data['wins']}-{team_data['losses']} ({team_data['total_games']} games)")
        if team_data['games']:
            print(f"  First game: {team_data['games'][0]['game_date_display']}")
            print(f"  Latest game: {team_data['games'][-1]['game_date_display']}")

# Also create a flattened CSV version for easier analysis
print("\nCreating CSV version...")
all_games = []
for team_abb, team_data in team_games.items():
    for game in team_data['games']:
        all_games.append({
            'team': team_abb,
            'team_name': team_data['team_name'],
            'date': game['date'],
            'result': game['result'],
            'opponent': game['opponent'],
            'home': game.get('home', None),
            'points': game.get('points', 0)
        })

if all_games:
    games_df = pd.DataFrame(all_games)
    csv_file = 'data/nba_api/all_games_2024-25.csv'
    games_df.to_csv(csv_file, index=False)
    print(f"✅ Saved flat CSV to {csv_file}")
    print(f"   Total game records: {len(games_df)}")

print("\n🎉 Done! Data ready for calendar visualization.")
