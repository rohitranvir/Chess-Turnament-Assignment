"""
Business logic for match generation and result simulation.

Functions
---------
generate_random_matches(tournament_id, round_number)
    Shuffles tournament players randomly and pairs them into Match records.
    Odd-player-count → last player receives a bye (auto-win, +3 pts).

simulate_match_result(match_id)
    Randomly assigns white_win / black_win / draw to a pending non-bye match,
    sets winner & played_at, updates TournamentPlayer.points accordingly.
"""

import random
from decimal import Decimal
from django.utils import timezone
from django.db import transaction

from tournaments.models import Tournament, TournamentPlayer
from .models import Match


# ---------------------------------------------------------------------------
# Points constants
# ---------------------------------------------------------------------------
POINTS_WIN = Decimal("3.0")
POINTS_DRAW = Decimal("1.0")
POINTS_LOSS = Decimal("0.0")


# ---------------------------------------------------------------------------
# generate_random_matches
# ---------------------------------------------------------------------------

def generate_random_matches(tournament_id: int, round_number: int) -> list[Match]:
    """
    Fetch all players enrolled in the tournament, shuffle them, and create
    Match records for the given round.

    Rules
    -----
    - Minimum 2 players required.
    - Players are shuffled randomly.
    - Pairs: players[0] vs players[1], players[2] vs players[3], …
    - If the player count is odd, the last player gets a BYE:
        * player_black = None
        * result = 'white_win'
        * winner = player_white
        * played_at = now()
        * TournamentPlayer.points += POINTS_WIN (3 pts)

    Parameters
    ----------
    tournament_id : int
    round_number  : int  — must be >= 1

    Returns
    -------
    list[Match]  — all Match objects created in this call

    Raises
    ------
    ValueError   — tournament not found, or fewer than 2 players enrolled
    """
    try:
        tournament = Tournament.objects.get(pk=tournament_id)
    except Tournament.DoesNotExist:
        raise ValueError(f"Tournament with id={tournament_id} does not exist.")

    if Match.objects.filter(tournament=tournament, round_number=round_number).exists():
        raise ValueError(f"Matches for round {round_number} have already been generated in this tournament.")

    entries = list(
        TournamentPlayer.objects.filter(tournament=tournament)
        .select_related("player")
    )

    if len(entries) < 2:
        raise ValueError(
            f"Tournament '{tournament.name}' needs at least 2 enrolled players "
            f"to generate matches (found {len(entries)})."
        )

    # Shuffle in-place for randomness
    random.shuffle(entries)

    created_matches: list[Match] = []
    now = timezone.now()

    with transaction.atomic():
        for i in range(0, len(entries) - 1, 2):
            white_entry = entries[i]
            black_entry = entries[i + 1]

            match = Match.objects.create(
                tournament=tournament,
                player_white=white_entry.player,
                player_black=black_entry.player,
                result=Match.Result.PENDING,
                round_number=round_number,
            )
            created_matches.append(match)

        # Handle bye for odd number of players
        if len(entries) % 2 == 1:
            bye_entry = entries[-1]
            bye_match = Match.objects.create(
                tournament=tournament,
                player_white=bye_entry.player,
                player_black=None,          # BYE
                result=Match.Result.WHITE_WIN,
                winner=bye_entry.player,
                round_number=round_number,
                played_at=now,
            )
            created_matches.append(bye_match)

            # Award bye player the win points immediately
            bye_entry.points += POINTS_WIN
            bye_entry.save(update_fields=["points"])

    return created_matches


# ---------------------------------------------------------------------------
# simulate_match_result
# ---------------------------------------------------------------------------

def simulate_match_result(match_id: int) -> Match:
    """
    Randomly assign a result to a single pending, non-bye match.

    Result probabilities
    --------------------
    white_win : 40 %
    black_win : 40 %
    draw      : 20 %

    Point allocation
    ----------------
    Win  → 3 pts for the winner
    Draw → 1 pt for each player
    Loss → 0 pts

    Parameters
    ----------
    match_id : int

    Returns
    -------
    Match  — the updated match object

    Raises
    ------
    ValueError — match not found
    RuntimeError — match is already decided or is a bye
    """
    try:
        match = Match.objects.select_related(
            "player_white", "player_black", "tournament"
        ).get(pk=match_id)
    except Match.DoesNotExist:
        raise ValueError(f"Match with id={match_id} does not exist.")

    if match.result != Match.Result.PENDING:
        raise RuntimeError(
            f"Match {match_id} is already decided (result='{match.result}'). "
            "Simulation skipped."
        )

    if match.is_bye:
        raise RuntimeError(
            f"Match {match_id} is a bye — it has no opponent to simulate against."
        )

    # Weighted random outcome
    outcome = random.choices(
        population=[Match.Result.WHITE_WIN, Match.Result.BLACK_WIN, Match.Result.DRAW],
        weights=[40, 40, 20],
        k=1,
    )[0]

    with transaction.atomic():
        match.result = outcome
        match.played_at = timezone.now()

        white_tp = TournamentPlayer.objects.select_for_update().get(
            tournament=match.tournament, player=match.player_white
        )
        black_tp = TournamentPlayer.objects.select_for_update().get(
            tournament=match.tournament, player=match.player_black
        )

        if outcome == Match.Result.WHITE_WIN:
            match.winner = match.player_white
            white_tp.points += POINTS_WIN
            # black gets 0 — no change needed

        elif outcome == Match.Result.BLACK_WIN:
            match.winner = match.player_black
            black_tp.points += POINTS_WIN

        else:  # DRAW
            match.winner = None
            white_tp.points += POINTS_DRAW
            black_tp.points += POINTS_DRAW

        match.save(update_fields=["result", "winner", "played_at"])
        white_tp.save(update_fields=["points"])
        black_tp.save(update_fields=["points"])

    return match
