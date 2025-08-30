#!/usr/bin/env node

// Test script for enhanced Claude formatter
const fs = require('fs');
const path = require('path');

// Sample Claude events to test enhanced formatting
const testEvents = [
  // Message start with model and cache info
  {
    type: "message_start",
    message: {
      id: "msg_017G4gdvNxXmaq7wzqZTqCZD",
      model: "claude-3-opus-20240229",
      usage: {
        input_tokens: 1000,
        cache_read_input_tokens: 500,
        cache_creation_input_tokens: 200,
        cache_creation: {
          ephemeral_5m_input_tokens: 150,
          ephemeral_1h_input_tokens: 50
        },
        service_tier: "standard"
      }
    }
  },
  
  // Content blocks with new types
  {
    type: "content_block_start",
    index: 0,
    content_block: {
      type: "redacted_thinking",
      id: "thinking_001"
    }
  },
  
  // Text delta with markdown content
  {
    type: "content_block_delta",
    delta: {
      type: "text_delta",
      text: "## Analysis Complete\n\nHere are the **key findings**:\n\n1. Performance improved by `30%`\n2. Memory usage reduced\n3. User satisfaction increased\n\n```python\ndef optimize():\n    return \"optimized\"\n```"
    }
  },
  
  // Different error types
  {
    type: "authentication_error",
    error: {
      type: "authentication_error",
      message: "Invalid API key provided",
      code: "invalid_api_key"
    }
  },
  
  {
    type: "rate_limit_error",
    error: {
      type: "rate_limit_error",
      message: "Rate limit exceeded",
      retry_after: 60,
      rate_limit: {
        requests: 0,
        tokens: 0,
        reset_at: "2025-08-30T12:00:00Z"
      }
    }
  },
  
  {
    type: "request_too_large",
    error: {
      type: "request_too_large",
      message: "Request exceeds maximum size of 200000 tokens",
      code: "request_too_large"
    }
  },
  
  // Tool use with JSON input
  {
    type: "content_block_start",
    index: 1,
    content_block: {
      type: "tool_use",
      id: "tool_001",
      name: "WebSearch",
      input: {
        query: "Claude API streaming events",
        max_results: 10
      }
    }
  },
  
  // Result event with full metrics
  {
    type: "result",
    subtype: "success",
    duration_ms: 45230,
    duration_api_ms: 42100,
    num_turns: 12,
    total_cost_usd: 0.0234,
    session_id: "sess_abc123def456",
    result: "### Task Successfully Completed\n\nAll requested features have been implemented:\n- Enhanced error handling\n- Improved markdown rendering\n- Better JSON formatting",
    usage: {
      input_tokens: 5000,
      output_tokens: 2000,
      cache_read_input_tokens: 3000,
      service_tier: "priority"
    }
  },
  
  // System init event
  {
    type: "system",
    subtype: "init",
    model: "claude-opus-4-1-20250805",
    cwd: "/Users/project",
    tools: ["Read", "Write", "Bash", "WebSearch"],
    output_style: "enhanced",
    permissionMode: "bypassPermissions",
    apiKeySource: "environment"
  },
  
  // Assistant message with multiple content types
  {
    type: "assistant",
    message: {
      content: [
        {
          type: "text",
          text: "I'll help you with that. Let me search for information."
        },
        {
          type: "tool_use",
          id: "tool_002",
          name: "WebSearch",
          input: {
            query: "latest updates"
          }
        },
        {
          type: "thinking",
          text: "I should consider multiple approaches here..."
        },
        {
          type: "redacted_thinking",
          text: "[REDACTED]"
        }
      ],
      usage: {
        output_tokens: 150
      }
    }
  },
  
  // Message stop
  {
    type: "message_stop"
  }
];

// Write test events to file
const outputPath = path.join(__dirname, 'test-events-enhanced.jsonl');
const output = testEvents.map(event => JSON.stringify(event)).join('\n');
fs.writeFileSync(outputPath, output);

console.log(`✅ Test events written to ${outputPath}`);
console.log(`\n📊 Test Coverage:`);
console.log(`- Message events: message_start, message_stop`);
console.log(`- Content blocks: text, thinking, redacted_thinking, tool_use`);
console.log(`- Error types: authentication, rate_limit, request_too_large`);
console.log(`- Special events: result, system, assistant`);
console.log(`- Markdown rendering in text content`);
console.log(`- JSON formatting in tool inputs`);
console.log(`\n🚀 Run with: cat ${outputPath} | ralph --stream-json`);