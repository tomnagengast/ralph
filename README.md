

## Architecture

### Setup

Each run gets it's own dir:
```sh
run_id="run-$(date +%s)"
mkdir -p .ralph/$run_id/{logs,notes}/
```

Along with the following artifacts
```sh
touch .ralph/$run_id/{backlog.md,builder.md,current.md,ralph.md,reviewer.md}
```

### Setup

Clone this repo into `$project/.ralph`
```sh
git clone git@github.com:tomnagengast/ralph.git .ralph
```

Run ralph
```sh
.ralph/run.sh
```

### Artifacts

#### backlog.md

This is a notepad for the user – items that ralph should focus on eventually, but not at the moment.
Items will be move from the backlog.md to current.md by either the user or the reviewer agent based on review feedback.

#### builder.md

This is the prompt for the builder agent.
It should provide development specific instructions like how coding standards, how to run and test it's work, and any additionl tooling it should use during implementation.

#### current.md

This is contains details on what single item the ralph loop should focus on immediately.

#### ralph.md

This is the core ralph prompt that will be referenced by all builder and reviewer agents.
It should contain instructions on how to gather context about the current goal of the ralph run and goals what what "done" looks like

#### reviewer.md

This is the prompt for the reviewer agent.
It should specific explicitly not to make any modifications to the code and where is should save it's review for the next loop builder to access.
It should provide development specific instructions like how coding standards, how to run and test it's work, and any additionl tooling it should use during code review.
