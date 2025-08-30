import test from 'ava';
import {
	shouldShowEvent,
	filterEvents,
	EventFilterPreset,
	validateEventFilterConfig,
} from '../src/utils/event-filter.js';
import type {EventFilterConfig} from '../src/utils/event-filter.js';
import type {
	ClaudeStreamEvent,
} from '../src/types/claude-events.js';
import {ClaudeEventType} from '../src/types/claude-events.js';

// Helper function to create test events
function createTestEvent(type: ClaudeEventType): ClaudeStreamEvent {
	return {
		type,
	};
}

test('shouldShowEvent with no filter shows all events', t => {
	const event = createTestEvent(ClaudeEventType.PING);
	t.true(shouldShowEvent(event));
	t.true(shouldShowEvent(event, undefined));
});

test('shouldShowEvent with preset filters work correctly', t => {
	const textEvent = createTestEvent(ClaudeEventType.CONTENT_BLOCK_DELTA);
	const pingEvent = createTestEvent(ClaudeEventType.PING);
	const errorEvent = createTestEvent(ClaudeEventType.ERROR);
	const toolEvent = createTestEvent(ClaudeEventType.TOOL_USE);

	// TEXT_ONLY preset
	const textOnlyConfig: EventFilterConfig = {
		preset: EventFilterPreset.TEXT_ONLY,
	};
	t.true(shouldShowEvent(textEvent, textOnlyConfig));
	t.false(shouldShowEvent(pingEvent, textOnlyConfig));
	t.false(shouldShowEvent(toolEvent, textOnlyConfig));

	// ERRORS_ONLY preset
	const errorsOnlyConfig: EventFilterConfig = {
		preset: EventFilterPreset.ERRORS_ONLY,
	};
	t.true(shouldShowEvent(errorEvent, errorsOnlyConfig));
	t.false(shouldShowEvent(textEvent, errorsOnlyConfig));
	t.false(shouldShowEvent(pingEvent, errorsOnlyConfig));

	// TOOLS preset
	const toolsConfig: EventFilterConfig = {preset: EventFilterPreset.TOOLS};
	t.true(shouldShowEvent(toolEvent, toolsConfig));
	t.false(shouldShowEvent(textEvent, toolsConfig));
	t.false(shouldShowEvent(pingEvent, toolsConfig));

	// NO_SYSTEM preset (excludes system events)
	const noSystemConfig: EventFilterConfig = {
		preset: EventFilterPreset.NO_SYSTEM,
	};
	t.true(shouldShowEvent(textEvent, noSystemConfig));
	t.true(shouldShowEvent(errorEvent, noSystemConfig));
	t.false(shouldShowEvent(pingEvent, noSystemConfig));
});

test('shouldShowEvent with include filter works correctly', t => {
	const textEvent = createTestEvent(ClaudeEventType.CONTENT_BLOCK_DELTA);
	const pingEvent = createTestEvent(ClaudeEventType.PING);
	const errorEvent = createTestEvent(ClaudeEventType.ERROR);

	const config: EventFilterConfig = {
		include: [ClaudeEventType.CONTENT_BLOCK_DELTA, ClaudeEventType.ERROR],
	};

	t.true(shouldShowEvent(textEvent, config));
	t.true(shouldShowEvent(errorEvent, config));
	t.false(shouldShowEvent(pingEvent, config));
});

test('shouldShowEvent with exclude filter works correctly', t => {
	const textEvent = createTestEvent(ClaudeEventType.CONTENT_BLOCK_DELTA);
	const pingEvent = createTestEvent(ClaudeEventType.PING);
	const systemEvent = createTestEvent(ClaudeEventType.SYSTEM);

	const config: EventFilterConfig = {
		exclude: [ClaudeEventType.PING, ClaudeEventType.SYSTEM],
	};

	t.true(shouldShowEvent(textEvent, config));
	t.false(shouldShowEvent(pingEvent, config));
	t.false(shouldShowEvent(systemEvent, config));
});

test('filterEvents filters array of events correctly', t => {
	const events: ClaudeStreamEvent[] = [
		createTestEvent(ClaudeEventType.CONTENT_BLOCK_DELTA),
		createTestEvent(ClaudeEventType.PING),
		createTestEvent(ClaudeEventType.ERROR),
		createTestEvent(ClaudeEventType.TOOL_USE),
	];

	// Test with include filter
	const includeConfig: EventFilterConfig = {
		include: [ClaudeEventType.CONTENT_BLOCK_DELTA, ClaudeEventType.ERROR],
	};
	const includedEvents = filterEvents(events, includeConfig);
	t.is(includedEvents.length, 2);
	t.is(includedEvents[0]!.type, ClaudeEventType.CONTENT_BLOCK_DELTA);
	t.is(includedEvents[1]!.type, ClaudeEventType.ERROR);

	// Test with exclude filter
	const excludeConfig: EventFilterConfig = {
		exclude: [ClaudeEventType.PING],
	};
	const excludedEvents = filterEvents(events, excludeConfig);
	t.is(excludedEvents.length, 3);
	t.false(excludedEvents.some(e => e.type === ClaudeEventType.PING));
});

test('validateEventFilterConfig detects validation errors', t => {
	// Valid config
	const validConfig: EventFilterConfig = {
		preset: EventFilterPreset.TEXT_ONLY,
	};
	t.is(validateEventFilterConfig(validConfig).length, 0);

	// Invalid preset
	const invalidPresetConfig: EventFilterConfig = {
		preset: 'invalid-preset' as EventFilterPreset,
	};
	const presetErrors = validateEventFilterConfig(invalidPresetConfig);
	t.true(presetErrors.length > 0);
	t.true(presetErrors[0]!.includes('Invalid preset'));

	// Invalid event types in include
	const invalidIncludeConfig: EventFilterConfig = {
		include: ['invalid_event_type'],
	};
	const includeErrors = validateEventFilterConfig(invalidIncludeConfig);
	t.true(includeErrors.length > 0);
	t.true(includeErrors[0]!.includes('Invalid event types in include'));

	// Invalid event types in exclude
	const invalidExcludeConfig: EventFilterConfig = {
		exclude: ['invalid_event_type'],
	};
	const excludeErrors = validateEventFilterConfig(invalidExcludeConfig);
	t.true(excludeErrors.length > 0);
	t.true(excludeErrors[0]!.includes('Invalid event types in exclude'));

	// Conflicting include/exclude
	const conflictConfig: EventFilterConfig = {
		include: [ClaudeEventType.PING],
		exclude: [ClaudeEventType.PING],
	};
	const conflictErrors = validateEventFilterConfig(conflictConfig);
	t.true(conflictErrors.length > 0);
	t.true(conflictErrors[0]!.includes('cannot be both included and excluded'));
});

test('preset configurations contain valid event types', t => {
	// This test ensures our preset configurations use actual event types
	const textOnlyConfig: EventFilterConfig = {
		preset: EventFilterPreset.TEXT_ONLY,
	};
	const errorsOnlyConfig: EventFilterConfig = {
		preset: EventFilterPreset.ERRORS_ONLY,
	};
	const toolsConfig: EventFilterConfig = {preset: EventFilterPreset.TOOLS};
	const noSystemConfig: EventFilterConfig = {
		preset: EventFilterPreset.NO_SYSTEM,
	};

	// These should not throw validation errors
	t.is(validateEventFilterConfig(textOnlyConfig).length, 0);
	t.is(validateEventFilterConfig(errorsOnlyConfig).length, 0);
	t.is(validateEventFilterConfig(toolsConfig).length, 0);
	t.is(validateEventFilterConfig(noSystemConfig).length, 0);
});
