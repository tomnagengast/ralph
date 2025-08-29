# Plan

Create a plan to complete the task using the specified markdown `Plan Format`. Research the codebase and create a thorough plan appropriate to the task's complexity.

## Variables

prompt: $ARGUMENTS (IMPORTANT: second argument)

## Instructions

- IMPORTANT: Use the feature-planner-codex subagent to create a plan to complete the task described in the `prompt`
- The plan should be appropriately detailed based on the task complexity:
  - Simple tasks (chores, fixes): Focus on specific changes and validation
  - Complex tasks (features, refactors): Include design, phases, and testing strategy
- Create the plan in the `specs/backlog` directory with filename: `{yyyyMMdd}-{HHmmss}-{descriptive-name}.md`
  - Replace `{yyyyMMdd}-{HHmmss}` with the current date and time
  - Replace `{descriptive-name}` with a short, descriptive name based on the task (e.g., "update-readme", "add-logging", "implement-api", "refactor-agent")
- Research the codebase starting with `README.md`
- IMPORTANT: When you finish your plan, return only the path to the plan file created.
- IMPORTANT: Replace every <placeholder> in the `Plan Format` with the requested value
- Think hard and throughly through the task requirements and appropriate level of planning needed
- Follow existing patterns and conventions in the codebase

## Workflow

1. **Research the Codebase**: Start with `README.md` to understand the project structure, existing patterns, and conventions
2. **Write Plan**: Create the plan document in `specs/backlog/*.md` following the Plan Format template
3. IMPORTANT: Think and make sure when you finish your work you return ONLY the path to the plan you've created and nothing else.

## Codebase Structure

- `README.md` - Project overview and instructions (start here)
- `src/` - Application layer you'll be working in
- `.claude/commands/` - Claude commands
- `specs/` - Specification and plan documents

## Plan Format

```md
# Plan: <task name>

## Metadata

prompt: `{prompt}`
task_type: <chore|feature|refactor|fix|enhancement>
complexity: <simple|medium|complex>

## Task Description

<describe the task in detail based on the prompt>

## Objective

<clearly state what will be accomplished when this plan is complete>

<if task_type is feature or complexity is medium/complex, include these sections:>

## Problem Statement

<clearly define the specific problem or opportunity this task addresses>

## Solution Approach

<describe the proposed solution approach and how it addresses the objective>
</if>

## Relevant Files

Use these files to complete the task:

<list files relevant to the task with bullet points explaining why. Include new files to be created under an h3 'New Files' section if needed>

<if complexity is medium/complex, include this section:>

## Implementation Phases

### Phase 1: Foundation

<describe any foundational work needed>

### Phase 2: Core Implementation

<describe the main implementation work>

### Phase 3: Integration & Polish

<describe integration, testing, and final touches>
</if>

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

<list step by step tasks as h3 headers with bullet points. Start with foundational changes then move to specific changes. Last step should validate the work>

### 1. <First Task Name>

- <specific action>
- <specific action>

### 2. <Second Task Name>

- <specific action>
- <specific action>

<continue with additional tasks as needed>

<if task_type is feature or complexity is medium/complex, include this section:>

## Testing Strategy

<describe testing approach, including unit tests and edge cases as applicable>
</if>

## Acceptance Criteria

<list specific, measurable criteria that must be met for the task to be considered complete>

## Validation Commands

Execute these commands to validate the task is complete:

<list specific commands to validate the work. Be precise about what to run>
- Example: `uv run python -m py_compile apps/*.py` - Test to ensure the code compiles

## Notes

<optional additional context, considerations, or dependencies. If new libraries are needed, specify using `uv add`>
```

## Task

Use the task description from the `prompt` variable.

## Report

IMPORTANT: Exclusively return the path to the plan file created.
