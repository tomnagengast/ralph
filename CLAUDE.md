# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Primary directive

1. Maintain simplicity at all cost

## Project Overview

Ralph is a CLI tool for running ralph loops, built with React/Ink for interactive terminal UI and TypeScript. The project uses meow for CLI argument parsing and has a simple architecture with two main components.

## Development Commands

```bash
# Build the TypeScript project
npm run build

# Watch mode for development
npm run dev

# Run tests (includes prettier check, xo linting, and ava tests)
npm test
```

## Architecture

The project consists of two main TypeScript files:

- `src/cli.tsx` - CLI entry point that handles command parsing and initialization
- `src/RalphLoop.tsx` - React/Ink component that renders the terminal UI and manages the Ralph loop

### Key Features

- `ralph init` - Creates default directory structure and configuration files
- `ralph -p <prompt>` - Runs ralph with a prompt (file path or direct text)
- Configurable paths for plan, specs, src, and config files

### Directory Structure Created by Init

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

## Testing & Linting

The project uses:

- **xo** for ESLint-based linting with React support
- **prettier** for code formatting
- **ava** for testing (configured for TypeScript with ts-node loader)

Note: Currently no test files exist in the project.
