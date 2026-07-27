"""Independent analysis-dataset build for the audit track.

Deliberately separate from `src/nfl_field_goal_pressure/build_dataset.py`, which
is left as guided stubs for the hands-on recreation. Nothing here imports from
those stubs, so the two tracks stay genuinely independent.

Processes season-by-season (filter, then keep) so peak memory stays small:
26 seasons x ~50k plays x 372 columns would be several GB if concatenated raw.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from nfl_field_goal_pressure.data import DEFAULT_SEASONS, fetch_season

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROCESSED = PROJECT_ROOT / "data" / "processed"

KEEP = [
    "game_id", "play_id", "season", "week", "season_type", "game_date",
    "posteam", "defteam", "home_team", "away_team", "posteam_type", "div_game",
    "play_type", "field_goal_result", "kick_distance",
    "game_seconds_remaining", "quarter_seconds_remaining", "half_seconds_remaining", "qtr",
    "score_differential", "posteam_score", "defteam_score",
    "wind", "temp", "roof", "surface", "stadium_id", "weather",
    "kicker_player_id", "kicker_player_name",
    "wp", "vegas_wp", "wpa", "ep", "epa",
    "timeout", "timeout_team", "down", "ydstogo", "yardline_100",
]


def _season_slice(season: int) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Return (field goal attempts, team-season EPA aggregate) for one season."""
    path = fetch_season(season)
    df = pd.read_parquet(path, columns=KEEP)

    # Team-season offensive EPA, computed on ALL plays before we discard them.
    # Used for the Figure 1/2 balance test. Restricted to scrimmage plays so
    # special teams don't dominate the average.
    scrimmage = df[df["play_type"].isin(["pass", "run"])]
    epa = (
        scrimmage.groupby(["posteam", "season"], as_index=False)["epa"]
        .mean()
        .rename(columns={"posteam": "team", "epa": "team_season_epa"})
    )

    fg = df[df["play_type"] == "field_goal"].copy()
    return fg, epa


def build(seasons=DEFAULT_SEASONS) -> pd.DataFrame:
    fg_parts, epa_parts = [], []
    for season in seasons:
        fg, epa = _season_slice(season)
        fg_parts.append(fg)
        epa_parts.append(epa)

    fg = pd.concat(fg_parts, ignore_index=True)
    team_epa = pd.concat(epa_parts, ignore_index=True)

    fg = add_columns(fg)
    fg = attach_team_epa(fg, team_epa)

    PROCESSED.mkdir(parents=True, exist_ok=True)
    fg.to_parquet(PROCESSED / "fg_attempts.parquet", index=False)
    team_epa.to_parquet(PROCESSED / "team_season_epa.parquet", index=False)
    return fg


def add_columns(fg: pd.DataFrame) -> pd.DataFrame:
    """Derived variables. Every judgment call here is made explicit as a column
    so downstream specs can toggle it rather than baking one choice in."""
    fg = fg.copy()

    fg["made"] = (fg["field_goal_result"] == "made").astype(int)
    fg["blocked"] = (fg["field_goal_result"] == "blocked").astype(int)
    # Alternative outcome: drop blocked kicks entirely (a block is a protection
    # failure, not a kicker-psychology failure). Kept as a separate flag so the
    # spec curve can test sensitivity instead of assuming one definition.
    fg["made_excl_blocked"] = np.where(fg["blocked"] == 1, np.nan, fg["made"])

    fg["is_ot"] = (fg["qtr"] >= 5).astype(int)
    fg["post4"] = (fg["qtr"] == 4).astype(int)
    # Paper's Table 2 sums exactly to N with no OT bucket, implying OT was
    # folded into Q4 or dropped. Both encodings are carried:
    fg["post4_incl_ot"] = (fg["qtr"] >= 4).astype(int)

    fg["abs_score_diff"] = fg["score_differential"].abs()
    fg["close_game"] = (fg["abs_score_diff"] <= 9).astype(int)
    for k in (3, 4, 7, 8, 9, 10, 14):
        fg[f"close_{k}"] = (fg["abs_score_diff"] <= k).astype(int)

    fg["T"] = fg["game_seconds_remaining"]
    fg["T100"] = fg["T"] / 100.0                      # per-100-second scaling
    fg["T100_c"] = (fg["T"] - fg["T"].mean()) / 100.0  # centered, per-100s

    fg["dist"] = fg["kick_distance"]
    fg["dist_c"] = fg["dist"] - fg["dist"].mean()
    fg["dist_c_sq"] = fg["dist_c"] ** 2
    fg["dist_sq"] = fg["dist"] ** 2

    fg["wind_f"] = fg["wind"].fillna(0.0)
    fg["indoor"] = fg["roof"].isin(["dome", "closed"]).astype(int)
    fg["playoff"] = (fg["season_type"] == "POST").astype(int)

    # Continuous leverage: |WP - 0.5| is small when the game is genuinely in
    # doubt. Flip so higher = more leverage.
    fg["wp_leverage"] = 1.0 - 2.0 * (fg["wp"] - 0.5).abs()
    fg["vegas_wp_leverage"] = 1.0 - 2.0 * (fg["vegas_wp"] - 0.5).abs()

    fg["two_min"] = ((fg["qtr"] == 4) & (fg["T"] <= 120)).astype(int)

    fg["kicker_id"] = fg["kicker_player_id"].astype("string")
    fg["stadium"] = fg["stadium_id"].astype("string")
    fg["season_f"] = fg["season"].astype("string")
    return fg


def attach_team_epa(fg: pd.DataFrame, team_epa: pd.DataFrame) -> pd.DataFrame:
    """Attach kicking team's season EPA for the balance test."""
    return fg.merge(
        team_epa.rename(columns={"team": "posteam"}),
        on=["posteam", "season"],
        how="left",
    )


def load() -> pd.DataFrame:
    return pd.read_parquet(PROCESSED / "fg_attempts.parquet")


if __name__ == "__main__":
    out = build()
    print(f"built {len(out):,} field goal attempts, {out['season'].min()}-{out['season'].max()}")
