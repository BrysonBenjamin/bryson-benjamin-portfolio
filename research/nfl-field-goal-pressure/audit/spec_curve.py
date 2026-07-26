"""Specification curve for the close-4th-quarter time-pressure estimand.

Every analytic choice the paper made silently is enumerated here. The estimand
held fixed across all of them is the one the paper actually claims: the total
time slope for close, 4th-quarter attempts (log-odds per +100 seconds) and its
average marginal effect in percentage points.

The point is not to find a preferred number. It is to see what fraction of
defensible analysis paths reach the paper's conclusion.
"""

from __future__ import annotations

import itertools
import warnings

import numpy as np
import pandas as pd

from audit.build_data import PROCESSED, load
from audit.models import Sample, Spec, ame_per_100s, fit, make_sample, total_time_effect

warnings.filterwarnings("ignore")

GRID = dict(
    season_max=[2023, 2025],
    include_ot=[False, True],
    include_blocked=[False, True],
    close_cut=[4, 7, 9, 10, 14],
    dist_control=["quad", "cubic"],
    fe=[(False, False, False), (True, True, False), (True, True, True)],
    cluster=["game_id"],
    trim_last=[0, 60],
)


def run() -> pd.DataFrame:
    fg = load()
    rows = []
    keys = list(GRID)
    combos = list(itertools.product(*(GRID[k] for k in keys)))
    for n, values in enumerate(combos, 1):
        cfg = dict(zip(keys, values))
        s = Sample(
            season_max=cfg["season_max"],
            include_ot=cfg["include_ot"],
            include_blocked=cfg["include_blocked"],
            close_cut=cfg["close_cut"],
        )
        d = make_sample(fg, s)
        if cfg["trim_last"]:
            d = d[~((d["C"] == 1) & (d["Q"] == 1) & (d["T"] < cfg["trim_last"]))].reset_index(drop=True)
        kfe, sfe, yfe = cfg["fe"]
        spec = Spec(
            kicker_fe=kfe, stadium_fe=sfe, season_fe=yfe,
            dist_control=cfg["dist_control"], cluster=cfg["cluster"],
        )
        try:
            res, X = fit(d, spec)
            tt = total_time_effect(res, X)
            am = ame_per_100s(res, X, d)
            rows.append({**cfg, "fe": f"{int(kfe)}{int(sfe)}{int(yfe)}", "n": len(d),
                         "slope": tt["logodds_per_100s"], "se": tt["se"], "p": tt["p"],
                         "ame_pp": am["pp_per_100s"], "ame_p": am["p"], "ok": True})
        except Exception as exc:  # singular / separation
            rows.append({**cfg, "fe": f"{int(kfe)}{int(sfe)}{int(yfe)}", "n": len(d),
                         "slope": np.nan, "se": np.nan, "p": np.nan,
                         "ame_pp": np.nan, "ame_p": np.nan, "ok": False, "err": str(exc)[:80]})
        if n % 25 == 0:
            print(f"{n}/{len(combos)}", flush=True)
    out = pd.DataFrame(rows)
    out.to_csv(PROCESSED.parent.parent / "outputs" / "audit" / "spec_curve.csv", index=False)
    return out


if __name__ == "__main__":
    df = run()
    ok = df[df["ok"] & df["p"].notna()]
    print(f"\n{len(ok)} of {len(df)} specifications converged")
    print(f"median slope {ok['slope'].median():+.4f}   median AME {ok['ame_pp'].median():+.3f} pp")
    print(f"share p<0.05 : {(ok['p'] < 0.05).mean():.3f}")
    print(f"share p<0.10 : {(ok['p'] < 0.10).mean():.3f}")
    print(f"share slope>0: {(ok['slope'] > 0).mean():.3f}")
