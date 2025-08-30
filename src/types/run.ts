export interface RunConfig {
	promptPath?: string;
	promptText?: string;
	intervalMs?: number;
	autoStopAfterErrors?: number;
	maxCostUsd?: number;
	outputFormat?: 'formatted' | 'raw' | 'minimal';
	verbosity?: 'minimal' | 'normal' | 'verbose' | 'debug';
	showStatistics?: boolean;
	truncateOutput?: boolean;
	maxOutputLines?: number;
	claudeFlags?: string[];
	model?: string;
	timeoutMs?: number;
}
