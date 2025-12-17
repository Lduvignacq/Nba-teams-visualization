"""
Fetch real free throw data from NBA API and add to scoring breakdown
This script enriches the existing scoring_breakdown_from_shots_2024-25.json
with actual free throw points for each team.
"""

from nba_api.stats.endpoints import leaguedashteamstats
import json
import time

def fetch_free_throw_data(season='2024-25'):
    """
    Fetch free throw statistics for all teams from NBA API
    
    Returns:
        dict: Team name -> free throw points
    """
    print(f"Fetching free throw data for season {season}...")
    
    try:
        # Get team statistics including free throws
        team_stats = leaguedashteamstats.LeagueDashTeamStats(
            season=season,
            season_type_all_star='Regular Season',
            per_mode_detailed='Totals'
        )
        
        df = team_stats.get_data_frames()[0]
        
        # Extract team names and free throw data
        ft_data = {}
        for _, row in df.iterrows():
            team_name = row['TEAM_NAME']
            ftm = row['FTM']  # Free Throws Made
            fta = row['FTA']  # Free Throws Attempted
            ft_pct = row['FT_PCT']  # Free Throw Percentage
            
            # Each made free throw = 1 point
            ft_points = ftm * 1.0
            
            ft_data[team_name] = {
                'ftm': int(ftm),
                'fta': int(fta),
                'ft_pct': float(ft_pct),
                'ft_points': float(ft_points)
            }
            
            print(f"  {team_name}: {ftm} FTM, {ft_points} points")
        
        return ft_data
    
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

def update_scoring_breakdown(input_file, output_file, season='2024-25'):
    """
    Update scoring breakdown JSON with real free throw data
    
    Args:
        input_file: Path to existing scoring_breakdown_from_shots_2024-25.json
        output_file: Path to save updated JSON
        season: NBA season (default: 2024-25)
    """
    print(f"\n📊 Updating scoring breakdown with free throw data...\n")
    
    # Load existing data
    print(f"Loading existing data from {input_file}...")
    with open(input_file, 'r') as f:
        scoring_data = json.load(f)
    
    print(f"Found {len(scoring_data)} teams in existing data\n")
    
    # Fetch free throw data from API
    ft_data = fetch_free_throw_data(season)
    
    if not ft_data:
        print("❌ Failed to fetch free throw data")
        return False
    
    print(f"\n✅ Fetched free throw data for {len(ft_data)} teams\n")
    
    # Update each team's data
    updated_count = 0
    missing_teams = []
    
    for team_name, team_info in scoring_data.items():
        if team_name in ft_data:
            ft_info = ft_data[team_name]
            
            # Get existing field goal data
            fg_points = team_info['field_goal_points']
            old_total = fg_points.get('total', 0)
            
            # Calculate new total including free throws
            field_goal_sum = (fg_points.get('three_pt', 0) + 
                            fg_points.get('paint', 0) + 
                            fg_points.get('mid_range', 0))
            
            new_total = field_goal_sum + ft_info['ft_points']
            
            # Add free throw data
            team_info['free_throws'] = {
                'ftm': ft_info['ftm'],
                'fta': ft_info['fta'],
                'ft_pct': ft_info['ft_pct'],
                'ft_points': ft_info['ft_points']
            }
            
            # Update total
            team_info['field_goal_points']['total'] = new_total
            
            # Update percentages to include free throws
            team_info['percentages']['free_throws_pct'] = round((ft_info['ft_points'] / new_total) * 100, 1)
            
            # Recalculate field goal percentages based on new total
            team_info['percentages']['three_pt_pct'] = round((fg_points.get('three_pt', 0) / new_total) * 100, 1)
            team_info['percentages']['paint_pct'] = round((fg_points.get('paint', 0) / new_total) * 100, 1)
            team_info['percentages']['mid_range_pct'] = round((fg_points.get('mid_range', 0) / new_total) * 100, 1)
            
            # Update note
            team_info['note'] = f"Updated with real free throw data from NBA API (season {season})"
            
            print(f"✓ {team_name}:")
            print(f"    Field Goals: {field_goal_sum:.0f} pts")
            print(f"    Free Throws: {ft_info['ft_points']:.0f} pts ({ft_info['ftm']}/{ft_info['fta']}, {ft_info['ft_pct']:.1%})")
            print(f"    Total: {new_total:.0f} pts")
            print(f"    FT%: {team_info['percentages']['free_throws_pct']}%\n")
            
            updated_count += 1
        else:
            missing_teams.append(team_name)
            print(f"⚠️  {team_name}: No free throw data found in API")
    
    # Save updated data
    print(f"\n💾 Saving updated data to {output_file}...")
    with open(output_file, 'w') as f:
        json.dump(scoring_data, f, indent=2)
    
    print(f"\n✅ Successfully updated {updated_count}/{len(scoring_data)} teams")
    
    if missing_teams:
        print(f"\n⚠️  Missing free throw data for {len(missing_teams)} teams:")
        for team in missing_teams:
            print(f"    - {team}")
    
    return True

def main():
    """Main execution"""
    import os
    
    # File paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(base_dir, 'data', 'nba_api', 'scoring_breakdown_from_shots_2024-25.json')
    output_file = os.path.join(base_dir, 'data', 'nba_api', 'scoring_breakdown_with_ft_2024-25.json')
    
    print("=" * 60)
    print("🏀 NBA Free Throw Data Fetcher")
    print("=" * 60)
    print()
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"❌ Input file not found: {input_file}")
        return
    
    # Update the data
    success = update_scoring_breakdown(input_file, output_file, season='2024-25')
    
    if success:
        print("\n" + "=" * 60)
        print("✅ DONE! Updated file saved as:")
        print(f"   {output_file}")
        print()
        print("Next steps:")
        print("1. Update waffle-chart.js to use the new file")
        print("2. Change: 'scoring_breakdown_from_shots_2024-25.json'")
        print("   To: 'scoring_breakdown_with_ft_2024-25.json'")
        print("=" * 60)
    else:
        print("\n❌ Failed to update data")

if __name__ == '__main__':
    main()
