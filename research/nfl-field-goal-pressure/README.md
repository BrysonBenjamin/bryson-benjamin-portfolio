# NFL Field Goal Pressure — Python Recreation

A from-scratch Python recreation of [*Temporal and Pressure Effects: Evidence
from NFL Field Goals*](../../apps/web/public/papers/temporal-and-pressure-effects-nfl-field-goals.pdf)
(Bryson Benjamin, NYU Shanghai, May 2025) — the logistic-regression study of
whether NFL kickers get worse as the clock runs out in close, late-game
situations. The original was written in R against `nflfastR`; this rebuilds
the data pipeline, tables, charts, and model in Python, on refreshed data.

This is a **hands-on learning project**, not a finished analysis. The data
pipeline (`data.py`) is done for you; everything that recreates the paper's
actual content — `build_dataset.py`, `tables.py`, `charts.py`, `model.py` —
is deliberately left as guided stubs. Fill them in yourself, one at a time,
checking your output against the original PDF as you go. Ask for a review
whenever a number doesn't match, a chart looks off, or you want a second
opinion on the statistics — that's the intended workflow, not a fallback.

## Why this lives outside the Bun workspace

The rest of this repo (`apps/`, `packages/`) is a Bun/TypeScript monorepo —
see [`docs/stack.md`](../../docs/stack.md). Python doesn't belong in that
`workspaces` array; it has its own package manager, its own dependency
resolution, its own venv. Rather than force it in, this is a self-contained
project under `research/` with its own `pyproject.toml`, lockfile, and
`.venv` — same principle as `packages/db` being its own thing, just for a
different language. It doesn't build, deploy, or get typechecked by anything
in the root `package.json`.

## Setup

Requires [`uv`](https://docs.astral.sh/uv/) (already used to scaffold this
project) and Python 3.11+, which `uv` will install if you don't have it.

```bash
cd research/nfl-field-goal-pressure
uv sync                     # creates .venv/, installs pinned deps
uv run python -m ipykernel install --user --name nfl-field-goal-pressure
uv run jupyter lab           # or: code . , if you prefer notebooks in-editor
```

Then open `notebooks/00_environment_check.ipynb`, run it top to bottom, and
confirm both cells succeed — that proves the venv, the kernel, and the
network fetch of nflverse data all work before you write any analysis code.

Day to day, once the venv exists:

```bash
uv run jupyter lab                 # notebook iteration
uv run python -m nfl_field_goal_pressure.data   # sanity-check the data fetch alone
uv run ruff check .                 # lint
```

## Data source

