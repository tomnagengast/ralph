import React, {useEffect, useState} from 'react';
import {Box, Text, Spacer} from 'ink';
import ms from 'ms';
import type {RunStatus} from '../types/run.js';

interface RunDisplayProps {
	status: RunStatus;
	outputLines: string[];
	onStop?: () => void;
	onPause?: () => void;
	onResume?: () => void;
}

export function RunDisplay({
	status,
	outputLines,
}: RunDisplayProps) {
	const [elapsedTime, setElapsedTime] = useState('0s');
	
	useEffect(() => {
		const interval = setInterval(() => {
			if (status.startTime) {
				const elapsed = Date.now() - status.startTime.getTime();
				setElapsedTime(ms(elapsed, {long: false}));
			}
		}, 1000);
		
		return () => clearInterval(interval);
	}, [status.startTime]);
	
	const getStateColor = () => {
		switch (status.state) {
			case 'running':
				return 'green';
			case 'paused':
				return 'yellow';
			case 'stopped':
				return 'red';
			case 'error':
				return 'red';
			default:
				return 'gray';
		}
	};
	
	const getStateIcon = () => {
		switch (status.state) {
			case 'running':
				return '▶';
			case 'paused':
				return '⏸';
			case 'stopped':
				return '⏹';
			case 'error':
				return '⚠';
			default:
				return '○';
		}
	};
	
	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="cyan">Ralph Run Mode</Text>
				<Spacer />
				<Text color={getStateColor()}>
					{getStateIcon()} {status.state.toUpperCase()}
				</Text>
			</Box>
			
			<Box>
				<Text>Iteration: </Text>
				<Text bold color="white">{status.iterationCount}</Text>
				<Text> | </Text>
				<Text>Elapsed: </Text>
				<Text bold color="white">{elapsedTime}</Text>
				{status.lastRunTime && (
					<>
						<Text> | </Text>
						<Text>Last run: </Text>
						<Text color="gray">
							{new Date(status.lastRunTime).toLocaleTimeString()}
						</Text>
					</>
				)}
			</Box>
			
			{status.errors.length > 0 && (
				<Box marginTop={1}>
					<Text color="red">
						Recent errors: {status.errors.slice(-3).join(', ')}
					</Text>
				</Box>
			)}
			
			<Box marginTop={1} marginBottom={1}>
				<Text>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
			</Box>
			
			<Box flexDirection="column" height={20}>
				{outputLines.map((line, index) => (
					<Text key={index}>{line}</Text>
				))}
			</Box>
			
			<Box marginTop={1}>
				<Text>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
			</Box>
			
			<Box marginTop={1}>
				<Text dimColor>
					Press Ctrl+C to stop • {status.state === 'paused' ? 'P to resume' : 'P to pause'}
				</Text>
			</Box>
		</Box>
	);
}