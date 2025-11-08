from nba_api.stats.endpoints import playerdashptpass, commonplayerinfo, commonteamroster, playercareerstats
from nba_api.stats.static import teams
import pandas as pd
import time

# "Boston_Celtics", "New_York_Knicks", "Milwaukee_Bucks", "Cleveland_Cavaliers", "Orlando_Magic", "Indiana_Pacers", "Philadelphia_76ers", "Miami_Heat", "Chicago_Bulls", "Atlanta_Hawks", "Brooklyn_Nets", "Toronto_Raptors", "Charlotte_Hornets", "Washington_Wizards", "Detroit_Pistons"

# Fixed season (hardcoded)
SEASON = '2024-25'
theteams = [ 'Atlanta Hawks', 'Boston Celtics', 'Cleveland Cavaliers', 'New Orleans Pelicans', 
 'Chicago Bulls', 'Dallas Mavericks', 'Denver Nuggets', 'Golden State Warriors', 
 'Houston Rockets', 'Los Angeles Clippers', 'Los Angeles Lakers', 'Miami Heat', 
 'Milwaukee Bucks', 'Minnesota Timberwolves', 'Brooklyn Nets', 'New York Knicks', 
 'Orlando Magic', 'Indiana Pacers', 'Philadelphia 76ers', 'Phoenix Suns', 
 'Portland Trail Blazers']
# ,'Sacramento Kings', 'San Antonio Spurs', 'Oklahoma City Thunder', 
#  'Toronto Raptors', 'Utah Jazz', 'Memphis Grizzlies', 'Washington Wizards', 'Detroit Pistons', 
#  'Charlotte Hornets'
# Helper: Clean "Last, First" → "First Last"
final_df= pd.read_csv('data\\nba_api\\passing_data\\team'+ SEASON+ '.csv')
def fix_name(name):
    parts = name.split(', ')
    return f"{parts[1]} {parts[0]}" if len(parts) == 2 else name
for teamname in theteams:
    print("currently working with"+ teamname)
    # User input
    inputTeam = teamname

    # Get team info
    nba_teams = teams.get_teams()
    team_info = [team for team in nba_teams if team['full_name'] == inputTeam][0]
    team_id = team_info['id']

    # Get roster
    roster_df = commonteamroster.CommonTeamRoster(team_id=team_id, season=SEASON).get_data_frames()[0]
    players = roster_df[['PLAYER', 'PLAYER_ID']].to_dict(orient='records')

    # Step 1: Get total minutes for all players
    player_minutes = []
    print("⏳ Gathering total minutes played by each player...")

    for player in players:
        try:
            time.sleep(0.5)
            career = playercareerstats.PlayerCareerStats(player_id=player['PLAYER_ID'])
            df = career.get_data_frames()[0]
            this_season = df[df['SEASON_ID'] == SEASON]

            if not this_season.empty:
                total_minutes = float(this_season['MIN'].values[0])
                player_minutes.append({
                    'PLAYER': player['PLAYER'],
                    'PLAYER_ID': player['PLAYER_ID'],
                    'MIN': total_minutes
                })
                print(f"🟢 {player['PLAYER']} — {total_minutes:.1f} total minutes")
            else:
                print(f"⚠️ No data for {player['PLAYER']} in {SEASON}")

        except Exception as e:
            print(f"❌ Error checking minutes for {player['PLAYER']}: {e}")

    # Step 2: Filter top 10 players
    sorted_players = sorted(player_minutes, key=lambda x: x['MIN'], reverse=True)
    filtered_players = sorted_players[:10]

    print("\n✅ Top 10 players by total minutes:")
    for p in filtered_players:
        print(f"{p['PLAYER']} — {p['MIN']:.1f} minutes")

    # Step 3: Get passing data
    all_passes = []

    for player in filtered_players:
        try:
            print(f"📦 Processing {player['PLAYER']}...")
            time.sleep(1)

            res = playerdashptpass.PlayerDashPtPass(
                player_id=player['PLAYER_ID'],
                team_id=team_id,
                season=SEASON,
                season_type_all_star='Regular Season'
            )
            df = res.get_data_frames()[0]
            if not df.empty:
                df['Passer'] = player['PLAYER']
                all_passes.append(df[['Passer', 'PASS_TO', 'TEAM_ABBREVIATION', 'PASS', 'AST']])

        except Exception as e:
            print(f"❌ Error for {player['PLAYER']}: {e}")

    # Step 4: Save to CSV
    if all_passes:
        pass_df = pd.concat(all_passes)
        pass_df.columns = ['Passer', 'Receiver', 'Team', 'Passes', 'Assists']
        pass_df['Receiver'] = pass_df['Receiver'].apply(fix_name)

        # Filter: keep only rows where both Passer and Receiver are in top 10
        valid_names = {p['PLAYER'] for p in filtered_players}
        pass_df = pass_df[
            pass_df['Passer'].isin(valid_names) & pass_df['Receiver'].isin(valid_names)
        ]
        
        existing_passers = set(pass_df['Passer'].unique())
        missing_passers = valid_names - existing_passers
        print("⚠️ Players in top 10 who had no passing data:", missing_passers)

        # Save file
        pass_df = pass_df.sort_values(by='Passes', ascending=False).reset_index(drop=True)
        final_df = pd.concat([final_df, pass_df], axis= 0, ignore_index=True)
        # csvName = inputTeam.replace(" ", "_") + "_" + SEASON + ".csv"
        # filename = 'data\\nba_api\\passing_data\\2024-25\\'+csvName
        # pass_df.to_csv(filename, index=False)
        # print("\n✅ CSV saved as " + csvName)

        # Print assist totals
        print("\n🧮 Total assists by each passer:")
        assist_totals = pass_df.groupby("Passer")["Assists"].sum().sort_values(ascending=False)
        print(assist_totals)

    else:
        print("❌ No passing data found.")

