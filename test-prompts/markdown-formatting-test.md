# Comprehensive Markdown Formatting Test

Please provide a response that demonstrates **all markdown formatting features** to test the rendering system:

## Headers and Structure

Create responses with multiple header levels (H1, H2, H3) to test header formatting.

### Text Formatting

- Show **bold text** examples
- Demonstrate _italic text_ usage
- Combine **_bold and italic_** formatting
- Use `inline code` examples
- Show ~~strikethrough~~ if supported

### Code Examples

Please include:

```javascript
// JavaScript code block
function testFormatting() {
	const message = 'Testing code block formatting';
	console.log(message);
	return true;
}
```

```python
# Python code block
def test_formatting():
    message = "Testing Python formatting"
    print(message)
    return True
```

```bash
# Bash commands
echo "Testing bash formatting"
ls -la
grep "pattern" file.txt
```

### Lists and Structure

**Unordered Lists:**

- First item
- Second item
  - Nested item
  - Another nested item
- Third item

**Ordered Lists:**

1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

### Links and References

- External link: [Claude AI](https://claude.ai)
- Documentation: [Markdown Guide](https://www.markdownguide.org)
- Local reference: [See section above](#headers-and-structure)

### Quotes and Callouts

> This is a blockquote to test quote formatting.
> It can span multiple lines and should be visually distinct.

> **Note:** Important information in a blockquote with formatting.

### Tables (if supported)

| Feature     | Status | Notes   |
| ----------- | ------ | ------- |
| Headers     | ✅     | Working |
| Code blocks | ✅     | Working |
| Links       | ✅     | Working |
| Tables      | ❓     | Testing |

### Special Characters and Edge Cases

Test handling of special characters: & < > " '

Mixed formatting: **Bold with `code` inside** and _italic with [links](https://example.com)_.

---

Please include all these elements in your response to thoroughly test the markdown rendering system in Ralph CLI.
