import React, {useEffect, useState} from 'react';
import {useInput, useApp} from 'ink';
import fs from 'fs';
import {RunEngine} from './run.js';
import {OutputProcessor} from './output.js';
import {RunDisplay} from './components/RunDisplay.js';
import {loadRunConfig} from './utils/config.js';
import type {RunStatus, RunConfig} from './types/run.js';

type Props = {
	prompt: string;
	model?: string;
};

export default function App(props: Props) {
	const {prompt, model} = props;
	const {exit} = useApp();
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


	// Initialize run engine on mount
	useEffect(() => {
		const config: RunConfig = loadRunConfig({
			promptPath: prompt && fs.existsSync(prompt) ? prompt : undefined,
			promptText: prompt && !fs.existsSync(prompt) ? prompt : undefined,
			model,
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
	}, [prompt, model]);

	// Always render run display
	if (!runStatus) {
		return null;
	}

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
