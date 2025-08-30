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