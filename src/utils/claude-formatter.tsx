import React from 'react';
import {Box, Text} from 'ink';
import {
	ClaudeStreamEvent,
	ClaudeEventType,
	ContentBlockType,
	DeltaType,
} from '../types/claude-events.js';
import {smartRenderText} from './markdown-renderer.js';
import {getColorManager} from './color-schemes.js';

// Utility function to format JSON with proper indentation and syntax highlighting
const formatJson = (obj: any, compact: boolean = false): React.ReactNode => {
	const colorManager = getColorManager();

	try {
		const jsonStr = compact
			? JSON.stringify(obj)
			: JSON.stringify(obj, null, 2);

		// For simple values, return as-is
		if (
			typeof obj === 'string' ||
			typeof obj === 'number' ||
			typeof obj === 'boolean' ||
			obj === null
		) {
			return <Text color={colorManager.jsonNumber()}>{jsonStr}</Text>;
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
								<Text color={colorManager.jsonProperty()}>{propName}</Text>
								<Text dimColor>:</Text>
								<Text
									color={
										value.includes('"')
											? colorManager.jsonString()
											: colorManager.jsonNumber()
									}
								>
									{value}
								</Text>
							</Text>
						);
					} else if (
						line.includes('{') ||
						line.includes('}') ||
						line.includes('[') ||
						line.includes(']')
					) {
						// Brackets
						color = colorManager.jsonBracket();
						dimColor = true;
					} else if (
						line.includes('true') ||
						line.includes('false') ||
						line.includes('null')
					) {
						// Boolean/null values
						color = colorManager.jsonBoolean();
					} else if (/\d+/.test(line)) {
						// Numbers
						color = colorManager.jsonNumber();
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
const formatTokenUsage = (
	usage: any,
	prefix: string = '',
	verbosity: 'minimal' | 'normal' | 'verbose' | 'debug' = 'normal',
) => {
	if (!usage) return null;

	// Don't show token usage in minimal mode
	if (verbosity === 'minimal') return null;

	return (
		<Box flexDirection="column">
			{usage.input_tokens && (
				<Text dimColor>
					{prefix}Input tokens: {usage.input_tokens}
					{(verbosity === 'verbose' || verbosity === 'debug') &&
					usage.cache_read_input_tokens
						? ` (${usage.cache_read_input_tokens} from cache)`
						: ''}
				</Text>
			)}
			{usage.output_tokens && (
				<Text dimColor>
					{prefix}Output tokens: {usage.output_tokens}
				</Text>
			)}
			{(verbosity === 'verbose' || verbosity === 'debug') &&
				usage.cache_creation_input_tokens &&
				usage.cache_creation_input_tokens > 0 && (
					<Text dimColor>
						{prefix}Cache created: {usage.cache_creation_input_tokens} tokens
					</Text>
				)}
			{(verbosity === 'verbose' || verbosity === 'debug') &&
				usage.cache_creation?.ephemeral_5m_input_tokens && (
					<Text dimColor>
						{prefix}Ephemeral 5m cache:{' '}
						{usage.cache_creation.ephemeral_5m_input_tokens} tokens
					</Text>
				)}
			{(verbosity === 'verbose' || verbosity === 'debug') &&
				usage.cache_creation?.ephemeral_1h_input_tokens && (
					<Text dimColor>
						{prefix}Ephemeral 1h cache:{' '}
						{usage.cache_creation.ephemeral_1h_input_tokens} tokens
					</Text>
				)}
			{(verbosity === 'verbose' || verbosity === 'debug') &&
				usage.service_tier && (
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
	verbosity: 'minimal' | 'normal' | 'verbose' | 'debug' = 'normal',
): React.ReactNode => {
	const colorManager = getColorManager();
	// Early return for minimal verbosity - only show essential content
	if (verbosity === 'minimal') {
		switch (event.type) {
			case ClaudeEventType.CONTENT_BLOCK_DELTA:
				if (event.delta?.type === DeltaType.TEXT_DELTA && event.delta.text) {
					return (
						<Text key={index} wrap="wrap">
							{smartRenderText(event.delta.text)}
						</Text>
					);
				}
				return null;
			case ClaudeEventType.ERROR:
			case ClaudeEventType.OVERLOADED_ERROR:
			case ClaudeEventType.INVALID_REQUEST_ERROR:
			case ClaudeEventType.AUTHENTICATION_ERROR:
			case ClaudeEventType.PERMISSION_ERROR:
			case ClaudeEventType.NOT_FOUND_ERROR:
			case ClaudeEventType.REQUEST_TOO_LARGE:
			case ClaudeEventType.RATE_LIMIT_ERROR:
			case ClaudeEventType.API_ERROR:
				const isOverloaded = event.type === ClaudeEventType.OVERLOADED_ERROR;
				return (
					<Box key={index} flexDirection="column" marginY={1}>
						<Text bold color={colorManager.error()}>
							⚠️ {isOverloaded ? 'API OVERLOADED' : 'ERROR OCCURRED'}
						</Text>
						<Box paddingLeft={2}>
							<Text color={colorManager.error()}>
								{typeof event.error === 'string'
									? event.error
									: event.error?.message || 'Unknown error occurred'}
							</Text>
						</Box>
					</Box>
				);
			case ClaudeEventType.RESULT:
				if (event.result) {
					return (
						<Box key={index} marginTop={1}>
							<Text wrap="wrap">{smartRenderText(event.result)}</Text>
						</Box>
					);
				}
				return null;
			default:
				return null;
		}
	}

	switch (event.type) {
		case ClaudeEventType.MESSAGE_START:
			if (verbosity === 'debug') {
				return (
					<Box key={index} flexDirection="column" marginBottom={1}>
						<Box
							borderStyle="round"
							borderColor={colorManager.messageStart()}
							paddingX={1}
						>
							<Text bold color={colorManager.messageStart()}>
								╭─ 📬 MESSAGE STARTED ─╮
							</Text>
						</Box>
						{event.message && (
							<Box paddingLeft={2} flexDirection="column">
								{event.message.model && (
									<Text>
										<Text color={colorManager.info()}>Model:</Text>
										<Text color={colorManager.primary()}>
											{' '}
											{event.message.model}
										</Text>
									</Text>
								)}
								{event.message.id && (
									<Text>
										<Text color={colorManager.info()}>ID:</Text>
										<Text dimColor> {event.message.id}</Text>
									</Text>
								)}
								{formatTokenUsage(event.message.usage, '', verbosity)}
								<Box marginTop={0.5}>
									<Text dimColor bold>
										DEBUG - Raw Event:
									</Text>
									<Box paddingLeft={2}>{formatJson(event)}</Box>
								</Box>
							</Box>
						)}
					</Box>
				);
			} else if (verbosity === 'verbose') {
				return (
					<Box key={index} flexDirection="column" marginBottom={1}>
						<Box
							borderStyle="round"
							borderColor={colorManager.messageStart()}
							paddingX={1}
						>
							<Text bold color={colorManager.messageStart()}>
								╭─ 📬 MESSAGE STARTED ─╮
							</Text>
						</Box>
						{event.message && (
							<Box paddingLeft={2} flexDirection="column">
								{event.message.model && (
									<Text>
										<Text color={colorManager.info()}>Model:</Text>
										<Text color={colorManager.primary()}>
											{' '}
											{event.message.model}
										</Text>
									</Text>
								)}
								{event.message.id && (
									<Text>
										<Text color={colorManager.info()}>ID:</Text>
										<Text dimColor> {event.message.id}</Text>
									</Text>
								)}
								{formatTokenUsage(event.message.usage, '', verbosity)}
							</Box>
						)}
					</Box>
				);
			} else {
				// Normal verbosity - simplified display
				return (
					<Box key={index} marginBottom={0.5}>
						<Text bold color={colorManager.secondary()}>
							📬 Message Started
						</Text>
						{event.message?.model && (
							<Text dimColor> ({event.message.model})</Text>
						)}
					</Box>
				);
			}

		case ClaudeEventType.CONTENT_BLOCK_START:
			if (verbosity === 'debug') {
				return (
					<Box key={index} flexDirection="column" marginBottom={0.5}>
						<Text color={colorManager.primary()}>
							▶ Content Block
							{event.index !== undefined ? ` #${event.index}` : ''}
						</Text>
						{event.content_block && (
							<>
								{event.content_block.type === ContentBlockType.TOOL_USE && (
									<Text color={colorManager.warning()}>
										{' '}
										🔧 Tool: {event.content_block.name}
									</Text>
								)}
								{event.content_block.type === ContentBlockType.THINKING && (
									<Text color={colorManager.thinking()}> 🤔 Thinking...</Text>
								)}
								{event.content_block.type === ContentBlockType.IMAGE && (
									<Text color={colorManager.secondary()}> 🖼️ Image</Text>
								)}
								{event.content_block.type === ContentBlockType.DOCUMENT && (
									<Text color={colorManager.success()}>
										{' '}
										📄 Document: {event.content_block.document?.name}
									</Text>
								)}
								{event.content_block.type === ContentBlockType.WEB_SEARCH && (
									<Text color={colorManager.primary()}> 🌐 Web Search</Text>
								)}
								{event.content_block.type ===
									ContentBlockType.SERVER_TOOL_USE && (
									<Text color={colorManager.toolUse()}>
										{' '}
										🔨 Server Tool: {event.content_block.name}
									</Text>
								)}
								{event.content_block.type ===
									ContentBlockType.REDACTED_THINKING && (
									<Text color={colorManager.error()}>
										{' '}
										🔒 Redacted Thinking (Safety)
									</Text>
								)}
							</>
						)}
						<Box marginTop={0.5} paddingLeft={2}>
							<Text dimColor bold>
								DEBUG - Raw Event:
							</Text>
							<Box paddingLeft={2}>{formatJson(event)}</Box>
						</Box>
					</Box>
				);
			} else if (verbosity === 'verbose') {
				return (
					<Box key={index} marginBottom={0.5}>
						<Text color={colorManager.primary()}>
							▶ Content Block
							{event.index !== undefined ? ` #${event.index}` : ''}
						</Text>
						{event.content_block && (
							<>
								{event.content_block.type === ContentBlockType.TOOL_USE && (
									<Text color={colorManager.warning()}>
										{' '}
										🔧 Tool: {event.content_block.name}
									</Text>
								)}
								{event.content_block.type === ContentBlockType.THINKING && (
									<Text color={colorManager.thinking()}> 🤔 Thinking...</Text>
								)}
								{event.content_block.type === ContentBlockType.IMAGE && (
									<Text color={colorManager.secondary()}> 🖼️ Image</Text>
								)}
								{event.content_block.type === ContentBlockType.DOCUMENT && (
									<Text color={colorManager.success()}>
										{' '}
										📄 Document: {event.content_block.document?.name}
									</Text>
								)}
								{event.content_block.type === ContentBlockType.WEB_SEARCH && (
									<Text color={colorManager.primary()}> 🌐 Web Search</Text>
								)}
								{event.content_block.type ===
									ContentBlockType.SERVER_TOOL_USE && (
									<Text color={colorManager.toolUse()}>
										{' '}
										🔨 Server Tool: {event.content_block.name}
									</Text>
								)}
								{event.content_block.type ===
									ContentBlockType.REDACTED_THINKING && (
									<Text color={colorManager.error()}>
										{' '}
										🔒 Redacted Thinking (Safety)
									</Text>
								)}
							</>
						)}
					</Box>
				);
			} else {
				// Normal verbosity - show important block types only
				if (event.content_block) {
					if (event.content_block.type === ContentBlockType.TOOL_USE) {
						return (
							<Text key={index} color={colorManager.warning()}>
								🔧 Tool: {event.content_block.name}
							</Text>
						);
					} else if (event.content_block.type === ContentBlockType.THINKING) {
						return (
							<Text key={index} color={colorManager.info()}>
								🤔 Thinking...
							</Text>
						);
					}
				}
				return null;
			}

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
						<Text key={index} color={colorManager.warning()} dimColor>
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
						<Text color={colorManager.info()} dimColor italic wrap="wrap">
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
						<Text color={colorManager.success()} dimColor>
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
						<Text color={colorManager.secondary()}>📊 Message Update</Text>
						<Box paddingLeft={2} flexDirection="column">
							{event.delta.stop_reason && (
								<Text>Stop reason: {event.delta.stop_reason}</Text>
							)}
							{formatTokenUsage(event.delta.usage, '', verbosity)}
						</Box>
					</Box>
				);
			}
			return null;

		case ClaudeEventType.MESSAGE_STOP:
			if (verbosity === 'debug' || verbosity === 'verbose') {
				return (
					<Box
						key={index}
						marginTop={1}
						borderStyle="round"
						borderColor={colorManager.success()}
						paddingX={1}
					>
						<Text bold color={colorManager.success()}>
							╰─ ✅ Message Complete ─╯
						</Text>
						{verbosity === 'debug' && (
							<Box marginTop={0.5} paddingLeft={2}>
								<Text dimColor bold>
									DEBUG - Raw Event:
								</Text>
								<Box paddingLeft={2}>{formatJson(event)}</Box>
							</Box>
						)}
					</Box>
				);
			} else if (verbosity === 'normal') {
				return (
					<Text key={index} color={colorManager.success()} bold>
						✅ Complete
					</Text>
				);
			} else {
				// Minimal - don't show completion message
				return null;
			}

		case ClaudeEventType.PING:
			if (verbosity === 'debug') {
				return (
					<Text key={index} dimColor>
						• ping
					</Text>
				);
			} else {
				// Don't show pings in other verbosity levels
				return null;
			}

		case ClaudeEventType.ERROR:
		case ClaudeEventType.OVERLOADED_ERROR:
			const isOverloaded = event.type === ClaudeEventType.OVERLOADED_ERROR;
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Box
						borderStyle="double"
						borderColor={colorManager.error()}
						paddingX={1}
					>
						<Text bold color={colorManager.error()}>
							⚠️ {isOverloaded ? 'API OVERLOADED' : 'ERROR OCCURRED'}
						</Text>
					</Box>
					<Box paddingLeft={2} flexDirection="column">
						<Text color={colorManager.error()}>
							{typeof event.error === 'string'
								? event.error
								: event.error?.message || 'Unknown error occurred'}
						</Text>
						{event.error &&
							typeof event.error === 'object' &&
							event.error.code && (
								<Text color={colorManager.error()} dimColor>
									🆔 Error code: {event.error.code}
								</Text>
							)}
						{event.error &&
							typeof event.error === 'object' &&
							event.error.type && (
								<Text color={colorManager.error()} dimColor>
									🎯 Error type: {event.error.type}
								</Text>
							)}
						{isOverloaded && (
							<Box marginTop={0.5}>
								<Text color={colorManager.warning()}>
									🔄 Please retry in a few moments...
								</Text>
							</Box>
						)}
						{event.error &&
							typeof event.error === 'object' &&
							event.error.retry_after && (
								<Box marginTop={0.5}>
									<Text color={colorManager.warning()}>
										⏰ Retry after: {event.error.retry_after}s
									</Text>
								</Box>
							)}
						{event.error &&
							typeof event.error === 'object' &&
							event.error.rate_limit && (
								<Box marginTop={0.5} flexDirection="column">
									<Text color={colorManager.warning()} bold>
										🚦 Rate Limit Information:
									</Text>
									{event.error.rate_limit.requests && (
										<Text color={colorManager.warning()} dimColor>
											Requests remaining: {event.error.rate_limit.requests}
										</Text>
									)}
									{event.error.rate_limit.tokens && (
										<Text color={colorManager.warning()} dimColor>
											Tokens remaining: {event.error.rate_limit.tokens}
										</Text>
									)}
									{event.error.rate_limit.reset_at && (
										<Text color={colorManager.warning()} dimColor>
											Resets at:{' '}
											{new Date(
												event.error.rate_limit.reset_at,
											).toLocaleString()}
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
						<Box
							borderStyle="double"
							borderColor={colorManager.success()}
							paddingX={1}
						>
							<Text bold color={colorManager.success()}>
								✨ TASK COMPLETED SUCCESSFULLY ✨
							</Text>
						</Box>
						<Box paddingLeft={2} flexDirection="column" marginTop={0.5}>
							{event.duration_ms && (
								<Text>
									<Text color={colorManager.warning()}>⏱️ Duration:</Text>
									<Text color={colorManager.primary()}>
										{' '}
										{(event.duration_ms / 1000).toFixed(1)}s
									</Text>
									{event.duration_api_ms && (
										<Text dimColor>
											{' '}
											(API: {(event.duration_api_ms / 1000).toFixed(1)}s)
										</Text>
									)}
								</Text>
							)}
							{event.num_turns && (
								<Text>
									<Text color={colorManager.warning()}>🔄 Turns:</Text>
									<Text color={colorManager.primary()}> {event.num_turns}</Text>
								</Text>
							)}
							{event.total_cost_usd && (
								<Text>
									<Text color={colorManager.warning()}>💰 Cost:</Text>
									<Text color={colorManager.success()}>
										{' '}
										${event.total_cost_usd.toFixed(4)}
									</Text>
								</Text>
							)}
							{event.session_id && (
								<Text>
									<Text color={colorManager.warning()}>🔗 Session:</Text>
									<Text dimColor> {truncateText(event.session_id, 16)}</Text>
								</Text>
							)}
							{formatTokenUsage(event.usage, '', verbosity)}
							{event.result && (
								<Box
									marginTop={1}
									borderStyle="single"
									borderColor={colorManager.borderSecondary()}
									paddingX={1}
								>
									<Text wrap="wrap">{smartRenderText(event.result)}</Text>
								</Box>
							)}
						</Box>
					</Box>
				);
			} else if (event.subtype === 'error' || event.is_error) {
				return (
					<Box key={index} flexDirection="column" marginY={1}>
						<Text bold color={colorManager.error()}>
							❌ Task Failed
						</Text>
						{event.result && (
							<Box paddingLeft={2}>
								<Text color={colorManager.error()}>
									{smartRenderText(event.result)}
								</Text>
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
						<Text bold color={colorManager.info()}>
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
					<Text bold color={colorManager.success()}>
						👤 User
					</Text>
					{event.message && (
						<Box paddingLeft={2}>
							{typeof event.message.content === 'string' ? (
								<Text wrap="wrap">
									{smartRenderText(event.message.content)}
								</Text>
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
					<Text bold color={colorManager.info()}>
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
											<Text color={colorManager.toolUse()}>
												🔧 Using tool: {content.name}
											</Text>
											<Box paddingLeft={2}>{formatJson(content.input)}</Box>
										</Box>
									);
								} else if (content.type === ContentBlockType.THINKING) {
									return (
										<Box key={i} flexDirection="column">
											<Text color={colorManager.thinking()}>🤔 Thinking</Text>
											<Box paddingLeft={2}>
												<Text dimColor wrap="wrap">
													{smartRenderText(content.text)}
												</Text>
											</Box>
										</Box>
									);
								} else if (
									content.type === ContentBlockType.REDACTED_THINKING
								) {
									return (
										<Box key={i} flexDirection="column">
											<Text color={colorManager.error()}>
												🔒 Redacted Thinking
											</Text>
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
					<Text color={colorManager.toolUse()}>
						🔧 Tool Use: {event.tool_name}
					</Text>
					{event.tool_input && (
						<Box paddingLeft={2}>{formatJson(event.tool_input)}</Box>
					)}
				</Box>
			);

		case ClaudeEventType.TOOL_RESULT:
			return (
				<Box key={index} flexDirection="column" marginY={0.5}>
					<Text color={colorManager.primary()}>
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
					<Text color={colorManager.warning()}>
						🔧 Tool Stream Start: {event.tool_name}
						{event.tool_use_id && (
							<Text dimColor> [{truncateText(event.tool_use_id, 8)}]</Text>
						)}
					</Text>
				</Box>
			);

		case ClaudeEventType.TOOL_USE_DELTA:
			return (
				<Text key={index} color={colorManager.warning()} dimColor>
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
					<Text bold color={colorManager.info()}>
						🧠 Extended Thinking Started
					</Text>
				</Box>
			);

		case ClaudeEventType.THINKING_BLOCK_DELTA:
			return (
				<Text key={index} color={colorManager.info()} dimColor wrap="wrap">
					{smartRenderText(event.delta?.text || '')}
				</Text>
			);

		case ClaudeEventType.THINKING_BLOCK_SIGNATURE:
			return (
				<Box key={index} marginTop={0.5}>
					<Text dimColor>
						✓ Thinking verified:{' '}
						{truncateText(event.delta?.signature || '', 16)}...
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
					<Text bold color={colorManager.primary()}>
						🔍 Search Results
					</Text>
				</Box>
			);

		case ClaudeEventType.SEARCH_RESULT_DELTA:
			return (
				<Box key={index} paddingLeft={2}>
					<Text color={colorManager.primary()} wrap="wrap">
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
					<Box
						borderStyle="single"
						borderColor={colorManager.messageStart()}
						paddingX={1}
					>
						<Text bold color={colorManager.secondary()}>
							💻 Code Execution
						</Text>
					</Box>
				</Box>
			);

		case ClaudeEventType.CODE_OUTPUT:
			return (
				<Box key={index} paddingLeft={2}>
					<Text color={colorManager.textDim()}>
						{event.content || event.text || ''}
					</Text>
				</Box>
			);

		case ClaudeEventType.CODE_ERROR:
			return (
				<Box key={index} paddingLeft={2}>
					<Text color={colorManager.error()}>
						❌ Code Error:{' '}
						{typeof event.error === 'string'
							? event.error
							: event.error?.message || event.content || ''}
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
					<Text bold color={colorManager.success()}>
						📁 Processing File: {event['file_name'] || 'Unknown'}
					</Text>
				</Box>
			);

		case ClaudeEventType.FILE_CHUNK:
			return (
				<Box key={index} paddingLeft={2}>
					<Text dimColor>{truncateText(event.content || '', 100)}</Text>
				</Box>
			);

		case ClaudeEventType.FILE_ERROR:
			return (
				<Box key={index} paddingLeft={2}>
					<Text color={colorManager.error()}>
						❌ File Error:{' '}
						{typeof event.error === 'string'
							? event.error
							: event.error?.message || event.content || ''}
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
					<Text color={colorManager.success()}>🔗 Connection Established</Text>
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
					<Text color={colorManager.error()}>
						❌ Connection Error:{' '}
						{typeof event.error === 'string'
							? event.error
							: event.error?.message || 'Unknown error'}
					</Text>
				</Box>
			);

		case ClaudeEventType.CONNECTION_CLOSE:
			return (
				<Box key={index} marginY={0.5}>
					<Text color={colorManager.warning()}>🔗 Connection Closed</Text>
				</Box>
			);

		// Specific error types
		case ClaudeEventType.INVALID_REQUEST_ERROR:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color={colorManager.error()}>
						⚠️ Invalid Request (400)
					</Text>
					<Box paddingLeft={2}>
						<Text color={colorManager.error()}>
							{typeof event.error === 'string'
								? event.error
								: event.error?.message ||
								  'Request format or content is invalid'}
						</Text>
					</Box>
				</Box>
			);

		case ClaudeEventType.AUTHENTICATION_ERROR:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color={colorManager.error()}>
						🔒 Authentication Failed (401)
					</Text>
					<Box paddingLeft={2}>
						<Text color={colorManager.error()}>
							{typeof event.error === 'string'
								? event.error
								: event.error?.message || 'API key is invalid or missing'}
						</Text>
					</Box>
				</Box>
			);

		case ClaudeEventType.PERMISSION_ERROR:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color={colorManager.error()}>
						🚫 Permission Denied (403)
					</Text>
					<Box paddingLeft={2}>
						<Text color={colorManager.error()}>
							{typeof event.error === 'string'
								? event.error
								: event.error?.message ||
								  'Insufficient permissions for this operation'}
						</Text>
					</Box>
				</Box>
			);

		case ClaudeEventType.NOT_FOUND_ERROR:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color={colorManager.error()}>
						❓ Not Found (404)
					</Text>
					<Box paddingLeft={2}>
						<Text color={colorManager.error()}>
							{typeof event.error === 'string'
								? event.error
								: event.error?.message || 'Resource not found'}
						</Text>
					</Box>
				</Box>
			);

		case ClaudeEventType.REQUEST_TOO_LARGE:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color={colorManager.error()}>
						📦 Request Too Large (413)
					</Text>
					<Box paddingLeft={2}>
						<Text color={colorManager.error()}>
							{typeof event.error === 'string'
								? event.error
								: event.error?.message || 'Request exceeds 32MB limit'}
						</Text>
					</Box>
				</Box>
			);

		case ClaudeEventType.RATE_LIMIT_ERROR:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color={colorManager.error()}>
						⏱️ Rate Limit Exceeded (429)
					</Text>
					<Box paddingLeft={2}>
						<Text color={colorManager.error()}>
							{typeof event.error === 'string'
								? event.error
								: event.error?.message || 'Too many requests, please slow down'}
						</Text>
						{event['retry_after'] && (
							<Text color={colorManager.warning()}>
								Retry after: {event['retry_after']}s
							</Text>
						)}
					</Box>
				</Box>
			);

		case ClaudeEventType.API_ERROR:
			return (
				<Box key={index} flexDirection="column" marginY={1}>
					<Text bold color={colorManager.error()}>
						💥 API Error (500)
					</Text>
					<Box paddingLeft={2}>
						<Text color={colorManager.error()}>
							{typeof event.error === 'string'
								? event.error
								: event.error?.message || 'Internal Anthropic system error'}
						</Text>
						<Text color={colorManager.warning()}>Please try again later</Text>
					</Box>
				</Box>
			);

		// Legacy/fallback event types
		case ClaudeEventType.TEXT:
		case ClaudeEventType.CONTENT:
			return (
				<Text key={index} color={colorManager.success()} wrap="wrap">
					{smartRenderText(event.text || event.content || '')}
				</Text>
			);

		default:
			// For unknown event types, try to extract meaningful text content
			// Check for common text fields in the event
			let textContent: string | null = null;
			
			// Try to extract text from various possible fields
			if (typeof event === 'object' && event !== null) {
				// Check for direct text fields
				if ('text' in event && typeof event.text === 'string') {
					textContent = event.text;
				} else if ('content' in event && typeof event.content === 'string') {
					textContent = event.content;
				} else if ('message' in event && typeof event.message === 'string') {
					textContent = event.message;
				} else if ('result' in event && typeof event.result === 'string') {
					textContent = event.result;
				} else if ('data' in event && typeof event['data'] === 'string') {
					textContent = event['data'];
				} else if ('output' in event && typeof event['output'] === 'string') {
					textContent = event['output'];
				} else if ('response' in event && typeof event['response'] === 'string') {
					textContent = event['response'];
				} else if ('body' in event && typeof event['body'] === 'string') {
					textContent = event['body'];
				}
				
				// Try to extract from nested structures
				if (!textContent) {
					if ('delta' in event && event.delta && typeof event.delta === 'object') {
						if ('text' in event.delta && typeof event.delta.text === 'string') {
							textContent = event.delta.text;
						} else if ('content' in event.delta && typeof event.delta.content === 'string') {
							textContent = event.delta.content;
						}
					} else if ('message' in event && event.message && typeof event.message === 'object') {
						if ('content' in event.message && typeof event.message.content === 'string') {
							textContent = event.message.content;
						} else if ('text' in event.message && typeof event.message.text === 'string') {
							textContent = event.message.text;
						}
					}
				}
				
				// If still no text content, try to extract any meaningful data
				if (!textContent) {
					// Try to find any non-metadata fields that might contain content
					const meaningfulFields = Object.entries(event)
						.filter(([key, value]) => {
							// Skip metadata fields
							if (['type', 'index', 'id', 'role', 'timestamp', 'version'].includes(key)) {
								return false;
							}
							// Look for string values or objects that might have content
							return value !== null && value !== undefined;
						})
						.map(([_key, value]) => {
							if (typeof value === 'string') {
								return value;
							} else if (typeof value === 'object') {
								// Try to extract text from nested objects
								if ('text' in value && typeof value.text === 'string') {
									return value.text;
								} else if ('content' in value && typeof value.content === 'string') {
									return value.content;
								} else if ('message' in value && typeof value.message === 'string') {
									return value.message;
								}
								// For other objects, format them nicely
								return formatJson(value, true);
							}
							return String(value);
						})
						.filter(v => v && v.trim());
					
					if (meaningfulFields.length > 0) {
						textContent = meaningfulFields.join(' ');
					}
				}
			}
			
			// If we found text content, display it nicely
			if (textContent && textContent.trim()) {
				return (
					<Text key={index} wrap="wrap">
						{smartRenderText(textContent)}
					</Text>
				);
			}
			
			// For completely unknown events with no extractable content,
			// show a minimal indicator in verbose/debug mode only
			if (verbosity === 'verbose' || verbosity === 'debug') {
				// Try to show something meaningful about the event
				const eventType = event.type || 'unknown';
				const eventInfo = event.subtype || event['name'] || '';
				
				return (
					<Text key={index} dimColor>
						• {eventType}{eventInfo ? `: ${eventInfo}` : ''}
					</Text>
				);
			}
			
			// In minimal/normal mode, silently skip truly empty events
			return null;
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
