# Independent Audit — Findings

Blind recreation of *Temporal and Pressure Effects: Evidence from NFL Field Goals*
(Benjamin, 2025), built independently of the learner stubs in
`src/nfl_field_goal_pressure/`. Code in `audit/`. Data: nflverse play-by-play,
2000–2025.

**Reading order for the review session:** this file states conclusions only.
The diagnostic path that produced them is in `audit/models.py`,
`audit/spec_curve.py`, and the run log — deliberately not narrated here so the
independent recreation stays independent.

---

## 1. The paper replicates exactly

Both the data build and the model reproduce to reported precision.

- **Sample definition recovered.** The paper never states its inclusion rule.
  It is: field goal attempts, **regulation only** (overtime dropped), **blocked
  kicks excluded**. Under that rule N = 23,580 against the paper's 23,583 — a
  three-observation drift consistent with nflverse revisions since 2025.
  Quarter counts match the paper's Table 2 *exactly* (4459 / 8507 / 4454 / 6160
  vs 4459 / 8507 / 4457 / 6160).
- **Every Table 1 and Table 3 statistic matches**: success rate 0.846, distance
  37.24/10.17, seconds remaining 1686.9/979.3, close-game share 0.71, 179
  unique kickers, attempts per kicker 131.7/149.7/1/617.
- **Table 4 replicates to the reported digits** across all four columns
  (0.0659, 0.0634, 0.0637, 0.0636 → 0.07, 0.06, 0.06, 0.06), including standard
  errors, residual deviances, and AICs.

**The paper's arithmetic is correct.** Nothing below is a computation error.

## 2. Two documentation errors, both harmless to the analysis

- Table 1's "Absolute score differential" row (mean 0.53, SD 9.30) is the
  **signed** variable's statistics, mislabeled. The true absolute differential
  is 6.76/6.46. The `close_game` variable itself was constructed correctly —
  its 0.71 share reproduces exactly — so this is a reporting error, not an
  estimation one.
- Wind is **zero-filled** where missing (28.5% of attempts). This is
  defensible: missingness is 100% for dome/closed/open-roof venues and only
  2.6% outdoors, so the fill is "no wind indoors," not silent imputation of
  real outdoor observations.

## 3. The headline effect is understated, not overstated

The paper reports the three-way interaction coefficient, which is a
*differential*. Its stated claim is about the *level* of the time slope for
close fourth-quarter kicks — a different quantity, and one no table contains.

Computing the quantity actually claimed:

| | estimate | p |
|---|---|---|
| Paper's reported interaction | +0.064 log-odds / 100s | 0.046 |
| **Correct estimand** (total close-Q4 time slope) | **+0.042 log-odds / 100s** | **0.012** |
| Average marginal effect | **+0.46 pp / 100s** | 0.011 |
| Paper's stated AME | +0.33 pp / 100s | — |

The correct estimand is *more* significant than the coefficient the paper
reported, and about 40% larger than the AME it claims. Clustering by game
(p → 0.017) and adding season fixed effects (p → 0.014) barely move it.

**My prior audit expected this to be fragile under correct standard errors.
That was wrong.** It is not a standard-error problem.

## 4. The real problem is functional form

This is the finding that matters, and it is not the one I predicted.

The paper's central methodological claim is that pressure builds
**continuously**, and that prior null results came from coarse binary "clutch"
indicators. The data contradicts this. Estimated non-parametrically, with
distance controlled flexibly and kicker/stadium fixed effects, the close-Q4
success profile is **flat across almost the entire fourth quarter and then
drops sharply in the final minute**:

| window (close Q4) | n | log-odds vs. T ≥ 300s | p |
|---|---|---|---|
| 0–15 s | 534 | **−0.331** | 0.019 |
| 15–60 s | 274 | **−0.318** | 0.080 |
| 60–120 s | 308 | −0.150 | 0.428 |
| 120–300 s | 780 | +0.088 | 0.519 |
| ≥ 300 s (ref) | 1,983 | — | — |

Run the paper's continuous specification and a discrete final-minute indicator
against each other in the same model and the continuous gradient collapses to
**+0.006 (p = 0.80)** while the discrete term carries a **−0.91 log-odds**
jump (p = 0.020). The linear-in-time specification is not describing a
gradient; it is a straight line fitted through a step function.

**So the paper's contribution is inverted.** It found a real phenomenon —
walk-off kicks in the final minute of close games convert materially worse —
and then imposed the one functional form that mis-describes it. A binary
indicator was the *right* tool; the prior literature's error was choosing the
wrong window and lacking power, not choosing a binary measure.

## 5. What the effect actually is

The attempts driving it are a specific, identifiable class, not a general
pressure gradient. Final-15-second close-Q4 kicks versus the rest:

- **99.3%** occur with a margin of 3 points or less — these are literal
  game-deciding walk-offs, so the paper's ±9-point "close" definition does
  almost no work in this subset
- 4.5 yards longer on average (41.7 vs 37.1); 26.8% are 50+ yards vs 12.6%
- raw conversion 74.9% vs 86.2%

