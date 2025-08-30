import React, {useMemo, useCallback} from 'react';
import {Box, Text} from 'ink';
import {ClaudeStreamEvent} from '../types/claude-events.js';
import {PerformanceConfig} from './performance-config.js';
import {
	formatClaudeEvent,
	groupTextDeltas,
	formatGroupedTextDeltas,
} from './claude-formatter.js';
import {EventFilterConfig, filterEvents} from './event-filter.js';

interface VirtualRendererProps {
	events: ClaudeStreamEvent[];
	config: PerformanceConfig;
	verbosity: 'minimal' | 'normal' | 'verbose' | 'debug';
	eventFilter?: EventFilterConfig;
	showMemoryStats?: boolean;
}

interface RendererStats {
	totalEvents: number;
	visibleEvents: number;
	estimatedMemoryKB: number;
	renderTime: number;
}

/**
 * Virtual renderer component that efficiently renders large lists of Claude events
 * with progressive loading, memory limits, and performance optimization
 */
export const VirtualRenderer: React.FC<VirtualRendererProps> = ({
	events,
	config,
	verbosity,
	eventFilter,
	showMemoryStats = false,
}) => {
	// Memoized event processing to avoid re-computation
	const processedEvents = useMemo(() => {
		const startTime = performance.now();

		// Filter events first
		const filteredEvents = eventFilter
			? filterEvents(events, eventFilter)
			: events;

		// Group text deltas for better readability
		const groupedEvents = groupTextDeltas(filteredEvents);

		// Apply display limits
		const limitedEvents =
			config.max_display_lines > 0
				? groupedEvents.slice(-config.max_display_lines)
				: groupedEvents;

		const renderTime = performance.now() - startTime;

		return {
			events: limitedEvents,
			stats: {
				totalEvents: events.length,
				visibleEvents: limitedEvents.length,
				estimatedMemoryKB: Math.round(
					JSON.stringify(limitedEvents).length / 1024,
				),
				renderTime: Math.round(renderTime * 100) / 100,
			} as RendererStats,
		};
	}, [events, eventFilter, config.max_display_lines]);

	// Memoized event renderer to avoid re-rendering unchanged events
	const renderEvent = useCallback(
		(item: ClaudeStreamEvent | ClaudeStreamEvent[], index: number) => {
			if (Array.isArray(item)) {
				// Render grouped text deltas efficiently using formatGroupedTextDeltas
				const formattedText = formatGroupedTextDeltas(item);

				// Truncate very long text for performance
				const displayText =
					config.auto_truncate &&
					formattedText.length > config.max_text_length_per_event
						? formattedText.substring(0, config.max_text_length_per_event) +
						  '\n\n[... truncated ...]'
						: formattedText;

				return (
					<Text key={`group-${index}`} wrap="wrap">
						{displayText}
					</Text>
				);
			} else {
				return formatClaudeEvent(item, index, verbosity);
			}
		},
		[config.auto_truncate, config.max_text_length_per_event, verbosity],
	);

	// Progressive rendering: split events into chunks
	const renderProgressively = useCallback(() => {
		if (
			!config.progressive_render ||
			processedEvents.events.length <= config.progressive_chunk_size
		) {
			// Render all at once if progressive rendering is disabled or list is small
			return (
				<Box flexDirection="column">
					{processedEvents.events.map(renderEvent)}
				</Box>
			);
		}

		// Split into chunks and render
		const chunks: (ClaudeStreamEvent | ClaudeStreamEvent[])[][] = [];
		for (
			let i = 0;
			i < processedEvents.events.length;
			i += config.progressive_chunk_size
		) {
			chunks.push(
				processedEvents.events.slice(i, i + config.progressive_chunk_size),
			);
		}

		return (
			<Box flexDirection="column">
				{chunks.map((chunk, chunkIndex) => (
					<ProgressiveChunk
						key={`chunk-${chunkIndex}`}
						events={chunk}
						renderer={renderEvent}
						delay={chunkIndex * config.progressive_delay_ms}
					/>
				))}
			</Box>
		);
	}, [
		processedEvents.events,
		config.progressive_render,
		config.progressive_chunk_size,
		config.progressive_delay_ms,
		renderEvent,
	]);

	return (
		<Box flexDirection="column">
			{/* Memory stats display */}
			{showMemoryStats && (
				<Box marginBottom={1}>
					<Text dimColor>
						📊 Events: {processedEvents.stats.visibleEvents}/
						{processedEvents.stats.totalEvents} | Memory:{' '}
						{processedEvents.stats.estimatedMemoryKB}KB | Render:{' '}
						{processedEvents.stats.renderTime}ms
					</Text>
				</Box>
			)}

			{/* Show truncation warning if applicable */}
			{config.max_display_lines > 0 &&
				events.length > config.max_display_lines && (
					<Box marginBottom={1}>
						<Text color="yellow" dimColor>
							⚠️ Showing last {config.max_display_lines} events (
							{events.length - config.max_display_lines} hidden for performance)
						</Text>
					</Box>
				)}

			{/* Main content */}
			{processedEvents.events.length === 0 ? (
				<Text dimColor>Waiting for response...</Text>
			) : (
				renderProgressively()
			)}
		</Box>
	);
};

