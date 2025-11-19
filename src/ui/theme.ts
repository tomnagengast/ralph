import chalk from "chalk";

export const colors = {
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

export const TERMINAL_WIDTH = process.stdout.columns || 80;
export const CONTENT_WIDTH = Math.max(20, TERMINAL_WIDTH - 8);

export const borderTopBottom = {
  topLeft: "─",
  topRight: "─",
  bottomLeft: "─",
  bottomRight: "─",
  horizontal: "─",
  vertical: "",
};
