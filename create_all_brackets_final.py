"""
Create accurate playoff brackets based on official playoff results data
Uses the playoff wins/losses data we already collected
"""
import json

# Based on playoff results we fetched earlier and user-provided matchups
# 2024-25: OKC champion (16-7), IND finalist (15-8)

playoff_bracket_2024_25 = {
    "season": "2024-25",
    "champion": "OKC",
    
    "east": {
        "conference": "East",
        "finals": {
            "winner": "IND",
            "teams": ["NYK", "IND"],
            "series": "4-3"
        },
        "semifinals": [
            {
                "winner": "NYK",
                "teams": ["BOS", "NYK"],
                "series": "2-4"
            },
            {
                "winner": "IND",
                "teams": ["CLE", "IND"],
                "series": "1-4"
            }
        ],
        "first_round": [
            {
                "winner": "CLE",
                "teams": ["CLE", "MIA"],
                "series": "4-0"
            },
            {
                "winner": "BOS",
                "teams": ["BOS", "ORL"],
                "series": "4-1"
            },
            {
                "winner": "NYK",
                "teams": ["NYK", "PHI"],
                "series": "4-2"
            },
            {
                "winner": "IND",
                "teams": ["IND", "MIL"],
                "series": "4-1"
            }
        ]
    },
    
    "west": {
        "conference": "West",
        "finals": {
            "winner": "OKC",
            "teams": ["OKC", "MIN"],
            "series": "4-2"
        },
        "semifinals": [
            {
                "winner": "OKC",
                "teams": ["OKC", "DEN"],
                "series": "4-3"
            },
            {
                "winner": "MIN",
                "teams": ["MIN", "GSW"],
                "series": "4-1"
            }
        ],
        "first_round": [
            {
                "winner": "OKC",
                "teams": ["OKC", "MEM"],
                "series": "4-0"
            },
            {
                "winner": "DEN",
                "teams": ["DEN", "LAC"],
                "series": "4-3"
            },
            {
                "winner": "GSW",
                "teams": ["GSW", "HOU"],
                "series": "4-3"
            },
            {
                "winner": "MIN",
                "teams": ["MIN", "LAL"],
                "series": "4-1"
            }
        ]
    },
    
    "finals": {
        "winner": "OKC",
        "teams": ["OKC", "IND"],
        "series": "4-3"
    }
}

# 2023-24: BOS champion (16-3), DAL finalist (13-9)
playoff_bracket_2023_24 = {
    "season": "2023-24",
    "champion": "BOS",
    
    "east": {
        "conference": "East",
        "finals": {
            "winner": "BOS",
            "teams": ["BOS", "IND"],
            "series": "4-0"
        },
        "semifinals": [
            {
                "winner": "BOS",
                "teams": ["BOS", "CLE"],
                "series": "4-1"
            },
            {
                "winner": "IND",
                "teams": ["IND", "NYK"],
                "series": "4-3"
            }
        ],
        "first_round": [
            {
                "winner": "BOS",
                "teams": ["BOS", "MIA"],
                "series": "4-1"
            },
            {
                "winner": "CLE",
                "teams": ["CLE", "ORL"],
                "series": "4-3"
            },
            {
                "winner": "NYK",
                "teams": ["NYK", "PHI"],
                "series": "4-2"
            },
            {
                "winner": "IND",
                "teams": ["IND", "MIL"],
                "series": "4-2"
            }
        ]
    },
    
    "west": {
        "conference": "West",
        "finals": {
            "winner": "DAL",
            "teams": ["DAL", "MIN"],
            "series": "4-1"
        },
        "semifinals": [
            {
                "winner": "DAL",
                "teams": ["DAL", "OKC"],
                "series": "4-2"
            },
            {
                "winner": "MIN",
                "teams": ["MIN", "DEN"],
                "series": "4-3"
            }
        ],
        "first_round": [
            {
                "winner": "OKC",
                "teams": ["OKC", "NOP"],
                "series": "4-0"
            },
            {
                "winner": "DEN",
                "teams": ["DEN", "LAL"],
                "series": "4-1"
            },
            {
                "winner": "MIN",
                "teams": ["MIN", "PHX"],
                "series": "4-0"
            },
            {
                "winner": "DAL",
                "teams": ["DAL", "LAC"],
                "series": "4-2"
            }
        ]
    },
    
    "finals": {
        "winner": "BOS",
        "teams": ["BOS", "DAL"],
        "series": "4-1"
    }
}

# 2022-23: DEN champion (16-4), MIA finalist (13-10)
playoff_bracket_2022_23 = {
    "season": "2022-23",
    "champion": "DEN",
    
    "east": {
        "conference": "East",
        "finals": {
            "winner": "MIA",
            "teams": ["BOS", "MIA"],
            "series": "3-4"
        },
        "semifinals": [
            {
                "winner": "BOS",
                "teams": ["BOS", "PHI"],
                "series": "4-3"
            },
            {
                "winner": "MIA",
                "teams": ["MIA", "NYK"],
                "series": "4-2"
            }
        ],
        "first_round": [
            {
                "winner": "BOS",
                "teams": ["BOS", "ATL"],
                "series": "4-2"
            },
            {
                "winner": "PHI",
                "teams": ["PHI", "BKN"],
                "series": "4-0"
            },
            {
                "winner": "NYK",
                "teams": ["NYK", "CLE"],
                "series": "4-1"
            },
            {
                "winner": "MIA",
                "teams": ["MIA", "MIL"],
                "series": "4-1"
            }
        ]
    },
    
    "west": {
        "conference": "West",
        "finals": {
            "winner": "DEN",
            "teams": ["DEN", "LAL"],
            "series": "4-0"
        },
        "semifinals": [
            {
                "winner": "DEN",
                "teams": ["DEN", "PHX"],
                "series": "4-2"
            },
            {
                "winner": "LAL",
                "teams": ["LAL", "GSW"],
                "series": "4-2"
            }
        ],
        "first_round": [
            {
                "winner": "DEN",
                "teams": ["DEN", "MIN"],
                "series": "4-1"
            },
            {
                "winner": "PHX",
                "teams": ["PHX", "LAC"],
                "series": "4-1"
            },
            {
                "winner": "GSW",
                "teams": ["GSW", "SAC"],
                "series": "4-3"
            },
            {
                "winner": "LAL",
                "teams": ["LAL", "MEM"],
                "series": "4-2"
            }
        ]
    },
    
    "finals": {
        "winner": "DEN",
        "teams": ["DEN", "MIA"],
        "series": "4-1"
    }
}

# Save all brackets
for bracket in [playoff_bracket_2022_23, playoff_bracket_2023_24, playoff_bracket_2024_25]:
    season = bracket['season']
    filename = f'data/nba_api/playoff_bracket_{season}.json'
    
    with open(filename, 'w') as f:
        json.dump(bracket, f, indent=2)
    
    print(f"✅ Created {filename}")
    print(f"   Champion: {bracket['champion']}")
    print(f"   Finals: {bracket['finals']['teams'][0]} vs {bracket['finals']['teams'][1]} ({bracket['finals']['series']})")
    print()

print("="*80)
print("✅ ALL PLAYOFF BRACKETS CREATED SUCCESSFULLY!")
print("="*80)
print("\nBrackets created for:")
print("  - 2022-23: Denver Nuggets champion")
print("  - 2023-24: Boston Celtics champion")
print("  - 2024-25: Oklahoma City Thunder champion")
