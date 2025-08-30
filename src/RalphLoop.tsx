import React, {useState, useEffect} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {spawn} from 'child_process';
import fs from 'fs';
import {ClaudeStreamEvent} from './types/claude-events.js';
import {
	formatClaudeEvent,
	groupTextDeltas,
	formatGroupedTextDeltas,
} from './utils/claude-formatter.js';
import {EventFilterConfig, filterEvents} from './utils/event-filter.js';
import {getColorManager} from './utils/color-schemes.js';

// Using the comprehensive ClaudeStreamEvent interface from types/claude-events.ts

interface Props {
	promptPath: string;
	claudeArgs: string[];
	intervalMs: number;
	autoStopAfterErrors: number;
	verbosity: 'minimal' | 'normal' | 'verbose' | 'debug';
	eventFilter?: EventFilterConfig;
}

export default function RalphLoop({
	promptPath,
	claudeArgs,
	intervalMs,
	autoStopAfterErrors,
	verbosity,
	eventFilter,
}: Props) {
	const {exit} = useApp();
	const [iterationCount, setIterationCount] = useState(0);
	const [currentPhase, setCurrentPhase] = useState<
		'prompt' | 'response' | 'waiting'
	>('prompt');
	const [promptContent, setPromptContent] = useState('');
	const [responseEvents, setResponseEvents] = useState<ClaudeStreamEvent[]>([]);
	const [rawResponse, setRawResponse] = useState('');
	const [consecutiveErrors, setConsecutiveErrors] = useState(0);
	const [lastError, setLastError] = useState('');
	const [isJsonMode, setIsJsonMode] = useState(false);

	// Handle Ctrl+C
	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			exit();
		}
	});

	useEffect(() => {
		const runIteration = async () => {
			// Read prompt
			const prompt = fs.readFileSync(promptPath, 'utf-8');
			setPromptContent(prompt);
			setCurrentPhase('prompt');
			setIterationCount(prev => prev + 1);
			setResponseEvents([]);
			setRawResponse('');

			// Check if we're in JSON mode
			const jsonMode = claudeArgs.includes('stream-json');
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

			// Collect response
			let buffer = '';
			let events: ClaudeStreamEvent[] = [];

			claude.stdout.on('data', data => {
				const chunk = data.toString();

				if (jsonMode) {
					buffer += chunk;
					const lines = buffer.split('\n');
					buffer = lines.pop() || '';

					for (const line of lines) {
						if (line.trim()) {
							try {
								const event = JSON.parse(line) as ClaudeStreamEvent;
								events.push(event);
								// Update display with all events (filtering happens in formatResponse)
								setResponseEvents([...events]);
							} catch {
								// Not JSON, treat as raw
								setRawResponse(prev => prev + line + '\n');
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

	// Format response for display
	const formatResponse = () => {
		if (isJsonMode && responseEvents.length > 0) {
			// Filter events based on configuration
			const filteredEvents = filterEvents(responseEvents, eventFilter);
			// Group consecutive text deltas for better readability
			const groupedEvents = groupTextDeltas(filteredEvents);

			return (
				<Box flexDirection="column">
					{groupedEvents.map((item, i) => {
						if (Array.isArray(item)) {
							// Render grouped text deltas as a single block
							const combinedText = formatGroupedTextDeltas(item);
							return (
								<Text key={i} color={getColorManager().promptSection()} wrap="wrap">
									{combinedText}
								</Text>
							);
						} else {
							return formatClaudeEvent(item, i, verbosity);
						}
					})}
				</Box>
			);
		}
		return <Text>{rawResponse || 'Waiting for response...'}</Text>;
	};

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color={getColorManager().primary()}>
					Ralph Loop Running
				</Text>
				<Text dimColor> (Press Ctrl+C to stop)</Text>
			</Box>

			<Box marginBottom={1}>
				<Text bold color={getColorManager().iterationInfo()}>
					🔄 Iteration #{iterationCount} - {timestamp}
				</Text>
				{consecutiveErrors > 0 && (
					<Text color={getColorManager().timing()}> ⚠️ {consecutiveErrors} consecutive errors</Text>
				)}
			</Box>

			<Box flexDirection="column" marginBottom={1}>
				<Text bold color={getColorManager().promptSection()}>
					📝 PROMPT:
				</Text>
				<Box borderStyle="single" borderColor={getColorManager().promptSection()} paddingX={1}>
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
					<Text color={getColorManager().error()}>❌ Last Error: {lastError}</Text>
				</Box>
			)}
		</Box>
	);
}
