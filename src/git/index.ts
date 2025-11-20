import { $ } from "bun";

export async function sync() {
	console.log("Skipping git sync");

	// if (process.env.RALPH_VERBOSE_GIT_SYNC) {
	//   await $`GIT_ADVICE_SKIPPED_CHERRY_PICKS=false git rebase --autostash origin/main`;
	//   return;
	// }
	// try {
	//   await $`GIT_ADVICE_SKIPPED_CHERRY_PICKS=false git rebase --autostash origin/main`.quiet();
	// } catch (e: unknown) {
	//   const err = e as { stdout?: Buffer; message?: string };
	//   console.error(err.stdout?.toString() || err.message);
	//   throw e;
	// }
}
