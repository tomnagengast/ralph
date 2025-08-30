#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import RalphLoop from './RalphLoop.js';
import {
	EventFilterPreset,
	EventFilterConfig,
	validateEventFilterConfig,
	getAllPresets,
} from './utils/event-filter.js';
import {setGlobalColorScheme, colorSchemes} from './utils/color-schemes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple arg parsing
const args = process.argv.slice(2);
const command = args[0];

// Handle version
if (args.includes('-v') || args.includes('--version')) {
	const packageJson = JSON.parse(
		fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'),
	);
	console.log(packageJson.version);
	process.exit(0);
}

// Handle help
if (args.includes('-h') || args.includes('--help') || !command) {
	console.log(`
  Usage: 
    ralph init                    Initialize ralph in current directory
    ralph run [options]           Run continuously with prompt

  Commands:
    init                          Create .ralph directory and template files
    run                           Start continuous execution loop

  Options for 'run':
    -p, --prompt <file|text>      Path to prompt file or direct text (default: .ralph/prompt.md)
    -m, --model <model>           Model to use (e.g. 'sonnet' or 'opus')
    --verbosity <level>           Display verbosity: minimal, normal, verbose, debug
    --color-scheme <scheme>       Color scheme: default, minimal, dark, light, high-contrast, none
    --filter-events <preset>      Filter events using preset: text-only, no-system, errors-only, tools, messages, debug, all
    --include-events <types>      Only show specific event types (comma-separated)
    --exclude-events <types>      Hide specific event types (comma-separated)
    
    Performance Options:
    --max-display-lines <num>     Maximum lines to display at once (default: 1000)
    --max-events <num>            Maximum events to keep in memory (default: 5000)
    --buffer-size <num>           Text buffer size for coalescing (default: 100)
    --throttle-ms <num>           Update throttle in milliseconds (default: 16)
    --no-progressive              Disable progressive rendering
    --no-virtual-scrolling        Disable virtual scrolling
    --show-memory-stats           Show memory usage statistics
    --auto-truncate               Enable automatic text truncation for performance
    
    -v, --version                 Output the version number
    -h, --help                    Display help for command

  Examples:
    ralph init                    Create project structure
    ralph run                     Run with default prompt (.ralph/prompt.md)
    ralph run -p custom.md        Run with custom prompt file
    ralph run -p "Fix all tests"  Run with direct text prompt
    ralph run -m opus             Run with specific model
    ralph run --color-scheme dark Run with dark color theme
    ralph run --filter-events text-only  Show only text content
    ralph run --exclude-events ping,system  Hide ping and system events
    ralph run --include-events error,tool_use  Show only errors and tool use events
`);
	process.exit(command ? 0 : 1);
}

// Handle init command
if (command === 'init') {
	const createDirIfNotExists = (dirPath: string) => {
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, {recursive: true});
			console.log(`✓ Created ${dirPath}`);
		} else {
			console.log(`• ${dirPath} already exists`);
		}
	};

	const createFileIfNotExists = (filePath: string, content = '') => {
		if (!fs.existsSync(filePath)) {
			fs.writeFileSync(filePath, content);
			console.log(`✓ Created ${filePath}`);
		} else {
			console.log(`• ${filePath} already exists`);
		}
	};

	console.log('\nInitializing ralph...\n');

	// Create directories
	createDirIfNotExists('.ralph');
	createDirIfNotExists('specs');
	createDirIfNotExists('specs/active');
	createDirIfNotExists('specs/backlog');
	createDirIfNotExists('specs/done');

	// Create files with default content
	const defaultSettings = {
		run: {
			interval_ms: 1000,
			auto_stop_after_errors: 5,
		},
		claude: {
			flags: [
				'--dangerously-skip-permissions',
				'--verbose',
				'--output-format',
				'stream-json',
			],
		},
		display: {
			verbosity: 'normal',
			color_scheme: 'default',
		},
		events: {
			filter: {
				preset: 'all',
			},
		},
	};

	const defaultPrompt = `# Default Prompt

Replace this with your continuous prompt.
`;

	createFileIfNotExists(
		'.ralph/settings.json',
		JSON.stringify(defaultSettings, null, 2),
	);
	createFileIfNotExists('.ralph/plan.md');
	createFileIfNotExists('.ralph/prompt.md', defaultPrompt);

	console.log('\n✨ Ralph initialized successfully!\n');
	console.log('Next steps:');
	console.log('  1. Edit .ralph/prompt.md with your prompt');
	console.log('  2. Run: ralph run\n');
	process.exit(0);
}

