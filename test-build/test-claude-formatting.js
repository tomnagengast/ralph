#!/usr/bin/env node
import { render } from 'ink';
import { Box } from 'ink';
import { ClaudeEventType } from './dist/types/claude-events.js';
import { formatClaudeEvent } from './dist/utils/claude-formatter.js';
// Test various Claude event types
const testEvents = [
    // Message start with comprehensive info
    {
        type: ClaudeEventType.MESSAGE_START,
        message: {
            id: 'msg_01XYZ789',
            model: 'claude-opus-4-1-20250805',
            role: 'assistant',
            usage: {
                input_tokens: 1500,
                cache_read_input_tokens: 800,
                cache_creation_input_tokens: 200,
                service_tier: 'priority',
            },
        },
    },
    // Content block start for text
    {
        type: ClaudeEventType.CONTENT_BLOCK_START,
        index: 0,
        content_block: {
            type: 'text',
        },
    },
    // Text delta with markdown content
    {
        type: ClaudeEventType.CONTENT_BLOCK_DELTA,
        delta: {
            type: 'text_delta',
            text: '# Hello World\n\nThis is a **bold** text and *italic* text.\n\n```python\ndef hello():\n    print("Hello, World!")\n```\n\n- Item 1\n- Item 2\n  - Nested item\n\n> This is a blockquote',
        },
    },
    // Tool use start
    {
        type: ClaudeEventType.CONTENT_BLOCK_START,
        index: 1,
        content_block: {
            type: 'tool_use',
            id: 'tool_use_123',
            name: 'calculator',
        },
    },
    // Tool input JSON delta
    {
        type: ClaudeEventType.CONTENT_BLOCK_DELTA,
        delta: {
            type: 'input_json_delta',
            partial_json: '{"operation": "add", "a": 5, "b": 3}',
        },
    },
    // Thinking block
    {
        type: ClaudeEventType.THINKING_BLOCK_START,
    },
    {
        type: ClaudeEventType.CONTENT_BLOCK_DELTA,
        delta: {
            type: 'thinking_delta',
            text: 'Let me analyze this problem step by step...',
        },
    },
    // Error event
    {
        type: ClaudeEventType.RATE_LIMIT_ERROR,
        error: {
            type: 'rate_limit_error',
            message: 'Too many requests',
            code: 'rate_limit_exceeded',
            retry_after: 30,
            rate_limit: {
                requests: 0,
                tokens: 1000,
                reset_at: '2025-08-30T12:00:00Z',
            },
        },
    },
    // Result event
    {
        type: ClaudeEventType.RESULT,
        subtype: 'success',
        duration_ms: 5432,
        duration_api_ms: 4200,
        num_turns: 3,
        total_cost_usd: 0.0234,
        session_id: 'session_abc123',
        usage: {
            input_tokens: 2500,
            output_tokens: 1800,
        },
        result: '## Task Completed\n\nSuccessfully processed all requests with the following results:\n- **Performance**: Optimized\n- **Accuracy**: 99.5%\n- **Status**: ✅ Complete',
    },
    // Message stop
    {
        type: ClaudeEventType.MESSAGE_STOP,
    },
];
// Component to display formatted events
const FormattingTest = () => {
    return flexDirection = "column";
    paddingX = { 1:  } >
        marginBottom;
    {
        1;
    }
    borderStyle = "double";
    borderColor = "cyan";
    paddingX = { 1:  } >
        bold;
    color = "cyan" >
        Claude;
    Message;
    Formatting;
    Test;
    Suite
        < /Text>
        < /Box>
        < Box;
    flexDirection = "column" >
        { testEvents, : .map((event, index) => {
                const formatted = formatClaudeEvent(event, index);
                return formatted ? key = { index } : ;
                marginBottom = { 1:  } >
                    { formatted }
                    < /Box>;
            }), null:  };
};
/Box>
    < Box;
marginTop = { 1:  };
borderStyle = "single";
borderColor = "green";
paddingX = { 1:  } >
    color;
"green" >
;
All;
event;
types;
rendered;
successfully
    < /Text>
    < /Box>
    < /Box>;
;
;
// Render the test
const app = render(/>);
// Exit after 5 seconds
setTimeout(() => {
    app.unmount();
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
}, 5000);
