import React from 'react';
import {Box, Text} from 'ink';
import {
	ClaudeStreamEvent,
	ClaudeEventType,
	ContentBlockType,
	DeltaType,
} from '../types/claude-events.js';
import {smartRenderText} from './markdown-renderer.js';

// Utility function to format JSON with proper indentation and syntax highlighting
const formatJson = (obj: any, compact: boolean = false): React.ReactNode => {
	try {
		const jsonStr = compact
			? JSON.stringify(obj)
			: JSON.stringify(obj, null, 2);
		
		// For simple values, return as-is
		if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || obj === null) {
			return <Text color="cyan">{jsonStr}</Text>;
		}
		
		// For complex objects, format with syntax highlighting
		return (
			<Box flexDirection="column">
				{jsonStr.split('\n').map((line, i) => {
					// Apply color coding based on content
					let color: string | undefined;
					let dimColor = false;
					
					if (line.includes('"') && line.includes(':')) {
						// Property names
						const parts = line.split(':');
						const propName = parts[0];
						const value = parts.slice(1).join(':');
						
						return (
							<Text key={i}>
								<Text color="magenta">{propName}</Text>
								<Text dimColor>:</Text>
								<Text color={value.includes('"') ? "green" : "cyan"}>
									{value}
								</Text>
							</Text>
						);
					} else if (line.includes('{') || line.includes('}') || line.includes('[') || line.includes(']')) {
						// Brackets
						color = 'yellow';
						dimColor = true;
					} else if (line.includes('true') || line.includes('false') || line.includes('null')) {
						// Boolean/null values
						color = 'cyan';
					} else if (/\d+/.test(line)) {
						// Numbers
						color = 'cyan';
					} else {
						// Default
						dimColor = true;
					}
					
					return (
						<Text key={i} color={color} dimColor={dimColor}>
							{line}
						</Text>
					);
				})}
			</Box>
		);
	} catch {
		return <Text dimColor>{String(obj)}</Text>;
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
					<Box borderStyle="round" borderColor="magenta" paddingX={1}>
						<Text bold color="magenta">
							╭─ 📬 MESSAGE STARTED ─╮
						</Text>
					</Box>
					{event.message && (
						<Box paddingLeft={2} flexDirection="column">
							{event.message.model && (
								<Text>
									<Text color="blue">Model:</Text>
									<Text color="cyan"> {event.message.model}</Text>
								</Text>
							)}
							{event.message.id && (
								<Text>
									<Text color="blue">ID:</Text>
									<Text dimColor> {event.message.id}</Text>
								</Text>
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
							{event.content_block.type === ContentBlockType.REDACTED_THINKING && (
								<Text color="red">
									{' '}
									🔒 Redacted Thinking (Safety)
								</Text>
							)}
						</>
					)}
				</Box>
			);

		case ClaudeEventType.CONTENT_BLOCK_DELTA:
			if (event.delta?.type === DeltaType.TEXT_DELTA && event.delta.text) {
				return (
					<Text key={index} wrap="wrap">
						{smartRenderText(event.delta.text)}
					</Text>
				);
			} else if (
				event.delta?.type === DeltaType.INPUT_JSON_DELTA &&
				event.delta.partial_json
			) {
				// Try to parse and format JSON nicely
				try {
					const parsed = JSON.parse(event.delta.partial_json);
					return (
						<Box key={index} paddingLeft={1}>
							{formatJson(parsed, true)}
						</Box>
					);
				} catch {
					// If not valid JSON yet, show as-is
					return (
						<Text key={index} color="yellow" dimColor>
							{event.delta.partial_json}
						</Text>
					);
				}
			} else if (
				event.delta?.type === DeltaType.THINKING_DELTA &&
				event.delta.text
			) {
				return (
					<Box key={index} paddingLeft={1}>
						<Text color="blue" dimColor italic wrap="wrap">
							💭 {smartRenderText(event.delta.text)}
						</Text>
					</Box>
				);
			} else if (
				event.delta?.type === DeltaType.SIGNATURE_DELTA &&
				event.delta.signature
			) {
				return (
					<Box key={index} marginTop={0.5}>
						<Text color="green" dimColor>
							✅ Verified: {truncateText(event.delta.signature, 20)}...
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
				<Box key={index} marginTop={1} borderStyle="round" borderColor="green" paddingX={1}>
					<Text bold color="green">
						╰─ ✅ Message Complete ─╯
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
					<Box borderStyle="double" borderColor="red" paddingX={1}>
						<Text bold color="red">
							⚠️ {isOverloaded ? 'API OVERLOADED' : 'ERROR OCCURRED'}
						</Text>
					</Box>
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
									🆔 Error code: {event.error.code}
								</Text>
							)}
						{event.error &&
							typeof event.error === 'object' &&
							event.error.type && (
								<Text color="red" dimColor>
									🎯 Error type: {event.error.type}
								</Text>
							)}
						{isOverloaded && (
							<Box marginTop={0.5}>
								<Text color="yellow">
									🔄 Please retry in a few moments...
								</Text>
							</Box>
						)}
						{event.error && typeof event.error === 'object' && event.error.retry_after && (
							<Box marginTop={0.5}>
								<Text color="yellow">
									⏰ Retry after: {event.error.retry_after}s
								</Text>
							</Box>
						)}
						{event.error && typeof event.error === 'object' && event.error.rate_limit && (
							<Box marginTop={0.5} flexDirection="column">
								<Text color="yellow" bold>
									🚦 Rate Limit Information:
								</Text>
								{event.error.rate_limit.requests && (
									<Text color="yellow" dimColor>
										  Requests remaining: {event.error.rate_limit.requests}
									</Text>
								)}
								{event.error.rate_limit.tokens && (
									<Text color="yellow" dimColor>
										  Tokens remaining: {event.error.rate_limit.tokens}
									</Text>
								)}
								{event.error.rate_limit.reset_at && (
									<Text color="yellow" dimColor>
										  Resets at: {new Date(event.error.rate_limit.reset_at).toLocaleString()}
									</Text>
								)}
							</Box>
						)}
					</Box>
				</Box>
			);

		case ClaudeEventType.RESULT:
			if (event.subtype === 'success' || (!event.is_error && !event.subtype)) {
				return (
					<Box key={index} flexDirection="column" marginY={1}>
						<Box borderStyle="double" borderColor="green" paddingX={1}>
							<Text bold color="green">
								✨ TASK COMPLETED SUCCESSFULLY ✨
							</Text>
						</Box>
						<Box paddingLeft={2} flexDirection="column" marginTop={0.5}>
							{event.duration_ms && (
								<Text>
									<Text color="yellow">⏱️  Duration:</Text>
									<Text color="cyan"> {(event.duration_ms / 1000).toFixed(1)}s</Text>
									{event.duration_api_ms && (
										<Text dimColor> (API: {(event.duration_api_ms / 1000).toFixed(1)}s)</Text>
									)}
								</Text>
							)}
							{event.num_turns && (
								<Text>
									<Text color="yellow">🔄 Turns:</Text>
									<Text color="cyan"> {event.num_turns}</Text>
								</Text>
							)}
							{event.total_cost_usd && (
								<Text>
									<Text color="yellow">💰 Cost:</Text>
									<Text color="green"> ${event.total_cost_usd.toFixed(4)}</Text>
								</Text>
							)}
							{event.session_id && (
								<Text>
									<Text color="yellow">🔗 Session:</Text>
									<Text dimColor> {truncateText(event.session_id, 16)}</Text>
								</Text>
							)}
							{formatTokenUsage(event.usage)}
							{event.result && (
								<Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
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
							{typeof event.message.content === 'string' ? (
								<Text wrap="wrap">{smartRenderText(event.message.content)}</Text>
							) : (
								<Box>{formatJson(event.message.content)}</Box>
							)}
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
												{formatJson(content.input)}
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
								} else if (content.type === ContentBlockType.REDACTED_THINKING) {
									return (
										<Box key={i} flexDirection="column">
											<Text color="red">🔒 Redacted Thinking</Text>
											<Box paddingLeft={2}>
												<Text dimColor italic>
													[Content removed by safety system]
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
							{formatJson(event.tool_input)}
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
						{typeof (event.tool_result || event.content) === 'string' ? (
							<Text wrap="wrap">
								{smartRenderText(event.tool_result || event.content || '')}
							</Text>
						) : (
							<Box>{formatJson(event.tool_result || event.content)}</Box>
						)}
					</Box>
				</Box>
			);

		// Fine-grained tool streaming events (2025 beta)
		case ClaudeEventType.TOOL_USE_START:
			return (
				<Box key={index} flexDirection="column" marginY={0.5}>
					<Text color="yellow">
						🔧 Tool Stream Start: {event.tool_name}
						{event.tool_use_id && (
							<Text dimColor> [{truncateText(event.tool_use_id, 8)}]</Text>
						)}
					</Text>
				</Box>
			);
			
		case ClaudeEventType.TOOL_USE_DELTA:
			return (
				<Text key={index} color="yellow" dimColor>
					{event.delta?.partial_json || ''}
				</Text>
			);
			
		case ClaudeEventType.TOOL_USE_STOP:
			return (
				<Box key={index} marginBottom={0.5}>
					<Text dimColor>🔧 Tool Stream End</Text>
				</Box>
			);
		
		// Extended thinking events (Claude 4)
		case ClaudeEventType.THINKING_BLOCK_START:
			return (
				<Box key={index} flexDirection="column" marginY={0.5}>
					<Text bold color="blue">
						🧠 Extended Thinking Started
					</Text>
				</Box>
			);
			
		case ClaudeEventType.THINKING_BLOCK_DELTA:
			return (
				<Text key={index} color="blue" dimColor wrap="wrap">
					{smartRenderText(event.delta?.text || '')}
				</Text>
			);
			
		case ClaudeEventType.THINKING_BLOCK_SIGNATURE:
			return (
				<Box key={index} marginTop={0.5}>
					<Text dimColor>
						✓ Thinking verified: {truncateText(event.delta?.signature || '', 16)}...
					</Text>
				</Box>
			);
			
		case ClaudeEventType.THINKING_BLOCK_STOP:
			return (
				<Box key={index} marginBottom={0.5}>
					<Text dimColor>🧠 Thinking Complete</Text>
				</Box>
			);
		
		// Search result events
		case ClaudeEventType.SEARCH_RESULT_START:
			return (
				<Box key={index} flexDirection="column" marginY={0.5}>
					<Text bold color="cyan">
						🔍 Search Results
					</Text>
				</Box>
			);
			
		case ClaudeEventType.SEARCH_RESULT_DELTA:
			return (
				<Box key={index} paddingLeft={2}>
					<Text color="cyan" wrap="wrap">
						{smartRenderText(event.delta?.text || event.content || '')}
					</Text>
				</Box>
			);
			
		case ClaudeEventType.SEARCH_RESULT_STOP:
			return (
				<Box key={index} marginBottom={0.5}>
					<Text dimColor>🔍 Search Complete</Text>
				</Box>
			);
		
		// Code execution events (Claude 4)
		case ClaudeEventType.CODE_START:
			return (
				<Box key={index} flexDirection="column" marginY={0.5}>
					<Box borderStyle="single" borderColor="magenta" paddingX={1}>
						<Text bold color="magenta">
							💻 Code Execution
						</Text>
					</Box>
				</Box>
			);
			
		case ClaudeEventType.CODE_OUTPUT:
			return (
				<Box key={index} paddingLeft={2}>
					<Text color="gray">
						{event.content || event.text || ''}
					</Text>
				</Box>
			);
			
		case ClaudeEventType.CODE_ERROR:
			return (
				<Box key={index} paddingLeft={2}>
					<Text color="red">
						❌ Code Error: {typeof event.error === 'string' ? event.error : (event.error?.message || event.content || '')}
					</Text>
				</Box>
			);
			
		case ClaudeEventType.CODE_STOP:
			return (
				<Box key={index} marginBottom={0.5}>
					<Text dimColor>💻 Execution Complete</Text>
				</Box>
			);
		
		// File processing events
		case ClaudeEventType.FILE_START:
			return (
				<Box key={index} flexDirection="column" marginY={0.5}>
					<Text bold color="green">
						📁 Processing File: {event['file_name'] || 'Unknown'}
					</Text>
				</Box>
			);
			
		case ClaudeEventType.FILE_CHUNK:
			return (
				<Box key={index} paddingLeft={2}>
					<Text dimColor>
						{truncateText(event.content || '', 100)}
					</Text>
				</Box>
			);
			
		case ClaudeEventType.FILE_ERROR:
			return (
				<Box key={index} paddingLeft={2}>
					<Text color="red">
						❌ File Error: {typeof event.error === 'string' ? event.error : (event.error?.message || event.content || '')}
					</Text>
				</Box>
			);
			
		case ClaudeEventType.FILE_STOP:
			return (
				<Box key={index} marginBottom={0.5}>
					<Text dimColor>📁 File Processing Complete</Text>
				</Box>
			);
		
		// Connection events
		case ClaudeEventType.CONNECTION_START:
			return (
				<Box key={index} marginY={0.5}>
					<Text color="green">
						🔗 Connection Established
					</Text>
				</Box>
			);
			
		case ClaudeEventType.CONNECTION_PING:
			return (
				<Text key={index} dimColor>
					• connection ping
				</Text>
			);
			
		case ClaudeEventType.CONNECTION_ERROR:
			return (
				<Box key={index} marginY={0.5}>
					<Text color="red">
						❌ Connection Error: {typeof event.error === 'string' ? event.error : (event.error?.message || 'Unknown error')}
					</Text>
				</Box>
			);
			
		case ClaudeEventType.CONNECTION_CLOSE:
			return (
				<Box key={index} marginY={0.5}>
					<Text color="yellow">
						🔗 Connection Closed
					</Text>
				</Box>
			);
		
		// Specific error types
		case ClaudeEventType.INVALID_REQUEST_ERROR:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color="red">
						⚠️ Invalid Request (400)
					</Text>
					<Box paddingLeft={2}>
						<Text color="red">{typeof event.error === 'string' ? event.error : (event.error?.message || 'Request format or content is invalid')}</Text>
					</Box>
				</Box>
			);
			
		case ClaudeEventType.AUTHENTICATION_ERROR:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color="red">
						🔒 Authentication Failed (401)
					</Text>
					<Box paddingLeft={2}>
						<Text color="red">{typeof event.error === 'string' ? event.error : (event.error?.message || 'API key is invalid or missing')}</Text>
					</Box>
				</Box>
			);
			
		case ClaudeEventType.PERMISSION_ERROR:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color="red">
						🚫 Permission Denied (403)
					</Text>
					<Box paddingLeft={2}>
						<Text color="red">{typeof event.error === 'string' ? event.error : (event.error?.message || 'Insufficient permissions for this operation')}</Text>
					</Box>
				</Box>
			);
			
		case ClaudeEventType.NOT_FOUND_ERROR:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color="red">
						❓ Not Found (404)
					</Text>
					<Box paddingLeft={2}>
						<Text color="red">{typeof event.error === 'string' ? event.error : (event.error?.message || 'Resource not found')}</Text>
					</Box>
				</Box>
			);
			
		case ClaudeEventType.REQUEST_TOO_LARGE:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color="red">
						📦 Request Too Large (413)
					</Text>
					<Box paddingLeft={2}>
						<Text color="red">{typeof event.error === 'string' ? event.error : (event.error?.message || 'Request exceeds 32MB limit')}</Text>
					</Box>
				</Box>
			);
			
		case ClaudeEventType.RATE_LIMIT_ERROR:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color="red">
						⏱️ Rate Limit Exceeded (429)
					</Text>
					<Box paddingLeft={2}>
						<Text color="red">{typeof event.error === 'string' ? event.error : (event.error?.message || 'Too many requests, please slow down')}</Text>
						{event['retry_after'] && (
							<Text color="yellow">Retry after: {event['retry_after']}s</Text>
						)}
					</Box>
				</Box>
			);
			
		case ClaudeEventType.API_ERROR:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color="red">
						💥 API Error (500)
					</Text>
					<Box paddingLeft={2}>
						<Text color="red">{typeof event.error === 'string' ? event.error : (event.error?.message || 'Internal Anthropic system error')}</Text>
						<Text color="yellow">Please try again later</Text>
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
				<Box key={index} marginY={0.5} flexDirection="column">
					{event.type && (
						<Text dimColor bold>
							[{event.type}]
						</Text>
					)}
					<Box paddingLeft={2}>
						{formatJson(event)}
					</Box>
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
