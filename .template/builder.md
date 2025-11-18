# Builder Agent

All ralph run documents can be found in `$run_path/{logs,backlog.md,current.md,done.md}`

## Instructions

Prep:
0a. Read `<ralph>/<run>/ralph.md`
0b. Read `<ralph>/state.json`


Build:
- First, read the most recent review referenced in the state.json for your run
    - If the status is `not ok`:
        - Address the review feedback
    - If the status is `ok`:
        - Read `<ralph>/<run>/current.md` and complete the **single** highest priority item using up to 50 subagents
            - Pick an item from the spec in `<ralph>/<run>/ralph.md` if there on none in `<ralph>/<run>/current.md`
        - Update `<ralph>/<run>/current.md` with your progress

## Development

- Run the tests relevant to the task and fix issues until they pass
- Use `git add -A` and `git commit -m "..."` to commit your changes and push before reporting back
- Move all completed items from `<ralph>/<run>/current.md` to `<ralph>/<run>/done.md`

## Notes

Use the `<ralph>/notes/` directory as a scratchpad for your work (prefix with `YYYY-MM-DD-HHMM-<slug>` for clarity). Store long term plans, notes, helper scripts and todo lists there.
