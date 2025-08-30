import React, {useMemo, useCallback} from 'react';
import {Box, Text} from 'ink';
import {ClaudeStreamEvent} from '../types/claude-events.js';
import {formatClaudeEvent} from './claude-formatter.js';
import {smartRenderText} from './markdown-renderer.js';

/**
 * Cache for memoized formatting results
 */
const formatCache = new Map<string, React.ReactNode>();
const textRenderCache = new Map<string, string>();

// Clear cache when it gets too large (memory management)
const MAX_CACHE_SIZE = 1000;

function clearOldCache() {
	if (formatCache.size > MAX_CACHE_SIZE) {
		// Keep only the most recent half
		const entries = Array.from(formatCache.entries());
		formatCache.clear();
		entries.slice(-MAX_CACHE_SIZE / 2).forEach(([key, value]) => {
			formatCache.set(key, value);
		});
	}

	if (textRenderCache.size > MAX_CACHE_SIZE) {
		const entries = Array.from(textRenderCache.entries());
		textRenderCache.clear();
		entries.slice(-MAX_CACHE_SIZE / 2).forEach(([key, value]) => {
			textRenderCache.set(key, value);
		});
	}
}

/**
 * Generate cache key for event formatting
 */
function getEventCacheKey(
	event: ClaudeStreamEvent,
	index: number,
	verbosity: string,
): string {
	// Include essential fields that affect rendering
	const keyData = {
		type: event.type,
		deltaType: event.delta?.type,
		deltaText: event.delta?.text,
		error: event.error,
		toolName: event.tool_name,
		contentType: event.content_block?.type,
		index,
		verbosity,
		// Add a hash of the full event for uniqueness, but truncated
		hash: JSON.stringify(event).slice(0, 100),
	};

	return JSON.stringify(keyData);
}

/**
 * Memoized Claude event formatter that caches rendering results
 */
export const useMemoizedEventFormatter = (
	verbosity: 'minimal' | 'normal' | 'verbose' | 'debug',
) => {
	return useCallback(
		(event: ClaudeStreamEvent, index: number): React.ReactNode => {
			const cacheKey = getEventCacheKey(event, index, verbosity);

			// Check cache first
			if (formatCache.has(cacheKey)) {
				return formatCache.get(cacheKey);
			}

			// Format the event
			const result = formatClaudeEvent(event, index, verbosity);

			// Cache the result
			formatCache.set(cacheKey, result);

			// Clean up cache if it's getting too large
			if (formatCache.size % 100 === 0) {
				clearOldCache();
			}

			return result;
		},
		[verbosity],
	);
};

/**
 * Memoized text renderer with caching
 */
export const useMemoizedTextRenderer = () => {
	return useCallback((text: string): string => {
		if (textRenderCache.has(text)) {
			return textRenderCache.get(text)!;
		}

		const result = smartRenderText(text);
		textRenderCache.set(text, result);

		// Clean up cache periodically
		if (textRenderCache.size % 100 === 0) {
			clearOldCache();
		}

		return result;
	}, []);
};

/**
 * Memoized JSON formatter for complex objects
 */
const jsonFormatCache = new Map<string, React.ReactNode>();

export const useMemoizedJsonFormatter = () => {
	return useCallback((obj: any, compact: boolean = false): React.ReactNode => {
		const cacheKey = JSON.stringify({obj, compact});

		if (jsonFormatCache.has(cacheKey)) {
			return jsonFormatCache.get(cacheKey);
		}

		let result: React.ReactNode;

		try {
			const jsonStr = compact
				? JSON.stringify(obj)
				: JSON.stringify(obj, null, 2);

			// For simple values, return as-is
			if (
				typeof obj === 'string' ||
				typeof obj === 'number' ||
				typeof obj === 'boolean' ||
				obj === null
			) {
				result = <Text color="cyan">{jsonStr}</Text>;
			} else {
				// For complex objects, create a formatted version
				result = (
					<Box flexDirection="column">
						{jsonStr
							.split('\n')
							.slice(0, 50)
							.map((line, i) => (
								<Text
									key={i}
									dimColor={line.includes('{') || line.includes('}')}
								>
									{line}
								</Text>
							))}
						{jsonStr.split('\n').length > 50 && (
							<Text dimColor>
								... ({jsonStr.split('\n').length - 50} more lines)
							</Text>
						)}
					</Box>
				);
			}
		} catch {
			result = <Text dimColor>{String(obj)}</Text>;
		}

		jsonFormatCache.set(cacheKey, result);

		// Clean up cache if needed
		if (jsonFormatCache.size > MAX_CACHE_SIZE) {
			const entries = Array.from(jsonFormatCache.entries());
			jsonFormatCache.clear();
			entries.slice(-MAX_CACHE_SIZE / 2).forEach(([key, value]) => {
				jsonFormatCache.set(key, value);
			});
		}

		return result;
	}, []);
};

/**
 * Performance-optimized event list renderer
 */
interface OptimizedEventListProps {
	events: (ClaudeStreamEvent | ClaudeStreamEvent[])[];
	verbosity: 'minimal' | 'normal' | 'verbose' | 'debug';
	maxEvents?: number;
}

export const OptimizedEventList: React.FC<OptimizedEventListProps> = ({
	events,
	verbosity,
	maxEvents = 1000,
}) => {
	const formatEvent = useMemoizedEventFormatter(verbosity);
	const renderText = useMemoizedTextRenderer();

	// Memoize the event list to avoid re-rendering unchanged events
	const renderedEvents = useMemo(() => {
		const eventsToRender = maxEvents > 0 ? events.slice(-maxEvents) : events;

		return eventsToRender.map((item, index) => {
			if (Array.isArray(item)) {
				// Handle grouped text deltas
				const combinedText = item.map(e => e.delta?.text || '').join('');
				const renderedText = renderText(combinedText);

				return (
					<Text key={`group-${index}`} wrap="wrap">
						{renderedText}
					</Text>
				);
			} else {
				return formatEvent(item, index);
			}
		});
	}, [events, verbosity, maxEvents, formatEvent, renderText]);

	return <Box flexDirection="column">{renderedEvents}</Box>;
};

/**
 * Clear all formatting caches (useful for memory management)
 */
export function clearFormattingCaches(): void {
	formatCache.clear();
	textRenderCache.clear();
	jsonFormatCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
	formatCacheSize: number;
	textRenderCacheSize: number;
	jsonFormatCacheSize: number;
	totalMemoryKB: number;
} {
	const formatMemory = Array.from(formatCache.values()).reduce(
		(sum: number, node) => {
			return (
				sum +
				(typeof node === 'string' ? node.length : JSON.stringify(node).length)
			);
		},
		0,
	);

	const textMemory = Array.from(textRenderCache.values()).reduce(
		(sum, text) => {
			return sum + text.length;
		},
		0,
	);

	const jsonMemory = Array.from(jsonFormatCache.keys()).reduce((sum, key) => {
		return sum + key.length;
	}, 0);

	return {
		formatCacheSize: formatCache.size,
		textRenderCacheSize: textRenderCache.size,
		jsonFormatCacheSize: jsonFormatCache.size,
		totalMemoryKB: Math.round((formatMemory + textMemory + jsonMemory) / 1024),
	};
}
