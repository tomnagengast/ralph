import type {StreamJsonOutput} from './types/run.js';

export class OutputProcessor {
	private buffer = '';
	private outputLines: string[] = [];
	
	processStreamJson(data: string): StreamJsonOutput[] {
		this.buffer += data;
		const lines = this.buffer.split('\n');
		const results: StreamJsonOutput[] = [];
		
		this.buffer = lines.pop() || '';
		
		for (const line of lines) {
			if (line.trim()) {
				try {
					const parsed = JSON.parse(line) as StreamJsonOutput;
					results.push(parsed);
				} catch (error) {
					console.error('Failed to parse JSON line:', line);
				}
			}
		}
		
		return results;
	}
	
	formatOutput(output: StreamJsonOutput): string {
		switch (output.type) {
			case 'text':
				return output.content || output.text || '';
			
			case 'tool_use':
				return `🔧 Using tool: ${output.tool_name}`;
			
			case 'tool_result':
				return `✅ Tool result received`;
			
			case 'error':
				return `❌ Error: ${output.error}`;
			
			default:
				return JSON.stringify(output, null, 2);
		}
	}
	
	addFormattedLine(line: string): void {
		this.outputLines.push(line);
	}
	
	getOutputLines(maxLines?: number): string[] {
		if (maxLines && this.outputLines.length > maxLines) {
			return this.outputLines.slice(-maxLines);
		}
		return [...this.outputLines];
	}
	
	clear(): void {
		this.buffer = '';
		this.outputLines = [];
	}
}