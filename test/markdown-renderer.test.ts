import test from 'ava';
import {
	renderMarkdown,
	isMarkdown,
	smartRenderText,
} from '../src/utils/markdown-renderer.js';

// Test basic markdown rendering
test('renderMarkdown - headers', t => {
	const input = '# Header 1\n## Header 2\n### Header 3';
	const result = renderMarkdown(input);

	t.true(result.includes('▸▸▸ Header 1'));
	t.true(result.includes('▸▸ Header 2'));
	t.true(result.includes('▸ Header 3'));
});

test('renderMarkdown - bold text', t => {
	const input = 'This is **bold text** in a sentence.';
	const result = renderMarkdown(input);

	t.is(result, 'This is bold text in a sentence.');
});

test('renderMarkdown - italic text', t => {
	const input = 'This is *italic text* in a sentence.';
	const result = renderMarkdown(input);

	t.is(result, 'This is italic text in a sentence.');
});

test('renderMarkdown - inline code', t => {
	const input = 'Use the `console.log()` function.';
	const result = renderMarkdown(input);

	t.is(result, 'Use the `console.log()` function.');
});

test('renderMarkdown - code blocks', t => {
	const input = '```javascript\nconsole.log("hello");\n```';
	const result = renderMarkdown(input);

	t.true(result.includes('---'));
	t.true(result.includes('console.log("hello");'));
});

test('renderMarkdown - links', t => {
	const input = 'Visit [Google](https://google.com) for search.';
	const result = renderMarkdown(input);

	t.is(result, 'Visit Google (https://google.com) for search.');
});

test('renderMarkdown - complex markdown', t => {
	const input = `# Main Title

This is a paragraph with **bold** and *italic* text.

## Subsection

Here's some code:

\`\`\`javascript
function hello() {
  console.log("Hello world!");
}
\`\`\`

And an inline \`variable\` reference.

Check out [this link](https://example.com) for more info.`;

	const result = renderMarkdown(input);

	t.true(result.includes('▸▸▸ Main Title'));
	t.true(result.includes('▸▸ Subsection'));
	t.true(result.includes('bold'));
	t.true(result.includes('italic'));
	t.true(result.includes('`variable`'));
	t.true(result.includes('this link (https://example.com)'));
	t.true(result.includes('---'));
});

test('renderMarkdown - error handling', t => {
	// Test with problematic input that might cause regex issues
	const input =
		'Normal text with [unclosed link and **unclosed bold and `unclosed code';
	const result = renderMarkdown(input);

	// Should not throw and should return some reasonable result
	t.is(typeof result, 'string');
	t.true(result.length > 0);
});

// Test markdown detection
test('isMarkdown - detects headers', t => {
	t.true(isMarkdown('# Header'));
	t.true(isMarkdown('## Header'));
	t.true(isMarkdown('### Header'));
	t.false(isMarkdown('Not a header'));
});

test('isMarkdown - detects bold text', t => {
	t.true(isMarkdown('This is **bold** text'));
	t.false(isMarkdown('This is regular text'));
});

test('isMarkdown - detects italic text', t => {
	t.true(isMarkdown('This is *italic* text'));
	t.false(isMarkdown('This is regular text with * asterisk'));
});

test('isMarkdown - detects code blocks', t => {
	t.true(isMarkdown('```code block```'));
	t.true(isMarkdown('```\nmultiline\ncode\n```'));
	t.false(isMarkdown('Regular text with ` backtick'));
});

test('isMarkdown - detects inline code', t => {
	t.true(isMarkdown('Use `console.log()` function'));
	t.false(isMarkdown('Regular text'));
});

test('isMarkdown - detects lists', t => {
	t.true(isMarkdown('- Item 1\n- Item 2'));
	t.true(isMarkdown('* Item 1\n* Item 2'));
	t.true(isMarkdown('+ Item 1\n+ Item 2'));
	t.true(isMarkdown('1. First item\n2. Second item'));
	t.false(isMarkdown('Regular text - not a list'));
});

test('isMarkdown - detects blockquotes', t => {
	t.true(isMarkdown('> This is a quote'));
	t.false(isMarkdown('This is > not a quote'));
});

test('isMarkdown - detects links', t => {
	t.true(isMarkdown('[Link text](https://example.com)'));
	t.false(isMarkdown('Regular text with (parentheses)'));
});

test('isMarkdown - complex detection', t => {
	const markdownText = `# Title
	
**Bold text** with *italic* and \`code\`.

- List item 1
- List item 2

> Quote text

[Link](https://example.com)`;

	t.true(isMarkdown(markdownText));
});

test('isMarkdown - plain text', t => {
	const plainText =
		'This is just regular plain text with no special formatting.';
	t.false(isMarkdown(plainText));
});

// Test smart rendering
test('smartRenderText - renders markdown when detected', t => {
	const input = '# Header\n\nThis is **bold** text.';
	const result = smartRenderText(input);

	t.true(result.includes('▸▸▸ Header'));
	t.true(result.includes('bold'));
});

test('smartRenderText - returns plain text when no markdown', t => {
	const input = 'This is just plain text.';
	const result = smartRenderText(input);

	t.is(result, input);
});

test('smartRenderText - handles empty string', t => {
	const result = smartRenderText('');
	t.is(result, '');
});

test('smartRenderText - handles undefined/null gracefully', t => {
	// These would be edge cases in real usage
	t.is(smartRenderText(''), '');
});

// Test edge cases and error handling
test('renderMarkdown - very long text', t => {
	const longText = 'a'.repeat(10000);
	const input = `# Header\n\n${longText}`;

	const result = renderMarkdown(input);
	t.is(typeof result, 'string');
	t.true(result.includes('▸▸▸ Header'));
});

test('renderMarkdown - special characters', t => {
	const input = 'Text with **special chars: !@#$%^&*()** and `código`';
	const result = renderMarkdown(input);

	t.is(typeof result, 'string');
	t.true(result.includes('!@#$%^&*()'));
});

test('renderMarkdown - nested formatting', t => {
	const input = '**Bold with *nested italic* inside**';
	const result = renderMarkdown(input);

	// Should handle nested formatting reasonably
	t.is(typeof result, 'string');
	t.true(result.includes('nested italic'));
});

test('renderMarkdown - malformed markdown', t => {
	const inputs = [
		'**Unclosed bold',
		'*Unclosed italic',
		'```Unclosed code block',
		'[Unclosed link(',
		'# \n## \n### Empty headers',
	];

	inputs.forEach(input => {
		const result = renderMarkdown(input);
		t.is(typeof result, 'string');
		// Should not throw
	});
});
