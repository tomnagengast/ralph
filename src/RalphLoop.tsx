import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {spawn} from 'child_process';
import fs from 'fs';
import {ClaudeStreamEvent} from './types/claude-events.js';
import {EventFilterConfig} from './utils/event-filter.js';
import {getColorManager} from './utils/color-schemes.js';
import {createStreamBuffer} from './utils/stream-buffer.js';
import {
	PerformanceConfig,
	loadPerformanceConfig,
} from './utils/performance-config.js';
import {VirtualRenderer} from './utils/virtual-renderer.js';
import {
	clearFormattingCaches,
	getCacheStats,
} from './utils/memoized-formatter.js';

// Using the comprehensive ClaudeStreamEvent interface from types/claude-events.ts

interface Props {
	promptPath?: string;
	promptText?: string;
	claudeArgs: string[];
	intervalMs: number;
	autoStopAfterErrors: number;
	verbosity: 'minimal' | 'normal' | 'verbose' | 'debug';
	eventFilter?: EventFilterConfig;
	performanceConfig?: Partial<PerformanceConfig>;
	showMemoryStats?: boolean;
}

export default function RalphLoop({
	promptPath,
	promptText,
	claudeArgs,
	intervalMs,
	autoStopAfterErrors,
	verbosity,
	eventFilter,
	performanceConfig = {},
	showMemoryStats = false,
}: Props) {
	const {exit} = useApp();
	const [iterationCount, setIterationCount] = useState(0);
	const [currentPhase, setCurrentPhase] = useState<
		'prompt' | 'response' | 'waiting'
	>('prompt');
	const [promptContent, setPromptContent] = useState('');
	const [rawResponse, setRawResponse] = useState('');
	const [consecutiveErrors, setConsecutiveErrors] = useState(0);
	const [lastError, setLastError] = useState('');
	const [isJsonMode, setIsJsonMode] = useState(false);
	const [forceUpdate, setForceUpdate] = useState(0);

	// Load performance configuration
	const config = useMemo(
		() => loadPerformanceConfig(performanceConfig),
		[performanceConfig],
	);

	// Create stream buffer with update callback
	const streamBuffer = useMemo(() => {
		return createStreamBuffer(config, () => {
			setForceUpdate(prev => prev + 1);
		});
	}, [config]);

	// Get events from stream buffer for rendering
	const events = useMemo(
		() => streamBuffer.getAllEvents(),
		[streamBuffer, forceUpdate],
	);

	// Remove unused virtual renderer hooks

	// Memory stats
	const memoryStats = useMemo(() => {
		return {
			buffer: streamBuffer.getMemoryStats(),
			cache: getCacheStats(),
		};
	}, [streamBuffer, forceUpdate]);

	// Handle Ctrl+C and other controls
	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			streamBuffer.dispose();
			clearFormattingCaches();
			exit();
		}
		// Additional performance controls
		if (key.ctrl && input === 'r') {
			// Ctrl+R: Clear caches and force refresh
			clearFormattingCaches();
			streamBuffer.clear();
			setForceUpdate(prev => prev + 1);
		}
		if (key.ctrl && input === 's') {
			// Ctrl+S: Show memory stats
			console.log('Memory Stats:', memoryStats);
		}
	});

	useEffect(() => {
		const runIteration = async () => {
			// Read prompt from file or use provided text
			const prompt = promptText || fs.readFileSync(promptPath!, 'utf-8');
			setPromptContent(prompt);
			setCurrentPhase('prompt');
			setIterationCount(prev => prev + 1);
			streamBuffer.clear();
			setRawResponse('');

			// Check if we're in JSON mode
			const jsonMode = claudeArgs.includes('--output-format') && 
				claudeArgs[claudeArgs.indexOf('--output-format') + 1] === 'stream-json';
			setIsJsonMode(jsonMode);

			// Small delay to show prompt
			await new Promise(resolve => setTimeout(resolve, 100));

			setCurrentPhase('response');

			// Run claude
			const claude = spawn('claude', claudeArgs, {
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			// Send prompt
			claude.stdin.write(prompt);
			claude.stdin.end();

			// Collect response using optimized stream buffer
			let buffer = '';

			claude.stdout.on('data', data => {
				const chunk = data.toString();

				if (jsonMode) {
					buffer += chunk;
					const lines = buffer.split('\n');
					buffer = lines.pop() || '';

					for (const line of lines) {
						if (line.trim()) {
							try {
								const parsed = JSON.parse(line);
								
								// Handle different event formats
								let event: ClaudeStreamEvent;
								
								// Check if it's already a properly formatted event
								if (parsed.type) {
									event = parsed as ClaudeStreamEvent;
								} 
								// Handle events that might be wrapped or have different structure
								else if (parsed.event) {
									event = parsed.event as ClaudeStreamEvent;
								}
								// Handle raw text or content
								else if (typeof parsed === 'string') {
									event = {
										type: 'text' as any,
										text: parsed
									} as ClaudeStreamEvent;
								}
								// Handle objects with content field
								else if (parsed.content) {
									event = {
										type: 'content' as any,
										content: parsed.content,
										...parsed
									} as ClaudeStreamEvent;
								}
								// Default case - treat as generic event
								else {
									event = {
										type: 'unknown' as any,
										...parsed
									} as ClaudeStreamEvent;
								}
								
								// Use stream buffer for optimized event handling
								streamBuffer.addEvent(event);
							} catch (error) {
								// If we can't parse it as JSON in JSON mode, treat as text
								if (line.trim() && !line.startsWith('data:')) {
									// Add as a text event so it still gets displayed
									const textEvent: ClaudeStreamEvent = {
										type: 'text' as any,
										text: line
									};
									streamBuffer.addEvent(textEvent);
								}
								
								if (verbosity === 'debug' && process.env['RALPH_DEBUG_JSON'] === 'true') {
									console.error('Failed to parse JSON event:', line, error);
								}
							}
						}
					}
				} else {
					setRawResponse(prev => prev + chunk);
				}
			});

			claude.stderr.on('data', data => {
				const error = data.toString();
				setLastError(error);
				setRawResponse(prev => prev + '\n' + error);
			});

			// Wait for completion
			await new Promise<void>(resolve => {
				claude.on('close', code => {
					if (code !== 0) {
						setConsecutiveErrors(prev => {
							const newCount = prev + 1;
							if (newCount >= autoStopAfterErrors) {
								setLastError(`Stopping after ${newCount} consecutive errors`);
								setTimeout(() => exit(), 2000);
							}
							return newCount;
						});
					} else {
						setConsecutiveErrors(0);
					}

					setCurrentPhase('waiting');

					// Wait before next iteration
					setTimeout(() => {
						resolve();
						runIteration();
					}, intervalMs);
				});
			});
		};

		runIteration();
	}, [promptPath, claudeArgs, intervalMs, autoStopAfterErrors, exit]);

	const timestamp = new Date().toLocaleTimeString();

	// Using the comprehensive formatClaudeEvent function from utils/claude-formatter.tsx

	// Optimized response formatter using virtual renderer
	const formatResponse = useCallback(() => {
		if (isJsonMode) {
			// Always use VirtualRenderer in JSON mode, even if no events yet
			return (
				<VirtualRenderer
					events={events}
					config={config}
					verbosity={verbosity}
					eventFilter={eventFilter}
					showMemoryStats={showMemoryStats}
				/>
			);
		}
		// Only show raw response in non-JSON mode
		return <Text>{rawResponse || 'Waiting for response...'}</Text>;
	}, [
		isJsonMode,
		events,
		config,
		verbosity,
		eventFilter,
		showMemoryStats,
		rawResponse,
	]);

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color={getColorManager().primary()}>
					Ralph Loop Running
				</Text>
				<Text dimColor> (Ctrl+C: stop, Ctrl+R: refresh, Ctrl+S: stats)</Text>
			</Box>

			{/* Performance stats display */}
			{showMemoryStats && (
				<Box marginBottom={1}>
					<Text dimColor>
						📊 Buffer: {memoryStats.buffer.eventCount} events (
						{memoryStats.buffer.estimatedMemoryKB}KB) | Cache:{' '}
						{memoryStats.cache.totalMemoryKB}KB | Config:{' '}
						{config.progressive_render ? 'Progressive' : 'Standard'} | Virtual:{' '}
						{config.enable_virtual_scrolling ? 'On' : 'Off'}
					</Text>
				</Box>
			)}

			<Box marginBottom={1}>
				<Text bold color={getColorManager().iterationInfo()}>
					🔄 Iteration #{iterationCount} - {timestamp}
				</Text>
				{consecutiveErrors > 0 && (
					<Text color={getColorManager().timing()}>
						{' '}
						⚠️ {consecutiveErrors} consecutive errors
					</Text>
				)}
			</Box>

			<Box flexDirection="column" marginBottom={1}>
				<Text bold color={getColorManager().promptSection()}>
					📝 PROMPT:
				</Text>
				<Box
					borderStyle="single"
					borderColor={getColorManager().promptSection()}
					paddingX={1}
				>
					<Text>{promptContent || 'Loading...'}</Text>
				</Box>
			</Box>

			<Box flexDirection="column">
				<Text bold color={getColorManager().responseSection()}>
					🤖 CLAUDE RESPONSE:{' '}
					{isJsonMode && <Text dimColor>(JSON Stream Mode)</Text>}
					{eventFilter &&
						(eventFilter.preset ||
							eventFilter.include ||
							eventFilter.exclude) && (
							<Text dimColor>
								{' '}
								(Filtered: {eventFilter.preset || 'custom'})
							</Text>
						)}
				</Text>
				<Box
					borderStyle="single"
					borderColor={getColorManager().responseSection()}
					paddingX={1}
					minHeight={10}
					flexDirection="column"
				>
					{currentPhase === 'response' ? (
						formatResponse()
					) : currentPhase === 'waiting' ? (
						<>
							{formatResponse()}
							<Text color={getColorManager().timing()}>
								{'\n'}⏱️ Waiting {intervalMs}ms before next iteration...
							</Text>
						</>
					) : (
						<Text>Preparing...</Text>
					)}
				</Box>
			</Box>

			{lastError && (
				<Box marginTop={1}>
					<Text color={getColorManager().error()}>
						❌ Last Error: {lastError}
					</Text>
				</Box>
			)}
		</Box>
	);
}
