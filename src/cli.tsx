#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import fs from 'fs';
import App from './app.js';

const cli = meow(
	`
	Usage: 
	  ralph init                    Initialize ralph in current directory
	  ralph [prompt]                Run continuously with a prompt file

	Arguments:
	  prompt                        Path to prompt file (or direct text)

	Options:
	  --model <model>               Model to use (e.g. 'sonnet' or 'opus')
	  -v, --version                 Output the version number
	  -h, --help                    Display help for command

	Examples:
	  ralph init                    Create .ralph directory and template files
	  ralph prompt.md               Run continuously with prompt.md
	  ralph "fix the bug"           Run with inline prompt
`,
	{
		importMeta: import.meta,
		flags: {
			model: {
				type: 'string',
			},
			version: {
				type: 'boolean',
				shortFlag: 'v',
			},
			help: {
				type: 'boolean',
				shortFlag: 'h',
			},
		},
	},
);

// Handle version flag
if (cli.flags.version) {
	const packageJson = JSON.parse(
		fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
	);
	console.log(packageJson.version);
	process.exit(0);
}

// Handle help flag
if (cli.flags.help) {
	cli.showHelp();
	process.exit(0);
}

// Get command from input
const command = cli.input[0];

// Handle init command
if (command === 'init') {
	const createDirIfNotExists = (dirPath: string) => {
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, {recursive: true});
			console.log(`✓ Created ${dirPath}`);
		} else {
			console.log(`• ${dirPath} already exists`);
		}
	};

	const createFileIfNotExists = (filePath: string, content = '') => {
		if (!fs.existsSync(filePath)) {
			fs.writeFileSync(filePath, content);
			console.log(`✓ Created ${filePath}`);
		} else {
			console.log(`• ${filePath} already exists`);
		}
	};

	console.log('\nInitializing ralph...\n');

	// Create directories
	createDirIfNotExists('.ralph');
	createDirIfNotExists('specs');
	createDirIfNotExists('specs/active');
	createDirIfNotExists('specs/backlog');
	createDirIfNotExists('specs/done');

	// Create files with default content
	const defaultSettings = `[run]
interval_ms = 1000
auto_stop_after_errors = 5
output_format = "formatted"
show_statistics = true
truncate_output = true
max_output_lines = 50

[claude]
flags = [
  "--dangerously-skip-permissions",
  "--verbose",
  "--output-format",
  "stream-json"
]
timeout_ms = 300000
`;

	const defaultPrompt = `# Default Prompt

Replace this with your continuous prompt.
`;

	createFileIfNotExists('.ralph/settings.toml', defaultSettings);
	createFileIfNotExists('.ralph/plan.md');
	createFileIfNotExists('.ralph/prompt.md', defaultPrompt);

	console.log('\n✨ Ralph initialized successfully!\n');
	console.log('Next steps:');
	console.log('  1. Edit .ralph/prompt.md with your prompt');
	console.log('  2. Run: ralph .ralph/prompt.md\n');
	process.exit(0);
}

// If no command provided, show help
if (!command) {
	console.error('Error: Please provide a prompt file or use "ralph init"\n');
	cli.showHelp();
	process.exit(1);
}

// Otherwise, treat it as a prompt and run
const prompt = cli.input.join(' ');

// Pass to app for continuous run
const appProps = {
	prompt,
	model: cli.flags.model,
};

render(<App {...appProps} />);