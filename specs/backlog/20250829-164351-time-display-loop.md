# Plan: Time Display Loop Feature

## Metadata

prompt: when the user runs `ralph -p <prompt>` I want the app (or cli?) to start a loop that displays the time every second
task_type: feature
complexity: simple

## Task Description

Implement a feature where running `ralph -p <prompt>` starts a continuous loop that displays the current time every second. This should work in non-interactive mode (when the `-p/--print` flag is used) and continue running until the user manually terminates the process (Ctrl+C).

## Objective

When a user runs `ralph -p <prompt>`, the application will display the current time in a formatted string that updates every second, creating a live clock display in the terminal.

## Problem Statement

Currently, when `ralph -p <prompt>` is executed, the application renders once and exits. There is no mechanism for continuous updates or time-based loops. The non-interactive mode needs to be enhanced to support ongoing time display functionality while maintaining the existing prompt handling behavior.

## Solution Approach

Implement a time display loop using React's `useEffect` hook with `setInterval` for timer management. The solution will:

1. Detect when the application is in non-interactive mode with a prompt
2. Set up a timer that updates the displayed time every second
3. Format the time in a readable format (HH:MM:SS)
4. Ensure proper cleanup of the interval when the component unmounts
5. Maintain existing functionality for other use cases

## Relevant Files

- `src/app.tsx` - Main React component where the time display logic will be implemented
  - Contains the main UI rendering logic and state management
  - Already has useEffect hooks for prompt loading
  - Needs modification to add timer functionality
- `src/cli.tsx` - CLI entry point that handles argument parsing
  - Already handles the `-p/--print` flag correctly
  - Sets `isInteractive: false` when `-p` is used
  - No changes needed here

## Implementation Phases

### Phase 1: Foundation

Set up the basic timer infrastructure and state management for the time display functionality.

### Phase 2: Core Implementation

Implement the time formatting, display logic, and interval management with proper React patterns.

### Phase 3: Integration & Polish

Integrate the time display with existing UI components and ensure proper cleanup and error handling.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Add Time State Management

- Add a new state variable `currentTime` to track the current time
- Initialize it with the current time when the component mounts
- Import necessary React hooks and Date utilities

### 2. Implement Time Display Logic

- Create a function to format the current time as HH:MM:SS
- Set up a `useEffect` hook to manage the timer interval
- Update the `currentTime` state every second using `setInterval`

### 3. Add Conditional Time Display Rendering

- Modify the JSX to conditionally show the time when in print mode with a prompt
- Display the formatted time in a prominent way using Ink's Text component
- Ensure the time display integrates well with the existing UI layout

### 4. Implement Proper Cleanup

- Add cleanup logic to clear the interval when the component unmounts
- Handle the cleanup in the `useEffect` return function
- Prevent memory leaks and ensure clean shutdown

### 5. Test Integration Points

- Verify that existing functionality (prompt loading, status display) still works
- Test that the time display only appears in non-interactive mode with a prompt
- Confirm that other CLI modes (interactive, continue, resume) are unaffected

### 6. Validate Implementation

- Test the feature with `ralph -p "test prompt"`
- Verify the time updates every second
- Confirm proper cleanup when terminating with Ctrl+C
- Test edge cases and error scenarios

## Testing Strategy

### Manual Testing
- Run `ralph -p "hello"` and verify time display updates every second
- Test that Ctrl+C properly terminates the application
- Verify existing functionality remains intact for other command variations
- Test with different prompt types (file paths vs direct text)

### Edge Cases
- Empty prompts
- Invalid file paths as prompts
- Rapid start/stop cycles
- Long-running sessions (multiple minutes)

## Acceptance Criteria

- [ ] Running `ralph -p <prompt>` displays the current time that updates every second
- [ ] Time format is readable (HH:MM:SS format)
- [ ] The time display continues indefinitely until manually terminated
- [ ] Existing prompt display functionality is preserved
- [ ] No memory leaks from uncleared intervals
- [ ] Interactive mode (`ralph` without `-p`) is unaffected
- [ ] Other CLI flags and commands continue to work as before
- [ ] Application can be cleanly terminated with Ctrl+C

## Validation Commands

Execute these commands to validate the task is complete:

```bash
# Test the main feature
ralph -p "hello world"
# Should display time updating every second, terminate with Ctrl+C after 5+ seconds

# Test with file prompt
echo "test prompt" > test_prompt.txt
ralph -p test_prompt.txt
# Should display time updating every second, terminate with Ctrl+C
rm test_prompt.txt

# Test interactive mode still works
ralph
# Should show interactive mode without time display, terminate quickly

# Test other flags are unaffected
ralph --help
# Should show help without time display

# Build and test
npm run build
npm test
```

## Notes

- The time display should be prominent but not interfere with existing status and prompt information
- Consider using a consistent color scheme with the existing UI (green for headers, yellow for status)
- The implementation should be lightweight and not affect performance
- Future enhancement could include customizable time formats or timezone support