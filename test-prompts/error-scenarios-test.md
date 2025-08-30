Please help test error handling in the Claude formatting system. Try to:

1. **Use a tool that might fail** - perhaps try to access a file that doesn't exist or run a command that will fail
2. **Access restricted resources** - try operations that might be denied
3. **Generate API errors** - if possible, try operations that might hit rate limits or other API issues
4. **Use malformed inputs** - try edge cases that might cause parsing issues

The goal is to test how the Ralph CLI formatting system handles various error scenarios and edge cases. Show me different types of errors and failures so I can verify the error formatting works correctly.

This is specifically for testing error event formatting in the Ralph CLI tool.
