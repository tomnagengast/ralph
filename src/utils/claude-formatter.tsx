import React from 'react';
import {Box, Text} from 'ink';
import {
	ClaudeStreamEvent,
	ClaudeEventType,
	ContentBlockType,
	DeltaType,
} from '../types/claude-events.js';
import {smartRenderText} from './markdown-renderer.js';

// Utility function to format JSON with proper indentation
const formatJson = (obj: any): string => {
	try {
		return JSON.stringify(obj, null, 2);
	} catch {
		return String(obj);
	}
};

// Utility function to truncate long text
const truncateText = (text: string, maxLength: number = 100): string => {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + '...';
};

// Utility function to format token counts with cache information
const formatTokenUsage = (usage: any, prefix: string = '') => {
	if (!usage) return null;

	return (
		<Box flexDirection="column">
			{usage.input_tokens && (
				<Text dimColor>
					{prefix}Input tokens: {usage.input_tokens}
					{usage.cache_read_input_tokens
						? ` (${usage.cache_read_input_tokens} from cache)`
						: ''}
				</Text>
			)}
			{usage.output_tokens && (
				<Text dimColor>
					{prefix}Output tokens: {usage.output_tokens}
				</Text>
			)}
			{usage.cache_creation_input_tokens &&
				usage.cache_creation_input_tokens > 0 && (
					<Text dimColor>
						{prefix}Cache created: {usage.cache_creation_input_tokens} tokens
					</Text>
				)}
			{usage.cache_creation?.ephemeral_5m_input_tokens && (
				<Text dimColor>
					{prefix}Ephemeral 5m cache:{' '}
					{usage.cache_creation.ephemeral_5m_input_tokens} tokens
				</Text>
			)}
			{usage.cache_creation?.ephemeral_1h_input_tokens && (
				<Text dimColor>
					{prefix}Ephemeral 1h cache:{' '}
					{usage.cache_creation.ephemeral_1h_input_tokens} tokens
				</Text>
			)}
			{usage.service_tier && (
				<Text dimColor>
					{prefix}Service tier: {usage.service_tier}
				</Text>
			)}
		</Box>
	);
};