Roughly a sixth of the raw gap is distance composition — flexible distance
controls cut the estimate about 16%, and notably push the paper's *own*
reported coefficient to p ≈ 0.067, i.e. insignificant. The remainder survives:
within distance bands the deficit is −2.4 pp (under 40 yds), −7.9 pp (40–49),
−13.6 pp (50+). That the gap *widens* with distance is itself informative and
argues against a pure attention/choking story.

## 6. Placebo tests pass

The effect is genuinely specific to close fourth quarters, which supports the
paper on this point:

| cell | time slope | p |
|---|---|---|
| close & Q4 | +0.037 | 0.039 |
| not close & Q4 | −0.025 | 0.318 |
| close & Q1–Q3 | +0.002 | 0.562 |
| not close & Q1–Q3 | −0.000 | 0.972 |

## 7. It does not survive out of sample

The 2024 and 2025 seasons are data the paper never saw.

| period | close-Q4 slope | p |
|---|---|---|
| 2000–2023 (paper's window) | +0.038 | 0.033 |
| **2000–2025 (adding 2 seasons)** | **+0.032** | **0.063** |
| **2024–2025 alone** | **−0.053** | 0.295 |
| 2000–2007 | +0.028 | 0.331 |
| 2008–2015 | +0.045 | 0.176 |
| 2016–2023 | +0.035 | 0.289 |

Two additional seasons are enough to push the result below conventional
significance, and the new data points the other way. No individual eight-year
era is significant on its own, though the sign is consistent within
2000–2023 — so this reads as underpowered rather than as noise.

## 7b. Specification curve (480 paths)

Varying every analytic choice the paper made silently — sample end year, OT
handling, blocked-kick handling, closeness cutoff, distance functional form,
fixed-effect set, and whether the final minute is retained:

- **97.3% of specifications produce a positive slope** — the direction is
  extremely stable
- **29.0% reach p < 0.05** — significance is a minority outcome
- median AME **+0.275 pp per 100s** (paper claims 0.33)

Which choice matters is unambiguous:

| choice | median AME | share p<0.05 |
|---|---|---|
| **keep final 60s** | +0.376 pp | **57.9%** |
| **drop final 60s** | +0.152 pp | **0.0%** |
| quadratic distance (paper's) | +0.298 pp | 40.8% |
| cubic distance | +0.265 pp | 17.1% |
| exclude blocked (paper's) | +0.282 pp | 33.8% |
| include blocked | +0.272 pp | 24.2% |
| through 2023 (paper's) | +0.269 pp | 32.9% |
| through 2025 | +0.276 pp | 25.0% |

**Zero of 240 specifications reach significance once the final minute is
removed** (largest z across all of them: 1.53). This is the cliff result
restated as an exhaustive search rather than a single test.

Two further notes. The paper's quadratic distance control more than doubles the
significance rate versus a cubic (40.8% vs 17.1%) — the distance functional
form is doing substantial work. And the effect is *weakest* under the tightest
closeness definition (|Δ| ≤ 4: median +0.219 pp, 6.2% significant) and
strongest at |Δ| ≤ 10 (+0.291 pp, 43.8%). Sample size only partly explains
this — n falls from 4,417 to 2,556 — because the point estimate falls too.
A pressure mechanism predicts the opposite ordering: genuinely tied games
should show *more* pressure, not less. Worth arguing about.

## 8. Verdict

**The paper is not wrong about there being something there. It is wrong about
what it is.**

1. The empirical work is competently executed and replicates exactly.
2. The claimed estimand was never actually computed; when computed, it is
   larger and more significant than reported.
3. The continuous-pressure framing — the paper's stated contribution over the
   prior literature — is **not supported**. The phenomenon is discrete and
   confined to the final minute.
4. Restated correctly, the finding is: *walk-off field goal attempts in the
   final minute of one-score games convert roughly 3–4 percentage points worse
   than comparable attempts earlier in the same quarter, after controlling for
   distance, kicker, venue and season.* That is a cleaner, more defensible, and
   frankly more interesting claim than the one in the abstract.
5. Even that claim needs a power caveat given the 2024–25 reversal.

## 9. Open question I could not close

**Icing.** The leading mechanical alternative to a psychological explanation is
that final-minute kicks are disproportionately preceded by a defensive timeout,
and/or run with rushed operation after a spike. nflverse's `timeout` column
flags timeouts *on* the play (essentially all zero for field goals), so
identifying iced kicks requires a previous-play lookup that this pass does not
implement. Until that is tested, "choking" and "iced/rushed operation" are
observationally equivalent here. This is the single highest-value extension.

## 10. Where my earlier audit was wrong

Stated for the record, since the earlier read was given with more confidence
than it earned:

- **Wrong:** predicted clustering would materially widen the standard errors.
  It moves p from 0.012 to 0.017.
- **Wrong:** predicted the effect would likely fail to survive proper controls.
  It survives everything except the linearity assumption.
- **Wrong:** implied the reported number might be arithmetically inconsistent.
  It replicates exactly; the 0.33 vs 0.06 discrepancy is the
  differential-vs-level confusion, not an error.
- **Right:** the reported coefficient is not the claimed quantity.
- **Right:** distance selection was a live threat (~16% of the estimate).
- **Missed entirely:** functional form, which turned out to be the whole story.
