import type { Run } from "../state";

export interface AgentOptions {
  prompt: string;
  run: Run;
  [key: string]: unknown;
}

export interface Agent {
  run(options: AgentOptions): Promise<void>;
}