The original paper sourced data via R's `nflfastR` package plus Pro Football
Reference for stadium detail, covering 2000–2023 (23,583 attempts). Both of
those ultimately draw on the same upstream source: the
[`nflverse-data`](https://github.com/nflverse/nflverse-data) GitHub release
assets — versioned, weekly-refreshed play-by-play parquet files per season,
back to 1999.

`data.py` fetches directly from those release assets over HTTPS (verified
reachable from this environment), rather than depending on
[`nfl_data_py`](https://pypi.org/project/nfl-data-py/) — the closest Python
equivalent to `nflfastR` — because as of writing it pins `numpy<2.0` and
`pandas<2.0`, which would force this whole project onto stale dependency
versions for a thin convenience wrapper. Fetching the parquet files directly
means modern pandas/numpy and full visibility into exactly what's being
downloaded — worth knowing this trade-off exists if you'd rather use
`nfl_data_py` for something later.

**This means the dataset is already updated past the paper's cutoff:**
`data.DEFAULT_SEASONS` is `range(2000, 2026)` — 2000 through the 2025 season
(the most recent completed one as of now) — two more seasons than the
original 2000–2023. Expect your raw attempt count to come in higher than
23,583 before you've applied any filtering.

## Roadmap

Each step below maps to a stub function already sitting in the matching
file, with a docstring pointing at the specific page/table/figure/equation
in the PDF. Suggested order — each step only needs the previous one done:

1. **Data pull** (`data.py` — already implemented). Run the environment
   check notebook.
2. **Build the analysis dataset** (`build_dataset.py`): filter to field goal
   attempts, construct `field_goal_made`, `close_game`, `post4`, and the
   distance terms. This is Section 3.1's raw material.
3. **Table 1** (`tables.summary_statistics`): summary stats, compare against
   p.9. Watch for the "Absolute score differential" flag in that function's
   docstring — it's a good first review-together moment.
4. **Table 2 & 3** (`tables.categorical_distributions`,
   `tables.kicker_summary`): categorical breakdowns and kicker heterogeneity,
   p.10–11.
5. **Figures 3 & 4** (`charts.success_by_time_elapsed`,
   `charts.success_by_kick_distance`): the two descriptive bar charts, p.13–14.
   These don't need a model yet, just binning and aggregation.
6. **Figures 1 & 2** (`charts.team_epa_balance`): the EPA balance test, p.11–12.
   Needs a team-season EPA aggregate you'll compute yourself from the raw
   play-by-play `epa` column — flagged in the docstring as an ambiguous spec
   worth a second opinion.
7. **The model** (`model.fit_logit`): the three-way interaction logit,
   Eq. 1 on p.18, Table 4 on p.21. This is the heart of the paper — go slow
   here, and definitely ask for a review of the formula and the fitted
   coefficients before trusting them.
8. **Figure 5** (`charts.predicted_success_by_time`): predicted probabilities
   from the fitted model, p.22.
9. **GVIF diagnostics** (`model.variance_inflation_factors`) and
   **robustness checks** (`model.robustness_checks`): Table 5 and Tables 6–9.
   The GVIF one has a real Python-vs-R gap noted in its docstring — worth
   discussing before picking an approach.
10. **Write-up and hosting**: once the numbers and charts hold up, we'll
    draft an updated paper (`paper/` — empty for now) describing what
    changed between the 2000–2023 R version and this 2000–2025 Python
    recreation, and republish it by swapping
    `apps/web/public/papers/temporal-and-pressure-effects-nfl-field-goals.pdf`
    and updating `apps/web/src/content/research.ts` on the main site. Don't
    jump to this step until 1–9 are solid — it's the last thing, not a
    parallel track.

## Known rough edges (flag these, don't silently resolve them)

- **Table 1's "Absolute score differential" (mean 0.53, SD 9.30, p.9)** looks
  internally inconsistent for a non-negative variable — see the note in
  `tables.summary_statistics`.
- **Quarter bucketing and overtime.** Table 2's four quarter counts
  (p.10) sum to exactly N=23,583, meaning the original coded every
  attempt into quarters 1–4 with no separate overtime bucket. The paper
  never states how OT field goals were handled — folded into "4th quarter,"
  or excluded entirely. Decide deliberately in `build_dataset.py` and note
  which you picked.
- **GVIF for multi-level factors.** No direct Python equivalent to R's
  `car::vif` for factors/interactions — see `model.variance_inflation_factors`.
- **Team-season EPA construction** for the Figure 1/2 balance test isn't
  fully specified by the paper (offense-only vs. net of defense, which
  season's EPA for a game spanning a season boundary is moot but worth being
  explicit about).

## Project layout

```text
src/nfl_field_goal_pressure/
  data.py             fetch + cache nflverse play-by-play (done)
  build_dataset.py    raw pbp -> analysis dataset (TODO)
  tables.py           Tables 1-3 (TODO)
  charts.py           Figures 1-5 (TODO)
  model.py            the logit model, GVIF, robustness checks (TODO)
notebooks/
  00_environment_check.ipynb   run this first
data/
  raw/                cached nflverse parquet, gitignored
  processed/           your cleaned analysis dataset, gitignored
outputs/
  figures/, tables/     regenerate on demand, gitignored
paper/                  empty until step 10 above
```
