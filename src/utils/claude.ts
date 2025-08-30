import {execa, ExecaChildProcess} from 'execa';
import {ClaudeStreamEvent} from '../types/claude-events.js';
import {RunConfig} from '../types/run.js';
import fs from 'fs/promises';

/**
 * Claude CLI interaction utilities
 */

export interface ClaudeCommandOptions {
	prompt?: string;
	promptPath?: string;
	promptText?: string;
	model?: string;
	flags?: string[];
	timeoutMs?: number;
	cwd?: string;
}

export interface ClaudeProcessResult {
	process: ExecaChildProcess;
	abort: () => void;
}

/**
 * Build claude CLI command arguments from configuration
 */
export function buildClaudeArgs(options: ClaudeCommandOptions): string[] {
	const args: string[] = [];

	// Always use stream-json output for parsing
	args.push('--stream-json');

	// Add model if specified
	if (options.model) {
		args.push('--model', options.model);
	}

	// Add prompt file or direct text
	if (options.promptPath) {
		args.push('--prompt-file', options.promptPath);
	} else if (options.prompt) {
		args.push('--prompt', options.prompt);
	}

	// Add additional flags
	if (options.flags && options.flags.length > 0) {
		args.push(...options.flags);
	}

	return args;
}

/**
 * Build claude command from RunConfig
 */
export function buildClaudeArgsFromConfig(config: RunConfig): string[] {
	const options: ClaudeCommandOptions = {
		promptPath: config.promptPath,
		promptText: config.promptText,
		model: config.model,
		flags: config.claudeFlags,
		timeoutMs: config.timeoutMs,
	};

	// Convert promptText to prompt option for buildClaudeArgs
	if (options.promptText && !options.promptPath) {
		options.prompt = options.promptText;
	}

	return buildClaudeArgs(options);
}

/**
 * Spawn claude CLI process with proper configuration
 */
export function spawnClaudeProcess(options: ClaudeCommandOptions): ClaudeProcessResult {
	const args = buildClaudeArgs(options);
	const abortController = new AbortController();
	
	const process = execa('claude', args, {
		stdout: 'pipe',
		stderr: 'pipe',
		signal: abortController.signal,
		cwd: options.cwd,
		timeout: options.timeoutMs,
	});

	return {
		process,
		abort: () => {
			abortController.abort();
		},
	};
}

/**
 * Parse stream-json output line into ClaudeStreamEvent
 */
export function parseClaudeStreamLine(line: string): ClaudeStreamEvent | null {
	if (!line.trim()) {
		return null;
	}

	try {
		const parsed = JSON.parse(line);
		return parsed as ClaudeStreamEvent;
	} catch (error) {
		// If JSON parsing fails, create a simple text event
		return {
			type: 'text',
			content: line,
		} as ClaudeStreamEvent;
	}
}

/**
 * Extract cost information from Claude result event
 */
export function extractCostFromEvent(event: ClaudeStreamEvent): number {
	if (event.type === 'result' && typeof event.total_cost_usd === 'number') {
		return event.total_cost_usd;
	}
	return 0;
}

/**
 * Extract token usage from Claude event
 */
export function extractTokenUsageFromEvent(event: ClaudeStreamEvent): {input: number; output: number} {
	const tokens = {input: 0, output: 0};

	// Check usage in message or event level
	const usage = event.usage || event.message?.usage;
	if (usage) {
		tokens.input = usage.input_tokens || 0;
		tokens.output = usage.output_tokens || 0;
		
		// Add cache tokens to input
		if (usage.cache_creation_input_tokens) {
			tokens.input += usage.cache_creation_input_tokens;
		}
		if (usage.cache_read_input_tokens) {
			tokens.input += usage.cache_read_input_tokens;
		}
	}

	return tokens;
}

/**
 * Check if an event indicates an error
 */
export function isErrorEvent(event: ClaudeStreamEvent): boolean {
	return (
		event.type === 'error' ||
		event.type.includes('error') ||
		event.is_error === true ||
		Boolean(event.error)
	);
}

/**
 * Check if an event indicates completion
 */
export function isCompletionEvent(event: ClaudeStreamEvent): boolean {
	return (
		event.type === 'result' ||
		event.type === 'message_stop' ||
		event.type === 'connection_close'
	);
}

/**
 * Get error message from error event
 */
export function getErrorMessage(event: ClaudeStreamEvent): string {
	if (typeof event.error === 'string') {
		return event.error;
	}
	
	if (event.error && typeof event.error === 'object') {
		return event.error.message || 'Unknown error occurred';
	}
	
	if (event.type.includes('error')) {
		return `Claude CLI error: ${event.type}`;
	}
	
	return 'Unknown error occurred';
}

/**
 * Validate prompt file exists and is readable
 */
export async function validatePromptFile(promptPath: string): Promise<boolean> {
	try {
		const stats = await fs.stat(promptPath);
		return stats.isFile();
	} catch {
		return false;
	}
}

/**
 * Read prompt file content
 */
export async function readPromptFile(promptPath: string): Promise<string> {
	try {
		const content = await fs.readFile(promptPath, 'utf-8');
		return content.trim();
	} catch (error) {
		throw new Error(`Failed to read prompt file ${promptPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Validate Claude CLI is available
 */
export async function validateClaudeCLI(): Promise<boolean> {
	try {
		const result = await execa('claude', ['--version'], {
			timeout: 5000,
			reject: false,
		});
		return result.exitCode === 0;
	} catch {
		return false;
	}
}

/**
 * Get Claude CLI version
 */
export async function getClaudeCLIVersion(): Promise<string | null> {
	try {
		const result = await execa('claude', ['--version'], {
			timeout: 5000,
		});
		return result.stdout.trim();
	} catch {
		return null;
	}
}

/**
 * Create stream processor for Claude CLI output
 */
export function createClaudeStreamProcessor(
	onEvent: (event: ClaudeStreamEvent) => void,
	onError?: (error: Error) => void,
	onEnd?: () => void
) {
	let buffer = '';

	return {
		write: (chunk: string) => {
			buffer += chunk;
			const lines = buffer.split('\n');
			
			// Keep the last line in buffer if it doesn't end with newline
			buffer = lines.pop() || '';
			
			// Process complete lines
			for (const line of lines) {
				const event = parseClaudeStreamLine(line);
				if (event) {
					try {
						onEvent(event);
					} catch (error) {
						onError?.(error instanceof Error ? error : new Error(String(error)));
					}
				}
			}
		},
		
		end: () => {
			// Process any remaining buffered content
			if (buffer.trim()) {
				const event = parseClaudeStreamLine(buffer);
				if (event) {
					try {
						onEvent(event);
					} catch (error) {
						onError?.(error instanceof Error ? error : new Error(String(error)));
					}
				}
			}
			onEnd?.();
		},
		
		error: (error: Error) => {
			onError?.(error);
		},
	};
}