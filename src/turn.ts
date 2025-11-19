import { join } from "node:path";
import { $ } from "bun";
// Modules
import { runAgent } from "./agents";
import { sync } from "./git";
import type { Run } from "./state";
import { hi } from "./ui";

// Configuration
const RALPH_BASE_EXIT_CODE = parseInt(
  process.env.RALPH_BASE_EXIT_CODE || "64",
  10,
);
const RALPH_DONE_EXIT_CODE = parseInt(
  process.env.RALPH_DONE_EXIT_CODE || "65",
  10,
);

export async function turn(run: Run, loop: number): Promise<number> {
  try {
    await sync();
  } catch (_e) {
    return 1;
  }

  // Read Config
  const { default: config } = await import(
    join(run.state.path, "config.toml"),
    {
      with: { type: "toml" },
    }
  );
  const agentsMd = await Bun.file(join(run.state.path, "../AGENTS.md")).text();

  hi(`start mode ${run.state.mode}`);

  // Run Builder
  if (loop !== 1 || run.state.mode !== "reviewer") {
    hi(`(${loop}) Builder`, config.builder);
    const builderMd = await Bun.file(join(run.state.path, "builder.md")).text();
    const prompt = `run:${run.state.path}\n${agentsMd}\n${builderMd}`;
    await runAgent(
      config.builder,
      {
        prompt,
        run,
      },
      "builder",
    );
  }

  // Run Reviewer
  hi(`(${loop}) Reviewer`, config.reviewer);
  const reviewerMd = await Bun.file(join(run.state.path, "reviewer.md")).text();
  const prompt = `run:${run.state.path}\n${agentsMd}\n${reviewerMd}`;
  await runAgent(
    config.reviewer,
    {
      prompt,
      run,
    },
    "reviewer",
  );

  // Check Status
  const commit = (await $`git rev-parse HEAD`.text()).trim();
  if (commit !== run.state.last_commit) {
    await run.update({ last_commit: commit });
  }
  const review = await run.review.latest();

  if (!review) {
    console.error("No last review found");
    return RALPH_BASE_EXIT_CODE;
  }

  try {
    const reviewContent = await Bun.file(review).json();
    const status = reviewContent.status;
    if (status === "ok") {
      return RALPH_DONE_EXIT_CODE;
    }
  } catch (e) {
    console.error("Error parsing review json:", e);
    return RALPH_BASE_EXIT_CODE;
  }

  return 0;
}
