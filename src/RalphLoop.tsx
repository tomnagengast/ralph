import React, {useState, useEffect} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {spawn} from 'child_process';
import fs from 'fs';

interface StreamJsonEvent {
	type: string;
	// Message events
	message?: {
		id?: string;
		type?: string;
		role?: string;
		model?: string;
		content?: any[];
		stop_reason?: string | null;
		stop_sequence?: string | null;
		usage?: {
			input_tokens?: number;
			output_tokens?: number;
			cache_creation_input_tokens?: number;
			cache_read_input_tokens?: number;
		};
	};
	// Content block events
	index?: number;
	content_block?: {
		type?: string;
		id?: string;
		name?: string;
		input?: any;
		text?: string;
	};
	// Delta events
	delta?: {
		type?: string;
		text?: string;
		partial_json?: string;
		stop_reason?: string;
		stop_sequence?: string | null;
		usage?: {
			output_tokens?: number;
		};
		signature?: string;
	};
	// Error events
	error?: {
		type?: string;
		message?: string;
	};
	// Legacy/simple fields
	content?: string;
	text?: string;
	tool_name?: string;
	tool_input?: any;
	tool_result?: any;
	[key: string]: any;
}

interface Props {
	promptPath: string;
	claudeArgs: string[];
	intervalMs: number;
	autoStopAfterErrors: number;
}

