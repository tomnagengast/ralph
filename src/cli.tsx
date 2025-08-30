#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import fs from 'fs';
import App from './app.js';

const cli = meow(
	`
	Usage: ralph [options] [command] [prompt]

	ralph - starts an interactive session

	Arguments:
	  prompt                                            Your prompt or path to prompt file

	Options:
	  -d, --debug [filter]                              Enable debug mode with optional category filtering (e.g., "api,hooks" or "!statsig,!file")
	  --verbose                                         Override verbose mode setting from config
	  -p, --print                                       Provide prompt text (alternative to positional arguments)
	  --output-format <format>                          Output format (reserved for future use): "text" (default), "json" (single result), or "stream-json" (realtime streaming)
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
				type: 'string',
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

// Handle prompt from various sources:
// 1. Direct positional arguments (ralph hello there!)
// 2. --print/-p flag value (ralph -p "hello there!" or ralph --print "hello there!")
// 3. Command argument (ralph init, ralph config, etc.)
let promptArg = '';
if (command && ['init', 'config', 'update'].includes(command)) {
	// For commands, prompt would be the second argument
	promptArg = cli.input[1] || '';
} else if (cli.flags.print && typeof cli.flags.print === 'string') {
	// If --print has a value, use it as the prompt
	promptArg = cli.flags.print;
} else if ((cli.flags as any).p && typeof (cli.flags as any).p === 'string') {
	// If -p has a value, use it as the prompt
	promptArg = (cli.flags as any).p;
} else if (cli.input.length > 0) {
	// Use all positional arguments as the prompt
	promptArg = cli.input.join(' ');
}

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

// Handle main ralph command - always interactive now
const prompt = promptArg || '';

// Pass all flags to the app
const appProps = {
	prompt,
	debug: cli.flags.debug,
	verbose: cli.flags.verbose,
	outputFormat: cli.flags.outputFormat,
	continue: cli.flags.continue,
	resume: cli.flags.resume,
	model: cli.flags.model,
	settings: cli.flags.settings,
	addDir: cli.flags.addDir,
	sessionId: cli.flags.sessionId,
};

// Always render in interactive mode
render(<App {...appProps} />);
