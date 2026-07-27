"""Econometric models for the audit track: replication, then correction.

Three layers:
  1. `replicate_table4`  - reproduce the paper's preferred spec as written.
  2. `total_time_effect` - the quantity the paper actually claims, which is a
     linear combination of four coefficients, not the single interaction term.
  3. `spec_curve`        - the same estimand across every defensible analytic
     choice, to see whether the result is a finding or a coin flip.

Units: T100 = seconds remaining / 100. Because that is a pure rescaling of T
(not a recentering), a model in T100 reproduces the paper's uncentered
reference point exactly while reading off "per 100 seconds" directly, which is
what the paper's beta_100 = beta_1 * 100 footnote constructs by hand.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

import numpy as np
import pandas as pd
import statsmodels.api as sm


# --------------------------------------------------------------------------
# sample construction
# --------------------------------------------------------------------------

@dataclass(frozen=True)
class Sample:
    """Every analytic choice the paper left implicit, made explicit."""
    season_max: int = 2023
    season_min: int = 2000
    include_ot: bool = False          # paper: OT excluded (recovered from Table 2)
    include_blocked: bool = False     # paper: blocked excluded (recovered from N)
    close_cut: int = 9
    wind_zero_fill: bool = True       # paper: yes (recovered from Table 1 wind mean)
    reg_only: bool = False


def make_sample(fg: pd.DataFrame, s: Sample) -> pd.DataFrame:
    d = fg[(fg["season"] >= s.season_min) & (fg["season"] <= s.season_max)]
    if not s.include_ot:
        d = d[d["qtr"] <= 4]
    if not s.include_blocked:
        d = d[d["blocked"] == 0]
    if s.reg_only:
        d = d[d["season_type"] == "REG"]
    d = d.copy()
    d["C"] = (d["abs_score_diff"] <= s.close_cut).astype(float)
    d["Q"] = (d["qtr"] >= 4).astype(float) if s.include_ot else (d["qtr"] == 4).astype(float)
    d["y"] = d["made"].astype(float)
    if s.wind_zero_fill:
        d["W"] = d["wind"].fillna(0.0)
    else:
        d = d[d["wind"].notna()]
        d["W"] = d["wind"]
    d["T100"] = d["T"] / 100.0
    return d.reset_index(drop=True)


# --------------------------------------------------------------------------
# design matrix
# --------------------------------------------------------------------------

@dataclass
class Spec:
    kicker_fe: bool = True
    stadium_fe: bool = True
    season_fe: bool = False
    wind: bool = True
    dist_centered: bool = True
    dist_control: str = "quad"        # quad | cubic | quartic | bins2 | bins1
    time_quadratic: bool = False      # T^2 and its interactions
    cluster: str | None = "game_id"   # None | "game_id" | "kicker_id"
    label: str = ""
    extra: list[str] = field(default_factory=list)


def build_design(d: pd.DataFrame, spec: Spec) -> tuple[pd.DataFrame, pd.Series]:
    X = pd.DataFrame(index=d.index)
    X["const"] = 1.0
    X["C"] = d["C"]
    X["Q"] = d["Q"]
    X["T100"] = d["T100"]
    X["C:Q"] = d["C"] * d["Q"]
    X["C:T100"] = d["C"] * d["T100"]
    X["Q:T100"] = d["Q"] * d["T100"]
    X["C:Q:T100"] = d["C"] * d["Q"] * d["T100"]

    # Distance control. The paper uses a quadratic. Because attempts late in
    # close games are systematically longer, any curvature the quadratic fails
    # to capture is absorbed by the time terms with exactly the sign that
    # mimics a pressure effect - so the flexible variants below are the
    # decisive specification test, not a cosmetic robustness check.
    base = d["dist_c"] if spec.dist_centered else d["dist"]
    if spec.dist_control in ("quad", "cubic", "quartic"):
        X["dist"] = base
        X["dist_sq"] = base ** 2
        if spec.dist_control in ("cubic", "quartic"):
            X["dist_cu"] = base ** 3
        if spec.dist_control == "quartic":
            X["dist_qu"] = base ** 4
    elif spec.dist_control in ("bins2", "bins1"):
        width = 2 if spec.dist_control == "bins2" else 1
        binned = (d["dist"] // width * width).clip(upper=62).astype(int).astype(str)
        dums = pd.get_dummies(binned, prefix="dbin", drop_first=True, dtype=float)
        X = pd.concat([X, dums], axis=1)
    else:
        raise ValueError(spec.dist_control)

    if spec.wind:
        X["wind"] = d["W"]

    if spec.time_quadratic:
        t2 = d["T100"] ** 2
        X["T100_sq"] = t2
        X["C:Q:T100_sq"] = d["C"] * d["Q"] * t2
        X["C:T100_sq"] = d["C"] * t2
        X["Q:T100_sq"] = d["Q"] * t2

    for col in spec.extra:
        X[col] = d[col]

    for flag, col, prefix in (
        (spec.kicker_fe, "kicker_id", "k_"),
        (spec.stadium_fe, "stadium", "s_"),
        (spec.season_fe, "season_f", "y_"),
    ):
        if flag:
            dums = pd.get_dummies(d[col].astype(str), prefix=prefix, drop_first=True, dtype=float)
            X = pd.concat([X, dums], axis=1)

    return X, d["y"]


def fit(d: pd.DataFrame, spec: Spec):
    X, y = build_design(d, spec)
    model = sm.GLM(y, X, family=sm.families.Binomial())
    if spec.cluster:
        res = model.fit(cov_type="cluster", cov_kwds={"groups": d[spec.cluster]})
    else:
        res = model.fit()
    return res, X


# --------------------------------------------------------------------------
# the estimand the paper actually claims
# --------------------------------------------------------------------------

TIME_TERMS = ["T100", "C:T100", "Q:T100", "C:Q:T100"]


def total_time_effect(res, X) -> dict:
    """Linear combination dLogOdds/d(100s) for close, 4th-quarter kicks.

    The paper reports only the C:Q:T coefficient, which is a *differential*:
    how the time slope in close Q4 games differs from the reference cell. The
    claim in the abstract is about the *level* of the time slope in close Q4
    games, which is beta_T + beta_CT + beta_QT + beta_CQT.
    """
    names = list(X.columns)
    c = np.zeros(len(names))
    for term in TIME_TERMS:
        c[names.index(term)] = 1.0
    est = float(c @ res.params.values)
    var = float(c @ res.cov_params().values @ c)
    se = float(np.sqrt(var))
    z = est / se
    from scipy import stats
    return {
        "logodds_per_100s": est,
        "se": se,
        "z": z,
        "p": float(2 * (1 - stats.norm.cdf(abs(z)))),
        "ci_lo": est - 1.96 * se,
        "ci_hi": est + 1.96 * se,
    }


def ame_per_100s(res, X, d, mask=None) -> dict:
    """Average marginal effect on the probability scale, in percentage points.

    Finite-difference AME: for each close-Q4 attempt, predict success at its
    observed clock and at 100 seconds later, average the difference. SE by
    numerical delta method over the full parameter vector, so it accounts for
    uncertainty in every coefficient the prediction touches, not just the
    interaction.
    """
    if mask is None:
        mask = (d["C"] == 1) & (d["Q"] == 1)
    Xm = X.loc[mask].to_numpy(dtype=float)
    names = list(X.columns)
    idx = {t: names.index(t) for t in TIME_TERMS}

    Xp = Xm.copy()
    # shift T100 by +1 (i.e. +100 seconds) everywhere T100 enters linearly
    Cv = Xm[:, names.index("C")]
    Qv = Xm[:, names.index("Q")]
    Xp[:, idx["T100"]] += 1.0
    Xp[:, idx["C:T100"]] += Cv
    Xp[:, idx["Q:T100"]] += Qv
    Xp[:, idx["C:Q:T100"]] += Cv * Qv

    def g(beta):
        p0 = 1.0 / (1.0 + np.exp(-(Xm @ beta)))
        p1 = 1.0 / (1.0 + np.exp(-(Xp @ beta)))
        return float(np.mean(p1 - p0))

    beta = res.params.values.astype(float)
    est = g(beta)

    grad = np.zeros_like(beta)
    step = 1e-6
    for j in range(len(beta)):
        b1 = beta.copy(); b1[j] += step
        b2 = beta.copy(); b2[j] -= step
        grad[j] = (g(b1) - g(b2)) / (2 * step)
    var = float(grad @ res.cov_params().values @ grad)
    se = float(np.sqrt(max(var, 0.0)))
    from scipy import stats
    z = est / se if se > 0 else np.nan
    return {
        "pp_per_100s": est * 100.0,
        "se_pp": se * 100.0,
        "z": z,
        "p": float(2 * (1 - stats.norm.cdf(abs(z)))) if se > 0 else np.nan,
        "n_cells": int(mask.sum()),
    }


def interaction_only(res, X) -> dict:
    """The single coefficient the paper actually reports (for comparison)."""
    from scipy import stats
    i = list(X.columns).index("C:Q:T100")
    est = float(res.params.values[i])
    se = float(np.sqrt(res.cov_params().values[i, i]))
    z = est / se
    return {
        "coef": est, "se": se, "z": z,
        "p": float(2 * (1 - stats.norm.cdf(abs(z)))),
    }
