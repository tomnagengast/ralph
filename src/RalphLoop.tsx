import React, {useState, useEffect} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {spawn} from 'child_process';
import fs from 'fs';

interface StreamJsonEvent {
	type: string;
	content?: string;
	text?: string;
	tool_name?: string;
	tool_input?: any;
	tool_result?: any;
	error?: string;
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
	const [currentPhase, setCurrentPhase] = useState<'prompt' | 'response' | 'waiting'>('prompt');
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
			
			claude.stdout.on('data', (data) => {
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
			
			claude.stderr.on('data', (data) => {
				const error = data.toString();
				setLastError(error);
				setRawResponse(prev => prev + '\n' + error);
			});
			
			// Wait for completion
			await new Promise<void>((resolve) => {
				claude.on('close', (code) => {
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

	// Format response for display
	const formatResponse = () => {
		if (isJsonMode && responseEvents.length > 0) {
			return responseEvents.map((event, i) => {
				const formatted = JSON.stringify(event, null, 2);
				
				// Add color based on event type
				let color = 'white';
				if (event.type === 'text' || event.type === 'content') color = 'green';
				else if (event.type === 'tool_use') color = 'yellow';
				else if (event.type === 'tool_result') color = 'cyan';
				else if (event.type === 'error') color = 'red';
				
				return (
					<Box key={i} flexDirection="column" marginBottom={1}>
						<Text color={color}>
							{formatted}
						</Text>
					</Box>
				);
			});
		}
		return <Text>{rawResponse || 'Waiting for response...'}</Text>;
	};

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="cyan">Ralph Loop Running</Text>
				<Text dimColor> (Press Ctrl+C to stop)</Text>
			</Box>
			
			<Box marginBottom={1}>
				<Text bold color="magenta">
					🔄 Iteration #{iterationCount} - {timestamp}
				</Text>
				{consecutiveErrors > 0 && (
					<Text color="yellow"> ⚠️  {consecutiveErrors} consecutive errors</Text>
				)}
			</Box>
			
			<Box flexDirection="column" marginBottom={1}>
				<Text bold color="green">📝 PROMPT:</Text>
				<Box borderStyle="single" borderColor="green" paddingX={1}>
					<Text>{promptContent || 'Loading...'}</Text>
				</Box>
			</Box>
			
			<Box flexDirection="column">
				<Text bold color="blue">
					🤖 CLAUDE RESPONSE: {isJsonMode && <Text dimColor>(JSON Stream Mode)</Text>}
				</Text>
				<Box borderStyle="single" borderColor="blue" paddingX={1} minHeight={10}>
					{currentPhase === 'response' ? formatResponse() : 
					 currentPhase === 'waiting' ? (
						<Box flexDirection="column">
							{formatResponse()}
							<Text color="yellow">{'\n'}⏱️  Waiting {intervalMs}ms before next iteration...</Text>
						</Box>
					) : <Text>Preparing...</Text>}
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