filename = 'data\\nba_api\\passing_data\\team'+ SEASON+ '.csv'
final_df.to_csv(filename, index=False)
print("\n✅ CSV saved as " + filename)



################################ > 650 MINUTES

# from nba_api.stats.endpoints import playerdashptpass, commonplayerinfo, commonteamroster, playercareerstats
# from nba_api.stats.static import teams
# import pandas as pd
# import time

# #team = input("Input team:")
# #team = "Golden State Warriors"
# inputTeam = input("Input team>")
# inputSeason = input("Input season (ex. 2023-24)>")
# #'2023-24'


# #

# # Helper: Clean "Last, First" → "First Last"
# def fix_name(name):
#     parts = name.split(', ')
#     return f"{parts[1]} {parts[0]}" if len(parts) == 2 else name

# # Get Warriors team info
# nba_teams = teams.get_teams()
# warriors = [team for team in nba_teams if team['full_name'] == inputTeam][0]
# team_id = warriors['id']

# # Get roster
# roster_df = commonteamroster.CommonTeamRoster(team_id=team_id, season='2023-24').get_data_frames()[0]
# warriors_players = roster_df[['PLAYER', 'PLAYER_ID']].to_dict(orient='records')

# ### pruning
# # Filter out players who play fewer than 10 minutes per game
# filtered_players = []
# print("Checking minutes per game for all players...")

# for player in warriors_players:
#     try:
#         time.sleep(0.5)
#         career = playercareerstats.PlayerCareerStats(player_id=player['PLAYER_ID'])
#         df = career.get_data_frames()[0]
        
#         # Get latest season row
#         this_season = df[df['SEASON_ID'] == '2023-24']
        
#         if not this_season.empty:
#             mpg = float(this_season['MIN'].values[0])
#             if mpg >= 650:
#                 filtered_players.append(player)
#                 print(f"✅ Keeping {player['PLAYER']} — {mpg:.1f} total minutes in season")
#             else:
#                 print(f"⏳ Skipping {player['PLAYER']} — only {mpg:.1f} total minutes in season")
#         else:
#             print(f"⚠️ No 2023–24 data for {player['PLAYER']}")

#     except Exception as e:
#         print(f"Error checking minutes for {player['PLAYER']}: {e}")
# ###



# # Collect passing data
# all_passes = []

# print(filtered_players)

# for player in filtered_players:
#     try:
#         print(f"Processing {player['PLAYER']}...")
#         time.sleep(1)

#         res = playerdashptpass.PlayerDashPtPass(
#             player_id=player['PLAYER_ID'],
#             team_id=team_id,
#             season='2023-24',
#             season_type_all_star='Regular Season'
#         )
#         df = res.get_data_frames()[0]
#         if not df.empty:
#             df['Passer'] = player['PLAYER']
#             all_passes.append(df[['Passer', 'PASS_TO', 'TEAM_ABBREVIATION', 'PASS', 'AST']])
    
#     except Exception as e:
#         print(f"Error for {player['PLAYER']}: {e}")


# if all_passes:
#     pass_df = pd.concat(all_passes)
#     pass_df.columns = ['Passer', 'Receiver', 'Team', 'Passes', 'Assists']
    
#     # Clean receiver names
#     pass_df['Receiver'] = pass_df['Receiver'].apply(fix_name)

#     # ✅ Remove rows where either Passer or Receiver is not in valid list
#     valid_names = {player['PLAYER'] for player in filtered_players}
#     pass_df = pass_df[
#         pass_df['Passer'].isin(valid_names) & pass_df['Receiver'].isin(valid_names)
#     ]

#     # Save CSV
#     pass_df = pass_df.sort_values(by='Passes', ascending=False).reset_index(drop=True)
#     #pass_df.to_csv("warriors_player_pass_network_2023.csv", index=False)
#     csvName = inputTeam.replace(" ", "_") + "_" + inputSeason + ".csv"
#     pass_df.to_csv(csvName, index=False)
#     print("✅ CSV saved as " + csvName + "\n")

#     # Print total assists by passer
#     print("🧮 Total assists by each passer:")
#     assist_totals = pass_df.groupby("Passer")["Assists"].sum().sort_values(ascending=False)
#     print(assist_totals)

# else:
#     print("❌ No data found.")