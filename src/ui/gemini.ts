import ansiEscapes from "ansi-escapes";
import boxen, { type Options } from "boxen";
import { highlight } from "cli-highlight";
import wrapAnsi from "wrap-ansi";
import { renderMarkdown } from "./markdown";
import { CONTENT_WIDTH, colors, TERMINAL_WIDTH } from "./theme";

type Role = "user" | "assistant_delta" | "tool_use" | "tool_result" | "result" | null;

type InitEvent = {
  type: "init";
  session_id: string;
  model: string;
};

type MessageEvent = {
  type: "message";
  role: "user" | "assistant";
  content: string;
};

type ToolUseEvent = {
  type: "tool_use";
  tool_name: string;
  parameters: unknown;
};

type ToolResultEvent = {
  type: "tool_result";
  status: string;
  output?: unknown;
};

type ResultEvent = {
  type: "result";
  stats?: {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    duration_ms: number;
  };
};

type StreamEvent = InitEvent | MessageEvent | ToolUseEvent | ToolResultEvent | ResultEvent;

type State = {
  role: Role;
  buffer: string;
  lines: string[];
};

function write(text: string) {
  process.stdout.write(text);
}

function writeLine(text = "") {
  process.stdout.write(`${text}\n`);
}

function updateAssistant(state: State, text: string) {
  const rendered = renderMarkdown(text);
  const next = rendered.split("\n");

  let index = 0;
  const max = Math.min(state.lines.length, next.length);

  while (index < max) {
    if (state.lines[index] !== next[index]) {
      break;
    }
    index++;
  }

  const erase = state.lines.length - index;
  if (erase > 0) {
    write(ansiEscapes.eraseLines(erase));
  }

  const add = next.slice(index);
  if (add.length > 0) {
    if (erase === 0 && index > 0) {
      write("\n");
    }
    write(add.join("\n"));
  }

  state.lines = next;
}

function finalizeAssistant(state: State) {
  writeLine();
  state.lines = [];
  state.buffer = "";
  state.role = null;
}

function handleInit(event: InitEvent) {
  writeLine();
  console.log(
    boxen(
      `${colors.gray("Session ID:")} ${colors.text(event.session_id)}
${colors.gray("Model:")}      ${colors.text(event.model)}`,
      {
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        margin: 0,
        borderStyle: "round",
        borderColor: "green",
        title: "Gemini Session Started",
        width: TERMINAL_WIDTH,
      } as Options,
    ),
  );
  writeLine();
}

function handleUserMessage(event: MessageEvent) {
  writeLine();
  writeLine(colors.accent.bold("❯ User"));
  const wrapped = wrapAnsi(event.content, CONTENT_WIDTH);
  writeLine(
    wrapped
      .split("\n")
      .map((line) => `  ${colors.text(line)}`)
      .join("\n"),
  );
}

function handleAssistantMessage(state: State, event: MessageEvent) {
  if (state.role !== "assistant_delta") {
    writeLine();
    writeLine(colors.primary.bold("❯ Gemini"));
    state.role = "assistant_delta";
    state.buffer = "";
    state.lines = [];
  }

  state.buffer += event.content || "";
  updateAssistant(state, state.buffer);
}

function handleToolUse(event: ToolUseEvent) {
  writeLine();
  const json = JSON.stringify(event.parameters, null, 2);
  let body = json;
  try {
    body = highlight(json, {
      language: "json",
      ignoreIllegals: true,
    });
  } catch {
    // ignore
  }

  console.log(
    boxen(body, {
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
      margin: 0,
      borderStyle: "round",
      borderColor: "blue",
      title: `${colors.secondary("Tool Use:")} ${colors.text.bold(event.tool_name)}`,
      width: TERMINAL_WIDTH,
    }),
  );
}

function handleToolResult(event: ToolResultEvent) {
  writeLine();
  const isError = event.status === "error";
  const color = isError ? "red" : "green";
  const label = isError ? "(err)" : "(ok)";

  let body = "(No output)";
  if (event.output) {
    const raw = typeof event.output === "string" ? event.output : JSON.stringify(event.output, null, 2);
    if (raw.length > 2000) {
      body = `${raw.substring(0, 2000)}\n... (truncated)`;
    } else {
      body = raw;
    }
  }

  console.log(
    boxen(body, {
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
      margin: 0,
      borderStyle: "round",
      borderColor: color,
      title: `Tool Result ${isError ? colors.red(label) : colors.green(label)}`,
      width: TERMINAL_WIDTH,
    }),
  );
}

function handleResult(event: ResultEvent) {
  writeLine();
  let body = "";
  if (event.stats) {
    body = `${colors.gray("Tokens:")} ${event.stats.total_tokens} (${event.stats.input_tokens} in / ${event.stats.output_tokens} out)\n${colors.gray("Duration:")} ${event.stats.duration_ms}ms`;
  }

  console.log(
    boxen(body, {
      padding: 0,
      margin: 0,
      borderStyle: "double",
      borderColor: "green",
      title: "Completed",
      width: TERMINAL_WIDTH,
      textAlignment: "center",
    }),
  );
  writeLine();
}

function handleLine(state: State, raw: string) {
  const line = raw.trim();
  if (!line) {
    return;
  }

  try {
    if (!line.startsWith("{")) {
      if (state.role === "assistant_delta") {
        finalizeAssistant(state);
      }
      console.log(
        boxen(line, {
          padding: 0,
          borderStyle: "classic",
          borderColor: "yellow",
          width: TERMINAL_WIDTH,
        }),
      );
      return;
    }

    const data = JSON.parse(line) as StreamEvent;
    const type = data.type;

    if (state.role === "assistant_delta" && (type !== "message" || (data as MessageEvent).role !== "assistant")) {
      finalizeAssistant(state);
    }

    if (type === "init") {
      handleInit(data as InitEvent);
      return;
    }

    if (type === "message") {
      const event = data as MessageEvent;
      if (event.role === "user") {
        handleUserMessage(event);
        state.role = "user";
        return;
      }
      if (event.role === "assistant") {
        handleAssistantMessage(state, event);
        return;
      }
    }

    if (type === "tool_use") {
      handleToolUse(data as ToolUseEvent);
      state.role = "tool_use";
      return;
    }

    if (type === "tool_result") {
      handleToolResult(data as ToolResultEvent);
      state.role = "tool_result";
      return;
    }

    if (type === "result") {
      handleResult(data as ResultEvent);
      state.role = "result";
    }
  } catch {
    // ignore
  }
}

const state: State = {
  role: null,
  buffer: "",
  lines: [],
};

export function display(line: string) {
  handleLine(state, line);
}

export function finish() {
  if (state.role === "assistant_delta") {
    finalizeAssistant(state);
  }
}
