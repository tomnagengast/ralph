#!/usr/bin/env node
import {spawn} from 'child_process';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import toml from 'toml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple arg parsing
const args = process.argv.slice(2);
const command = args[0];

// Handle version
if (args.includes('-v') || args.includes('--version')) {
	const packageJson = JSON.parse(
		fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'),
	);
	console.log(packageJson.version);
	process.exit(0);
}

// Handle help
if (args.includes('-h') || args.includes('--help') || !command) {
	console.log(`
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
`);
	process.exit(command ? 0 : 1);
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

	// Create files with default content
	const defaultSettings = `[run]
interval_ms = 1000
auto_stop_after_errors = 5

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
	// Parse flags
	let promptPath = '.ralph/prompt.md';
	let model: string | undefined;
	
	for (let i = 1; i < args.length; i++) {
		if ((args[i] === '-p' || args[i] === '--prompt') && args[i + 1]) {
			promptPath = args[i + 1]!;
			i++;
		} else if ((args[i] === '-m' || args[i] === '--model') && args[i + 1]) {
			model = args[i + 1]!;
			i++;
		}
	}
	
	// Check if prompt file exists
	if (!fs.existsSync(promptPath)) {
		console.error(`Error: Prompt file not found: ${promptPath}`);
		if (promptPath === '.ralph/prompt.md') {
			console.error('\nTip: Run "ralph init" first to create the default structure.');
		}
		process.exit(1);
	}
	
	// Load settings
	let settings: any = {};
	const settingsPath = '.ralph/settings.toml';
	if (fs.existsSync(settingsPath)) {
		try {
			const content = fs.readFileSync(settingsPath, 'utf-8');
			settings = toml.parse(content);
		} catch (error) {
			console.error('Failed to parse settings.toml:', error);
		}
	}
	
	// Build claude args
	const claudeArgs = ['-p'];
	if (model) {
		claudeArgs.push('--model', model);
	}
	
	// Add flags from settings
	const flags = settings.claude?.flags ?? [
		'--dangerously-skip-permissions',
		'--verbose', 
		'--output-format',
		'stream-json',
	];
	claudeArgs.push(...flags);
	
	const intervalMs = settings.run?.interval_ms ?? 1000;
	const autoStopAfterErrors = settings.run?.auto_stop_after_errors ?? 5;
	let consecutiveErrors = 0;
	
	console.log('🔄 Ralph Loop Running (Press Ctrl+C to stop)\n');
	
	// Run loop
	const runIteration = async () => {
		const promptContent = fs.readFileSync(promptPath, 'utf-8');
		
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		
		const claude = spawn('claude', claudeArgs, {
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		
		// Send prompt to stdin
		claude.stdin.write(promptContent);
		claude.stdin.end();
		
		// Handle output
		claude.stdout.on('data', (data) => {
			process.stdout.write(data);
		});
		
		claude.stderr.on('data', (data) => {
			process.stderr.write(data);
		});
		
		// Wait for completion
		await new Promise<void>((resolve) => {
			claude.on('close', (code) => {
				if (code !== 0) {
					consecutiveErrors++;
					console.error(`\n⚠️  Claude exited with code ${code}`);
					
					if (consecutiveErrors >= autoStopAfterErrors) {
						console.error(`\nStopping after ${consecutiveErrors} consecutive errors`);
						process.exit(1);
					}
				} else {
					consecutiveErrors = 0;
				}
				
				// Wait before next iteration
				setTimeout(() => {
					resolve();
					runIteration();
				}, intervalMs);
			});
		});
	};
	
	// Handle Ctrl+C
	process.on('SIGINT', () => {
		console.log('\n\nStopping ralph loop...');
		process.exit(0);
	});
	
	// Start the loop
	runIteration();
} else {
	console.error(`Error: Unknown command "${command}"\n`);
	process.exit(1);
}