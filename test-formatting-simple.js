#!/usr/bin/env node
import {
	formatClaudeEvent,
	groupTextDeltas,
	formatGroupedTextDeltas,
} from './dist/utils/claude-formatter.js';
import {
	renderMarkdown,
	isMarkdown,
	smartRenderText,
} from './dist/utils/markdown-renderer.js';
import fs from 'fs';

console.log('='.repeat(80));
console.log('CLAUDE FORMATTING VERIFICATION');
console.log('='.repeat(80));

// Test markdown rendering
console.log('\n📝 TESTING MARKDOWN RENDERING:');
console.log('-'.repeat(40));

const markdownTests = [
	'# Header Test',
	'This is **bold** and *italic* text',
	'```javascript\nconsole.log("code block");\n```',
	'Regular text with `inline code`',
	'[Link text](https://example.com)',
	'> This is a blockquote',
];

markdownTests.forEach((text, i) => {
	console.log(`\nTest ${i + 1}:`);
	console.log(`  Input:  "${text}"`);
	console.log(`  Detected as markdown: ${isMarkdown(text)}`);
	console.log(`  Output: "${smartRenderText(text)}"`);
});

// Test text delta grouping
console.log('\n\n🔗 TESTING TEXT DELTA GROUPING:');
console.log('-'.repeat(40));

const mockEvents = [
	{
		type: 'content_block_delta',
		delta: {type: 'text_delta', text: 'Hello '},
	},
	{
		type: 'content_block_delta',
		delta: {type: 'text_delta', text: 'world! '},
	},
	{
		type: 'message_stop',
	},
	{
		type: 'content_block_delta',
		delta: {type: 'text_delta', text: 'Another sentence.'},
	},
];

const grouped = groupTextDeltas(mockEvents);
console.log(`\nOriginal events: ${mockEvents.length}`);
console.log(`Grouped items: ${grouped.length}`);

grouped.forEach((item, i) => {
	if (Array.isArray(item)) {
		const combined = formatGroupedTextDeltas(item);
		console.log(`  Group ${i}: [${item.length} text deltas] -> "${combined}"`);
	} else {
		console.log(`  Event ${i}: ${item.type}`);
	}
});

// Test event type coverage
console.log('\n\n📊 TESTING EVENT TYPE COVERAGE:');
console.log('-'.repeat(40));

const testData = JSON.parse(
	fs.readFileSync('./test/test-data/sample-claude-events.json', 'utf-8'),
);
const allEventTypes = new Set();

testData.forEach(scenario => {
	if (scenario.events) {
		scenario.events.forEach(event => {
			allEventTypes.add(event.type);
		});
	}
});

console.log(`\nTotal unique event types found: ${allEventTypes.size}`);
allEventTypes.forEach(type => {
	console.log(`  ✓ ${type}`);
});

// Test that formatClaudeEvent handles all event types without errors
console.log('\n\n🛡️ TESTING ERROR RESILIENCE:');
console.log('-'.repeat(40));

let totalEvents = 0;
let successfulFormats = 0;
let errors = 0;

testData.forEach(scenario => {
	if (scenario.events) {
		scenario.events.forEach((event, index) => {
			totalEvents++;
			try {
				const result = formatClaudeEvent(event, index);
				if (result !== null && result !== undefined) {
					successfulFormats++;
				} else {
					// null/undefined is acceptable for some events
					successfulFormats++;
				}
			} catch (error) {
				errors++;
				console.log(`  ❌ Error formatting ${event.type}: ${error.message}`);
			}
		});
	}
});

console.log(`\nResults:`);
console.log(`  Total events processed: ${totalEvents}`);
console.log(`  Successfully formatted: ${successfulFormats}`);
console.log(`  Errors: ${errors}`);
console.log(
	`  Success rate: ${((successfulFormats / totalEvents) * 100).toFixed(1)}%`,
);

// Test edge cases
console.log('\n\n⚠️ TESTING EDGE CASES:');
console.log('-'.repeat(40));

const edgeCases = [
	{type: 'unknown_event', data: 'test'},
	{type: 'message_start', message: null},
	{type: 'content_block_delta', delta: {type: 'text_delta', text: ''}},
	{type: 'error', error: ''},
];

edgeCases.forEach((event, index) => {
	try {
		const result = formatClaudeEvent(event, index);
		console.log(
			`  ✓ Edge case ${index + 1} (${event.type}): Handled gracefully`,
		);
	} catch (error) {
		console.log(
			`  ❌ Edge case ${index + 1} (${event.type}): ${error.message}`,
		);
	}
});

console.log('\n' + '='.repeat(80));
console.log('VERIFICATION COMPLETE');
console.log('='.repeat(80));
