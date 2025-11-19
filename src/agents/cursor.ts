import { join } from "node:path";
import type { Agent, AgentOptions } from "./contracts";

export class CursorAgent implements Agent {
  async run(options: AgentOptions) {
    const { prompt, run } = options;
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 16);
    const logFile = join(run.state.path, "logs", `composer-${timestamp}.md`);

    await Bun.spawn({
      cmd: ["a", "--force", prompt],
      env: {
        ...process.env,
        A_MARKDOWN: "1",
        A_LOG_FILE: logFile,
      },
      stdio: ["inherit", "inherit", "inherit"],
    }).exited;
  }
}
