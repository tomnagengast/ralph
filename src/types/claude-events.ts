// Comprehensive TypeScript interfaces for all Claude CLI streaming events
// Based on Claude API documentation and CLI stream-json format

// Core message usage information
export interface MessageUsage {
	input_tokens?: number;
	output_tokens?: number;
	cache_creation_input_tokens?: number;
	cache_read_input_tokens?: number;
	cache_creation?: {
		ephemeral_5m_input_tokens?: number;
		ephemeral_1h_input_tokens?: number;
	};
	service_tier?: 'standard' | 'priority' | 'batch';
}

// Content block types
export interface ContentBlock {
	type:
		| 'text'
		| 'thinking'
		| 'tool_use'
		| 'tool_result'
		| 'image'
		| 'document'
		| 'web_search'
		| 'server_tool_use'
		| 'redacted_thinking';
	id?: string;
	name?: string;
	text?: string;
	input?: any;
	content?: string | any;
	// Image block specific
	image?: {
		media_type?: string;
		data?: string;
	};
	// Document block specific
	document?: {
		name?: string;
		media_type?: string;
		data?: string;
	};
}

// Message object structure
export interface Message {
	id?: string;
	type?: 'message';
	role?: 'assistant' | 'user';
	model?: string;
	content?: ContentBlock[];
	stop_reason?:
		| 'end_turn'
		| 'max_tokens'
		| 'stop_sequence'
		| 'tool_use'
		| 'pause_turn'
		| 'refusal'
		| null;
	stop_sequence?: string | null;
	usage?: MessageUsage;
}

// Delta events for incremental updates
export interface Delta {
	type?:
		| 'text_delta'
		| 'input_json_delta'
		| 'thinking_delta'
		| 'signature_delta';
	text?: string;
	partial_json?: string;
	stop_reason?:
		| 'end_turn'
		| 'max_tokens'
		| 'stop_sequence'
		| 'tool_use'
		| 'pause_turn'
		| 'refusal';
	stop_sequence?: string | null;
	usage?: {
		output_tokens?: number;
	};
	signature?: string;
}

// Error information
export interface ErrorInfo {
	type?: string;
	message?: string;
	code?: string;
	retry_after?: number;
	rate_limit?: {
		requests?: number;
		tokens?: number;
		reset_at?: string;
	};
}

// Comprehensive Claude CLI streaming event interface
export interface ClaudeStreamEvent {
	type: string;

	// Message events
	message?: Message;

	// Content block events
	index?: number;
	content_block?: ContentBlock;

	// Delta events
	delta?: Delta;

	// Error events
	error?: ErrorInfo | string;

	// Result events (Claude CLI specific)
	subtype?: string;
	is_error?: boolean;
	duration_ms?: number;
	duration_api_ms?: number;
	num_turns?: number;
	total_cost_usd?: number;
	result?: string;
	session_id?: string;
	uuid?: string;
	usage?: MessageUsage;
	permission_denials?: any[];

	// System events (Claude CLI specific)
	cwd?: string;
	tools?: string[];
	mcp_servers?: any[];
	model?: string;
	permissionMode?: string;
	slash_commands?: string[];
	apiKeySource?: string;
	output_style?: string;

	// Tool events
	tool_name?: string;
	tool_input?: any;
	tool_result?: any;
	tool_use_id?: string;
	parent_tool_use_id?: string | null;

	// Legacy/fallback fields
	content?: string;
	text?: string;

	// Allow additional fields for extensibility
	[key: string]: any;
}

// Event type enums for type safety
export enum ClaudeEventType {
	// Core streaming events
	MESSAGE_START = 'message_start',
	CONTENT_BLOCK_START = 'content_block_start',
	CONTENT_BLOCK_DELTA = 'content_block_delta',
	CONTENT_BLOCK_STOP = 'content_block_stop',
	MESSAGE_DELTA = 'message_delta',
	MESSAGE_STOP = 'message_stop',

	// System events
	PING = 'ping',
	ERROR = 'error',
	OVERLOADED_ERROR = 'overloaded_error',

	// CLI specific events
	RESULT = 'result',
	SYSTEM = 'system',
	USER = 'user',
	ASSISTANT = 'assistant',

	// Specific error types
	INVALID_REQUEST_ERROR = 'invalid_request_error',
	AUTHENTICATION_ERROR = 'authentication_error',
	PERMISSION_ERROR = 'permission_error',
	NOT_FOUND_ERROR = 'not_found_error',
	REQUEST_TOO_LARGE = 'request_too_large',
	RATE_LIMIT_ERROR = 'rate_limit_error',
	API_ERROR = 'api_error',

	// Tool events
	TOOL_USE = 'tool_use',
	TOOL_RESULT = 'tool_result',

	// Fine-grained tool streaming (2025 beta)
	TOOL_USE_START = 'tool_use_start',
	TOOL_USE_DELTA = 'tool_use_delta',
	TOOL_USE_STOP = 'tool_use_stop',

	// Extended thinking events (Claude 4)
	THINKING_BLOCK_START = 'thinking_block_start',
	THINKING_BLOCK_DELTA = 'thinking_block_delta',
	THINKING_BLOCK_SIGNATURE = 'thinking_block_signature',
	THINKING_BLOCK_STOP = 'thinking_block_stop',

	// Search events
	SEARCH_RESULT_START = 'search_result_start',
	SEARCH_RESULT_DELTA = 'search_result_delta',
	SEARCH_RESULT_STOP = 'search_result_stop',

	// Code execution events (Claude 4)
	CODE_START = 'code_start',
	CODE_OUTPUT = 'code_output',
	CODE_ERROR = 'code_error',
	CODE_STOP = 'code_stop',

	// File processing events
	FILE_START = 'file_start',
	FILE_CHUNK = 'file_chunk',
	FILE_ERROR = 'file_error',
	FILE_STOP = 'file_stop',

	// Connection events
	CONNECTION_START = 'connection_start',
	CONNECTION_PING = 'connection_ping',
	CONNECTION_ERROR = 'connection_error',
	CONNECTION_CLOSE = 'connection_close',

	// Legacy events
	TEXT = 'text',
	CONTENT = 'content',
}

// Stop reasons for better type safety
export enum StopReason {
	END_TURN = 'end_turn',
	MAX_TOKENS = 'max_tokens',
	STOP_SEQUENCE = 'stop_sequence',
	TOOL_USE = 'tool_use',
	PAUSE_TURN = 'pause_turn',
	REFUSAL = 'refusal',
}

// Content block types for better type safety
export enum ContentBlockType {
	TEXT = 'text',
	THINKING = 'thinking',
	TOOL_USE = 'tool_use',
	TOOL_RESULT = 'tool_result',
	IMAGE = 'image',
	DOCUMENT = 'document',
	WEB_SEARCH = 'web_search',
	SERVER_TOOL_USE = 'server_tool_use',
	REDACTED_THINKING = 'redacted_thinking',
}

// Delta types for better type safety
export enum DeltaType {
	TEXT_DELTA = 'text_delta',
	INPUT_JSON_DELTA = 'input_json_delta',
	THINKING_DELTA = 'thinking_delta',
	SIGNATURE_DELTA = 'signature_delta',
}
