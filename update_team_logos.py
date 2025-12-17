"""
Update NBA team logos to latest official versions
Downloads current logos from NBA official sources or reliable CDN
"""

import urllib.request
import os
from pathlib import Path

# NBA team abbreviations and their official logo URLs
# Using NBA.com official assets or ESPN CDN for 2024-25 season
TEAM_LOGOS = {
    'ATL': 'https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg',  # Atlanta Hawks
    'BOS': 'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg',  # Boston Celtics
    'BKN': 'https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg',  # Brooklyn Nets
    'CHA': 'https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg',  # Charlotte Hornets
    'CHI': 'https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg',  # Chicago Bulls
    'CLE': 'https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg',  # Cleveland Cavaliers
    'DAL': 'https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg',  # Dallas Mavericks
    'DEN': 'https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg',  # Denver Nuggets
    'DET': 'https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg',  # Detroit Pistons
    'GSW': 'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg',  # Golden State Warriors
    'HOU': 'https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg',  # Houston Rockets
    'IND': 'https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg',  # Indiana Pacers
    'LAC': 'https://cdn.nba.com/logos/nba/1610612746/primary/L/logo.svg',  # LA Clippers
    'LAL': 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg',  # Los Angeles Lakers
    'MEM': 'https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg',  # Memphis Grizzlies
    'MIA': 'https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg',  # Miami Heat
    'MIL': 'https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg',  # Milwaukee Bucks
    'MIN': 'https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg',  # Minnesota Timberwolves
    'NOP': 'https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg',  # New Orleans Pelicans
    'NYK': 'https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg',  # New York Knicks
    'OKC': 'https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg',  # Oklahoma City Thunder
    'ORL': 'https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg',  # Orlando Magic
    'PHI': 'https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg',  # Philadelphia 76ers
    'PHX': 'https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg',  # Phoenix Suns
    'POR': 'https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg',  # Portland Trail Blazers
    'SAC': 'https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg',  # Sacramento Kings
    'SAS': 'https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg',  # San Antonio Spurs
    'TOR': 'https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg',  # Toronto Raptors
    'UTA': 'https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg',  # Utah Jazz
    'WAS': 'https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg',  # Washington Wizards
}

def download_logo(team_abb, url, output_dir):
    """Download a team logo from URL"""
    try:
        output_path = output_dir / f"{team_abb}_logo.svg"
        
        # Download using urllib
        urllib.request.urlretrieve(url, output_path)
        
        return True, f"✅ {team_abb}: Downloaded successfully"
    
    except Exception as e:
        return False, f"❌ {team_abb}: Failed - {str(e)}"

def main():
    print("=" * 70)
    print("🏀 NBA Team Logos Updater - 2024-25 Season")
    print("=" * 70)
    print()
    
    # Get the logo directory
    script_dir = Path(__file__).parent
    logo_dir = script_dir / 'data' / 'logo'
    
    if not logo_dir.exists():
        print(f"❌ Logo directory not found: {logo_dir}")
        return
    
    print(f"📁 Logo directory: {logo_dir}")
    print(f"🔄 Updating {len(TEAM_LOGOS)} team logos...")
    print()
    
    success_count = 0
    failed_teams = []
    
    for team_abb, url in TEAM_LOGOS.items():
        success, message = download_logo(team_abb, url, logo_dir)
        print(message)
        
        if success:
            success_count += 1
        else:
            failed_teams.append(team_abb)
    
    print()
    print("=" * 70)
    print(f"✅ Successfully updated: {success_count}/{len(TEAM_LOGOS)} logos")
    
    if failed_teams:
        print(f"❌ Failed teams: {', '.join(failed_teams)}")
        print()
        print("Note: Failed logos may need to be downloaded manually from:")
        print("  - https://www.nba.com/")
        print("  - https://www.espn.com/nba/teams")
    else:
        print("🎉 All logos updated successfully!")
    
    print("=" * 70)
    
    # Note about Utah
    if 'UTA' in TEAM_LOGOS:
        uta_file = logo_dir / 'UTH_logo.svg'
        if uta_file.exists():
            print()
            print("📝 Note: Your file is named 'UTH_logo.svg' but standard is 'UTA_logo.svg'")
            print("   Consider renaming for consistency.")

if __name__ == '__main__':
    main()
