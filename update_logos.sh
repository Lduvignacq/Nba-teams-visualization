#!/bin/bash
# Update NBA team logos to latest official versions
# Downloads current logos from NBA.com CDN

echo "======================================================================"
echo "🏀 NBA Team Logos Updater - 2024-25 Season"
echo "======================================================================"
echo ""

LOGO_DIR="data/logo"

# Array of team abbreviations and their NBA.com team IDs
declare -A TEAMS
TEAMS[ATL]=1610612737  # Atlanta Hawks
TEAMS[BOS]=1610612738  # Boston Celtics
TEAMS[BKN]=1610612751  # Brooklyn Nets
TEAMS[CHA]=1610612766  # Charlotte Hornets
TEAMS[CHI]=1610612741  # Chicago Bulls
TEAMS[CLE]=1610612739  # Cleveland Cavaliers
TEAMS[DAL]=1610612742  # Dallas Mavericks
TEAMS[DEN]=1610612743  # Denver Nuggets
TEAMS[DET]=1610612765  # Detroit Pistons
TEAMS[GSW]=1610612744  # Golden State Warriors
TEAMS[HOU]=1610612745  # Houston Rockets
TEAMS[IND]=1610612754  # Indiana Pacers
TEAMS[LAC]=1610612746  # LA Clippers
TEAMS[LAL]=1610612747  # Los Angeles Lakers
TEAMS[MEM]=1610612763  # Memphis Grizzlies
TEAMS[MIA]=1610612748  # Miami Heat
TEAMS[MIL]=1610612749  # Milwaukee Bucks
TEAMS[MIN]=1610612750  # Minnesota Timberwolves
TEAMS[NOP]=1610612740  # New Orleans Pelicans
TEAMS[NYK]=1610612752  # New York Knicks
TEAMS[OKC]=1610612760  # Oklahoma City Thunder
TEAMS[ORL]=1610612753  # Orlando Magic
TEAMS[PHI]=1610612755  # Philadelphia 76ers
TEAMS[PHX]=1610612756  # Phoenix Suns
TEAMS[POR]=1610612757  # Portland Trail Blazers
TEAMS[SAC]=1610612758  # Sacramento Kings
TEAMS[SAS]=1610612759  # San Antonio Spurs
TEAMS[TOR]=1610612761  # Toronto Raptors
TEAMS[UTA]=1610612762  # Utah Jazz
TEAMS[WAS]=1610612764  # Washington Wizards

SUCCESS=0
FAILED=0

echo "📁 Logo directory: $LOGO_DIR"
echo "🔄 Updating ${#TEAMS[@]} team logos..."
echo ""

for TEAM in "${!TEAMS[@]}"; do
    TEAM_ID="${TEAMS[$TEAM]}"
    URL="https://cdn.nba.com/logos/nba/${TEAM_ID}/primary/L/logo.svg"
    OUTPUT="$LOGO_DIR/${TEAM}_logo.svg"
    
    if curl -f -s -o "$OUTPUT" "$URL"; then
        echo "✅ $TEAM: Downloaded successfully"
        ((SUCCESS++))
    else
        echo "❌ $TEAM: Failed to download"
        ((FAILED++))
    fi
done

echo ""
echo "======================================================================"
echo "✅ Successfully updated: $SUCCESS/${#TEAMS[@]} logos"
if [ $FAILED -gt 0 ]; then
    echo "❌ Failed: $FAILED logos"
fi
echo "======================================================================"
