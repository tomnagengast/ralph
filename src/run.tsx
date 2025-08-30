import {execa, type ResultPromise} from 'execa';
import fs from 'fs';
import path from 'path';
import {EventEmitter} from 'events';
import type {RunConfig, RunStatus} from './types/run.js';

export class RunEngine extends EventEmitter {
	private config: RunConfig;
	private status: RunStatus;
	private currentProcess: ResultPromise | null = null;
	private isRunning = false;
	private consecutiveErrors = 0;

	constructor(config: RunConfig) {
		super();
		// Config is already loaded with defaults from loadRunConfig
		this.config = config;

		this.status = {
			state: 'idle',
			iterationCount: 0,
			startTime: null,
			lastRunTime: null,
			errors: [],
			currentOutput: '',
		};
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			return;
		}

		this.isRunning = true;
		this.status.state = 'running';
		this.status.startTime = new Date();
		this.emit('statusUpdate', this.status);

		while (this.isRunning && this.status.state === 'running') {
			await this.runIteration();

			if (this.config.intervalMs && this.config.intervalMs > 0) {
				await new Promise(resolve => setTimeout(resolve, this.config.intervalMs));
			}
		}
	}

	async stop(): Promise<void> {
		this.isRunning = false;
		this.status.state = 'stopped';

		if (this.currentProcess) {
			this.currentProcess.kill('SIGINT');
			this.currentProcess = null;
		}

		this.emit('statusUpdate', this.status);
	}

	pause(): void {
		if (this.status.state === 'running') {
			this.status.state = 'paused';
			this.emit('statusUpdate', this.status);
		}
	}

	resume(): void {
		if (this.status.state === 'paused') {
			this.status.state = 'running';
			this.emit('statusUpdate', this.status);
		}
	}

	private async runIteration(): Promise<void> {
		if (this.status.state !== 'running') {
			return;
		}

		this.status.iterationCount++;
		this.status.lastRunTime = new Date();
		this.status.currentOutput = '';
		this.emit('statusUpdate', this.status);

		try {
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
					const output = data.toString();
					this.status.currentOutput += output;
					this.emit('output', output);
					this.emit('statusUpdate', this.status);
				});
			}

			if (this.currentProcess.stderr) {
				this.currentProcess.stderr.on('data', (data: Buffer) => {
					const error = data.toString();
					this.emit('error', error);
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
			this.status.errors.push(errorMessage);
			this.emit('error', errorMessage);

			if (
				this.config.autoStopAfterErrors &&
				this.consecutiveErrors >= this.config.autoStopAfterErrors
			) {
				this.emit('error', `Stopping after ${this.consecutiveErrors} consecutive errors`);
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

	getStatus(): RunStatus {
		return {...this.status};
	}
}