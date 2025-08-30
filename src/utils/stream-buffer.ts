import {
	ClaudeStreamEvent,
	ClaudeEventType,
	DeltaType,
} from '../types/claude-events.js';
import {PerformanceConfig} from './performance-config.js';

/**
 * Buffered text content with metadata
 */
interface BufferedText {
	text: string;
	timestamp: number;
	eventCount: number;
}

/**
 * Optimized buffer for handling large volumes of Claude stream events
 * Provides text coalescing, memory management, and efficient rendering support
 */
export class StreamBuffer {
	private events: ClaudeStreamEvent[] = [];
	private textBuffer: BufferedText[] = [];
	private lastFlushTime: number = 0;
	private config: PerformanceConfig;
	private updateCallback?: () => void;
	private throttleTimeout?: NodeJS.Timeout;
	private gcTimeout?: NodeJS.Timeout;

	constructor(config: PerformanceConfig, updateCallback?: () => void) {
		this.config = config;
		this.updateCallback = updateCallback;
		this.startGarbageCollection();
	}

	/**
	 * Add a new event to the buffer
	 */
	addEvent(event: ClaudeStreamEvent): void {
		// Handle text deltas specially for performance
		if (this.shouldBufferTextDelta(event)) {
			this.addToTextBuffer(event);
			this.scheduleFlush();
			return;
		}

		// For non-text events, add directly and flush any pending text
		this.flushTextBuffer();
		this.events.push(event);
		this.enforceMemoryLimits();
		this.scheduleUpdate();
	}

	/**
	 * Check if event should be buffered as text delta
	 */
	private shouldBufferTextDelta(event: ClaudeStreamEvent): boolean {
		return (
			event.type === ClaudeEventType.CONTENT_BLOCK_DELTA &&
			event.delta?.type === DeltaType.TEXT_DELTA &&
			Boolean(event.delta.text)
		);
	}

	/**
	 * Add text delta to buffer for coalescing
	 */
	private addToTextBuffer(event: ClaudeStreamEvent): void {
		const text = event.delta?.text || '';
		const now = Date.now();

		// If buffer is empty or we have a large gap in time, start new buffer
		if (
			this.textBuffer.length === 0 ||
			now - this.lastFlushTime > this.config.update_throttle_ms * 2
		) {
			this.textBuffer.push({
				text,
				timestamp: now,
				eventCount: 1,
			});
		} else {
			// Append to existing buffer
			const lastBuffer = this.textBuffer[this.textBuffer.length - 1];
			if (lastBuffer) {
				lastBuffer.text += text;
				lastBuffer.eventCount += 1;

				// If buffer gets too large, flush it
				if (
					lastBuffer.text.length > this.config.text_buffer_size ||
					lastBuffer.eventCount > this.config.progressive_chunk_size
				) {
					this.flushTextBuffer();
				}
			}
		}
	}

	/**
	 * Flush text buffer to events array
	 */
	private flushTextBuffer(): void {
		if (this.textBuffer.length === 0) return;

		for (const buffer of this.textBuffer) {
			// Create a combined text delta event
			const combinedEvent: ClaudeStreamEvent = {
				type: ClaudeEventType.CONTENT_BLOCK_DELTA,
				delta: {
					type: DeltaType.TEXT_DELTA,
					text: buffer.text,
				},
				// Add metadata for debugging
				_buffered: true,
				_eventCount: buffer.eventCount,
				_timestamp: buffer.timestamp,
			} as any;

			this.events.push(combinedEvent);
		}

		this.textBuffer = [];
		this.lastFlushTime = Date.now();
		this.enforceMemoryLimits();
	}

	/**
	 * Schedule a throttled UI update
	 */
	private scheduleUpdate(): void {
		if (this.throttleTimeout) return;

		this.throttleTimeout = setTimeout(() => {
			this.throttleTimeout = undefined;
			this.updateCallback?.();
		}, this.config.update_throttle_ms);
	}

