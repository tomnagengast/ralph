import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {
	formatClaudeEvent,
	groupTextDeltas,
	formatGroupedTextDeltas,
} from '../src/utils/claude-formatter.js';
import {
	ClaudeStreamEvent,
	ClaudeEventType,
	ContentBlockType,
	DeltaType,
} from '../src/types/claude-events.js';

// Test basic message start event
test('formatClaudeEvent - MESSAGE_START', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.MESSAGE_START,
		message: {
			id: 'msg_123',
			model: 'claude-3-5-sonnet-20241022',
			usage: {
				input_tokens: 100,
				cache_read_input_tokens: 50,
			},
		},
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	// Test rendering
	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('Message Started'));
	t.true(lastFrame().includes('claude-3-5-sonnet-20241022'));
	t.true(lastFrame().includes('Input tokens: 100'));
});

// Test content block start with tool use
test('formatClaudeEvent - CONTENT_BLOCK_START with tool use', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.CONTENT_BLOCK_START,
		index: 0,
		content_block: {
			type: ContentBlockType.TOOL_USE,
			id: 'tool_123',
			name: 'search_files',
		},
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('Content Block #0'));
	t.true(lastFrame().includes('Tool: search_files'));
});

// Test text delta
test('formatClaudeEvent - CONTENT_BLOCK_DELTA with text', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.CONTENT_BLOCK_DELTA,
		index: 0,
		delta: {
			type: DeltaType.TEXT_DELTA,
			text: 'Hello world',
		},
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('Hello world'));
});

// Test thinking delta
test('formatClaudeEvent - CONTENT_BLOCK_DELTA with thinking', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.CONTENT_BLOCK_DELTA,
		index: 0,
		delta: {
			type: DeltaType.THINKING_DELTA,
			text: 'I need to think about this...',
		},
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('I need to think about this...'));
});

// Test JSON delta
test('formatClaudeEvent - CONTENT_BLOCK_DELTA with JSON', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.CONTENT_BLOCK_DELTA,
		index: 0,
		delta: {
			type: DeltaType.INPUT_JSON_DELTA,
			partial_json: '{"query": "test"',
		},
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('{"query": "test"'));
});

// Test error event
test('formatClaudeEvent - ERROR', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.ERROR,
		error: {
			type: 'invalid_request_error',
			message: 'Invalid API key',
			code: 'authentication_error',
		},
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('Error'));
	t.true(lastFrame().includes('Invalid API key'));
	t.true(lastFrame().includes('authentication_error'));
});

// Test overloaded error
test('formatClaudeEvent - OVERLOADED_ERROR', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.OVERLOADED_ERROR,
		error: 'API is currently overloaded',
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('API Overloaded'));
	t.true(lastFrame().includes('Try again in a few moments'));
});

// Test result success
test('formatClaudeEvent - RESULT success', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.RESULT,
		subtype: 'success',
		duration_ms: 5000,
		duration_api_ms: 3000,
		num_turns: 3,
		total_cost_usd: 0.0025,
		session_id: 'sess_abc123',
		usage: {
			input_tokens: 200,
			output_tokens: 150,
			cache_creation_input_tokens: 50,
		},
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('Task Complete'));
	t.true(lastFrame().includes('Duration: 5.0s'));
	t.true(lastFrame().includes('Cost: $0.0025'));
	t.true(lastFrame().includes('Turns: 3'));
});

// Test result error
test('formatClaudeEvent - RESULT error', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.RESULT,
		subtype: 'error',
		is_error: true,
		result: 'Command failed with exit code 1',
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('Task Failed'));
	t.true(lastFrame().includes('Command failed with exit code 1'));
});

// Test system init
test('formatClaudeEvent - SYSTEM init', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.SYSTEM,
		subtype: 'init',
		model: 'claude-3-5-sonnet-20241022',
		cwd: '/home/user/project',
		tools: ['bash', 'editor', 'search'],
		mcp_servers: ['filesystem'],
		output_style: 'markdown',
		permissionMode: 'ask',
		apiKeySource: 'environment',
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('System Initialized'));
	t.true(lastFrame().includes('claude-3-5-sonnet-20241022'));
	t.true(lastFrame().includes('Tools: 3 available'));
	t.true(lastFrame().includes('MCP Servers: 1 connected'));
});

// Test tool use event
test('formatClaudeEvent - TOOL_USE', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.TOOL_USE,
		tool_name: 'search_files',
		tool_input: {
			query: 'test.js',
			directory: './src',
		},
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('Tool Use: search_files'));
	t.true(lastFrame().includes('test.js'));
});

// Test tool result
test('formatClaudeEvent - TOOL_RESULT', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.TOOL_RESULT,
		tool_use_id: 'tool_123',
		tool_result: {
			files: ['src/test.js', 'test/test.spec.js'],
			count: 2,
		},
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('Tool Result'));
	t.true(lastFrame().includes('tool_123'));
});

// Test ping
test('formatClaudeEvent - PING', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.PING,
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('ping'));
});

// Test unknown event type
test('formatClaudeEvent - unknown event', t => {
	const event: ClaudeStreamEvent = {
		type: 'unknown_event',
		custom_data: 'some value',
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	t.true(lastFrame().includes('[unknown_event]'));
});

// Test group text deltas
test('groupTextDeltas - groups consecutive text deltas', t => {
	const events: ClaudeStreamEvent[] = [
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			delta: {type: DeltaType.TEXT_DELTA, text: 'Hello '},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			delta: {type: DeltaType.TEXT_DELTA, text: 'world'},
		},
		{
			type: ClaudeEventType.MESSAGE_STOP,
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			delta: {type: DeltaType.TEXT_DELTA, text: 'Another text'},
		},
	];

	const grouped = groupTextDeltas(events);
	t.is(grouped.length, 3);
	t.true(Array.isArray(grouped[0]));
	t.is((grouped[0] as ClaudeStreamEvent[]).length, 2);
	t.false(Array.isArray(grouped[1]));
	t.true(Array.isArray(grouped[2]));
});

// Test format grouped text deltas
test('formatGroupedTextDeltas - combines text from multiple deltas', t => {
	const events: ClaudeStreamEvent[] = [
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			delta: {type: DeltaType.TEXT_DELTA, text: 'Hello '},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			delta: {type: DeltaType.TEXT_DELTA, text: 'world!'},
		},
	];

	const combined = formatGroupedTextDeltas(events);
	t.is(combined, 'Hello world!');
});

// Test cache information formatting
test('formatClaudeEvent - MESSAGE_START with cache info', t => {
	const event: ClaudeStreamEvent = {
		type: ClaudeEventType.MESSAGE_START,
		message: {
			id: 'msg_123',
			usage: {
				input_tokens: 1000,
				output_tokens: 500,
				cache_creation_input_tokens: 200,
				cache_read_input_tokens: 300,
				cache_creation: {
					ephemeral_5m_input_tokens: 100,
					ephemeral_1h_input_tokens: 100,
				},
				service_tier: 'priority',
			},
		},
	};

	const result = formatClaudeEvent(event, 0);
	t.truthy(result);

	const {lastFrame} = render(React.createElement('div', {}, result));
	const frame = lastFrame();
	t.true(frame.includes('Input tokens: 1000'));
	t.true(frame.includes('(300 from cache)'));
	t.true(frame.includes('Cache created: 200 tokens'));
	t.true(frame.includes('Ephemeral 5m cache: 100 tokens'));
	t.true(frame.includes('Ephemeral 1h cache: 100 tokens'));
	t.true(frame.includes('Service tier: priority'));
});
