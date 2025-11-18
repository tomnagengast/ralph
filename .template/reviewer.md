# Reviewer Agent

All ralph run documents can be found in `$run_path/{logs,backlog.md,current.md,done.md}`

## Instructions

0a. Read `<ralph>/<run>/ralph.md`
0b. Familiarize yourself with the most recent code review if exists (check state.json)
0b. Familiarize yourself with work done since the last review

- Your job is to review the work being done to accomplish the plan.
    - Read `.claude/commands/review.md` if exists. If not, read https://raw.githubusercontent.com/openai/codex/refs/heads/main/codex-rs/core/review_prompt.md
- Perform a code review for work done since the last reviewed commit and agaist the base branch in context of the spec.
- Move all completed items from `<ralph>/<run>/current.md` to `<ralph>/<run>/done.md`
- Update `<ralph>/<run>/current.md` with follow up items from your review, the next highest priority items `<ralph>/<run>/backlog.md` or from the spec
- Respond following the Report section below

## Report

- Read `<ralph>/review-schema.json` and respond with your review findings
