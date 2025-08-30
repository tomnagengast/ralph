import React, {useEffect} from 'react';
import {useInput, useApp} from 'ink';
import {Text} from 'ink';
import fs from 'fs';
import {RunEngine} from './run.js';
import {loadRunConfig} from './utils/config.js';
import type {RunConfig} from './types/run.js';

type Props = {
	prompt: string;
	model?: string;
};

export default function App(props: Props) {
	const {prompt, model} = props;
	const {exit} = useApp();

	// Handle keyboard input - only Ctrl+C for exit
	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			exit();
		}
	});


	// Initialize run engine on mount
	useEffect(() => {
		const config: RunConfig = loadRunConfig({
			promptPath: prompt && fs.existsSync(prompt) ? prompt : undefined,
			promptText: prompt && !fs.existsSync(prompt) ? prompt : undefined,
			model,
		});

		const engine = new RunEngine(config);
		
		// Simply pass through stdout output
		engine.on('output', (data: string) => {
			process.stdout.write(data);
		});
		
		// Pass through stderr output
		engine.on('error', (error: string) => {
			process.stderr.write(error);
		});
		
		// Start the run engine
		engine.start().catch(error => {
			console.error('Failed to start run engine:', error);
			exit();
		});
		
		return () => {
			engine.stop();
		};
	}, [prompt, model, exit]);

	// Simple status message
	return <Text>Running ralph loop... (Press Ctrl+C to stop)</Text>;
}
