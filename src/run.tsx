import {execa, type ResultPromise} from 'execa';
import fs from 'fs';
import path from 'path';
import {EventEmitter} from 'events';
import type {RunConfig} from './types/run.js';

export class RunEngine extends EventEmitter {
	private config: RunConfig;
	private currentProcess: ResultPromise | null = null;
	private isRunning = false;
	private consecutiveErrors = 0;

	constructor(config: RunConfig) {
		super();
		// Config is already loaded with defaults from loadRunConfig
		this.config = config;
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			return;
		}

		this.isRunning = true;

		while (this.isRunning) {
			await this.runIteration();

			if (this.config.intervalMs && this.config.intervalMs > 0) {
				await new Promise(resolve => setTimeout(resolve, this.config.intervalMs));
			}
		}
	}

	async stop(): Promise<void> {
		this.isRunning = false;

		if (this.currentProcess) {
			this.currentProcess.kill('SIGINT');
			this.currentProcess = null;
		}
	}

	private async runIteration(): Promise<void> {
		try {
			this.emit('iteration:start');
			
			const promptContent = await this.getPromptContent();
			if (!promptContent) {
				throw new Error('No prompt content available');
			}

			const args = this.buildClaudeArgs();
			
			this.currentProcess = execa('claude', args, {
				input: promptContent,
				timeout: this.config.timeoutMs,
				reject: false,
			});

			if (this.currentProcess.stdout) {
				this.currentProcess.stdout.on('data', (data: Buffer) => {
					this.emit('output', data.toString());
				});
			}

			if (this.currentProcess.stderr) {
				this.currentProcess.stderr.on('data', (data: Buffer) => {
					this.emit('error', data.toString());
				});
			}

			const result = await this.currentProcess;

			if (result.exitCode !== 0) {
				throw new Error(`Claude exited with code ${result.exitCode}`);
			}

			this.consecutiveErrors = 0;
		} catch (error) {
			this.consecutiveErrors++;
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.emit('error', `${errorMessage}\n`);

			if (
				this.config.autoStopAfterErrors &&
				this.consecutiveErrors >= this.config.autoStopAfterErrors
			) {
				this.emit('error', `Stopping after ${this.consecutiveErrors} consecutive errors\n`);
				await this.stop();
			}
		} finally {
			this.currentProcess = null;
		}
	}

	private async getPromptContent(): Promise<string | null> {
		if (this.config.promptText) {
			return this.config.promptText;
		}

		if (this.config.promptPath) {
			const resolvedPath = path.resolve(this.config.promptPath);
			if (fs.existsSync(resolvedPath)) {
				return fs.readFileSync(resolvedPath, 'utf-8');
			}
		}

		const defaultPromptPath = '.ralph/prompt.md';
		if (fs.existsSync(defaultPromptPath)) {
			return fs.readFileSync(defaultPromptPath, 'utf-8');
		}

		return null;
	}

	private buildClaudeArgs(): string[] {
		const args: string[] = ['-p']; // Always use -p for stdin input

		if (this.config.model) {
			args.push('--model', this.config.model);
		}

		if (this.config.claudeFlags) {
			args.push(...this.config.claudeFlags);
		}

		return args;
	}

}