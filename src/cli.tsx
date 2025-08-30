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
	  ralph run [options]           Run continuously with prompt

	Commands:
	  init                          Create .ralph directory and template files
	  run                           Start continuous execution loop

	Options for 'run':
	  -p, --prompt <file>           Path to prompt file (default: .ralph/prompt.md)
	  -m, --model <model>           Model to use (e.g. 'sonnet' or 'opus')
	  -v, --version                 Output the version number
	  -h, --help                    Display help for command

	Examples:
	  ralph init                    Create project structure
	  ralph run                     Run with default prompt (.ralph/prompt.md)
	  ralph run -p custom.md        Run with custom prompt file
	  ralph run -m opus             Run with specific model
`,
	{
		importMeta: import.meta,
		flags: {
			prompt: {
				type: 'string',
				shortFlag: 'p',
			},
			model: {
				type: 'string',
				shortFlag: 'm',
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
	console.log('  2. Run: ralph run\n');
	process.exit(0);
}

// Handle run command
if (command === 'run') {
	// Use provided prompt file or default to .ralph/prompt.md
	const promptPath = cli.flags.prompt || '.ralph/prompt.md';
	
	// Check if prompt file exists
	if (!fs.existsSync(promptPath)) {
		console.error(`Error: Prompt file not found: ${promptPath}`);
		if (!cli.flags.prompt && promptPath === '.ralph/prompt.md') {
			console.error('\nTip: Run "ralph init" first to create the default structure.');
		}
		process.exit(1);
	}
	
	// Pass to app for continuous run
	const appProps = {
		prompt: promptPath,
		model: cli.flags.model,
	};

	render(<App {...appProps} />);
} else if (!command) {
	console.error('Error: Please specify a command (init or run)\n');
	cli.showHelp();
	process.exit(1);
} else {
	console.error(`Error: Unknown command "${command}"\n`);
	cli.showHelp();
	process.exit(1);
}