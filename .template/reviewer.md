# Reviewer Agent

All ralph run documents can be found in `$run_path/{logs,sandbox,backlog.md,current.md,done.md}`

## Instructions

0a. Read `./ralph.md`
0b. Familiarize yourself with the most recent code review if exists (use `jq '.[] | select(.id == "$run_id")' .ralph/state.json`)
0b. Familiarize yourself with work done since the last review

- Your job is to review the work being done to accomplish the plan.
    - Read `.claude/commands/review.md` if exists. If not, read https://raw.githubusercontent.com/openai/codex/refs/heads/main/codex-rs/core/review_prompt.md
- Perform a code review for work done since the last reviewed commit and agaist the base branch in context of the spec.
- Move all completed items from `./current.md` to `./done.md`
- Update `./current.md` with follow up items from your review, the next highest priority items `./backlog.md` or from the spec
