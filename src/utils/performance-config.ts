/**
 * Performance configuration interface and defaults for stream optimization
 */
export interface PerformanceConfig {
	// Display limits
	max_display_lines: number;
	max_events_in_memory: number;
	max_text_length_per_event: number;

	// Update throttling
	update_throttle_ms: number;
	text_buffer_size: number;

	// Auto-cleanup options
	auto_truncate: boolean;
	auto_cleanup_old_events: boolean;
	cleanup_threshold_events: number;

	// Progressive rendering
	progressive_render: boolean;
	progressive_chunk_size: number;
	progressive_delay_ms: number;

	// Memory management
	enable_virtual_scrolling: boolean;
	virtual_buffer_size: number;
	gc_interval_ms: number;
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
	// Display limits
	max_display_lines: 1000,
	max_events_in_memory: 5000,
	max_text_length_per_event: 10000,

	// Update throttling (16ms = 60fps)
	update_throttle_ms: 16,
	text_buffer_size: 100,

	// Auto-cleanup options
	auto_truncate: true,
	auto_cleanup_old_events: true,
	cleanup_threshold_events: 10000,

	// Progressive rendering
	progressive_render: true,
	progressive_chunk_size: 50,
	progressive_delay_ms: 5,

	// Memory management
	enable_virtual_scrolling: true,
	virtual_buffer_size: 200,
	gc_interval_ms: 30000, // 30 seconds
};

/**
 * Load performance configuration from environment or config file
 */
export function loadPerformanceConfig(
	overrides: Partial<PerformanceConfig> = {},
): PerformanceConfig {
	const config = {...DEFAULT_PERFORMANCE_CONFIG};

	// Apply environment variable overrides
	if (process.env['RALPH_MAX_DISPLAY_LINES']) {
		config.max_display_lines = parseInt(
			process.env['RALPH_MAX_DISPLAY_LINES'],
			10,
		);
	}
	if (process.env['RALPH_UPDATE_THROTTLE_MS']) {
		config.update_throttle_ms = parseInt(
			process.env['RALPH_UPDATE_THROTTLE_MS'],
			10,
		);
	}
	if (process.env['RALPH_AUTO_TRUNCATE']) {
		config.auto_truncate = process.env['RALPH_AUTO_TRUNCATE'] === 'true';
	}
	if (process.env['RALPH_PROGRESSIVE_RENDER']) {
		config.progressive_render =
			process.env['RALPH_PROGRESSIVE_RENDER'] === 'true';
	}
	if (process.env['RALPH_VIRTUAL_SCROLLING']) {
		config.enable_virtual_scrolling =
			process.env['RALPH_VIRTUAL_SCROLLING'] === 'true';
	}

	// Apply explicit overrides
	return {...config, ...overrides};
}
