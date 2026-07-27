export type ResearchStat = {
  label: string;
  meta: string;
  value: string;
};

export type ResearchPillar = {
  title: string;
  body: string;
  tag: string;
};

export const researchPaper = {
  title: "Temporal and Pressure Effects: Evidence from NFL Field Goals",
  subtitle: "Undergraduate thesis on psychological pressure and performance in the NFL",
  author: "Bryson Benjamin",
  institution: "New York University Shanghai, Arts and Sciences",
  degreeLine: "B.A. Economics & B.S. Data Science, NYU / NYU Shanghai",
  date: "May 2025",
  pdfPath: "/papers/temporal-and-pressure-effects-nfl-field-goals.pdf",
  pdfDownloadName: "Bryson-Benjamin-Temporal-and-Pressure-Effects-NFL-Field-Goals.pdf",
  lead: "My undergraduate thesis asks a simple question with a messy answer: when the clock is running out in a close game, do NFL kickers actually get worse? Using 23,583 field goal attempts and a continuous measure of time pressure instead of the usual binary “clutch” indicator, the answer is yes — a small, statistically significant decline that lines up with decades of psychology research on performance under stress.",
  abstract:
    "This paper examines whether psychological pressure—proxied by dwindling game time in high-stakes situations—affects field goal accuracy in the National Football League (NFL). Using 23,583 field goal attempts from 2000 to 2023, I estimate a logistic regression model that interacts continuous game time remaining with game closeness and quarter. Unlike prior research that relies on binary clutch classifications, this study employs a continuous pressure measure and controls for kick distance, kicker fixed effects, wind speed, and stadium conditions. Results show that in close fourth-quarter situations, every 100-second decrease in remaining game time reduces the probability of a successful kick by 0.33 percentage points. This effect is absent in non-close games, supporting behavioral theories of performance deterioration under pressure. The findings contribute to the literature on stress, decision-making, and sports analytics, and have practical implications for coaching strategy and real-time risk assessment.",
  keywords: ["Football", "Yerkes-Dodson", "Behavioral Economics", "American Football", "Field Goal Kicking"],
  citation:
    "Benjamin, Bryson. “Temporal and Pressure Effects: Evidence from NFL Field Goals.” Undergraduate thesis, NYU Shanghai, May 2025.",
  coursework: [
    "Advanced Econometrics",
    "Behavioral Economics",
    "Game Theory",
    "Statistical Modeling",
    "Machine Learning",
    "Probability Theory",
    "Data Engineering"
  ]
} as const;

export const researchStats: readonly ResearchStat[] = [
  {
    label: "Field goal attempts analyzed",
    value: "23,583",
    meta: "NFL play-by-play data, 2000–2023"
  },
  {
    label: "Effect in close 4th-quarter kicks",
    value: "−0.33 pp",
    meta: "per 100 seconds remaining, p < 0.05"
  },
  {
    label: "Kickers controlled for",
    value: "179",
    meta: "individual fixed effects, 6 robustness checks"
  }
];

export const researchPillars: readonly ResearchPillar[] = [
  {
    title: "Psychological factors",
    tag: "Behavioral economics",
    body: "The core question is behavioral: does rising arousal under a ticking clock impair a well-rehearsed motor skill? The model is built around the Yerkes-Dodson law and the choking-under-pressure literature, testing whether performance decay is real or just an artifact of how earlier studies measured “clutch.”"
  },
  {
    title: "Game theory & strategy",
    tag: "Strategic decision-making",
    body: "Coaches face a live decision problem every time the kicking unit takes the field: distance, win probability, and the opponent's incentives all interact. Treating pressure as continuous rather than binary is meant to give that decision a sharper signal than a simple “clutch or not” flag."
  },
  {
    title: "Empirical methods in R",
    tag: "Applied econometrics",
    body: "Everything runs through R: play-by-play data pulled with NFLFastR, a logistic regression with a three-way interaction term, kicker and stadium fixed effects, an EPA balance test for identification, and GVIF diagnostics to rule out multicollinearity. Six alternate specifications confirm the result holds."
  }
];
