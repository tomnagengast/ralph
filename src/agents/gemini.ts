import { display, finish } from "../ui/gemini";
import type { Agent, AgentOptions } from "./contracts";

export class GeminiAgent implements Agent {
  async run(options: AgentOptions) {
    const { prompt, run } = options;
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 16);
    const system = `
    <system_prompt>
    When acting as the reviewer, save your final review to ${run.state.path}/logs/review-${timestamp}.json
    using the format from ${run.state.path}/../review-schema.json
    </system_prompt>
  `;
    const fullPrompt = `${system}\n${prompt}`;

    const proc = Bun.spawn({
      cmd: [
        "gemini",
        "-m",
        "gemini-3-pro-preview",
        "--yolo",
        "--output-format",
        "stream-json",
        "-p",
        fullPrompt,
      ],
      stdout: "pipe",
      stderr: "inherit",
    });

    if (proc.stdout) {
      const reader = proc.stdout.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });

        let index = buffer.indexOf("\n");
        while (index !== -1) {
          const line = buffer.slice(0, index);
          buffer = buffer.slice(index + 1);
          display(line);
          index = buffer.indexOf("\n");
        }
      }

      buffer += decoder.decode();
      if (buffer) {
        display(buffer);
      }

      finish();
    }

    await proc.exited;
  }
}
