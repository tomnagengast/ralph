#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import fs from 'fs';
import App from './app.js';

const cli = meow(
	`
	Usage: ralph [options] [command] [prompt]

	ralph - starts an interactive session by default, use -p/--print for non-interactive output

	Arguments:
	  prompt                                            Your prompt or path to prompt file

	Options:
	  -d, --debug [filter]                              Enable debug mode with optional category filtering (e.g., "api,hooks" or "!statsig,!file")
	  --verbose                                         Override verbose mode setting from config
	  -p, --print                                       Print responses (useful for pipes)
	  --output-format <format>                          Output format (only works with --print): "text" (default), "json" (single result), or "stream-json" (realtime streaming)
	  -c, --continue                                    Continue the most recent conversation
	  -r, --resume [sessionId]                          Resume a conversation - provide a session ID or interactively select a conversation to resume
	  --model <model>                                   Model for the current session. Provide an alias for the latest model (e.g. 'sonnet' or 'opus') or a model's full name
	  --settings <file-or-json>                         Path to a settings JSON file or a JSON string to load additional settings from
	  --add-dir <directories...>                        Additional directories to allow tool access to
	  --session-id <uuid>                               Use a specific session ID for the conversation (must be a valid UUID)
	  -v, --version                                     Output the version number
	  -h, --help                                        Display help for command

	Commands:
	  config                                            Manage configuration (eg. ralph config set -g theme dark)
	  init                                              Initialize ralph template files and directories
	  update                                            Check for updates and install if available
`,
	{
		importMeta: import.meta,
		flags: {
			debug: {
				type: 'string',
				shortFlag: 'd',
				isMultiple: false,
			},
			verbose: {
				type: 'boolean',
			},
			print: {
				type: 'boolean',
				shortFlag: 'p',
			},
			outputFormat: {
				type: 'string',
				default: 'text',
			},
			continue: {
				type: 'boolean',
				shortFlag: 'c',
			},
			resume: {
				type: 'string',
				shortFlag: 'r',
				isMultiple: false,
			},
			model: {
				type: 'string',
			},
			settings: {
				type: 'string',
			},
			addDir: {
				type: 'string',
				isMultiple: true,
			},
			sessionId: {
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

// Get the command and prompt from input
const command = cli.input[0];
const promptArg = command && ['init', 'config', 'update'].includes(command) ? cli.input[1] : cli.input[0];

// Handle version flag
if (cli.flags.version) {
	const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
	console.log(packageJson.version);
	process.exit(0);
}

// Handle help flag
if (cli.flags.help) {
	cli.showHelp();
	process.exit(0);
}

// Handle config command
if (command === 'config') {
	console.log('Config management not yet implemented');
	process.exit(0);
}

// Handle update command
if (command === 'update') {
	console.log('Update checking not yet implemented');
	process.exit(0);
}

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

	// Create files
	createFileIfNotExists('.ralph/settings.toml');
	createFileIfNotExists('.ralph/plan.md');
	createFileIfNotExists('.ralph/prompt.md');

	console.log('\n✨ Ralph initialized successfully!\n');
	process.exit(0);
}

// Handle main ralph command (interactive or non-interactive)
const isInteractive = !cli.flags.print;

// If no prompt provided and not in interactive mode, show help
if (!promptArg && !isInteractive && !cli.flags.continue && !cli.flags.resume) {
	cli.showHelp();
	process.exit(1);
}

const prompt = promptArg || '';

// Pass all flags to the app
const appProps = {
	prompt,
	isInteractive,
	debug: cli.flags.debug,
	verbose: cli.flags.verbose,
	print: cli.flags.print,
	outputFormat: cli.flags.outputFormat,
	continue: cli.flags.continue,
	resume: cli.flags.resume,
	model: cli.flags.model,
	settings: cli.flags.settings,
	addDir: cli.flags.addDir,
	sessionId: cli.flags.sessionId,
};

if (isInteractive) {
	render(<App {...appProps} />);
} else {
	// Non-interactive mode - just render once and exit
	render(<App {...appProps} />);
}