// Handle run command
if (command === 'run') {
	// Parse flags
	let promptPath = '.ralph/prompt.md';
	let promptText: string | undefined;
	let model: string | undefined;
	let verbosity: 'minimal' | 'normal' | 'verbose' | 'debug' | undefined;
	let colorScheme: string | undefined;
	let filterPreset: EventFilterPreset | undefined;
	let includeEvents: string[] | undefined;
	let excludeEvents: string[] | undefined;

	// Performance configuration
	let maxDisplayLines: number | undefined;
	let maxEvents: number | undefined;
	let bufferSize: number | undefined;
	let throttleMs: number | undefined;
	let progressiveRender: boolean | undefined;
	let virtualScrolling: boolean | undefined;
	let showMemoryStats = false;
	let autoTruncate: boolean | undefined;

	for (let i = 1; i < args.length; i++) {
		if ((args[i] === '-p' || args[i] === '--prompt') && args[i + 1]) {
			const promptArg = args[i + 1]!;
			// Check if it's a file path that exists
			if (fs.existsSync(promptArg)) {
				promptPath = promptArg;
			} else {
				// Treat it as direct text
				promptText = promptArg;
			}
			i++;
		} else if ((args[i] === '-m' || args[i] === '--model') && args[i + 1]) {
			model = args[i + 1]!;
			i++;
		} else if (args[i] === '--verbosity' && args[i + 1]) {
			const level = args[i + 1]!;
			if (['minimal', 'normal', 'verbose', 'debug'].includes(level)) {
				verbosity = level as 'minimal' | 'normal' | 'verbose' | 'debug';
			} else {
				console.error(
					`Error: Invalid verbosity level "${level}". Must be one of: minimal, normal, verbose, debug`,
				);
				process.exit(1);
			}
			i++;
		} else if (args[i] === '--color-scheme' && args[i + 1]) {
			const scheme = args[i + 1]!;
			const availableSchemes = Object.keys(colorSchemes);
			if (availableSchemes.includes(scheme)) {
				colorScheme = scheme;
			} else {
				console.error(
					`Error: Invalid color scheme "${scheme}". Must be one of: ${availableSchemes.join(
						', ',
					)}`,
				);
				process.exit(1);
			}
			i++;
		} else if (args[i] === '--filter-events' && args[i + 1]) {
			const preset = args[i + 1]! as EventFilterPreset;
			if (getAllPresets().includes(preset)) {
				filterPreset = preset;
			} else {
				console.error(
					`Error: Invalid filter preset "${preset}". Must be one of: ${getAllPresets().join(
						', ',
					)}`,
				);
				process.exit(1);
			}
			i++;
		} else if (args[i] === '--include-events' && args[i + 1]) {
			includeEvents = args[i + 1]!.split(',').map(s => s.trim());
			i++;
		} else if (args[i] === '--exclude-events' && args[i + 1]) {
			excludeEvents = args[i + 1]!.split(',').map(s => s.trim());
			i++;
		} else if (args[i] === '--max-display-lines' && args[i + 1]) {
			const value = parseInt(args[i + 1]!, 10);
			if (isNaN(value) || value < 0) {
				console.error(
					`Error: Invalid max-display-lines "${
						args[i + 1]
					}". Must be a positive number.`,
				);
				process.exit(1);
			}
			maxDisplayLines = value;
			i++;
		} else if (args[i] === '--max-events' && args[i + 1]) {
			const value = parseInt(args[i + 1]!, 10);
			if (isNaN(value) || value < 0) {
				console.error(
					`Error: Invalid max-events "${
						args[i + 1]
					}". Must be a positive number.`,
				);
				process.exit(1);
			}
			maxEvents = value;
			i++;
		} else if (args[i] === '--buffer-size' && args[i + 1]) {
			const value = parseInt(args[i + 1]!, 10);
			if (isNaN(value) || value < 0) {
				console.error(
					`Error: Invalid buffer-size "${
						args[i + 1]
					}". Must be a positive number.`,
				);
				process.exit(1);
			}
			bufferSize = value;
			i++;
		} else if (args[i] === '--throttle-ms' && args[i + 1]) {
			const value = parseInt(args[i + 1]!, 10);
			if (isNaN(value) || value < 0) {
				console.error(
					`Error: Invalid throttle-ms "${
						args[i + 1]
					}". Must be a positive number.`,
				);
				process.exit(1);
			}
			throttleMs = value;
			i++;
		} else if (args[i] === '--no-progressive') {
			progressiveRender = false;
		} else if (args[i] === '--no-virtual-scrolling') {
			virtualScrolling = false;
		} else if (args[i] === '--show-memory-stats') {
			showMemoryStats = true;
		} else if (args[i] === '--auto-truncate') {
			autoTruncate = true;
		}
	}

	// Check if we have a prompt (either text or file)
	if (!promptText && !fs.existsSync(promptPath)) {
		console.error(`Error: Prompt file not found: ${promptPath}`);
		if (promptPath === '.ralph/prompt.md') {
			console.error(
				'\nTip: Run "ralph init" first to create the default structure.',
			);
		}
		process.exit(1);
	}

	// Load settings
	let settings: any = {};
	const settingsPath = '.ralph/settings.json';
	if (fs.existsSync(settingsPath)) {
		try {
			const content = fs.readFileSync(settingsPath, 'utf-8');
			settings = JSON.parse(content);
		} catch (error) {
			console.error('Failed to parse settings.json:', error);
		}
	}

	// Build claude args
	const claudeArgs = ['-p'];
	if (model) {
		claudeArgs.push('--model', model);
	}

	// Add system prompt if .ralph/system.md exists
	const systemPromptPath = '.ralph/system.md';
	if (fs.existsSync(systemPromptPath)) {
		claudeArgs.push('--append-system-prompt', systemPromptPath);
		if (verbosity === 'debug' || verbosity === 'verbose') {
			console.log(`✓ Using system prompt from ${systemPromptPath}`);
		}
	}

	// Add flags from settings
	const flags = settings.claude?.flags ?? [
		'--dangerously-skip-permissions',
		'--verbose',
		'--output-format',
		'stream-json',
	];
	claudeArgs.push(...flags);

	const intervalMs = settings.run?.interval_ms ?? 1000;
	const autoStopAfterErrors = settings.run?.auto_stop_after_errors ?? 5;
	const settingsVerbosity = settings.display?.verbosity || 'normal';
	const finalVerbosity = verbosity ?? settingsVerbosity;

	// Set up color scheme
	const settingsColorScheme = settings.display?.color_scheme || 'default';
	const finalColorScheme = colorScheme ?? settingsColorScheme;
	setGlobalColorScheme(finalColorScheme);

	// Build event filter config
	const eventFilterConfig: EventFilterConfig = {
		preset:
			filterPreset || (settings.events?.filter?.preset as EventFilterPreset),
		include: includeEvents || settings.events?.filter?.include,
		exclude: excludeEvents || settings.events?.filter?.exclude,
	};

	// Validate event filter config
	const filterErrors = validateEventFilterConfig(eventFilterConfig);
	if (filterErrors.length > 0) {
		console.error('Event filter configuration errors:');
		filterErrors.forEach(error => console.error(`  - ${error}`));
		process.exit(1);
	}

	// Build performance configuration
	const performanceConfig = {
		...(maxDisplayLines !== undefined && {max_display_lines: maxDisplayLines}),
		...(maxEvents !== undefined && {max_events_in_memory: maxEvents}),
		...(bufferSize !== undefined && {text_buffer_size: bufferSize}),
		...(throttleMs !== undefined && {update_throttle_ms: throttleMs}),
		...(progressiveRender !== undefined && {
			progressive_render: progressiveRender,
		}),
		...(virtualScrolling !== undefined && {
			enable_virtual_scrolling: virtualScrolling,
		}),
		...(autoTruncate !== undefined && {auto_truncate: autoTruncate}),
	};

	// Render the Ink app
	render(
		<RalphLoop
			promptPath={promptText ? undefined : promptPath}
			promptText={promptText}
			claudeArgs={claudeArgs}
			intervalMs={intervalMs}
			autoStopAfterErrors={autoStopAfterErrors}
			verbosity={finalVerbosity}
			eventFilter={eventFilterConfig}
			performanceConfig={performanceConfig}
			showMemoryStats={showMemoryStats}
		/>,
	);
} else {
	console.error(`Error: Unknown command "${command}"\n`);
	process.exit(1);
}
