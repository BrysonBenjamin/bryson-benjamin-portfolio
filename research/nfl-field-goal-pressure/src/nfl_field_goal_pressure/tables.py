"""Recreate Tables 1-3 (Section 3.1) from the analysis dataset.

Each function below should return a pandas DataFrame shaped like the
corresponding table in the PDF, so you can eyeball it next to the original
(`paper/original/` once you've dropped a copy of the source PDF there - see
README.md) and see where the refreshed 2000-2025 data agrees or disagrees
with 2000-2023.

Original paper reference: pages 9-11.
"""

from __future__ import annotations

import pandas as pd


def summary_statistics(fg: pd.DataFrame) -> pd.DataFrame:
    """Table 1: Summary Statistics.

    Columns: Variable, Mean, SD, Min, Max, N. Rows, in the paper's order:

        Field goal made, Kick distance (yards), Game seconds remaining,
        Absolute score differential, Close game, Wind speed (mph)

    TODO: compute mean/std/min/max/count for each variable above and assemble
    into one DataFrame with those column names.

    A flag for when you get here: the paper reports "Absolute score
    differential" with mean 0.53 and SD 9.30 (p.9). A non-negative variable
    (it's wrapped in abs()) having a mean that much smaller than its SD is
    the kind of thing worth double-checking against your own recomputation
    rather than assuming your code is wrong if the numbers don't match -
    bring whatever you get back for a second pair of eyes.
    """
    raise NotImplementedError


def categorical_distributions(fg: pd.DataFrame) -> dict[str, pd.DataFrame]:
    """Table 2: Distribution of Categorical Variables.

    Three separate breakdowns, each as Count + Percent: game quarter,
    stadium roof type, playing surface type.

    TODO: return a dict of three DataFrames, e.g.
    {"quarter": ..., "roof": ..., "surface": ...}, each with Count and
    Percent columns. Percent should be computed against your full N, not
    against each group's own subtotal.
    """
    raise NotImplementedError


def kicker_summary(fg: pd.DataFrame) -> pd.DataFrame:
    """Table 3: Kicker Summary Statistics.

    Rows: Number of unique kickers, Mean field goals attempted, Standard
    deviation, Minimum attempts, Maximum attempts - all computed over the
    per-kicker attempt *counts*, not over individual kicks.

    TODO: group by kicker_player_id, count attempts per kicker, then
    summarize that distribution of counts.
    """
    raise NotImplementedError
