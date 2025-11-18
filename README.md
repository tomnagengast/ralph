# ralph

## Setup

Clone this repo into `$project/.ralph`
```sh
git clone git@github.com:tomnagengast/ralph.git .ralph
```

Start a new ralph run and select "Setup a new run":
```sh
.ralph/run.sh
Choose:
> Setup a new run
```

This copies the `.ralph/run-template` to a dedicated `run-$(date +%Y-%m-%d-%H%M)` directory.

You can then:
- Update `.ralph/<run>/ralph.md` with your spec or additional run-specific context for the agents
- Add items to the `.ralph/<run>/{current.md,backlog.md}` with items you want ralph to work on first
- Update the `.ralph/<run>/config.toml` to use different agents for the builder or reviewer

Then run ralph
```sh
$ .ralph/run.sh
Choose:
  Setup a new run
> run-2006-01-02-1504
```

## Artifacts

### backlog.md

This is a notepad for the user – items that ralph should focus on eventually, but not at the moment.
Items will be move from the backlog.md to current.md by either the user or the reviewer agent based on review feedback.

### builder.md

This is the prompt for the builder agent.
It should provide development specific instructions like how coding standards, how to run and test it's work, and any additionl tooling it should use during implementation.

### current.md

This is contains details on what single item the ralph loop should focus on immediately.

### ralph.md

This is the core ralph prompt that will be referenced by all builder and reviewer agents.
It should contain instructions on how to gather context about the current goal of the ralph run and goals what what "done" looks like

### reviewer.md

This is the prompt for the reviewer agent.
It should specific explicitly not to make any modifications to the code and where is should save it's review for the next loop builder to access.
It should provide development specific instructions like how coding standards, how to run and test it's work, and any additionl tooling it should use during code review.
