# Plan: Convert Ralph to Interactive-Only Mode

## Metadata

prompt: `the only mode should be interactive mode. I want the user to be able to start ralph in any of the following ways: ralph hello there!, ralph -p "hello there!", ralph --print "hello there!"`
task_type: refactor
complexity: medium

## Task Description

Refactor ralph CLI to eliminate non-interactive print mode and make interactive mode the default and only mode. Users should be able to invoke ralph with prompts in three ways:

1. `ralph hello there!` - direct positional arguments as prompt
2. `ralph -p "hello there!"` - using short flag
3. `ralph --print "hello there!"` - using long flag

The current implementation has two modes (interactive and non-interactive print mode) with different behaviors and UI rendering. This task consolidates to a single interactive mode while preserving all three invocation methods.

## Objective

Convert ralph to use only interactive mode, removing the print mode distinction while maintaining backward compatibility for all three prompt input methods. The result will be a unified interactive experience regardless of how the prompt is provided.

## Problem Statement

The current ralph CLI has confusing dual modes:

- Interactive mode (default when no `--print` flag)
- Non-interactive print mode (when `--print` flag is used)

This creates inconsistent user experience and unnecessary complexity. Users expect ralph to be interactive regardless of how they provide their prompt, and the current print mode with its time display loop doesn't add meaningful value.

## Solution Approach

1. Remove the print mode logic and `waitUntilExit()` behavior from cli.tsx
2. Simplify the CLI argument parsing to treat `-p/--print` flags as prompt input methods rather than mode switches
3. Update the App component to remove print-mode-specific UI elements (like the time loop)
4. Ensure all three invocation methods result in the same interactive experience
5. Maintain backward compatibility for existing flag usage

## Relevant Files

- `src/cli.tsx` - Contains CLI argument parsing logic, mode detection, and process lifecycle management that needs refactoring
- `src/app.tsx` - Contains React/Ink UI with mode-specific rendering that needs simplification
- `package.json` - May need updates if dependencies change (meow configuration)

## Implementation Phases

### Phase 1: Foundation

Remove mode distinction and simplify CLI parsing to focus on prompt extraction from various input methods.

### Phase 2: Core Implementation

Update the React/Ink UI to remove print-mode-specific features and ensure consistent interactive behavior.

### Phase 3: Integration & Polish

Test all three invocation methods, ensure backward compatibility, and validate the unified interactive experience.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Analyze Current Mode Logic

- Review the current implementation in `src/cli.tsx` to understand how `isInteractive` and print mode are determined
- Document the specific logic that needs to be removed or modified
- Identify all references to print mode and interactive mode distinction

### 2. Refactor CLI Argument Parsing

- Modify `src/cli.tsx` to remove the `isInteractive` calculation based on `--print` flag
- Update prompt extraction logic to handle all three methods:
  - Positional arguments as prompt text
  - `--print/-p` flag value as prompt text
  - Direct prompt text from positional args when no command is specified
- Remove `waitUntilExit()` call and related print mode process lifecycle management
- Simplify the props passed to the `<App>` component by removing `isInteractive` prop

### 3. Update App Component UI

- Remove the `isInteractive` prop from the App component interface in `src/app.tsx`
- Remove the time display loop that only appears in print mode (the `useEffect` with `setInterval` for current time)
- Remove any conditional rendering based on interactive vs non-interactive mode
- Simplify the status message logic to focus on prompt source rather than mode
- Remove the "Mode" display section that shows "Non-interactive" information

### 4. Clean Up Mode-Related Code

- Remove any unused imports or variables related to mode distinction
- Clean up any conditional logic that differentiated between interactive and print modes
- Ensure consistent behavior regardless of how the prompt was provided
- Remove or update any comments that reference the dual-mode system

### 5. Update Help Text and Documentation

- Review and update the help text in meow configuration to reflect the simplified usage
- Ensure flag descriptions accurately represent their new behavior
- Update any inline comments that reference the old mode system

### 6. Test All Invocation Methods

- Test `ralph hello there!` to ensure positional arguments work as prompt
- Test `ralph -p "hello there!"` to ensure short flag works as prompt input
- Test `ralph --print "hello there!"` to ensure long flag works as prompt input
- Verify that all three methods result in identical interactive behavior
- Test edge cases like empty prompts, file paths, and special characters

## Testing Strategy

Manual testing approach focusing on:

- All three invocation methods produce identical interactive UI
- Prompt text is correctly extracted and displayed in all cases
- No time loop or print-mode artifacts appear in the UI
- Process lifecycle is consistent (doesn't hang or exit unexpectedly)
- Backward compatibility with existing scripts using `--print` flag

## Acceptance Criteria

- `ralph hello there!` starts interactive mode with "hello there!" as the prompt
- `ralph -p "hello there!"` starts interactive mode with "hello there!" as the prompt
- `ralph --print "hello there!"` starts interactive mode with "hello there!" as the prompt
- All three methods result in identical UI and behavior
- No time display loop appears in any mode
- Process runs interactively without `waitUntilExit()` complexity
- Help text accurately reflects the simplified usage
- No mode-related UI elements remain (like "Mode: Non-interactive")
- Existing functionality for commands (`init`, `config`, `update`) remains unaffected

## Validation Commands

Execute these commands to validate the task is complete:

- `npm run build` - Ensure the TypeScript compiles successfully
- `npm test` - Run linting and any tests to ensure code quality
- `./dist/cli.js hello world` - Test positional argument prompt
- `./dist/cli.js -p "test prompt"` - Test short flag prompt
- `./dist/cli.js --print "another test"` - Test long flag prompt
- `./dist/cli.js init` - Verify commands still work correctly
- `./dist/cli.js --help` - Check help text is accurate

## Notes

The refactoring should preserve all existing CLI flags and functionality except for the mode distinction. The `--print/-p` flags change from mode switches to prompt input methods, which maintains backward compatibility while simplifying the user experience.

Special attention should be paid to ensuring the process lifecycle is correct without `waitUntilExit()` - the interactive mode should run properly with Ink's default behavior.
