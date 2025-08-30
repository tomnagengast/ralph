import {ClaudeStreamEvent, ClaudeEventType} from '../types/claude-events.js';

// Event filter preset configurations
export interface EventFilterConfig {
	include?: string[]; // Only show these event types
	exclude?: string[]; // Don't show these event types
	preset?: EventFilterPreset; // Use a predefined preset
}

export enum EventFilterPreset {
	TEXT_ONLY = 'text-only',
	NO_SYSTEM = 'no-system',
	ERRORS_ONLY = 'errors-only',
	TOOLS = 'tools',
	MESSAGES = 'messages',
	DEBUG = 'debug',
	ALL = 'all',
}

// Predefined event filter presets
export const EVENT_FILTER_PRESETS: Record<
	EventFilterPreset,
	{include?: string[]; exclude?: string[]}
> = {
	[EventFilterPreset.TEXT_ONLY]: {
		include: [ClaudeEventType.CONTENT_BLOCK_DELTA, ClaudeEventType.RESULT],
	},
	[EventFilterPreset.NO_SYSTEM]: {
		exclude: [
			ClaudeEventType.PING,
			ClaudeEventType.CONNECTION_PING,
			ClaudeEventType.SYSTEM,
			ClaudeEventType.MESSAGE_START,
			ClaudeEventType.MESSAGE_STOP,
			ClaudeEventType.CONTENT_BLOCK_START,
			ClaudeEventType.CONTENT_BLOCK_STOP,
		],
	},
	[EventFilterPreset.ERRORS_ONLY]: {
		include: [
			ClaudeEventType.ERROR,
			ClaudeEventType.OVERLOADED_ERROR,
			ClaudeEventType.INVALID_REQUEST_ERROR,
			ClaudeEventType.AUTHENTICATION_ERROR,
			ClaudeEventType.PERMISSION_ERROR,
			ClaudeEventType.NOT_FOUND_ERROR,
			ClaudeEventType.REQUEST_TOO_LARGE,
			ClaudeEventType.RATE_LIMIT_ERROR,
			ClaudeEventType.API_ERROR,
			ClaudeEventType.CONNECTION_ERROR,
			ClaudeEventType.CODE_ERROR,
			ClaudeEventType.FILE_ERROR,
		],
	},
	[EventFilterPreset.TOOLS]: {
		include: [
			ClaudeEventType.TOOL_USE,
			ClaudeEventType.TOOL_RESULT,
			ClaudeEventType.TOOL_USE_START,
			ClaudeEventType.TOOL_USE_DELTA,
			ClaudeEventType.TOOL_USE_STOP,
		],
	},
	[EventFilterPreset.MESSAGES]: {
		include: [
			ClaudeEventType.MESSAGE_START,
			ClaudeEventType.MESSAGE_DELTA,
			ClaudeEventType.MESSAGE_STOP,
			ClaudeEventType.USER,
			ClaudeEventType.ASSISTANT,
			ClaudeEventType.CONTENT_BLOCK_START,
			ClaudeEventType.CONTENT_BLOCK_DELTA,
			ClaudeEventType.CONTENT_BLOCK_STOP,
		],
	},
	[EventFilterPreset.DEBUG]: {
		// Include all events (no filtering)
	},
	[EventFilterPreset.ALL]: {
		// Include all events (no filtering)
	},
};

// Function to check if an event should be shown based on filter config
export function shouldShowEvent(
	event: ClaudeStreamEvent,
	config?: EventFilterConfig,
): boolean {
	if (!config) return true;

	// Apply preset first if specified
	let include = config.include;
	let exclude = config.exclude;

	if (config.preset) {
		const preset = EVENT_FILTER_PRESETS[config.preset];
		if (preset) {
			include = include || preset.include;
			exclude = exclude || preset.exclude;
		}
	}

	// If include list is specified, only show events in that list
	if (include && include.length > 0) {
		return include.includes(event.type);
	}

	// If exclude list is specified, hide events in that list
	if (exclude && exclude.length > 0) {
		return !exclude.includes(event.type);
	}

	// Default: show all events
	return true;
}

// Function to filter an array of events
export function filterEvents(
	events: ClaudeStreamEvent[],
	config?: EventFilterConfig,
): ClaudeStreamEvent[] {
	if (!config) return events;
	return events.filter(event => shouldShowEvent(event, config));
}

// Helper function to validate event filter configuration
export function validateEventFilterConfig(config: EventFilterConfig): string[] {
	const errors: string[] = [];

	// Check for conflicting include/exclude
	if (config.include && config.exclude) {
		const overlap = config.include.filter(type =>
			config.exclude!.includes(type),
		);
		if (overlap.length > 0) {
			errors.push(
				`Event types cannot be both included and excluded: ${overlap.join(
					', ',
				)}`,
			);
		}
	}

	// Validate event types
	const allEventTypes = Object.values(ClaudeEventType);

	if (config.include) {
		const invalidInclude = config.include.filter(
			type => !allEventTypes.includes(type as ClaudeEventType),
		);
		if (invalidInclude.length > 0) {
			errors.push(
				`Invalid event types in include list: ${invalidInclude.join(', ')}`,
			);
		}
	}

	if (config.exclude) {
		const invalidExclude = config.exclude.filter(
			type => !allEventTypes.includes(type as ClaudeEventType),
		);
		if (invalidExclude.length > 0) {
			errors.push(
				`Invalid event types in exclude list: ${invalidExclude.join(', ')}`,
			);
		}
	}

	// Validate preset
	if (
		config.preset &&
		!Object.values(EventFilterPreset).includes(config.preset)
	) {
		errors.push(
			`Invalid preset: ${config.preset}. Valid presets: ${Object.values(
				EventFilterPreset,
			).join(', ')}`,
		);
	}

	return errors;
}

// Helper function to get all available event types for help/documentation
export function getAllEventTypes(): string[] {
	return Object.values(ClaudeEventType).sort();
}

// Helper function to get all available presets
export function getAllPresets(): EventFilterPreset[] {
	return Object.values(EventFilterPreset);
}
