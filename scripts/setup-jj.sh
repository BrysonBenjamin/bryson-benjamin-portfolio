#!/usr/bin/env bash
# Bootstraps Jujutsu (jj) as a colocated VCS on top of this repo's git history.
# Safe to run on a fresh clone anywhere: local Mac, a cloud dev container, or CI.
# Re-running is a no-op where things are already set up.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '[setup-jj] %s\n' "$1"; }

# --- 1. Install jj if missing -----------------------------------------------
if ! command -v jj >/dev/null 2>&1; then
  log "jj not found, installing..."
  if [[ "$(uname -s)" == "Darwin" ]] && command -v brew >/dev/null 2>&1; then
    brew install jj
  elif command -v cargo >/dev/null 2>&1; then
    cargo install --locked jj-cli
  else
    # Prebuilt static binary for Linux containers without brew/cargo.
    JJ_VERSION="0.43.0"
    ARCH="$(uname -m)"
    case "$ARCH" in
      x86_64) TARGET="x86_64-unknown-linux-musl" ;;
      aarch64|arm64) TARGET="aarch64-unknown-linux-musl" ;;
      *) log "Unsupported architecture: $ARCH. Install jj manually: https://jj-vcs.github.io/jj/latest/install-and-setup/"; exit 1 ;;
    esac
    URL="https://github.com/jj-vcs/jj/releases/download/v${JJ_VERSION}/jj-v${JJ_VERSION}-${TARGET}.tar.gz"
    TMP_DIR="$(mktemp -d)"
    curl -fsSL "$URL" -o "$TMP_DIR/jj.tar.gz"
    tar -xzf "$TMP_DIR/jj.tar.gz" -C "$TMP_DIR"
    install -m 755 "$TMP_DIR/jj" /usr/local/bin/jj
    rm -rf "$TMP_DIR"
  fi
  log "jj installed: $(jj --version)"
else
  log "jj already installed: $(jj --version)"
fi

# --- 2. Colocate jj with the existing git repo ------------------------------
if [[ ! -d .jj ]]; then
  log "Initializing jj (colocated with .git)..."
  jj git init --colocate
else
  log ".jj already present, skipping init."
fi

# --- 3. Identity -------------------------------------------------------------
# Prefer existing git identity so authorship stays consistent with git history.
JJ_NAME="$(jj config get user.name 2>/dev/null || true)"
if [[ -z "$JJ_NAME" ]]; then
  GIT_NAME="$(git config user.name 2>/dev/null || true)"
  GIT_EMAIL="$(git config user.email 2>/dev/null || true)"
  if [[ -n "$GIT_NAME" && -n "$GIT_EMAIL" ]]; then
    jj config set --user user.name "$GIT_NAME"
    jj config set --user user.email "$GIT_EMAIL"
    log "Set jj identity from git config: $GIT_NAME <$GIT_EMAIL>"
  else
    log "No git identity found. Set one manually:"
    log '  jj config set --user user.name "Your Name"'
    log '  jj config set --user user.email "you@example.com"'
  fi
fi

# --- 4. Track the main remote bookmark --------------------------------------
if jj bookmark list --all-remotes 2>/dev/null | grep -q 'main@origin' \
   && ! jj bookmark list 2>/dev/null | grep -q '^main '; then
  jj bookmark track main --remote=origin 2>/dev/null || true
  log "Tracking main@origin."
fi

# --- 5. Quality-of-life aliases for the rapid-iteration workflow -----------
# tug: advance the nearest bookmark up to the parent of the working copy.
# Used after `jj new` + edits to move your PR bookmark to the change you just finished.
jj config set --user 'aliases.tug' '["bookmark", "move", "--from", "closest_bookmark(@-)", "--to", "@-"]' 2>/dev/null || true

log "Done. See .claude/skills/jujutsu-workflow/SKILL.md for the workflow this repo uses."
jj log --limit 3
