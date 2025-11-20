import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { turn } from "../turn";
import { hi } from "../ui";

export interface RunState {
  id: string;
  status: string;
  cwd: string;
  path: string;
  last_commit: string;
  last_review: string;
  mode: RunMode;
}

export type RunMode = "builder" | "reviewer";

export class Run {
  private constructor(
    public id: string,
    public state: RunState,
  ) {}

  static async create(state: RunState): Promise<Run> {
    const run = new Run(state.id, state);
    await run.save();
    return run;
  }

  static async find(ralph: string, id: string): Promise<Run | undefined> {
    const store = (await Bun.file(join(ralph, "state.json")).json()) as RunState[];
    const run = store.find((r) => r.id === id);
    if (!run) {
      throw new Error(`Run ${id} not found`);
    }
    return new Run(run.id, run);
  }

  get review() {
    return {
      latest: async (): Promise<string | null> => {
        const path = join(this.state.path, "logs");

        try {
          const files = await readdir(path);
          const reviews = files
            .filter((f) => f.startsWith("review-") && f.endsWith(".json"))
            .sort()
            .reverse(); // Newest first

          if (reviews.length > 0) {
            return join(path, reviews[0]);
          }
        } catch (_e) {
          // ignore
        }
        return null;
      },
    };
  }

  async update(payload: Partial<RunState>) {
    this.state = { ...this.state, ...payload };
    await this.save();
  }

  async save() {
    const statePath = join(this.state.path, "../state.json");
    let store: RunState[] = [];
    try {
      if (await Bun.file(statePath).exists()) {
        store = (await Bun.file(statePath).json()) as RunState[];
      }
    } catch (_e) {
      // ignore error, start with empty array
    }

    const index = store.findIndex((r) => r.id === this.id);
    if (index !== -1) {
      store[index] = this.state;
    } else {
      store.push(this.state);
    }

    await Bun.write(statePath, JSON.stringify(store, null, 2));
  }

  async cached(): Promise<RunState | undefined> {
    const statePath = join(this.state.path, "../state.json");
    try {
      const store = (await Bun.file(statePath).json()) as RunState[];
      return store.find((r) => r.id === this.id);
    } catch {
      return undefined;
    }
  }

  async loop(loop: number) {
    hi(`(${loop}) Starting Loop`, this.id);
    const exitCode = await turn(this, loop);
    return exitCode;
  }
}
