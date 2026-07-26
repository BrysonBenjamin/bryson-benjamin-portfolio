"""Fetch and cache NFL play-by-play data from nflverse-data.

This is the Python-native replacement for the original paper's data source
(the R package `nflfastR`, plus Pro Football Reference for stadium/surface
detail). `nflfastR` itself reads from the same place this module does: the
`nflverse-data` GitHub release assets, which are the canonical, versioned
distribution of NFL play-by-play back to 1999, refreshed weekly during the
season. Reading directly from those release assets means:

- no R dependency to reproduce the original data pull
- an updated sample: the original paper covers 2000-2023 (23,583 attempts);
  the 2024 and 2025 seasons are now available, so DEFAULT_SEASONS below
  already extends past the paper's cutoff
- one HTTP GET per season, cached locally so re-running analysis doesn't
  re-download

Everything past "get a season's play-by-play as a DataFrame" (filtering to
field goal attempts, constructing Close_Game/Post4, etc.) lives in
`build_dataset.py`, not here.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd
import requests

RELEASE_URL_TEMPLATE = (
    "https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_{season}.parquet"
)

# The original paper used 2000-2023. nflverse-data has 1999 onward; we start
# at 2000 to match the paper and extend through the most recent completed
# season so the recreation runs on more data than the original, not less.
DEFAULT_SEASONS: range = range(2000, 2026)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"


def season_cache_path(season: int, raw_dir: Path = RAW_DATA_DIR) -> Path:
    return raw_dir / f"play_by_play_{season}.parquet"


def fetch_season(season: int, *, raw_dir: Path = RAW_DATA_DIR, force: bool = False) -> Path:
    """Download one season's play-by-play parquet from nflverse-data, caching it locally.

    Returns the local path. Safe to call repeatedly - only re-downloads when
    `force=True` or the cached file is missing.
    """
    raw_dir.mkdir(parents=True, exist_ok=True)
    dest = season_cache_path(season, raw_dir)
    if dest.exists() and not force:
        return dest

    url = RELEASE_URL_TEMPLATE.format(season=season)
    response = requests.get(url, timeout=60)
    response.raise_for_status()

    tmp = dest.with_suffix(".parquet.tmp")
    tmp.write_bytes(response.content)
    tmp.replace(dest)
    return dest


def load_seasons(seasons: range | list[int] = DEFAULT_SEASONS, *, raw_dir: Path = RAW_DATA_DIR) -> pd.DataFrame:
    """Fetch (if needed) and concatenate play-by-play for every season given.

    This returns the *raw* nflverse play-by-play schema - one row per play,
    every play type, hundreds of columns. Filtering down to field goal
    attempts and the specific columns the paper uses happens in
    `build_dataset.py`.
    """
    frames = []
    for season in seasons:
        path = fetch_season(season, raw_dir=raw_dir)
        frames.append(pd.read_parquet(path))
    return pd.concat(frames, ignore_index=True)


if __name__ == "__main__":
    df = load_seasons()
    print(f"Loaded {len(df):,} plays across {df['season'].nunique()} seasons "
          f"({df['season'].min()}-{df['season'].max()})")
