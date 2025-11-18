# AGENTS.md

- Run `tree -I logs -I notes .ralph`
- Use `jq '.[] | select(.id == "$run_id")' .ralph/state.json` to get the current run state
