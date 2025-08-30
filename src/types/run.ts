import {EventEmitter} from 'events';
import {ClaudeStreamEvent} from './claude-events.js';

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

// Run execution states
export enum RunState {
	IDLE = 'idle',
	STARTING = 'starting',
	RUNNING = 'running',
	PAUSED = 'paused',
	STOPPING = 'stopping',
	STOPPED = 'stopped',
	ERROR = 'error',
}

// Run event types for the event emitter
export enum RunEventType {
	STATE_CHANGE = 'stateChange',
	ITERATION_START = 'iterationStart',
	ITERATION_COMPLETE = 'iterationComplete',
	ITERATION_ERROR = 'iterationError',
	CLAUDE_EVENT = 'claudeEvent',
	PROCESS_SPAWN = 'processSpawn',
	PROCESS_EXIT = 'processExit',
	ERROR = 'error',
	ABORT = 'abort',
	STATISTICS_UPDATE = 'statisticsUpdate',
}

// Statistics tracking
export interface RunStatistics {
	iterationCount: number;
	totalRunTime: number;
	averageIterationTime: number;
	successfulIterations: number;
	failedIterations: number;
	totalCostUsd: number;
	totalTokensUsed: number;
	startTime: Date;
	lastIterationTime?: Date;
	currentIterationStartTime?: Date;
}

// Current run status
export interface RunStatus {
	state: RunState;
	currentIteration: number;
	processId?: number;
	statistics: RunStatistics;
	lastError?: Error;
	abortController?: AbortController;
}

// Event payloads
export interface StateChangeEvent {
	previousState: RunState;
	newState: RunState;
	timestamp: Date;
}

export interface IterationEvent {
	iteration: number;
	timestamp: Date;
	duration?: number;
	error?: Error;
	cost?: number;
	tokens?: {
		input: number;
		output: number;
	};
}

export interface ProcessEvent {
	processId?: number;
	command: string;
	args: string[];
	timestamp: Date;
	exitCode?: number;
	signal?: string;
}

export interface ClaudeEventWrapper {
	iteration: number;
	timestamp: Date;
	event: ClaudeStreamEvent;
}

// Run Engine interface
export interface RunEngine extends EventEmitter {
	// Core control methods
	start(): Promise<void>;
	stop(): Promise<void>;
	pause(): Promise<void>;
	resume(): Promise<void>;
	abort(): Promise<void>;

	// Status methods
	getStatus(): RunStatus;
	getStatistics(): RunStatistics;
	isRunning(): boolean;
	isPaused(): boolean;

	// Configuration
	getConfig(): RunConfig;
	updateConfig(config: Partial<RunConfig>): void;

	// Event emitter methods (inherited)
	on(event: RunEventType.STATE_CHANGE, listener: (data: StateChangeEvent) => void): this;
	on(event: RunEventType.ITERATION_START, listener: (data: IterationEvent) => void): this;
	on(event: RunEventType.ITERATION_COMPLETE, listener: (data: IterationEvent) => void): this;
	on(event: RunEventType.ITERATION_ERROR, listener: (data: IterationEvent) => void): this;
	on(event: RunEventType.CLAUDE_EVENT, listener: (data: ClaudeEventWrapper) => void): this;
	on(event: RunEventType.PROCESS_SPAWN, listener: (data: ProcessEvent) => void): this;
	on(event: RunEventType.PROCESS_EXIT, listener: (data: ProcessEvent) => void): this;
	on(event: RunEventType.ERROR, listener: (error: Error) => void): this;
	on(event: RunEventType.ABORT, listener: () => void): this;
	on(event: RunEventType.STATISTICS_UPDATE, listener: (stats: RunStatistics) => void): this;

	emit(event: RunEventType.STATE_CHANGE, data: StateChangeEvent): boolean;
	emit(event: RunEventType.ITERATION_START, data: IterationEvent): boolean;
	emit(event: RunEventType.ITERATION_COMPLETE, data: IterationEvent): boolean;
	emit(event: RunEventType.ITERATION_ERROR, data: IterationEvent): boolean;
	emit(event: RunEventType.CLAUDE_EVENT, data: ClaudeEventWrapper): boolean;
	emit(event: RunEventType.PROCESS_SPAWN, data: ProcessEvent): boolean;
	emit(event: RunEventType.PROCESS_EXIT, data: ProcessEvent): boolean;
	emit(event: RunEventType.ERROR, error: Error): boolean;
	emit(event: RunEventType.ABORT): boolean;
	emit(event: RunEventType.STATISTICS_UPDATE, stats: RunStatistics): boolean;
}
