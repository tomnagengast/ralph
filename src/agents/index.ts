import { ClaudeAgent } from "./claude";
import { CodexAgent } from "./codex";
import type { Agent, AgentOptions } from "./contracts";
import { CursorAgent } from "./cursor";
import { GeminiAgent } from "./gemini";

export function createAgent(name: string): Agent {
  switch (name) {
    case "claude":
      return new ClaudeAgent();
    case "codex":
      return new CodexAgent();
    case "cursor":
      return new CursorAgent();
    case "gemini":
      return new GeminiAgent();
    default:
      throw new Error(`Unknown agent: ${name}`);
  }
}

export async function runAgent(
  agentName: string,
  options: AgentOptions,
  _type: "builder" | "reviewer", // keeping for potential future use or logging
) {
  const agent = createAgent(agentName);
  await agent.run(options);
}