	/**
	 * Schedule a flush of text buffer
	 */
	private scheduleFlush(): void {
		// For progressive rendering, flush more frequently
		const flushDelay = this.config.progressive_render
			? this.config.progressive_delay_ms
			: this.config.update_throttle_ms;

		if (this.throttleTimeout) return;

		this.throttleTimeout = setTimeout(() => {
			this.throttleTimeout = undefined;
			this.flushTextBuffer();
			this.updateCallback?.();
		}, flushDelay);
	}

	/**
	 * Enforce memory limits and cleanup old events
	 */
	private enforceMemoryLimits(): void {
		if (!this.config.auto_cleanup_old_events) return;

		// Remove old events if we exceed the threshold
		if (this.events.length > this.config.cleanup_threshold_events) {
			const excessCount = this.events.length - this.config.max_events_in_memory;
			if (excessCount > 0) {
				this.events.splice(0, excessCount);
			}
		}

		// Truncate very long text content in events
		if (this.config.auto_truncate) {
			this.events.forEach(event => {
				if (
					event.delta?.text &&
					event.delta.text.length > this.config.max_text_length_per_event
				) {
					event.delta.text =
						event.delta.text.substring(
							0,
							this.config.max_text_length_per_event,
						) + '\n\n[... content truncated for performance ...]';
				}
			});
		}
	}

	/**
	 * Get events for rendering with virtual scrolling support
	 */
	getEventsForRender(
		startIndex: number = 0,
		count?: number,
	): ClaudeStreamEvent[] {
		// Flush any pending text first
		this.flushTextBuffer();

		if (!this.config.enable_virtual_scrolling) {
			return this.events;
		}

		const renderCount = count ?? this.config.virtual_buffer_size;
		const endIndex = Math.min(startIndex + renderCount, this.events.length);

		return this.events.slice(startIndex, endIndex);
	}

	/**
	 * Get all events (bypasses virtual scrolling)
	 */
	getAllEvents(): ClaudeStreamEvent[] {
		this.flushTextBuffer();
		return [...this.events];
	}

	/**
	 * Get total event count
	 */
	getEventCount(): number {
		return this.events.length + this.textBuffer.length;
	}

	/**
	 * Get memory usage statistics
	 */
	getMemoryStats(): {
		eventCount: number;
		textBufferCount: number;
		estimatedMemoryKB: number;
		lastFlushTime: number;
	} {
		const eventMemory = this.events.reduce((sum, event) => {
			return sum + JSON.stringify(event).length;
		}, 0);

		const textBufferMemory = this.textBuffer.reduce((sum, buffer) => {
			return sum + buffer.text.length;
		}, 0);

		return {
			eventCount: this.events.length,
			textBufferCount: this.textBuffer.length,
			estimatedMemoryKB: Math.round((eventMemory + textBufferMemory) / 1024),
			lastFlushTime: this.lastFlushTime,
		};
	}

	/**
	 * Clear all events and buffers
	 */
	clear(): void {
		this.events = [];
		this.textBuffer = [];
		this.lastFlushTime = 0;

		if (this.throttleTimeout) {
			clearTimeout(this.throttleTimeout);
			this.throttleTimeout = undefined;
		}
	}

	/**
	 * Start periodic garbage collection
	 */
	private startGarbageCollection(): void {
		if (this.config.gc_interval_ms <= 0) return;

		this.gcTimeout = setTimeout(() => {
			this.enforceMemoryLimits();
			this.startGarbageCollection(); // Reschedule
		}, this.config.gc_interval_ms);
	}

	/**
	 * Cleanup resources
	 */
	dispose(): void {
		if (this.throttleTimeout) {
			clearTimeout(this.throttleTimeout);
		}
		if (this.gcTimeout) {
			clearTimeout(this.gcTimeout);
		}
		this.clear();
	}
}

/**
 * Factory function to create a StreamBuffer with sensible defaults
 */
export function createStreamBuffer(
	config: PerformanceConfig,
	updateCallback?: () => void,
): StreamBuffer {
	return new StreamBuffer(config, updateCallback);
}
