import React, {useState, useEffect} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {spawn} from 'child_process';
import fs from 'fs';

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
	const [responseContent, setResponseContent] = useState('');
	const [consecutiveErrors, setConsecutiveErrors] = useState(0);
	const [lastError, setLastError] = useState('');

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
			setResponseContent('');
			
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
			let response = '';
			claude.stdout.on('data', (data) => {
				response += data.toString();
				setResponseContent(response);
			});
			
			claude.stderr.on('data', (data) => {
				const error = data.toString();
				setLastError(error);
				setResponseContent(prev => prev + '\n' + error);
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
				<Text bold color="blue">🤖 CLAUDE RESPONSE:</Text>
				<Box borderStyle="single" borderColor="blue" paddingX={1} minHeight={10}>
					<Text>
						{currentPhase === 'response' ? responseContent || 'Waiting for response...' : 
						 currentPhase === 'waiting' ? `${responseContent}\n\n⏱️  Waiting ${intervalMs}ms before next iteration...` :
						 'Preparing...'}
					</Text>
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