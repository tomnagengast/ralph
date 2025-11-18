#!/usr/bin/env bun

import { createInterface } from "node:readline";
import ansiEscapes from "ansi-escapes";
import boxen from "boxen";
import chalk from "chalk";
import { highlight } from "cli-highlight";
import { marked } from "marked";
import wrapAnsi from "wrap-ansi";

// --- Theme Setup ---
const colors = {
  primary: chalk.hex("#FF79C6"),
  secondary: chalk.hex("#BD93F9"),
  accent: chalk.hex("#8BE9FD"),
  text: chalk.hex("#F8F8F2"),
  gray: chalk.hex("#6272A4"),
  green: chalk.hex("#50FA7B"),
  orange: chalk.hex("#FFB86C"),
  red: chalk.hex("#FF5555"),
  yellow: chalk.hex("#F1FA8C"),
  blue: chalk.hex("#8BE9FD"),
};

const TERMINAL_WIDTH = process.stdout.columns || 80;
// Reduce content width to accommodate list indentation without causing terminal wrapping
// 80 - 8 = 72. List indent is 4. 72+4 = 76. Safe.
const CONTENT_WIDTH = Math.max(20, TERMINAL_WIDTH - 8);

// --- Custom Renderer ---
class GlowRenderer extends marked.Renderer {
  code(code, language) {
    let highlighted = code;
    try {
      highlighted = highlight(code, {
        language: language || "txt",
        ignoreIllegals: true,
      });
    } catch {
      // ignore
    }

    const indented = highlighted
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n");
    return `\n${indented}\n`;
  }

  blockquote(quote) {
    return `\n${boxen(quote.trim(), {
      padding: { left: 1, right: 1, top: 0, bottom: 0 },
      borderStyle: {
        topLeft: "",
        topRight: "",
        bottomLeft: "",
        bottomRight: "",
        horizontal: "",
        vertical: "▌",
      },
      borderColor: "gray",
      dimBorder: true,
      width: TERMINAL_WIDTH - 2,
    })}
`;
  }

  heading(text, level) {
    const content = wrapAnsi(text, CONTENT_WIDTH);
    const prefix = "#".repeat(level);
    if (level === 1) {
      return `\n${colors.primary.bold.underline(content)}\n`;
    }
    return `\n${colors.primary.bold(`${prefix} ${content}`)}\n`;
  }

  hr() {
    return `\n${colors.gray("─".repeat(TERMINAL_WIDTH))}\n`;
  }

  list(body) {
    return `\n${body}\n`;
  }

  listitem(text) {
    const content = text.trim();
    // Force wrapping for list items to prevent terminal wrapping artifacts
    // We subtract 6 to account for the bullet "  • " and a margin
    const wrapped = wrapAnsi(content, TERMINAL_WIDTH - 6);

    const bullet = colors.secondary("•");
    const lines = wrapped.split("\n");

    if (lines.length === 0) return "";

    let result = `  ${bullet} ${lines[0]}\n`;
    if (lines.length > 1) {
      result += `${lines
        .slice(1)
        .map((l) => `    ${l}`)
        .join("\n")}\n`;
    }
    return result;
  }

  paragraph(text) {
    return `\n${wrapAnsi(text, CONTENT_WIDTH)}\n`;
  }

  table(header, body) {
    return `\n${header}\n${body}\n`;
  }

  tablerow(content) {
    return `${content}\n`;
  }

  tablecell(content) {
    return `${content}  `;
  }

  strong(text) {
    return colors.orange.bold(text);
  }
  em(text) {
    return colors.yellow.italic(text);
  }
  codespan(text) {
    return colors.green(text);
  }
  br() {
    return "\n";
  }
  del(text) {
    return chalk.strikethrough(text);
  }
  link(href, title, text) {
    return colors.accent.underline(text || href) + (title ? ` (${title})` : "");
  }
  image(href, title, text) {
    return colors.gray(`[Image: ${text || href}]`);
  }
  text(text) {
    return text;
  }
}

const renderer = new GlowRenderer();

// --- Helper Functions ---

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

let lastRole: string | null = null;
let assistantBuffer = "";
let previousRenderedLines: string[] = [];

function print(text: string) {
  process.stdout.write(text);
}

function printLine(text: string = "") {
  process.stdout.write(`${text}\n`);
}

function renderMarkdown(text: string) {
  // biome-ignore lint/suspicious/noExplicitAny: renderer compatibility
  return marked.parse(text, { renderer: renderer as any }).trimEnd();
}

