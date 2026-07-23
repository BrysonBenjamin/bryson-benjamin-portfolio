---
name: jujutsu-workflow
description: How this repo uses Jujutsu (jj), colocated with git, for rapid local iteration batched into single CI runs per PR. Use whenever making a series of related edits headed for one PR, isolating/removing a bad change, or shipping a hotfix.
---

This repo is a colocated jj + git repo (`.jj` and `.git` both present, in sync). `git`
and `gh` still work normally (CI reads `.git`), but day-to-day editing goes through
`jj` because it makes rapid-iteration-then-batch-push workflows much cheaper than raw
git.

Bootstrap on a fresh clone (local Mac or a cloud container): `bash scripts/setup-jj.sh`.
It installs jj if missing, runs `jj git init --colocate`, sets identity from git config,
tracks `main`, and installs the `tug` alias used below. Idempotent — safe to re-run.

## Why batch pushes

`.github/workflows/ci.yml` runs the full build+typecheck on every `push` to `main` and
on every `pull_request` event (which includes each push to the PR branch). Every
`jj git push` is a CI run. So: iterate freely and cheaply *locally*, and only push when
a batch of work is genuinely ready to be built.

## Core loop for one PR

1. Start the PR: `jj new main -m "wip: <topic>"` (or `jj new <parent-change>` if
   stacking on other in-flight work).
2. Edit files. jj auto-snapshots the working copy on every command — no `git add`,
   no separate commit step.
3. Keep iterating without creating new changes: just keep editing. Run `jj diff` to see
   the accumulated diff at any point, `jj describe -m "..."` to update the change
   description as the work solidifies.
4. If a chunk of work should be its own change instead of folded into the current one,
   use `jj new` again to start the next change on top, or `jj split` to carve a piece
   out of the current change after the fact.
5. When the batch is ready for CI: point the PR's bookmark at it and push once.
   ```
   jj bookmark set <branch-name> -r @      # first time, or after `jj new`
   jj tug                                  # subsequent updates: moves the bookmark
                                            # up to your latest finished change (@-)
   jj git push --bookmark <branch-name>
   ```
   `gh pr create --head <branch-name>` (once) to open the PR, then keep pushing the
   same bookmark — one CI run per push, not per local edit.

## Isolating and removing bad code fast

This is where jj beats git for this workflow: descendants auto-rebase, so dropping a
bad change doesn't require an interactive rebase.

- Find the offending change: `jj log` (each change has a short change-id on the left).
- Drop it entirely, keeping everything built on top of it: `jj abandon <change-id>`.
  jj automatically rebases any children onto the abandoned change's parent.
- Made a mistake abandoning/squashing/rebasing? Everything is undoable:
  `jj op log` to see the operation history, `jj undo` to revert the last operation, or
  `jj op restore <op-id>` to jump back to any earlier state. This is a safety net for
  the whole repo, not just the working copy.
- To back out edits in the *current* change without abandoning it:
  `jj restore [<path>]` reverts the working copy (or a path) to the parent change.

## Hotfixes without disturbing WIP

Because jj changes aren't tied to a single "checked out branch" the way git branches
are, you can hotfix without stashing whatever you're mid-edit on:

```
jj new main -m "hotfix: <description>"
# make the fix
jj bookmark set hotfix-<short-name> -r @
jj git push --bookmark hotfix-<short-name>
gh pr create --head hotfix-<short-name> --title "hotfix: ..." --base main
```

Your other in-progress change (from the core loop above) is untouched — jj didn't need
to move you off it, since `jj new main` creates a fresh, independent change and leaves
`@` on the new one only if you were on the change you just navigated from. Switch back
with `jj edit <change-id>` (found via `jj log`) to resume the WIP.

## Handing off work between cloud containers

jj has no sync of its own across machines — each container's `.jj` store (op log, undo
history, unpushed changes) is local to that container only. The one channel between two
containers is the same one git always had: the `origin` remote. There is no shared
filesystem or second remote backing this repo, so anything not pushed to `origin` is
invisible outside the container that made it.

To move in-progress work from one container to another:

**In the source container** (work can be unfinished — this is just for handoff, not a PR):
```
jj bookmark set wip-<topic> -r @
jj git push --bookmark wip-<topic>
```

**In the destination container:**
```
bash scripts/setup-jj.sh   # if it's a fresh container
jj git fetch
jj new wip-<topic>@origin -m "continuing wip-<topic>"
```

Pushing a `wip-*` bookmark with no open PR does not trigger the `pull_request` CI job
(that only fires on PR sync events), so parking WIP on `origin` for handoff is free —
it won't burn a CI run by itself.

jj's change-ids are stable content-addressed IDs, not just git SHAs, so once this work
is fetched elsewhere and later amended or rebased, it's still recognized as the same
logical change on subsequent pushes/fetches. That only applies after something has been
pushed at least once, though — there's no way to reach into another container's
unpushed local state.

## Cheat sheet

| Goal | Command |
|---|---|
| Start a new change | `jj new [<parent>] -m "..."` |
| Update the description | `jj describe -m "..."` |
| See accumulated diff | `jj diff` / `jj log` |
| Fold current change into parent | `jj squash` |
| Split current change in two | `jj split` |
| Drop a change, keep descendants | `jj abandon <change-id>` |
| Revert working copy to parent | `jj restore` |
| Move a bookmark to your latest finished change | `jj tug` |
| Push a batch for CI | `jj git push --bookmark <name>` |
| Undo the last jj operation | `jj undo` |
| Full operation history (repo-wide undo log) | `jj op log` |
| Switch to another in-progress change | `jj edit <change-id>` |
