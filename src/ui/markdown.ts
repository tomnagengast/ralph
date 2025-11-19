import boxen from "boxen";
import chalk from "chalk";
import { highlight } from "cli-highlight";
import { marked } from "marked";
import wrapAnsi from "wrap-ansi";
import { CONTENT_WIDTH, colors, TERMINAL_WIDTH } from "./theme";

class GlowRenderer extends marked.Renderer {
  code(code: string, language?: string) {
    let value = code;
    try {
      value = highlight(code, {
        language: language || "txt",
        ignoreIllegals: true,
      });
    } catch {
      // ignore
    }

    const body = value
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
    return `\n${body}\n`;
  }

  blockquote(quote: string) {
    return `\n${boxen(quote.trim(), {
      padding: { left: 1, right: 1, top: 0, bottom: 0 },
      borderStyle: "none",
      borderColor: "gray",
      dimBorder: true,
      width: TERMINAL_WIDTH - 2,
    })}
`;
  }

  heading(text: string, level: number) {
    const body = wrapAnsi(text, CONTENT_WIDTH);
    const prefix = "#".repeat(level);
    if (level === 1) {
      return `\n${colors.primary.bold.underline(body)}\n`;
    }
    return `\n${colors.primary.bold(`${prefix} ${body}`)}\n`;
  }

  hr() {
    return `\n${colors.gray("─".repeat(TERMINAL_WIDTH))}\n`;
  }

  list(body: string) {
    return `\n${body}\n`;
  }

  listitem(text: string) {
    const base = text.trim();
    const wrapped = wrapAnsi(base, TERMINAL_WIDTH - 6);

    const bullet = colors.secondary("•");
    const parts = wrapped.split("\n");
    if (!parts.length) {
      return "";
    }

    let first = `  ${bullet} ${parts[0]}\n`;
    if (parts.length > 1) {
      first += `${parts
        .slice(1)
        .map((line) => `    ${line}`)
        .join("\n")}\n`;
    }
    return first;
  }

  paragraph(text: string) {
    return `\n${wrapAnsi(text, CONTENT_WIDTH)}\n`;
  }

  table(header: string, body: string) {
    return `\n${header}\n${body}\n`;
  }

  tablerow(content: string) {
    return `${content}\n`;
  }

  tablecell(content: string) {
    return `${content}  `;
  }

  strong(text: string) {
    return colors.orange.bold(text);
  }

  em(text: string) {
    return colors.yellow.italic(text);
  }

  codespan(text: string) {
    return colors.green(text);
  }

  br() {
    return "\n";
  }

  del(text: string) {
    return chalk.strikethrough(text);
  }

  link(href: string, title: string | null | undefined, text: string) {
    const body = text || href;
    if (!title) {
      return colors.accent.underline(body);
    }
    return `${colors.accent.underline(body)} (${title})`;
  }

  image(href: string, _title: string | null | undefined, text: string) {
    const label = text || href;
    return colors.gray(`[Image: ${label}]`);
  }

  text(text: string) {
    return text;
  }
}

const renderer = new GlowRenderer();

export function renderMarkdown(text: string) {
  const value = marked.parse(text, { renderer });
  if (typeof value === "string") {
    return value.trimEnd();
  }
  return "";
}