function updateAssistantOutput(fullText: string) {
  const newRendered = renderMarkdown(fullText);
  const newLines = newRendered.split("\n");

  let diffIndex = 0;
  const maxCommon = Math.min(previousRenderedLines.length, newLines.length);

  while (diffIndex < maxCommon) {
    if (previousRenderedLines[diffIndex] !== newLines[diffIndex]) {
      break;
    }
    diffIndex++;
  }

  const linesToErase = previousRenderedLines.length - diffIndex;

  if (linesToErase > 0) {
    process.stdout.write(ansiEscapes.eraseLines(linesToErase));
  }

  const linesToAdd = newLines.slice(diffIndex);
  if (linesToAdd.length > 0) {
    // Handle case where we are appending to a line that didn't have a trailing newline
    if (linesToErase === 0 && diffIndex > 0) {
      print("\n");
    }
    print(linesToAdd.join("\n"));
  }

  previousRenderedLines = newLines;
}

function finalizeAssistantOutput() {
  printLine();
  previousRenderedLines = [];
  assistantBuffer = "";
  lastRole = null;
}

const borderTopBottom = {
  topLeft: "─",
  topRight: "─",
  bottomLeft: "─",
  bottomRight: "─",
  horizontal: "─",
  vertical: "",
};

// --- Main Loop ---

rl.on("line", (line) => {
  if (!line.trim()) return;

  try {
    if (!line.trim().startsWith("{")) {
      if (lastRole === "assistant_delta") {
        finalizeAssistantOutput();
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

    const data = JSON.parse(line);
    const { type } = data;

    if (
      lastRole === "assistant_delta" &&
      (type !== "message" || data.role !== "assistant")
    ) {
      finalizeAssistantOutput();
    }

    switch (type) {
      case "init":
        printLine();
        console.log(
          boxen(
            `${colors.gray("Session ID:")} ${colors.text(data.session_id)}
${colors.gray("Model:")}      ${colors.text(data.model)}`,
            {
              padding: { top: 0, bottom: 0, left: 2, right: 2 },
              margin: 0,
              borderStyle: "round",
              borderColor: "green",
              title: "Gemini Session Started",
              width: TERMINAL_WIDTH,
            },
          ),
        );
        printLine();
        break;

      case "message":
        if (data.role === "user") {
          printLine();
          printLine(colors.accent.bold("❯ User"));
          const wrappedUser = wrapAnsi(data.content, CONTENT_WIDTH);
          printLine(
            wrappedUser
              .split("\n")
              .map((l) => `  ${colors.text(l)}`)
              .join("\n"),
          );
          lastRole = "user";
        } else if (data.role === "assistant") {
          if (lastRole !== "assistant_delta") {
            printLine();
            printLine(colors.primary.bold("❯ Gemini"));
            lastRole = "assistant_delta";
            assistantBuffer = "";
            previousRenderedLines = [];
          }

          assistantBuffer += data.content || "";
          updateAssistantOutput(assistantBuffer);
        }
        break;

      case "tool_use": {
        printLine();
        const params = JSON.stringify(data.parameters, null, 2);
        let highlightedParams = params;
        try {
          highlightedParams = highlight(params, {
            language: "json",
            ignoreIllegals: true,
          });
        } catch {
          // ignore
        }

        console.log(
          boxen(highlightedParams, {
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
            margin: 0,
            borderStyle: borderTopBottom,
            borderColor: "blue",
            title: `${colors.secondary("Tool Use:")} ${colors.text.bold(data.tool_name)}`,
            width: TERMINAL_WIDTH,
          }),
        );
        lastRole = "tool_use";
        break;
      }

      case "tool_result": {
        printLine();
        const isError = data.status === "error";
        const color = isError ? "red" : "green";
        const statusLabel = isError ? "(err)" : "(ok)";

        let outputDisplay = "(No output)";
        if (data.output) {
          const outputStr =
            typeof data.output === "string"
              ? data.output
              : JSON.stringify(data.output, null, 2);
          if (outputStr.length > 2000) {
            outputDisplay = `${outputStr.substring(0, 2000)}\n... (truncated)`;
          } else {
            outputDisplay = outputStr;
          }
        }

        console.log(
          boxen(outputDisplay, {
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
            margin: 0,
            borderStyle: borderTopBottom,
            borderColor: color,
            title: `Tool Result ${isError ? colors.red(statusLabel) : colors.green(statusLabel)}`,
            width: TERMINAL_WIDTH,
          }),
        );
        lastRole = "tool_result";
        break;
      }

      case "result": {
        printLine();
        let statsText = "";
        if (data.stats) {
          statsText = `${colors.gray("Tokens:")} ${data.stats.total_tokens} (${data.stats.input_tokens} in / ${data.stats.output_tokens} out)\n${colors.gray("Duration:")} ${data.stats.duration_ms}ms`;
        }

        console.log(
          boxen(statsText, {
            padding: 0,
            margin: 0,
            borderStyle: "double",
            borderColor: "green",
            title: "Completed",
            width: TERMINAL_WIDTH,
            textAlignment: "center",
          }),
        );
        printLine();
        lastRole = "result";
        break;
      }

      default:
    }
  } catch {
    // ignore
  }
});
