import { join } from "node:path";
import { $ } from "bun";
import type { Agent, AgentOptions } from "./contracts";

export class CodexAgent implements Agent {
  async run(options: AgentOptions) {
    const { prompt, run } = options;
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 16);
    const reviewPath = join(run.state.path, "logs", `review-${timestamp}.json`);
    const schemaPath = join(run.state.path, "../review-schema.json");

    await Bun.spawn({
      cmd: [
        "codex",
        "--yolo",
        "exec",
        "--skip-git-repo-check",
        "--output-schema",
        schemaPath,
        "--output-last-message",
        reviewPath,
        prompt,
      ],
      stdio: ["inherit", "inherit", "inherit"],
    }).exited;

    // Update state.json
    try {
      const commit = (await $`git rev-parse HEAD`.text()).trim();
      await run.update({
        last_commit: commit,
        last_review: reviewPath,
      });
    } catch (e) {
      console.error("Failed to update state.json", e);
    }
  }
}