// Main formatter function that handles all Claude event types
export const formatClaudeEvent = (
	event: ClaudeStreamEvent,
	index: number,
): React.ReactNode => {
	switch (event.type) {
		case ClaudeEventType.MESSAGE_START:
			return (
				<Box key={index} flexDirection="column" marginBottom={1}>
					<Text bold color="magenta">
						📬 Message Started
					</Text>
					{event.message && (
						<Box paddingLeft={2} flexDirection="column">
							{event.message.model && (
								<Text dimColor>Model: {event.message.model}</Text>
							)}
							{event.message.id && (
								<Text dimColor>Message ID: {event.message.id}</Text>
							)}
							{formatTokenUsage(event.message.usage)}
						</Box>
					)}
				</Box>
			);

		case ClaudeEventType.CONTENT_BLOCK_START:
			return (
				<Box key={index} marginBottom={0.5}>
					<Text color="cyan">
						▶ Content Block{event.index !== undefined ? ` #${event.index}` : ''}
					</Text>
					{event.content_block && (
						<>
							{event.content_block.type === ContentBlockType.TOOL_USE && (
								<Text color="yellow"> 🔧 Tool: {event.content_block.name}</Text>
							)}
							{event.content_block.type === ContentBlockType.THINKING && (
								<Text color="blue"> 🤔 Thinking...</Text>
							)}
							{event.content_block.type === ContentBlockType.IMAGE && (
								<Text color="magenta"> 🖼️ Image</Text>
							)}
							{event.content_block.type === ContentBlockType.DOCUMENT && (
								<Text color="green">
									{' '}
									📄 Document: {event.content_block.document?.name}
								</Text>
							)}
							{event.content_block.type === ContentBlockType.WEB_SEARCH && (
								<Text color="cyan"> 🌐 Web Search</Text>
							)}
							{event.content_block.type ===
								ContentBlockType.SERVER_TOOL_USE && (
								<Text color="orange">
									{' '}
									🔨 Server Tool: {event.content_block.name}
								</Text>
							)}
						</>
					)}
				</Box>
			);

		case ClaudeEventType.CONTENT_BLOCK_DELTA:
			if (event.delta?.type === DeltaType.TEXT_DELTA && event.delta.text) {
				return (
					<Text key={index} color="green">
						{smartRenderText(event.delta.text)}
					</Text>
				);
			} else if (
				event.delta?.type === DeltaType.INPUT_JSON_DELTA &&
				event.delta.partial_json
			) {
				return (
					<Text key={index} color="yellow">
						{event.delta.partial_json}
					</Text>
				);
			} else if (
				event.delta?.type === DeltaType.THINKING_DELTA &&
				event.delta.text
			) {
				return (
					<Text key={index} color="blue" dimColor>
						{smartRenderText(event.delta.text)}
					</Text>
				);
			} else if (
				event.delta?.type === DeltaType.SIGNATURE_DELTA &&
				event.delta.signature
			) {
				return (
					<Box key={index} marginTop={0.5}>
						<Text dimColor>
							✓ Signature: {truncateText(event.delta.signature, 16)}...
						</Text>
					</Box>
				);
			}
			return null;

		case ClaudeEventType.CONTENT_BLOCK_STOP:
			return (
				<Box key={index} marginBottom={1}>
					<Text dimColor>■ Block End</Text>
				</Box>
			);

		case ClaudeEventType.MESSAGE_DELTA:
			if (event.delta?.stop_reason || event.delta?.usage) {
				return (
					<Box key={index} flexDirection="column" marginTop={1}>
						<Text color="magenta">📊 Message Update</Text>
						<Box paddingLeft={2} flexDirection="column">
							{event.delta.stop_reason && (
								<Text>Stop reason: {event.delta.stop_reason}</Text>
							)}
							{formatTokenUsage(event.delta.usage)}
						</Box>
					</Box>
				);
			}
			return null;

		case ClaudeEventType.MESSAGE_STOP:
			return (
				<Box key={index} marginTop={1}>
					<Text bold color="green">
						✅ Message Complete
					</Text>
				</Box>
			);

		case ClaudeEventType.PING:
			return (
				<Text key={index} dimColor>
					• ping
				</Text>
			);

		case ClaudeEventType.ERROR:
		case ClaudeEventType.OVERLOADED_ERROR:
			const isOverloaded = event.type === ClaudeEventType.OVERLOADED_ERROR;
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color="red">
						❌ {isOverloaded ? 'API Overloaded' : 'Error'}
					</Text>
					<Box paddingLeft={2} flexDirection="column">
						<Text color="red">
							{typeof event.error === 'string'
								? event.error
								: event.error?.message || 'Unknown error occurred'}
						</Text>
						{event.error &&
							typeof event.error === 'object' &&
							event.error.code && (
								<Text color="red" dimColor>
									Error code: {event.error.code}
								</Text>
							)}
						{isOverloaded && (
							<Text color="yellow" dimColor>
								Try again in a few moments...
							</Text>
						)}
					</Box>
				</Box>
			);

		case ClaudeEventType.RESULT:
			if (event.subtype === 'success' || (!event.is_error && !event.subtype)) {
				return (
					<Box key={index} flexDirection="column" marginY={1}>
						<Text bold color="green">
							✅ Task Complete
						</Text>
						<Box paddingLeft={2} flexDirection="column">
							{event.duration_ms && (
								<Text dimColor>
									⏱️ Duration: {(event.duration_ms / 1000).toFixed(1)}s
									{event.duration_api_ms &&
										` (API: ${(event.duration_api_ms / 1000).toFixed(1)}s)`}
								</Text>
							)}
							{event.num_turns && (
								<Text dimColor>🔄 Turns: {event.num_turns}</Text>
							)}
							{event.total_cost_usd && (
								<Text dimColor>
									💰 Cost: ${event.total_cost_usd.toFixed(4)}
								</Text>
							)}
							{event.session_id && (
								<Text dimColor>
									🔗 Session: {truncateText(event.session_id, 12)}
								</Text>
							)}
							{formatTokenUsage(event.usage)}
							{event.result && (
								<Box marginTop={0.5}>
									<Text wrap="wrap">{smartRenderText(event.result)}</Text>
								</Box>
							)}
						</Box>
					</Box>
				);
			} else if (event.subtype === 'error' || event.is_error) {
				return (
					<Box key={index} flexDirection="column" marginY={1}>
						<Text bold color="red">
							❌ Task Failed
						</Text>
						{event.result && (
							<Box paddingLeft={2}>
								<Text color="red">{smartRenderText(event.result)}</Text>
							</Box>
						)}
					</Box>
				);
			}
			return null;

		case ClaudeEventType.SYSTEM:
			if (event.subtype === 'init') {
				return (
					<Box key={index} flexDirection="column" marginY={1}>
						<Text bold color="blue">
							🚀 System Initialized
						</Text>
						<Box paddingLeft={2} flexDirection="column">
							{event.model && <Text dimColor>Model: {event.model}</Text>}
							{event.cwd && <Text dimColor>Directory: {event.cwd}</Text>}
							{event.tools && event.tools.length > 0 && (
								<Text dimColor>Tools: {event.tools.length} available</Text>
							)}
							{event.mcp_servers && event.mcp_servers.length > 0 && (
								<Text dimColor>
									MCP Servers: {event.mcp_servers.length} connected
								</Text>
							)}
							{event.output_style && (
								<Text dimColor>Output style: {event.output_style}</Text>
							)}
							{event.permissionMode && (
								<Text dimColor>Permission mode: {event.permissionMode}</Text>
							)}
							{event.apiKeySource && (
								<Text dimColor>API key source: {event.apiKeySource}</Text>
							)}
						</Box>
					</Box>
				);
			}
			return null;

		case ClaudeEventType.USER:
			return (
				<Box key={index} flexDirection="column" marginY={0.5}>
					<Text bold color="green">
						👤 User
					</Text>
					{event.message && (
						<Box paddingLeft={2}>
							<Text wrap="wrap">{formatJson(event.message.content)}</Text>
						</Box>
					)}
				</Box>
			);

		case ClaudeEventType.ASSISTANT:
			return (
				<Box key={index} flexDirection="column" marginY={0.5}>
					<Text bold color="blue">
						🤖 Assistant
					</Text>
					{event.message && (
						<Box paddingLeft={2} flexDirection="column">
							{event.message.content?.map((content: any, i: number) => {
								if (content.type === ContentBlockType.TEXT) {
									return (
										<Text key={i} wrap="wrap">
											{smartRenderText(content.text)}
										</Text>
									);
								} else if (content.type === ContentBlockType.TOOL_USE) {
									return (
										<Box key={i} flexDirection="column">
											<Text color="yellow">🔧 Using tool: {content.name}</Text>
											<Box paddingLeft={2}>
												<Text dimColor>{formatJson(content.input)}</Text>
											</Box>
										</Box>
									);
								} else if (content.type === ContentBlockType.THINKING) {
									return (
										<Box key={i} flexDirection="column">
											<Text color="blue">🤔 Thinking</Text>
											<Box paddingLeft={2}>
												<Text dimColor wrap="wrap">
													{smartRenderText(content.text)}
												</Text>
											</Box>
										</Box>
									);
								}
								return null;
							})}
							{formatTokenUsage(event.message.usage)}
						</Box>
					)}
				</Box>
			);

		case ClaudeEventType.TOOL_USE:
			return (
				<Box key={index} flexDirection="column" marginY={0.5}>
					<Text color="yellow">🔧 Tool Use: {event.tool_name}</Text>
					{event.tool_input && (
						<Box paddingLeft={2}>
							<Text dimColor>{formatJson(event.tool_input)}</Text>
						</Box>
					)}
				</Box>
			);

		case ClaudeEventType.TOOL_RESULT:
			return (
				<Box key={index} flexDirection="column" marginY={0.5}>
					<Text color="cyan">
						📋 Tool Result
						{event.tool_use_id && (
							<Text dimColor> (ID: {truncateText(event.tool_use_id, 8)})</Text>
						)}
					</Text>
					<Box paddingLeft={2}>
						<Text wrap="wrap">
							{formatJson(event.tool_result || event.content)}
						</Text>
					</Box>
				</Box>
			);

		// Legacy/fallback event types
		case ClaudeEventType.TEXT:
		case ClaudeEventType.CONTENT:
			return (
				<Text key={index} color="green" wrap="wrap">
					{smartRenderText(event.text || event.content || '')}
				</Text>
			);

		default:
			// For unknown event types, show raw JSON in dimmed text with better formatting
			return (
				<Box key={index} marginY={0.5}>
					<Text dimColor>
						{event.type && `[${event.type}] `}
						{formatJson(event)}
					</Text>
				</Box>
			);
	}
};

// Group consecutive text deltas for better readability
export const groupTextDeltas = (
	events: ClaudeStreamEvent[],
): (ClaudeStreamEvent | ClaudeStreamEvent[])[] => {
	const grouped: (ClaudeStreamEvent | ClaudeStreamEvent[])[] = [];
	let currentTextGroup: ClaudeStreamEvent[] = [];

	events.forEach(event => {
		if (
			event.type === ClaudeEventType.CONTENT_BLOCK_DELTA &&
			event.delta?.type === DeltaType.TEXT_DELTA
		) {
			currentTextGroup.push(event);
		} else {
			if (currentTextGroup.length > 0) {
				grouped.push(currentTextGroup);
				currentTextGroup = [];
			}
			grouped.push(event);
		}
	});

	if (currentTextGroup.length > 0) {
		grouped.push(currentTextGroup);
	}

	return grouped;
};

// Format grouped text deltas as a single block
export const formatGroupedTextDeltas = (
	events: ClaudeStreamEvent[],
): string => {
	const combinedText = events.map(e => e.delta?.text || '').join('');
	return smartRenderText(combinedText);
};
