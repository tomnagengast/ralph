export type RunState = 'idle' | 'running' | 'paused' | 'stopped' | 'error';

export interface RunStatus {
	state: RunState;
	iterationCount: number;
	startTime: Date | null;
	lastRunTime: Date | null;
	errors: string[];
	currentOutput: string;
}

export interface RunConfig {
	promptPath?: string;
	promptText?: string;
	intervalMs?: number;
	autoStopAfterErrors?: number;
	maxCostUsd?: number;
	outputFormat?: 'formatted' | 'raw' | 'minimal';
	showStatistics?: boolean;
	truncateOutput?: boolean;
	maxOutputLines?: number;
	claudeFlags?: string[];
	model?: string;
	timeoutMs?: number;
}

export interface StreamJsonOutput {
	type: string;
	content?: string;
	text?: string;
	tool_name?: string;
	tool_input?: any;
	tool_result?: any;
	error?: string;
}