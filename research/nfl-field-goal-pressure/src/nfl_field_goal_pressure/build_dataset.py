"""Turn raw nflverse play-by-play into the analysis dataset from Section 3.1.

This is the first hands-on module. `data.py` gets you a raw play-by-play
DataFrame (every play, every type, hundreds of columns); this module narrows
that down to the same shape as the paper's analysis sample: one row per field
goal attempt, with the variables Table 1-3 describe.

Original paper reference: pages 9-15 (Section 3.1, "Data Analysis"), Table 1.

Relevant raw columns already present in the nflverse play-by-play schema
(no need to compute these from scratch):

    play_type            -> filter to "field_goal"
    field_goal_result     -> "made" / "missed" / "blocked"
    kick_distance          -> yards
    game_seconds_remaining -> 0-3600, matches Table 1's variable directly
    qtr                    -> 1-4 (5 = overtime - decide how you want to
                              handle OT kicks; the paper's quarter counts in
                              Table 2 sum to exactly N=23,583, so it made
                              *some* choice about OT that isn't stated - see
                              the note in README.md's "known rough edges")
    score_differential     -> posteam_score - defteam_score at snap time
    wind                   -> mph
    roof                   -> "outdoors" / "dome" / "closed" / "open"
    surface                -> "grass" / "fieldturf" / etc.
    stadium_id
    kicker_player_id, kicker_player_name
    season_type            -> "REG" / "POST"

Nothing here is computed for you - filling in the TODOs below *is* the
exercise. Suggested order: get `field_goal_attempts` working first (that
unlocks Table 1's N), then the derived columns, then check your Table 1
numbers against the paper's before moving on to build_summary tables.
"""

from __future__ import annotations

import pandas as pd


def field_goal_attempts(pbp: pd.DataFrame) -> pd.DataFrame:
    """Filter raw play-by-play down to field goal attempts.

    TODO: keep only rows where a field goal was actually attempted (there's
    more than one reasonable way to define this - `play_type == "field_goal"`
    is the obvious start, but check whether that already excludes plays you'd
    want, like ones nflverse marks differently for blocked kicks).
    """
    raise NotImplementedError


def add_analysis_columns(fg: pd.DataFrame) -> pd.DataFrame:
    """Add every derived column the model and tables need.

    TODO, per the paper's variable definitions (Section 3.2, p.15):

    - `field_goal_made`: 1 if `field_goal_result == "made"`, else 0
    - `close_game` (C): 1 if `abs(score_differential) <= 9`, else 0
      (footnote to Table 1, p.9 - this is the "9-point cutoff" the balance
      test on p.11-12 is defending)
    - `post4` (Q): 1 if `qtr == 4` (decide your OT convention here - see
      the module docstring above)
    - `game_seconds_remaining` (T): already in the raw data, just keep it
    - `kick_distance_centered` and `kick_distance_squared`: Table 5 in the
      appendix uses a centered distance for the squared term - try both
      centered and raw and see if it changes anything about the fit
    - keep `wind`, `roof`, `surface`, `stadium_id`, `kicker_player_id` as-is
      for the fixed effects later

    Return the same DataFrame with these columns added, not a copy with only
    a subset of columns - later steps (tables.py, model.py) expect the raw
    columns to still be there too.
    """
    raise NotImplementedError


def load_analysis_dataset(pbp: pd.DataFrame) -> pd.DataFrame:
    """Convenience wrapper: field_goal_attempts + add_analysis_columns.

    Once the two functions above pass your own sanity checks, this is the
    one function everything else (tables.py, charts.py, model.py) imports.
    """
    return add_analysis_columns(field_goal_attempts(pbp))
