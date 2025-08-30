#!/usr/bin/env node

// Test script to verify Claude event formatting
// Run with: node test-claude-events.js | ralph --stream-json

const events = [
	// Message start with cache information
	{
		type: 'message_start',
		message: {
			id: 'msg_123',
			model: 'claude-3-opus-20240229',
			usage: {
				input_tokens: 1500,
				cache_read_input_tokens: 500,
				cache_creation_input_tokens: 200,
				cache_creation: {
					ephemeral_5m_input_tokens: 100,
					ephemeral_1h_input_tokens: 100,
				},
				service_tier: 'priority',
			},
		},
	},

	// Content blocks with various types
	{type: 'content_block_start', index: 0, content_block: {type: 'text'}},
	{
		type: 'content_block_delta',
		delta: {
			type: 'text_delta',
			text: '# Hello World\n\nThis is **bold** and *italic* text.\n\n',
		},
	},
	{
		type: 'content_block_delta',
		delta: {
			type: 'text_delta',
			text: "Here's a list:\n- Item 1\n- Item 2\n- Item 3\n\n",
		},
	},
	{
		type: 'content_block_delta',
		delta: {
			type: 'text_delta',
			text: "```javascript\nconst greeting = 'Hello';\nconsole.log(greeting);\n```\n",
		},
	},
	{type: 'content_block_stop', index: 0},

	// Tool use
	{
		type: 'content_block_start',
		index: 1,
		content_block: {type: 'tool_use', name: 'calculator', id: 'tool_123'},
	},
	{
		type: 'content_block_delta',
		delta: {type: 'input_json_delta', partial_json: '{"operation": "add", '},
	},
	{
		type: 'content_block_delta',
		delta: {type: 'input_json_delta', partial_json: '"numbers": [5, 3]}'},
	},
	{type: 'content_block_stop', index: 1},

	// Thinking block
	{type: 'content_block_start', index: 2, content_block: {type: 'thinking'}},
	{
		type: 'content_block_delta',
		delta: {type: 'thinking_delta', text: 'Let me analyze this request...'},
	},
	{type: 'content_block_stop', index: 2},

	// Message delta and stop
	{
		type: 'message_delta',
		delta: {stop_reason: 'end_turn', usage: {output_tokens: 150}},
	},
	{type: 'message_stop'},

	// Error events
	{
		type: 'error',
		error: {
			message: 'Invalid API key',
			code: 'authentication_error',
			type: 'invalid_request_error',
		},
	},
	{
		type: 'overloaded_error',
		error: {
			message: 'API is currently overloaded',
			retry_after: 30,
			rate_limit: {requests: 0, tokens: 100, reset_at: '2025-01-01T12:00:00Z'},
		},
	},

	// Result event
	{
		type: 'result',
		subtype: 'success',
		duration_ms: 5000,
		duration_api_ms: 4500,
		num_turns: 3,
		total_cost_usd: 0.0125,
		session_id: 'session_abc123',
		usage: {
			input_tokens: 2000,
			output_tokens: 500,
			cache_read_input_tokens: 800,
		},
		result: 'Task completed successfully with all requirements met.',
	},

	// System init
	{
		type: 'system',
		subtype: 'init',
		model: 'claude-3-opus-20240229',
		cwd: '/home/user/project',
		tools: ['bash', 'edit', 'read'],
		mcp_servers: ['server1', 'server2'],
		output_style: 'json',
		permissionMode: 'auto',
		apiKeySource: 'environment',
	},

	// User and assistant messages
	{
		type: 'user',
		message: {
			content: 'Can you help me write a Python function?',
		},
	},
	{
		type: 'assistant',
		message: {
			content: [
				{type: 'text', text: "Sure! I'll help you write a Python function."},
				{
					type: 'tool_use',
					name: 'code_editor',
					id: 'tool_456',
					input: {action: 'create', filename: 'helper.py'},
				},
			],
			usage: {input_tokens: 50, output_tokens: 100},
		},
	},

	// Tool events
	{
		type: 'tool_use',
		tool_name: 'web_search',
		tool_input: {query: 'Python best practices 2025'},
	},
	{
		type: 'tool_result',
		tool_use_id: 'tool_789',
		tool_result: 'Found 10 relevant articles about Python best practices.',
	},

	// Unknown event type (for fallback testing)
	{type: 'custom_event', data: {custom_field: 'test', nested: {value: 123}}},

	// Ping
	{type: 'ping'},
];

// Output events as stream-json format
events.forEach(event => {
	console.log(JSON.stringify(event));
});
