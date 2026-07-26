"""Recreate Figures 1-5 (Sections 3.1 and 5.1) with matplotlib.

Each function takes the analysis DataFrame (and, for Figure 5, a fitted
model) and returns a matplotlib `Figure`. Save with
`fig.savefig(outputs/figures/...)` - `outputs/figures/` is already gitignored
except for a `.gitkeep`, so regenerate-on-demand is the expected workflow,
not committing PNGs.

Original paper reference: pages 12-14 (Figures 1-4), page 22 (Figure 5).
"""

from __future__ import annotations

import matplotlib.pyplot as plt
import pandas as pd


def team_epa_balance(fg: pd.DataFrame, team_epa: pd.DataFrame) -> tuple[plt.Figure, plt.Figure]:
    """Figures 1 & 2: distribution of team-season EPA, close vs. non-close games.

    The paper's balance test (p.11) compares average team-season Expected
    Points Added between attempts in close games (|score differential| <= 9)
    and non-close games, via a two-sample t-test (reported p=0.075, 95% CI
    [-0.251, 0.012]).

    `team_epa` isn't in play-by-play directly - you'll need to compute it
    yourself: nflverse pbp has a per-play `epa` column, so team-season EPA is
    something like `pbp.groupby(["posteam", "season"])["epa"].mean()`. Decide
    whether that should be offense-only (posteam) or net of defense allowed -
    the paper doesn't fully spec this, which is exactly the kind of
    ambiguity worth flagging when you write up your version.

    TODO:
    1. Join each field goal attempt to its game's two teams' season EPA.
    2. Split into close vs. non-close using `close_game`.
    3. Plot two histograms (one per group) - Figures 1 and 2 in the PDF.
    4. Run `scipy.stats.ttest_ind` on the two EPA distributions and compare
       your p-value/CI to the paper's.
    """
    raise NotImplementedError


def success_by_time_elapsed(fg: pd.DataFrame, bin_seconds: int = 300) -> plt.Figure:
    """Figure 3: field goal success rate by game time elapsed, binned.

    The paper bins *game time elapsed* (not remaining) into 300-second
    windows and plots a stacked bar of made vs. missed per bin, with the
    success percentage labeled on each bar (p.13).

    TODO:
    - Derive elapsed time: `3600 - game_seconds_remaining`.
    - Bin into 300s buckets (`pd.cut` with `bin_seconds`-wide bins).
    - For each bin, count made vs. missed and compute the success rate.
    - Plot as a stacked bar chart, success rate annotated on top of each bar.
    """
    raise NotImplementedError


def success_by_kick_distance(fg: pd.DataFrame, bin_yards: int = 5) -> plt.Figure:
    """Figure 4: field goal success rate by kick distance, in 5-yard bins.

    Same shape as Figure 3 but binned on `kick_distance` instead of time, with
    a wide final bin for 60+ yards (p.14).

    TODO: bin `kick_distance` into 5-yard buckets up to 60, with a final
    "60+" catch-all bucket, then plot made/missed counts and the success
    rate label per bin, same style as `success_by_time_elapsed`.
    """
    raise NotImplementedError


def predicted_success_by_time(model_results, fg: pd.DataFrame) -> plt.Figure:
    """Figure 5: predicted success rate vs. 4th-quarter time elapsed, by game status.

    Two lines - close vs. not-close - showing model-predicted probability of
    success across the fourth quarter (p.22). This is the figure that makes
    the three-way interaction visible: the paper's version shows the two
    lines crossing around the 3200-second mark.

    TODO:
    1. Build a small "scenario" DataFrame: qtr == 4, `close_game` fixed at
       0 and 1, `game_seconds_remaining` swept across the fourth quarter's
       range, other covariates (distance, wind, etc.) held at representative
       values (e.g. the sample mean, or a fixed "average" kicker/stadium).
    2. Get predicted probabilities from `model_results.predict(...)`.
    3. Plot one line per `close_game` value.
    """
    raise NotImplementedError