export default function RalphLoop({
	promptPath,
	claudeArgs,
	intervalMs,
	autoStopAfterErrors,
}: Props) {
	const {exit} = useApp();
	const [iterationCount, setIterationCount] = useState(0);
	const [currentPhase, setCurrentPhase] = useState<
		'prompt' | 'response' | 'waiting'
	>('prompt');
	const [promptContent, setPromptContent] = useState('');
	const [responseEvents, setResponseEvents] = useState<StreamJsonEvent[]>([]);
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
			let events: StreamJsonEvent[] = [];

			claude.stdout.on('data', data => {
				const chunk = data.toString();

				if (jsonMode) {
					buffer += chunk;
					const lines = buffer.split('\n');
					buffer = lines.pop() || '';

					for (const line of lines) {
						if (line.trim()) {
							try {
								const event = JSON.parse(line) as StreamJsonEvent;
								events.push(event);
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

	// Format a single event for display
	const formatEvent = (event: StreamJsonEvent, index: number) => {
		switch (event.type) {
			case 'message_start':
				return (
					<Box key={index} flexDirection="column" marginBottom={1}>
						<Text bold color="magenta">
							📬 Message Start
						</Text>
						{event.message && (
							<Box paddingLeft={2} flexDirection="column">
								<Text dimColor>Model: {event.message.model}</Text>
								{event.message.usage && (
									<Text dimColor>
										Input tokens: {event.message.usage.input_tokens}
									</Text>
								)}
							</Box>
						)}
					</Box>
				);

			case 'content_block_start':
				return (
					<Box key={index} marginBottom={0.5}>
						<Text color="cyan">
							▶ Content Block{' '}
							{event.index !== undefined ? `#${event.index}` : ''}
						</Text>
						{event.content_block?.type === 'tool_use' && (
							<Text color="yellow"> 🔧 Tool: {event.content_block.name}</Text>
						)}
						{event.content_block?.type === 'thinking' && (
							<Text color="blue"> 🤔 Thinking...</Text>
						)}
					</Box>
				);

			case 'content_block_delta':
				if (event.delta?.type === 'text_delta' && event.delta.text) {
					return (
						<Text key={index} color="green">
							{event.delta.text}
						</Text>
					);
				} else if (
					event.delta?.type === 'input_json_delta' &&
					event.delta.partial_json
				) {
					return (
						<Text key={index} color="yellow">
							{event.delta.partial_json}
						</Text>
					);
				} else if (event.delta?.type === 'thinking_delta' && event.delta.text) {
					return (
						<Text key={index} color="blue" dimColor>
							{event.delta.text}
						</Text>
					);
				} else if (event.delta?.signature) {
					return (
						<Box key={index} marginTop={0.5}>
							<Text dimColor>
								✓ Signature: {event.delta.signature.substring(0, 16)}...
							</Text>
						</Box>
					);
				}
				return null;

			case 'content_block_stop':
				return (
					<Box key={index} marginBottom={1}>
						<Text dimColor>■ Block End</Text>
					</Box>
				);

			case 'message_delta':
				if (event.delta?.stop_reason) {
					return (
						<Box key={index} flexDirection="column" marginTop={1}>
							<Text color="magenta">📊 Message Update</Text>
							<Box paddingLeft={2}>
								<Text>Stop reason: {event.delta.stop_reason}</Text>
								{event.delta.usage?.output_tokens && (
									<Text dimColor>
										Total output tokens: {event.delta.usage.output_tokens}
									</Text>
								)}
							</Box>
						</Box>
					);
				}
				return null;

			case 'message_stop':
				return (
					<Box key={index} marginTop={1}>
						<Text bold color="green">
							✅ Message Complete
						</Text>
					</Box>
				);

			case 'ping':
				return (
					<Text key={index} dimColor>
						• ping
					</Text>
				);

			case 'error':
			case 'overloaded_error':
				return (
					<Box key={index} flexDirection="column" marginY={1}>
						<Text bold color="red">
							❌ Error
						</Text>
						<Box paddingLeft={2}>
							<Text color="red">
								{typeof event.error === 'string'
									? event.error
									: event.error?.message || 'Unknown error occurred'}
							</Text>
						</Box>
					</Box>
				);

			// Legacy/fallback formatting
			case 'text':
			case 'content':
				return (
					<Text key={index} color="green">
						{event.text || event.content || ''}
					</Text>
				);

			case 'tool_use':
				return (
					<Box key={index} flexDirection="column" marginY={0.5}>
						<Text color="yellow">🔧 Tool Use: {event.tool_name}</Text>
						{event.tool_input && (
							<Box paddingLeft={2}>
								<Text dimColor>
									{JSON.stringify(event.tool_input, null, 2)}
								</Text>
							</Box>
						)}
					</Box>
				);

			case 'tool_result':
				return (
					<Box key={index} flexDirection="column" marginY={0.5}>
						<Text color="cyan">📋 Tool Result</Text>
						<Box paddingLeft={2}>
							<Text>{JSON.stringify(event.tool_result, null, 2)}</Text>
						</Box>
					</Box>
				);

			default:
				// For unknown event types, show raw JSON in dimmed text
				return (
					<Box key={index} marginY={0.5}>
						<Text dimColor>{JSON.stringify(event, null, 2)}</Text>
					</Box>
				);
		}
	};

	// Format response for display
	const formatResponse = () => {
		if (isJsonMode && responseEvents.length > 0) {
			// Group consecutive text deltas for better readability
			const groupedEvents: (StreamJsonEvent | StreamJsonEvent[])[] = [];
			let currentTextGroup: StreamJsonEvent[] = [];

			responseEvents.forEach(event => {
				if (
					event.type === 'content_block_delta' &&
					event.delta?.type === 'text_delta'
				) {
					currentTextGroup.push(event);
				} else {
					if (currentTextGroup.length > 0) {
						groupedEvents.push(currentTextGroup);
						currentTextGroup = [];
					}
					groupedEvents.push(event);
				}
			});

			if (currentTextGroup.length > 0) {
				groupedEvents.push(currentTextGroup);
			}

			return (
				<Box flexDirection="column">
					{groupedEvents.map((item, i) => {
						if (Array.isArray(item)) {
							// Render grouped text deltas as a single block
							const combinedText = item.map(e => e.delta?.text || '').join('');
							return (
								<Text key={i} color="green" wrap="wrap">
									{combinedText}
								</Text>
							);
						} else {
							return formatEvent(item, i);
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
				<Text bold color="cyan">
					Ralph Loop Running
				</Text>
				<Text dimColor> (Press Ctrl+C to stop)</Text>
			</Box>

			<Box marginBottom={1}>
				<Text bold color="magenta">
					🔄 Iteration #{iterationCount} - {timestamp}
				</Text>
				{consecutiveErrors > 0 && (
					<Text color="yellow"> ⚠️ {consecutiveErrors} consecutive errors</Text>
				)}
			</Box>

			<Box flexDirection="column" marginBottom={1}>
				<Text bold color="green">
					📝 PROMPT:
				</Text>
				<Box borderStyle="single" borderColor="green" paddingX={1}>
					<Text>{promptContent || 'Loading...'}</Text>
				</Box>
			</Box>

			<Box flexDirection="column">
				<Text bold color="blue">
					🤖 CLAUDE RESPONSE:{' '}
					{isJsonMode && <Text dimColor>(JSON Stream Mode)</Text>}
				</Text>
				<Box
					borderStyle="single"
					borderColor="blue"
					paddingX={1}
					minHeight={10}
					flexDirection="column"
				>
					{currentPhase === 'response' ? (
						formatResponse()
					) : currentPhase === 'waiting' ? (
						<>
							{formatResponse()}
							<Text color="yellow">
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
					<Text color="red">❌ Last Error: {lastError}</Text>
				</Box>
			)}
		</Box>
	);
}
