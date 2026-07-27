"""Recreate the logistic regression model from Section 4 and Table 4.

Original paper's specification (Eq. 1, p.18):

    Pr(Y=1) = Λ(α + β1*C + β2*Q + β3*T + Z*δ + β7*C*Q*T + X*γ)

    C = close_game, Q = post4, T = game_seconds_remaining
    Z = [C*Q, C*T, Q*T]                 (all two-way interactions)
    X = wind, kick_distance, kick_distance^2, kicker FE, stadium FE
    β7 is the coefficient of interest: the three-way interaction, rescaled
        to "per 100 seconds" (β7 * 100) for interpretability in Table 4.

This module is `statsmodels`-based (`smf.logit` / `sm.GLM` with a binomial
family + logit link are both fine - `smf.logit` is closer to a direct port of
R's `glm(family = binomial)`). Fixed effects for ~179 kickers and ~40
stadiums means a lot of dummy columns; if `smf.logit` chokes on that, that's
a real finding worth raising rather than working around silently.
"""

from __future__ import annotations

import pandas as pd
import statsmodels.formula.api as smf  # noqa: F401 - use this in fit_logit below


def fit_logit(fg: pd.DataFrame, *, kicker_fe: bool = True, stadium_fe: bool = True):
    """Fit the full model (Table 4, column 4) or a reduced variant.

    TODO: build a patsy formula string from the pieces in the module
    docstring, e.g. roughly:

        field_goal_made ~ close_game * post4 * game_seconds_remaining
            + wind + kick_distance_centered + kick_distance_squared
            + C(kicker_player_id)   # if kicker_fe
            + C(stadium_id)         # if stadium_fe

    `close_game * post4 * game_seconds_remaining` in patsy notation expands
    to all the main effects, all two-way interactions, and the three-way
    interaction automatically - that's the `Z` and `β7` terms in the paper's
    Eq. 1 in one expression. Fit with `smf.logit(formula, data=fg).fit()`
    and return the results object.

    Once this runs, rescale the three-way interaction coefficient and its SE
    by 100 (the paper's Table 4 footnote: beta_100 = beta_1 * 100) before
    comparing to the paper's reported 0.06-0.07 (per 100s, p<0.05).
    """
    raise NotImplementedError


def marginal_effect_per_100s(results, term: str = "close_game:post4:game_seconds_remaining") -> tuple[float, float]:
    """Return (coefficient, standard error) for a term, rescaled per 100 seconds.

    TODO: pull `results.params[term]` and `results.bse[term]`, multiply both
    by 100. Sanity-check the term name against `results.params.index` first -
    patsy's generated name for the three-way interaction may not match the
    string above exactly depending on column order.
    """
    raise NotImplementedError


def variance_inflation_factors(fg: pd.DataFrame, formula_rhs: str) -> pd.DataFrame:
    """Approximate Table 5's GVIF diagnostics.

    Heads up before you start: `statsmodels.stats.outliers_influence.
    variance_inflation_factor` computes plain VIF for individual numeric
    columns of a design matrix - it does not implement the multi-parameter
    GVIF^(1/(2*Df)) correction from Fox and Monette (1992) that the paper
    uses for multi-level factors (kicker, stadium) and interaction terms.
    There isn't a drop-in Python equivalent (R's `car::vif` handles this
    natively). Two honest paths, worth a review pass before you commit to
    one:

    1. Implement the GVIF formula yourself, per Fox & Monette (1992):
       generalize VIF to a term spanning multiple design-matrix columns by
       comparing the determinant of that term's block of the correlation
       matrix to the whole model's.
    2. Report plain per-column VIF for the numeric terms only (wind, the two
       distance terms, and the interaction columns), and note in your
       write-up that the fixed effects aren't covered the same way the
       paper covered them.

    TODO: pick one of the above and implement it; don't silently approximate
    without flagging which path you took.
    """
    raise NotImplementedError


def robustness_checks(fg: pd.DataFrame) -> dict[str, object]:
    """Recreate the robustness table variants (Section 5.2, Tables 6-9).

    The paper reports four families of robustness checks:
    - three-way interaction only, no other interactions (Table 6/9)
    - restricted to the final 2-minute window (Table 7)
    - a rookie-kicker dummy added (Table 7, col 2)
    - a playoff indicator + four-way interaction (Table 7, col 3)

    TODO: fit each variant with `fit_logit` (or a similar direct
    `smf.logit` call for the ones with different formulas) and return a dict
    keyed by a short label, e.g. {"two_minute_window": results, ...}, so you
    can compare marginal effects across specifications the way Section 5.2
    does (the paper reports effects "ranging from 0.002 to 0.003 per 100
    seconds" across specifications - see if yours lands in a similar range).
    """
    raise NotImplementedError
