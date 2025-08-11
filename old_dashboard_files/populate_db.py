
import os
import logging
import requests
from datetime import datetime
from espn_api.football import League
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.core.db import Season, Team, Player, Matchup, BoxScorePlayer, DraftPick

# --- Setup ---
load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Environment Variables ---
LEAGUE_ID = os.environ.get("LEAGUE_ID")
ESPN_S2 = os.environ.get("ESPN_S2")
SWID = os.environ.get("SWID")
DATABASE_URL = os.environ.get('DATABASE_URL') or 'sqlite:///../instance/fantasy_league.db'

# --- Database Session ---
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def clear_season_data(session, year):
    """Clears all data for a given season to prevent duplicates."""
    logging.info(f"Clearing existing data for {year}...")
    session.query(DraftPick).filter(DraftPick.season_year == year).delete()
    session.query(BoxScorePlayer).join(Matchup).filter(Matchup.season_year == year).delete()
    session.query(Matchup).filter(Matchup.season_year == year).delete()
    session.query(Team).filter(Team.season_year == year).delete()
    session.query(Season).filter(Season.year == year).delete()
    session.commit()

def populate_modern_season_data(session, year):
    """Fetches and populates data for a modern season using the espn-api package."""
    logging.info(f"Fetching modern data for season {year}...")
    league = League(league_id=LEAGUE_ID, year=year, espn_s2=ESPN_S2, swid=SWID)

    # 1. Season
    new_season = Season(year=year, league_name=league.settings.name, regular_season_weeks=league.settings.reg_season_count, is_legacy=False)
    session.add(new_season)
    session.commit()

    # 2. Teams
    teams_map = {}
    for team_data in league.teams:
        owner = team_data.owners[0]['firstName'] if team_data.owners else 'Unknown'
        new_team = Team(
            season_year=year, espn_team_id=team_data.team_id, team_name=team_data.team_name,
            owner_name=owner, wins=team_data.wins, losses=team_data.losses, ties=team_data.ties,
            points_for=team_data.points_for, points_against=team_data.points_against, final_standing=team_data.final_standing
        )
        session.add(new_team)
        teams_map[team_data.team_id] = new_team
    session.commit()

    # 3. Matchups and Box Scores
    for week in range(1, 20): # Iterate past the typical end of season to be safe
        try:
            box_scores = league.box_scores(week=week)
            if not box_scores: continue
            
            for matchup_data in box_scores:
                if not matchup_data.home_team or not matchup_data.away_team: continue
                
                home_team = teams_map[matchup_data.home_team.team_id]
                away_team = teams_map[matchup_data.away_team.team_id]
                
                new_matchup = Matchup(
                    season_year=year, week=week, home_team=home_team, away_team=away_team,
                    home_score=matchup_data.home_score, away_score=matchup_data.away_score, is_playoff=matchup_data.is_playoff
                )
                session.add(new_matchup)
                
                for player_data in matchup_data.home_lineup + matchup_data.away_lineup:
                    # Ensure player exists
                    player = session.query(Player).get(player_data.playerId)
                    if not player:
                        player = Player(id=player_data.playerId, full_name=player_data.name, position=player_data.position, pro_team=player_data.proTeam)
                        session.add(player)
                    
                    team = home_team if player_data in matchup_data.home_lineup else away_team
                    new_box_score = BoxScorePlayer(
                        matchup=new_matchup, team=team, player=player, slot_position=player_data.slot_position,
                        points=player_data.points, projected_points=player_data.projected_points
                    )
                    session.add(new_box_score)
        except Exception:
            logging.info(f"No more matchups found for year {year} after week {week-1}.")
            break
    session.commit()

def main():
    """Main function to run population for all seasons."""
    start_year = 2019 # Only modern seasons for now
    current_year = datetime.now().year
    
    session = Session()
    try:
        for year in range(start_year, current_year):
            logging.info(f"--- Starting data population for {year} ---")
            clear_season_data(session, year)
            populate_modern_season_data(session, year)
            logging.info(f"--- Successfully populated all data for {year} ---")
    except Exception as e:
        logging.error("An error occurred during DB population, rolling back.", exc_info=True)
        session.rollback()
    finally:
        session.close()

if __name__ == '__main__':
    if not all([LEAGUE_ID, ESPN_S2, SWID]):
        raise ValueError("Required environment variables LEAGUE_ID, ESPN_S2, or SWID are not set.")
    main()
