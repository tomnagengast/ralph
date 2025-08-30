import React, {useEffect, useState} from 'react';
import {useInput, useApp} from 'ink';
import {Text, Box} from 'ink';
import fs from 'fs';
import {RunEngine} from './run.js';
import {OutputProcessor} from './output.js';
import {loadRunConfig} from './utils/config.js';
import type {RunConfig} from './types/run.js';

type Props = {
	prompt: string;
	model?: string;
};

export default function App(props: Props) {
	const {prompt, model} = props;
	const {exit} = useApp();
	const [output, setOutput] = useState<string>('');
	const [outputProcessor] = useState(new OutputProcessor());

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
		
		// Listen for iteration start event
		engine.on('iteration:start', () => {
			setOutput('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
			outputProcessor.clear();
		});
		
		// Process stream JSON output
		engine.on('output', (data: string) => {
			// Try to parse as stream JSON first
			const outputs = outputProcessor.processStreamJson(data);
			
			if (outputs.length > 0) {
				// We have valid JSON output
				for (const out of outputs) {
					if (out.type === 'text' || out.type === 'content') {
						const text = out.content || out.text || '';
						setOutput(prev => prev + text);
					} else if (out.type === 'tool_use') {
						setOutput(prev => prev + `\n🔧 Using tool: ${out.tool_name}\n`);
					} else if (out.type === 'error') {
						setOutput(prev => prev + `\n❌ Error: ${out.error}\n`);
					}
				}
			} else {
				// If not JSON, display raw output
				setOutput(prev => prev + data);
			}
		});
		
		// Handle errors
		engine.on('error', (error: string) => {
			setOutput(prev => prev + `\n⚠️  ${error}`);
		});
		
		// Start the run engine
		engine.start().catch(error => {
			console.error('Failed to start run engine:', error);
			exit();
		});
		
		return () => {
			engine.stop();
		};
	}, [prompt, model, exit, outputProcessor]);

	// Render formatted output with Ink
	return (
		<Box flexDirection="column">
			<Text color="cyan" bold>Ralph Loop Running</Text>
			<Text dimColor>(Press Ctrl+C to stop)</Text>
			<Box marginTop={1}>
				<Text>{output}</Text>
			</Box>
		</Box>
	);
}
