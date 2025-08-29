import React, {useEffect, useState} from 'react';
import {Text, Box} from 'ink';
import fs from 'fs';

type Props = {
	prompt: string;
	isInteractive: boolean;
	debug?: string;
	verbose?: boolean;
	print?: boolean;
	outputFormat?: string;
	continue?: boolean;
	resume?: string;
	model?: string;
	settings?: string;
	addDir?: string[];
	sessionId?: string;
};

export default function App(props: Props) {
	const {
		prompt,
		// isInteractive, // Will be used in future for interactive mode
		debug,
		verbose,
		print,
		outputFormat,
		continue: continueConversation,
		resume,
		model,
		// settings, // Will be used in future for loading settings
		addDir,
		sessionId,
	} = props;
	const [, setPromptContent] = useState<string>('');
	const [status, setStatus] = useState<string>('Initializing...');

	useEffect(() => {
		const loadPrompt = async () => {
			try {
				// Check if prompt is provided
				if (prompt) {
					// Check if prompt is a file path or direct text
					if (fs.existsSync(prompt)) {
						const content = fs.readFileSync(prompt, 'utf-8');
						setPromptContent(content);
						setStatus(`Loaded prompt from ${prompt}`);
					} else {
						// Treat as direct text input
						setPromptContent(prompt);
						setStatus('Using provided prompt text');
					}
				} else if (continueConversation) {
					setStatus('Continuing most recent conversation');
				} else if (resume) {
					setStatus(`Resuming conversation: ${resume}`);
				} else {
					setStatus('Starting interactive session');
				}
			} catch (error) {
				setStatus(`Error: ${error}`);
			}
		};

		loadPrompt();
	}, [prompt]);

	return (
		<Box flexDirection="column">
			<Text color="green" bold>
				Ralph - Implementation Assistant
			</Text>
			<Text>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
			<Box flexDirection="column" marginTop={1}>
				{prompt && (
					<Text>
						<Text bold>Prompt:</Text> {prompt}
					</Text>
				)}
				{model && (
					<Text>
						<Text bold>Model:</Text> {model}
					</Text>
				)}
				{sessionId && (
					<Text>
						<Text bold>Session ID:</Text> {sessionId}
					</Text>
				)}
				{debug && (
					<Text>
						<Text bold>Debug:</Text> {typeof debug === 'boolean' ? 'enabled' : debug}
					</Text>
				)}
				{verbose && (
					<Text>
						<Text bold>Verbose:</Text> enabled
					</Text>
				)}
				{print && (
					<Text>
						<Text bold>Mode:</Text> Non-interactive ({outputFormat || 'text'})
					</Text>
				)}
				{addDir && addDir.length > 0 && (
					<Text>
						<Text bold>Additional Directories:</Text> {addDir.join(', ')}
					</Text>
				)}
			</Box>
			<Box marginTop={1}>
				<Text color="yellow">{status}</Text>
			</Box>
		</Box>
	);
}
