import { dirname, join } from "node:path";
import { $ } from "bun";
import { setup } from "./setup";
import { Run, type RunMode } from "./state";
import { banner, hi } from "./ui";

// Configuration
const RALPH_BASE_EXIT_CODE = 64;
const RALPH_DONE_EXIT_CODE = 65;

// Environment
const project = (await $`git rev-parse --show-toplevel`.text()).trim();
const ralph = join(project, ".ralph");

async function main() {
  const args = Bun.argv.slice(2);
  let mode: RunMode = "builder";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--review") {
      mode = "reviewer";
    }
  }

  // TODO: extract getInput
  const glob = new Bun.Glob("run-2*/config.toml");
  const runs: string[] = [];
  for await (const file of glob.scan({ cwd: ralph })) {
    runs.push(dirname(file));
  }
  runs.sort().reverse();

  // Using Bun.spawn for better stdin/tty handling with gum choose
  const proc = Bun.spawn(["gum", "choose"], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "inherit",
  });

  const input = ["Setup a new run", ...runs].join("\n");
  proc.stdin.write(input);
  proc.stdin.end();

  const choice = (await new Response(proc.stdout).text()).trim();

  if (!choice) {
    process.exit(1);
  }

  let id = choice;
  let isNew = false;
  let run: Run;
  if (choice === "Setup a new run") {
    isNew = true;
    id = `run-${new Date().toISOString().slice(0, 16).replace(/[-:]/g, "").replace(/[T]/g, "-")}`;
    run = await Run.create({
      id,
      status: "pending",
      cwd: project,
      path: join(ralph, id),
      last_commit: "",
      last_review: "",
      mode,
    });
  } else {
    run = (await Run.find(ralph, id))!;
  }

  // /getInput

  // Cleanup function that ensures updateRunStatus is called
  const cleanup = async (code: number) => {
    await run.update({ status: "inactive" });
    process.exit(code);
  };

  process.on("SIGINT", () => cleanup(0));
  process.on("SIGTERM", () => cleanup(0));

  if (isNew) {
    await setup(run);
    await cleanup(0);
  }

  await run.update({ status: "active" });
  banner(run.id);

  // Main Loop
  let loop = 1;
  while (true) {
    const exitCode = await run.loop(loop);
    if (exitCode !== 0) {
      if (
        exitCode === RALPH_BASE_EXIT_CODE ||
        exitCode === RALPH_DONE_EXIT_CODE
      ) {
        await cleanup(0);
      }
      await cleanup(exitCode);
    }

    hi(`(${loop}) Finished Loop`, run.id);
    loop++;
    await Bun.sleep(10000);
  }
}

main();
