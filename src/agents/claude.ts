import { join } from "node:path";
import type { Agent, AgentOptions } from "./contracts";

export class ClaudeAgent implements Agent {
  async run(options: AgentOptions) {
    const { prompt, run } = options;
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 16);
    const logFile = join(run.state.path, "logs", `claude-${timestamp}.jsonl`);

    const p1 = Bun.spawn({
      cmd: [
        "claude",
        "-p",
        "--output-format=stream-json",
        "--verbose",
        "--dangerously-skip-permissions",
        prompt,
      ],
      stderr: "inherit",
      stdout: "pipe",
    });

    const tee = Bun.spawn({
      cmd: ["tee", "-a", logFile],
      stdin: p1.stdout,
      stdout: "pipe",
      stderr: "inherit",
    });

    const p3 = Bun.spawn({
      cmd: ["npx", "repomirror", "visualize", "--debug"],
      stdin: tee.stdout,
      stdout: "inherit",
      stderr: "inherit",
    });

    await p3.exited;
  }
}
