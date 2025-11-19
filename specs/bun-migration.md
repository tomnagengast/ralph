# Bun/TypeScript CLI Migration Plan

## Objective
Refactor the current Shell script-based orchestration (`run.sh`, `turn.sh`) into a unified, type-safe Bun CLI application. This moves logic from fragile string parsing/shell commands to structured TypeScript, improving maintainability, error handling, and the developer experience.

## Current vs. Future State

| Feature | Current (`*.sh`) | Future (Bun/TS) |
| :--- | :--- | :--- |
| **Orchestration** | `run.sh` loop with `exit` codes | `LoopManager` class with async control flow |
| **State Mgmt** | `jq` editing `state.json` | Typed `State` service (read/write JSON) |
| **Config** | `yq` parsing `config.toml` | `Bun.TOML` native parsing + Zod validation |
| **User Input** | `gum` | `@inquirer/prompts` (native Node/Bun interactive) |
| **Agent Exec** | Shell functions in `turn.sh` | `Agent` Strategy Pattern (Class per provider) |
| **Output** | Mixed `echo`, `gum`, and pipe to `gemini-display` | Unified `Renderer` class (Ported from `display/`) |

## Proposed Architecture

### Directory Structure
We will consolidate logic into a `src` directory within `.ralph`.

```text
.ralph/
├── src/
│   ├── agents/         # Agent adapters (Claude, Cursor, Gemini)
│   ├── core/           # Core logic
│   │   ├── config.ts   # TOML parsing
│   │   ├── state.ts    # state.json management
│   │   └── loop.ts     # Main execution loop
│   ├── ui/             # Display logic (ported from display/gemini)
│   │   ├── renderer.ts
│   │   └── prompts.ts
│   ├── utils/          # Helpers (git, fs)
│   └── cli.ts          # Entry point
├── package.json        # Unified dependencies
└── tsconfig.json
```

### Key Technologies
- **Runtime:** Bun (Native TypeScript support, fast startup).
- **CLI Args:** `cac` or `commander` (Lightweight argument parsing).
- **Validation:** `zod` (Runtime validation for Config and State schemas).
- **Interactivity:** `@inquirer/prompts` (Replaces `gum` for choices/inputs).
- **Formatting:** `chalk`, `boxen`, `marked-terminal` (Ported from existing display logic).

## Migration Phases

### Phase 1: Infrastructure & Scaffolding
1.  Initialize `package.json` in `.ralph`.
2.  Install dependencies: `zod`, `boxen`, `chalk`, `@inquirer/prompts`.
3.  Set up the `src` directory structure.
4.  Create `src/types.ts` to define `RunConfig`, `RunState`, and `Agent` interfaces.

### Phase 2: Core Services (State & Config)
1.  **Config Service:** Implement `ConfigManager` to read/parse `run-template/config.toml` and run-specific configs using `Bun.TOML`.
2.  **State Service:** Implement `StateManager` to robustly read/write `.ralph/state.json` using Zod to ensure schema integrity (replacing fragile `jq` edits).
3.  **Run Management:** Implement logic to list existing runs, create new runs (copying templates), and manage directory paths.

### Phase 3: Agent Orchestration
1.  Define an abstract `Agent` class/interface.
2.  Implement `ClaudeAgent`, `CursorAgent`, `CodexAgent`, and `GeminiAgent`.
3.  Use `Bun.spawn` to execute the underlying CLI tools, capturing stdout/stderr streams for the UI renderer.
4.  Port the logging logic (writing to `logs/`).

### Phase 4: The Loop & UI
1.  Port the `GlowRenderer` from `display/gemini/index.ts` to `src/ui/renderer.ts`.
2.  Implement the main `Loop` class that handles the cycle:
    *   Check State
    *   Run Builder
    *   Run Reviewer
    *   Update State
3.  Replace `turn.sh` logic with specific `Agent.execute()` calls.

### Phase 5: Cutover
1.  Create a `ralph` binary entry point.
2.  Verify feature parity with `run.sh`.
3.  Update documentation.
4.  Deprecate `*.sh` files.

## Detailed Implementation Specs

### State Schema (Zod)
```typescript
const RunStatus = z.enum(['active', 'inactive', 'ok']);

const RunStateItem = z.object({
  id: z.string(),
  status: RunStatus,
  path: z.string(),
  last_commit: z.string(),
  last_review: z.string().optional(),
});
```

### Agent Interface
```typescript
interface Agent {
  name: string;
  execute(prompt: string, context: RunContext): Promise<AgentResult>;
}
```

## Success Criteria
- [ ] `bun run start` replaces `.ralph/run.sh`.
- [ ] Creating a new run works identically (files copied, state updated).
- [ ] Selecting an existing run resumes the loop.
- [ ] All agents (Claude, Cursor, Gemini) execute correctly.
- [ ] Output is visually identical or better than current `gemini-display`.