/**
 * Progressive chunk component that renders with a delay
 */
interface ProgressiveChunkProps {
	events: (ClaudeStreamEvent | ClaudeStreamEvent[])[];
	renderer: (
		item: ClaudeStreamEvent | ClaudeStreamEvent[],
		index: number,
	) => React.ReactNode;
	delay: number;
}

const ProgressiveChunk: React.FC<ProgressiveChunkProps> = ({
	events,
	renderer,
	delay,
}) => {
	const [isVisible, setIsVisible] = React.useState(delay === 0);

	React.useEffect(() => {
		if (delay > 0 && !isVisible) {
			const timer = setTimeout(() => setIsVisible(true), delay);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [delay, isVisible]);

	if (!isVisible) {
		return <Text dimColor>Loading...</Text>;
	}

	return <Box flexDirection="column">{events.map(renderer)}</Box>;
};

/**
 * Hook for managing virtual renderer state
 */
export function useVirtualRenderer(
	events: ClaudeStreamEvent[],
	config: PerformanceConfig,
) {
	const [scrollPosition, setScrollPosition] = React.useState(0);
	const [isAutoScrolling, setIsAutoScrolling] = React.useState(true);

	// Auto-scroll to bottom when new events arrive (if enabled)
	React.useEffect(() => {
		if (isAutoScrolling && config.enable_virtual_scrolling) {
			const maxScroll = Math.max(0, events.length - config.virtual_buffer_size);
			setScrollPosition(maxScroll);
		}
	}, [
		events.length,
		isAutoScrolling,
		config.enable_virtual_scrolling,
		config.virtual_buffer_size,
	]);

	const scrollToTop = useCallback(() => {
		setScrollPosition(0);
		setIsAutoScrolling(false);
	}, []);

	const scrollToBottom = useCallback(() => {
		const maxScroll = Math.max(0, events.length - config.virtual_buffer_size);
		setScrollPosition(maxScroll);
		setIsAutoScrolling(true);
	}, [events.length, config.virtual_buffer_size]);

	const getVisibleEvents = useCallback(() => {
		if (!config.enable_virtual_scrolling) {
			return events;
		}

		const endIndex = scrollPosition + config.virtual_buffer_size;
		return events.slice(scrollPosition, endIndex);
	}, [
		events,
		scrollPosition,
		config.enable_virtual_scrolling,
		config.virtual_buffer_size,
	]);

	return {
		scrollPosition,
		isAutoScrolling,
		visibleEvents: getVisibleEvents(),
		scrollToTop,
		scrollToBottom,
		canScrollUp: scrollPosition > 0,
		canScrollDown: scrollPosition + config.virtual_buffer_size < events.length,
	};
}
