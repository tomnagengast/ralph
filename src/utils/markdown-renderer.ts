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
		result = result.replace(/^### (.+)$/gm, '▸ $1');
		result = result.replace(/^## (.+)$/gm, '▸▸ $1');
		result = result.replace(/^# (.+)$/gm, '▸▸▸ $1');

		// Bold text (remove ** but keep text)
		result = result.replace(/\*\*(.+?)\*\*/g, '$1');

		// Italic text (remove * but keep text)
		result = result.replace(/\*(.+?)\*/g, '$1');

		// Code blocks (preserve with simple formatting)
		result = result.replace(/```[\s\S]*?```/g, match => {
			return match.replace(/```/g, '---');
		});

		// Inline code (preserve with backticks)
		result = result.replace(/`([^`]+)`/g, '`$1`');

		// Links (show text and URL)
		result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

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
		/\*.*\*/, // Italic text
		/`.*`/, // Code spans
		/```[\s\S]*```/m, // Code blocks
		/^\s*[-*+]\s+/m, // Unordered lists
		/^\s*\d+\.\s+/m, // Ordered lists
		/^\s*>\s+/m, // Blockquotes
		/\[.*\]\(.*\)/, // Links
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
