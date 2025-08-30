import test from 'ava';
import {
	ClaudeStreamEvent,
	ClaudeEventType,
} from '../src/types/claude-events.js';
import {
	formatClaudeEvent,
	groupTextDeltas,
	formatGroupedTextDeltas,
} from '../src/utils/claude-formatter.js';
import {
	renderMarkdown,
	isMarkdown,
	smartRenderText,
} from '../src/utils/markdown-renderer.js';
import fs from 'fs/promises';
import path from 'path';

// Load test data
let testData: any;

test.before(async () => {
	try {
		const testDataPath = path.join(
			__dirname,
			'test-data',
			'sample-claude-events.json',
		);
		const data = await fs.readFile(testDataPath, 'utf-8');
		testData = JSON.parse(data);
	} catch (error) {
		console.warn('Could not load test data file, using minimal test data');
		testData = [];
	}
});

// Test processing complete event sequences
test('integration - process complete message sequence', t => {
	const messageSequence: ClaudeStreamEvent[] = [
		{
			type: ClaudeEventType.MESSAGE_START,
			message: {
				id: 'msg_test',
				model: 'claude-3-5-sonnet-20241022',
				usage: {input_tokens: 100},
			},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_START,
			index: 0,
			content_block: {type: 'text'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 0,
			delta: {type: 'text_delta', text: 'Hello '},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 0,
			delta: {type: 'text_delta', text: 'world!'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_STOP,
			index: 0,
		},
		{
			type: ClaudeEventType.MESSAGE_STOP,
		},
	];

	// Test that all events can be processed
	messageSequence.forEach((event, index) => {
		const result = formatClaudeEvent(event, index);
		t.truthy(result); // Should not return null/undefined
	});

	// Test text delta grouping
	const grouped = groupTextDeltas(messageSequence);
	t.true(grouped.length > 0);

	// Find the grouped text deltas
	const textGroup = grouped.find(item =>
		Array.isArray(item),
	) as ClaudeStreamEvent[];
	if (textGroup) {
		const combinedText = formatGroupedTextDeltas(textGroup);
		t.is(combinedText, 'Hello world!');
	}
});

test('integration - process tool use sequence', t => {
	const toolSequence: ClaudeStreamEvent[] = [
		{
			type: ClaudeEventType.MESSAGE_START,
			message: {
				id: 'msg_tool',
				model: 'claude-3-5-sonnet-20241022',
				usage: {input_tokens: 200},
			},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_START,
			index: 0,
			content_block: {
				type: 'tool_use',
				id: 'tool_123',
				name: 'search_files',
			},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 0,
			delta: {
				type: 'input_json_delta',
				partial_json: '{"query": "test"}',
			},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_STOP,
			index: 0,
		},
		{
			type: ClaudeEventType.MESSAGE_STOP,
		},
	];

	toolSequence.forEach((event, index) => {
		const result = formatClaudeEvent(event, index);
		t.truthy(result);
	});
});

test('integration - process error scenarios gracefully', t => {
	const errorEvents: ClaudeStreamEvent[] = [
		{
			type: ClaudeEventType.ERROR,
			error: {
				type: 'rate_limit_error',
				message: 'Rate limit exceeded',
				code: 'rate_limit_exceeded',
			},
		},
		{
			type: ClaudeEventType.OVERLOADED_ERROR,
			error: 'Service temporarily unavailable',
		},
		{
			type: ClaudeEventType.RESULT,
			subtype: 'error',
			is_error: true,
			result: 'Task failed with error',
		},
	];

	errorEvents.forEach((event, index) => {
		const result = formatClaudeEvent(event, index);
		t.truthy(result);
	});
});

test('integration - handle edge cases', t => {
	const edgeCases: ClaudeStreamEvent[] = [
		// Empty/null data
		{
			type: ClaudeEventType.MESSAGE_START,
			message: null as any,
		},
		// Empty text
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			delta: {type: 'text_delta', text: ''},
		},
		// Unknown event type
		{
			type: 'unknown_event_type',
			someField: 'someValue',
		},
		// Malformed error
		{
			type: ClaudeEventType.ERROR,
			error: null as any,
		},
	];

	edgeCases.forEach((event, index) => {
		// Should not throw errors
		t.notThrows(() => {
			const result = formatClaudeEvent(event, index);
			// May return null for some cases, which is acceptable
		});
	});
});

test('integration - markdown and formatting work together', t => {
	const markdownText = `# Analysis Results

Found **3 issues** in your code:

1. *Performance* - Use memoization
2. *Security* - Validate inputs  
3. *Style* - Follow conventions

## Code Example

\`\`\`javascript
const result = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
\`\`\`

See [documentation](https://example.com) for details.`;

	// Test markdown detection
	t.true(isMarkdown(markdownText));

	// Test rendering
	const rendered = renderMarkdown(markdownText);
	t.true(rendered.includes('▸▸▸ Analysis Results'));
	t.true(rendered.includes('▸▸ Code Example'));
	t.true(rendered.includes('documentation (https://example.com)'));

	// Test smart rendering
	const smart = smartRenderText(markdownText);
	t.is(smart, rendered);
});

test('integration - complex event processing from test data', t => {
	if (!testData || testData.length === 0) {
		t.pass('No test data available, skipping');
		return;
	}

	// Process each test scenario
	testData.forEach((scenario: any, scenarioIndex: number) => {
		t.log(`Processing scenario: ${scenario.description}`);

		if (scenario.events && Array.isArray(scenario.events)) {
			scenario.events.forEach(
				(event: ClaudeStreamEvent, eventIndex: number) => {
					t.notThrows(() => {
						const result = formatClaudeEvent(event, eventIndex);
						// Should be able to format any event without throwing
					}, `Failed to format event in scenario "${scenario.description}": ${JSON.stringify(event)}`);
				},
			);
		}
	});
});

test('integration - text grouping with real-world patterns', t => {
	// Simulate a realistic streaming response
	const streamingEvents: ClaudeStreamEvent[] = [
		{
			type: ClaudeEventType.MESSAGE_START,
			message: {id: 'msg_1', usage: {input_tokens: 50}},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_START,
			index: 0,
			content_block: {type: 'text'},
		},
		// Multiple small text chunks (realistic streaming)
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 0,
			delta: {type: 'text_delta', text: 'I'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 0,
			delta: {type: 'text_delta', text: ' will'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 0,
			delta: {type: 'text_delta', text: ' help'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 0,
			delta: {type: 'text_delta', text: ' you'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 0,
			delta: {type: 'text_delta', text: ' with'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 0,
			delta: {type: 'text_delta', text: ' this.'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_STOP,
			index: 0,
		},
		// Tool use interrupts text
		{
			type: ClaudeEventType.CONTENT_BLOCK_START,
			index: 1,
			content_block: {type: 'tool_use', name: 'search', id: 'tool_1'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_STOP,
			index: 1,
		},
		// More text after tool use
		{
			type: ClaudeEventType.CONTENT_BLOCK_START,
			index: 2,
			content_block: {type: 'text'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 2,
			delta: {type: 'text_delta', text: ' Based'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 2,
			delta: {type: 'text_delta', text: ' on'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 2,
			delta: {type: 'text_delta', text: ' the'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 2,
			delta: {type: 'text_delta', text: ' results...'},
		},
		{
			type: ClaudeEventType.CONTENT_BLOCK_STOP,
			index: 2,
		},
		{
			type: ClaudeEventType.MESSAGE_STOP,
		},
	];

	// Test grouping
	const grouped = groupTextDeltas(streamingEvents);

	// Should have groups: [text_deltas], tool_start, tool_stop, [text_deltas], other_events...
	const textGroups = grouped.filter(item =>
		Array.isArray(item),
	) as ClaudeStreamEvent[][];
	t.true(textGroups.length >= 2, 'Should have at least 2 text groups');

	// Test first group
	const firstGroup = textGroups[0];
	const firstText = formatGroupedTextDeltas(firstGroup);
	t.is(firstText, 'I will help you with this.');

	// Test second group
	const secondGroup = textGroups[1];
	const secondText = formatGroupedTextDeltas(secondGroup);
	t.is(secondText, ' Based on the results...');
});

test('integration - performance with large event streams', t => {
	// Create a large number of events to test performance
	const largeEventStream: ClaudeStreamEvent[] = [];

	// Add message start
	largeEventStream.push({
		type: ClaudeEventType.MESSAGE_START,
		message: {id: 'perf_test', usage: {input_tokens: 1000}},
	});

	// Add many text deltas (simulate very long response)
	for (let i = 0; i < 1000; i++) {
		largeEventStream.push({
			type: ClaudeEventType.CONTENT_BLOCK_DELTA,
			index: 0,
			delta: {type: 'text_delta', text: `word${i} `},
		});
	}

	// Add message stop
	largeEventStream.push({
		type: ClaudeEventType.MESSAGE_STOP,
	});

	const startTime = Date.now();

	// Process all events
	largeEventStream.forEach((event, index) => {
		formatClaudeEvent(event, index);
	});

	// Group text deltas
	const grouped = groupTextDeltas(largeEventStream);
	const textGroup = grouped.find(item =>
		Array.isArray(item),
	) as ClaudeStreamEvent[];
	if (textGroup) {
		formatGroupedTextDeltas(textGroup);
	}

	const endTime = Date.now();
	const processingTime = endTime - startTime;

	t.log(`Processed ${largeEventStream.length} events in ${processingTime}ms`);
	t.true(
		processingTime < 5000,
		'Should process large streams in reasonable time',
	);
});
