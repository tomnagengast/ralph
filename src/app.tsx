import React, {useEffect, useState} from 'react';
import {Text, Box, useInput, useApp} from 'ink';
import fs from 'fs';
import {RunEngine} from './run.js';
import {OutputProcessor} from './output.js';
import {RunDisplay} from './components/RunDisplay.js';
import {loadRunConfig} from './utils/config.js';
import type {RunStatus, RunConfig} from './types/run.js';

type Props = {
	prompt: string;
	debug?: string;
	verbose?: boolean;
	outputFormat?: string;
	continue?: boolean;
	resume?: string;
	model?: string;
	settings?: string;
	addDir?: string[];
	sessionId?: string;
	run?: boolean;
};

export default function App(props: Props) {
	const {
		prompt,
		debug,
		verbose,
		outputFormat,
		continue: continueConversation,
		resume,
		model,
		// settings, // Will be used in future for loading settings
		addDir,
		sessionId,
		run,
	} = props;
	const {exit} = useApp();
	const [, setPromptContent] = useState<string>('');
	const [status, setStatus] = useState<string>('Initializing...');
	const [runEngine, setRunEngine] = useState<RunEngine | null>(null);
	const [runStatus, setRunStatus] = useState<RunStatus | null>(null);
	const [outputProcessor] = useState(new OutputProcessor());
	const [outputLines, setOutputLines] = useState<string[]>([]);

	// Handle keyboard input
	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			if (runEngine) {
				runEngine.stop();
				setTimeout(() => exit(), 1000);
			} else {
				exit();
			}
		}
		
		if (input === 'p' || input === 'P') {
			if (runEngine && runStatus) {
				if (runStatus.state === 'paused') {
					runEngine.resume();
				} else if (runStatus.state === 'running') {
					runEngine.pause();
				}
			}
		}
	});

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

	// Initialize run mode
	useEffect(() => {
		if (run) {
			const config: RunConfig = loadRunConfig({
				promptPath: prompt && fs.existsSync(prompt) ? prompt : undefined,
				promptText: prompt && !fs.existsSync(prompt) ? prompt : undefined,
				model,
				outputFormat: outputFormat as 'formatted' | 'raw' | 'minimal' | undefined,
			});

			const engine = new RunEngine(config);
			
			engine.on('statusUpdate', (status: RunStatus) => {
				setRunStatus(status);
			});
			
			engine.on('output', (data: string) => {
				const outputs = outputProcessor.processStreamJson(data);
				for (const output of outputs) {
					const formatted = outputProcessor.formatOutput(output);
					if (formatted) {
						outputProcessor.addFormattedLine(formatted);
						setOutputLines(outputProcessor.getOutputLines(config.maxOutputLines));
					}
				}
			});
			
			engine.on('error', (error: string) => {
				outputProcessor.addFormattedLine(`❌ ${error}`);
				setOutputLines(outputProcessor.getOutputLines(config.maxOutputLines));
			});
			
			setRunEngine(engine);
			
			// Start the run engine
			engine.start().catch(error => {
				console.error('Failed to start run engine:', error);
			});
			
			return () => {
				engine.stop();
			};
		}
		return undefined;
	}, [run, prompt, model, outputFormat]);

	// Render run mode UI if in run mode
	if (run && runStatus) {
		return (
			<RunDisplay
				status={runStatus}
				outputLines={outputLines}
				onStop={() => runEngine?.stop()}
				onPause={() => runEngine?.pause()}
				onResume={() => runEngine?.resume()}
			/>
		);
	}

	// Regular UI for non-run mode
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
						<Text bold>Debug:</Text>{' '}
						{typeof debug === 'boolean' ? 'enabled' : debug}
					</Text>
				)}
				{verbose && (
					<Text>
						<Text bold>Verbose:</Text> enabled
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
