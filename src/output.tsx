export interface StreamJsonOutput {
	type: string;
	content?: string;
	text?: string;
	tool_name?: string;
	tool_input?: any;
	tool_result?: any;
	error?: string;
}

export class OutputProcessor {
	private buffer = '';
	
	processStreamJson(data: string): StreamJsonOutput[] {
		this.buffer += data;
		const lines = this.buffer.split('\n');
		const results: StreamJsonOutput[] = [];
		
		// Keep the incomplete line in the buffer
		this.buffer = lines.pop() || '';
		
		for (const line of lines) {
			if (line.trim()) {
				try {
					const parsed = JSON.parse(line) as StreamJsonOutput;
					results.push(parsed);
				} catch {
					// Not JSON - could be raw output, ignore for JSON processing
				}
			}
		}
		
		return results;
	}
	
	clear(): void {
		this.buffer = '';
	}
}