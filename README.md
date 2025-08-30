# ralph

A tool for running [`ralph`](https://ghuntley.com/ralph/) loops so easy even Ralph could use it.

## Install

```bash
$ npm install --global ralph
```

## Usage

```
$ ralph --help

Usage: 
  ralph init                    Initialize ralph in current directory
  ralph run [options]           Run continuously with prompt

Commands:
  init                          Create .ralph directory and template files
  run                           Start continuous execution loop

Options for 'run':
  -p, --prompt <file|text>      Path to prompt file or direct text (default: .ralph/prompt.md)
  -m, --model <model>           Model to use (e.g. 'sonnet' or 'opus')
  --verbosity <level>           Display verbosity: minimal, normal, verbose, debug
  --color-scheme <scheme>       Color scheme: default, minimal, dark, light, high-contrast, none
  --filter-events <preset>      Filter events using preset: text-only, no-system, errors-only, tools, messages, debug, all
  --include-events <types>      Only show specific event types (comma-separated)
  --exclude-events <types>      Hide specific event types (comma-separated)
  
  Performance Options:
  --max-display-lines <num>     Maximum lines to display at once (default: 1000)
  --max-events <num>            Maximum events to keep in memory (default: 5000)
  --buffer-size <num>           Text buffer size for coalescing (default: 100)
  --throttle-ms <num>           Update throttle in milliseconds (default: 16)
  --no-progressive              Disable progressive rendering
  --no-virtual-scrolling        Disable virtual scrolling
  --show-memory-stats           Show memory usage statistics
  --auto-truncate               Enable automatic text truncation for performance
  
  -v, --version                 Output the version number
  -h, --help                    Display help for command
```

## Examples

```bash
# Initialize ralph in current directory
ralph init

# Run with default prompt (.ralph/prompt.md)
ralph run

# Run with custom prompt file
ralph run -p custom.md

# Run with direct text prompt
ralph run -p "Fix all tests"

# Run with specific model
ralph run -m opus

# Run with dark color theme
ralph run --color-scheme dark

# Show only text content
ralph run --filter-events text-only

# Hide specific event types
ralph run --exclude-events ping,system

# Show only specific event types
ralph run --include-events error,tool_use
```

## Directory Structure

When you run `ralph init`, it creates:

```
.ralph/
  settings.toml
  plan.md
  prompt.md
specs/
  active/
  backlog/
  done/
```