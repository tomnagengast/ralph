import fs from 'fs';
import path from 'path';
import toml from 'toml';
import type {RunConfig} from '../types/run.js';

interface SettingsFile {
	run?: {
		interval_ms?: number;
		auto_stop_after_errors?: number;
		max_cost_usd?: number;
		output_format?: 'formatted' | 'raw' | 'minimal';
		show_statistics?: boolean;
		truncate_output?: boolean;
		max_output_lines?: number;
	};
	claude?: {
		flags?: string[];
		model?: string;
		timeout_ms?: number;
	};
}

export function loadRunConfig(overrides: Partial<RunConfig> = {}): RunConfig {
	let settings: SettingsFile = {};
	
	// Try to load settings from .ralph/settings.toml
	const settingsPath = path.resolve('.ralph/settings.toml');
	if (fs.existsSync(settingsPath)) {
		try {
			const content = fs.readFileSync(settingsPath, 'utf-8');
			settings = toml.parse(content) as SettingsFile;
		} catch (error) {
			console.error('Failed to parse settings.toml:', error);
		}
	}
	
	// Build config from settings with overrides
	const config: RunConfig = {
		intervalMs: settings.run?.interval_ms ?? 1000,
		autoStopAfterErrors: settings.run?.auto_stop_after_errors ?? 5,
		maxCostUsd: settings.run?.max_cost_usd,
		outputFormat: overrides.outputFormat ?? settings.run?.output_format ?? 'formatted',
		showStatistics: settings.run?.show_statistics ?? true,
		truncateOutput: settings.run?.truncate_output ?? true,
		maxOutputLines: settings.run?.max_output_lines ?? 50,
		claudeFlags: settings.claude?.flags ?? [
			'--dangerously-skip-permissions',
			'--verbose',
			'--output-format',
			'stream-json',
		],
		model: overrides.model ?? settings.claude?.model,
		timeoutMs: settings.claude?.timeout_ms ?? 300000,
		...overrides,
	};
	
	return config;
}