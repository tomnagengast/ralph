/**
 * Simple markdown renderer for terminal display
 * This provides basic markdown formatting without external dependencies
 * @param text The markdown text to render
 * @returns Basic terminal-formatted text
 */
export function renderMarkdown(text: string): string {
	try {
		// Simple markdown transformations for terminal display
		let result = text;

		// Headers (convert to uppercase with decoration)
		result = result.replace(/^#### (.+)$/gm, '› $1');
		result = result.replace(/^### (.+)$/gm, '▸ $1');
		result = result.replace(/^## (.+)$/gm, '▸▸ $1');
		result = result.replace(/^# (.+)$/gm, '▸▸▸ $1');

		// Horizontal rules
		result = result.replace(/^---+$/gm, '━━━━━━━━━━━━━━━━━━━━');
		result = result.replace(/^\*\*\*+$/gm, '━━━━━━━━━━━━━━━━━━━━');

		// Lists (unordered)
		result = result.replace(/^\s*[-*+] (.+)$/gm, '  • $1');
		// Lists (ordered)
		result = result.replace(/^\s*(\d+)\. (.+)$/gm, '  $1. $2');

		// Task lists
		result = result.replace(/^\s*- \[x\] (.+)$/gim, '  ✓ $1');
		result = result.replace(/^\s*- \[ \] (.+)$/gm, '  ☐ $1');

		// Blockquotes
		result = result.replace(/^> (.+)$/gm, '│ $1');

		// Bold text (remove ** but keep text uppercase for emphasis)
		result = result.replace(/\*\*(.+?)\*\*/g, (_, text) => text.toUpperCase());

		// Italic text (remove * but keep text)
		result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '_$1_');

		// Code blocks with enhanced formatting
		result = result.replace(/```([\w]*)?\n([\s\S]*?)```/g, (_, lang, code) => {
			const lines = code.split('\n');
			// Remove trailing empty line if present
			if (lines[lines.length - 1] === '') lines.pop();

			const maxLength = Math.max(...lines.map((l: string) => l.length), 20);
			const border = '─'.repeat(maxLength + 2);
			const formatted = lines
				.map((line: string) => '│ ' + line.padEnd(maxLength) + ' │')
				.join('\n');
			const langLabel = lang ? ` ${lang} ` : ' code ';

			return `╭─${langLabel}${border.substring(
				langLabel.length,
			)}╮\n${formatted}\n╰${border}──╯`;
		});

		// Inline code (preserve with better markers)
		result = result.replace(/`([^`]+)`/g, '｢$1｣');

		// Links (show text with URL indicator)
		result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ↗');

		// Tables (basic support)
		result = result.replace(/\|/g, '│');

		return result;
	} catch (error) {
		// Fallback to plain text if markdown rendering fails
		return text;
	}
}

/**
 * Check if text contains markdown syntax
 * @param text The text to check
 * @returns True if text appears to contain markdown
 */
export function isMarkdown(text: string): boolean {
	// Simple heuristics to detect markdown content
	const markdownPatterns = [
		/^#{1,6}\s+/m, // Headers
		/\*\*.*\*\*/, // Bold text
		/(?<!\*)\*[^*]+\*(?!\*)/, // Italic text (not bold)
		/`[^`]+`/, // Code spans
		/```[\s\S]*```/m, // Code blocks
		/^\s*[-*+]\s+/m, // Unordered lists
		/^\s*\d+\.\s+/m, // Ordered lists
		/^\s*>\s+/m, // Blockquotes
		/\[[^\]]+\]\([^)]+\)/, // Links
		/^\s*---+\s*$/m, // Horizontal rules
		/^\s*\|.*\|/m, // Tables
		/^\s*- \[(x| )\]/im, // Task lists
	];

	return markdownPatterns.some(pattern => pattern.test(text));
}

/**
 * Smart text renderer that detects and renders markdown if present
 * @param text The text to render
 * @returns Formatted text (markdown rendered if detected, plain text otherwise)
 */
export function smartRenderText(text: string): string {
	if (isMarkdown(text)) {
		return renderMarkdown(text);
	}
	return text;
}
