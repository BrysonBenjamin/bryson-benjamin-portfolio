---
name: jujutsu-workflow
description: Use this repository's colocated Jujutsu (jj) and git workflow for Codex work in the portfolio repo, especially when making related edits for one PR, bootstrapping local or cloud-container workspaces, isolating/removing bad changes, preserving WIP while hotfixing, or batching pushes to avoid unnecessary CI runs.
---

# Jujutsu Workflow

This repo is a colocated `jj` + `git` repo: `.jj` and `.git` both exist, GitHub and CI still read git, and local work should use Jujutsu for cheap iteration with undoable operations.

## Start Of Turn

1. Run `jj status` and `jj log --limit 8` before editing.
2. If `.jj` is missing or `jj` is unavailable, run `bash scripts/setup-jj.sh`. The script is idempotent and supports local Macs, cloud containers, and Linux environments without Homebrew.
3. Keep using normal repo instructions for package managers, tests, GitHub, and Linear. This skill only changes the VCS workflow.

## Cloud Container Bootstrap

For a fresh clone in a cloud container:

```bash
bash scripts/setup-jj.sh
jj status
jj bookmark list --all-remotes
```

`scripts/setup-jj.sh` installs `jj` if needed, runs `jj git init --colocate`, copies identity from git config when available, tracks `main@origin`, and installs the `jj tug` alias.

If the container cannot install to `/usr/local/bin`, install `jj` with the environment's package path first, then rerun `bash scripts/setup-jj.sh` to finish repo setup.

## BRY / Linear Branches

For Linear issue work, prefer the Linear-provided branch name when available. For example, `BRY-39` currently maps to:

```bash
jbenjamin1616/bry-39-sa-sa-agentic-mascot-character-page-integration-framework
```

Use that as the jj bookmark/PR branch unless the user asks for a different branch.

## Core Loop For One PR

1. Create or enter a change:

```bash
jj new main -m "wip: <topic>"
```

Use `jj new <parent-change>` when stacking on an in-flight change.

2. Edit files normally. Jujutsu auto-snapshots on every command, so there is no `git add` or separate local commit step during iteration.

3. Inspect and describe the current change:

```bash
jj diff
jj describe -m "<clear change description>"
```

4. Split or stack only when the work genuinely wants separate review units:

```bash
jj split
jj new
```

5. Push only when the batch is ready for CI:

```bash
jj bookmark set <branch-name> -r @
jj git push --bookmark <branch-name>
```

For later updates after creating a new child change, use:

```bash
jj tug
jj git push --bookmark <branch-name>
```

Each `jj git push` triggers GitHub CI for the PR, so prefer local verification and batch pushes.

## Bad Change Recovery

Use `jj log` to find the short change ID.

Drop a bad change while keeping descendants:

```bash
jj abandon <change-id>
```

Undo a mistaken operation:

```bash
jj op log
jj undo
```

Restore only current-change edits:

```bash
jj restore
jj restore <path>
```

## Hotfix Without Disturbing WIP

```bash
jj new main -m "hotfix: <description>"
# make the fix
jj bookmark set hotfix-<short-name> -r @
jj git push --bookmark hotfix-<short-name>
gh pr create --head hotfix-<short-name> --title "hotfix: <description>" --base main
```

Return to prior work with:

```bash
jj edit <change-id>
```

## Git Interop

- Use `git status` only as a sanity check or for tools that require git.
- Use `jj git push --bookmark <name>` for pushing PR branches.
- Do not run destructive git commands to manage local WIP; prefer `jj abandon`, `jj restore`, `jj undo`, or `jj op restore`.
- After successful `jj git push`, report the pushed bookmark as the branch.

## Cheat Sheet

| Goal | Command |
|---|---|
| Bootstrap repo | `bash scripts/setup-jj.sh` |
| Start a change | `jj new [<parent>] -m "..."` |
| Update description | `jj describe -m "..."` |
| See work | `jj status`, `jj diff`, `jj log` |
| Fold current change into parent | `jj squash` |
| Split current change | `jj split` |
| Drop a change, keep descendants | `jj abandon <change-id>` |
| Revert current edits | `jj restore [<path>]` |
| Move bookmark to latest finished parent | `jj tug` |
| Push once for CI | `jj git push --bookmark <name>` |
| Undo last jj operation | `jj undo` |
| Inspect operation history | `jj op log` |
| Switch WIP | `jj edit <change-id>` |
