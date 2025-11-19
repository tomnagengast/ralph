import { join } from "node:path";
import boxen from "boxen";
import { $ } from "bun";
import chalk from "chalk";
import type { Run } from "./state";

const RALPH_BOX_WIDTH = parseInt(process.env.RALPH_BOX_WIDTH || "50", 10);

export async function setup(run: Run) {
  if (!(await Bun.file(run.state.path).exists())) {
    // Create run directory
    await $`cp -r ${join(run.state.path, "../run-template")} ${run.state.path}`;

    const message = [
      "New Run Setup Complete",
      `Created ${run.state.path}`,
      `Added to ${join(run.state.path, "../state.json")}`,
    ].join("\n");

    console.log(
      boxen(chalk.hex("#04B575")(message), {
        padding: { top: 1, bottom: 1, left: 2, right: 2 },
        borderColor: "#04B575",
        borderStyle: "round",
        textAlignment: "center",
        width: RALPH_BOX_WIDTH,
      }),
    );

    return true;
  }
  return false;
}
