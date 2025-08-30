import {LiteralUnion} from 'type-fest';

// Define the color types available in Ink
export type InkColor =
	| 'black'
	| 'red'
	| 'green'
	| 'yellow'
	| 'blue'
	| 'magenta'
	| 'cyan'
	| 'white'
	| 'gray'
	| 'grey'
	| 'blackBright'
	| 'redBright'
	| 'greenBright'
	| 'yellowBright'
	| 'blueBright'
	| 'magentaBright'
	| 'cyanBright'
	| 'whiteBright'
	| undefined;

export type ColorValue = LiteralUnion<InkColor, string> | undefined;

// Color scheme interface defining all color roles
export interface ColorScheme {
	name: string;
	description: string;
	
	// Primary colors
	primary: ColorValue;
	secondary: ColorValue;
	accent: ColorValue;
	
	// Semantic colors
	success: ColorValue;
	warning: ColorValue;
	error: ColorValue;
	info: ColorValue;
	
	// UI elements
	text: ColorValue;
	textDim: ColorValue;
	border: ColorValue;
	borderSecondary: ColorValue;
	
	// Claude-specific elements
	messageStart: ColorValue;
	messageComplete: ColorValue;
	userMessage: ColorValue;
	assistantMessage: ColorValue;
	thinking: ColorValue;
	
	// Tool and system elements
	toolUse: ColorValue;
	toolResult: ColorValue;
	systemMessage: ColorValue;
	codeExecution: ColorValue;
	
	// JSON formatting
	jsonProperty: ColorValue;
	jsonString: ColorValue;
	jsonNumber: ColorValue;
	jsonBoolean: ColorValue;
	jsonBracket: ColorValue;
	
	// Search and file operations
	searchResult: ColorValue;
	fileOperation: ColorValue;
	
	// Ralph Loop specific
	iterationInfo: ColorValue;
	promptSection: ColorValue;
	responseSection: ColorValue;
	timing: ColorValue;
}

// Built-in color schemes
export const colorSchemes: Record<string, ColorScheme> = {
	default: {
		name: 'Default',
		description: 'Colorful theme optimized for dark terminals',
		primary: 'cyan',
		secondary: 'magenta',
		accent: 'yellow',
		success: 'green',
		warning: 'yellow',
		error: 'red',
		info: 'blue',
		text: undefined,
		textDim: undefined,
		border: undefined,
		borderSecondary: 'gray',
		messageStart: 'magenta',
		messageComplete: 'green',
		userMessage: 'green',
		assistantMessage: 'blue',
		thinking: 'blue',
		toolUse: 'yellow',
		toolResult: 'cyan',
		systemMessage: 'blue',
		codeExecution: 'magenta',
		jsonProperty: 'magenta',
		jsonString: 'green',
		jsonNumber: 'cyan',
		jsonBoolean: 'cyan',
		jsonBracket: 'yellow',
		searchResult: 'cyan',
		fileOperation: 'green',
		iterationInfo: 'magenta',
		promptSection: 'green',
		responseSection: 'blue',
		timing: 'yellow',
	},
	
	minimal: {
		name: 'Minimal',
		description: 'Reduced colors, mostly grayscale with essential highlights',
		primary: 'white',
		secondary: 'gray',
		accent: 'white',
		success: 'green',
		warning: 'yellow',
		error: 'red',
		info: 'gray',
		text: undefined,
		textDim: undefined,
		border: 'gray',
		borderSecondary: 'gray',
		messageStart: 'gray',
		messageComplete: 'green',
		userMessage: 'white',
		assistantMessage: 'gray',
		thinking: 'gray',
		toolUse: 'white',
		toolResult: 'gray',
		systemMessage: 'gray',
		codeExecution: 'gray',
		jsonProperty: 'gray',
		jsonString: 'white',
		jsonNumber: 'white',
		jsonBoolean: 'white',
		jsonBracket: 'gray',
		searchResult: 'white',
		fileOperation: 'white',
		iterationInfo: 'white',
		promptSection: 'white',
		responseSection: 'gray',
		timing: 'gray',
	},
	
	dark: {
		name: 'Dark',
		description: 'High contrast colors optimized for dark terminals',
		primary: 'cyanBright',
		secondary: 'magentaBright',
		accent: 'yellowBright',
		success: 'greenBright',
		warning: 'yellowBright',
		error: 'redBright',
		info: 'blueBright',
		text: 'whiteBright',
		textDim: 'gray',
		border: 'whiteBright',
		borderSecondary: 'gray',
		messageStart: 'magentaBright',
		messageComplete: 'greenBright',
		userMessage: 'greenBright',
		assistantMessage: 'blueBright',
		thinking: 'blueBright',
		toolUse: 'yellowBright',
		toolResult: 'cyanBright',
		systemMessage: 'blueBright',
		codeExecution: 'magentaBright',
		jsonProperty: 'magentaBright',
		jsonString: 'greenBright',
		jsonNumber: 'cyanBright',
		jsonBoolean: 'cyanBright',
		jsonBracket: 'yellowBright',
		searchResult: 'cyanBright',
		fileOperation: 'greenBright',
		iterationInfo: 'magentaBright',
		promptSection: 'greenBright',
		responseSection: 'blueBright',
		timing: 'yellowBright',
	},
	
	light: {
		name: 'Light',
		description: 'Colors optimized for light terminals',
		primary: 'blue',
		secondary: 'magenta',
		accent: 'red',
		success: 'green',
		warning: 'red',
		error: 'red',
		info: 'blue',
		text: 'black',
		textDim: 'gray',
		border: 'black',
		borderSecondary: 'gray',
		messageStart: 'magenta',
		messageComplete: 'green',
		userMessage: 'green',
		assistantMessage: 'blue',
		thinking: 'blue',
		toolUse: 'red',
		toolResult: 'blue',
		systemMessage: 'blue',
		codeExecution: 'magenta',
		jsonProperty: 'magenta',
		jsonString: 'green',
		jsonNumber: 'blue',
		jsonBoolean: 'blue',
		jsonBracket: 'red',
		searchResult: 'blue',
		fileOperation: 'green',
		iterationInfo: 'magenta',
		promptSection: 'green',
		responseSection: 'blue',
		timing: 'red',
	},
	
	'high-contrast': {
		name: 'High Contrast',
		description: 'High contrast colors for accessibility',
		primary: 'whiteBright',
		secondary: 'yellowBright',
		accent: 'yellowBright',
		success: 'greenBright',
		warning: 'yellowBright',
		error: 'redBright',
		info: 'cyanBright',
		text: 'whiteBright',
		textDim: 'white',
		border: 'whiteBright',
		borderSecondary: 'yellowBright',
		messageStart: 'yellowBright',
		messageComplete: 'greenBright',
		userMessage: 'greenBright',
		assistantMessage: 'cyanBright',
		thinking: 'cyanBright',
		toolUse: 'yellowBright',
		toolResult: 'whiteBright',
		systemMessage: 'cyanBright',
		codeExecution: 'yellowBright',
		jsonProperty: 'yellowBright',
		jsonString: 'greenBright',
		jsonNumber: 'whiteBright',
		jsonBoolean: 'whiteBright',
		jsonBracket: 'yellowBright',
		searchResult: 'whiteBright',
		fileOperation: 'greenBright',
		iterationInfo: 'yellowBright',
		promptSection: 'greenBright',
		responseSection: 'cyanBright',
		timing: 'yellowBright',
	},
	
	none: {
		name: 'No Colors',
		description: 'Plain text with no colors',
		primary: undefined,
		secondary: undefined,
		accent: undefined,
		success: undefined,
		warning: undefined,
		error: undefined,
		info: undefined,
		text: undefined,
		textDim: undefined,
		border: undefined,
		borderSecondary: undefined,
		messageStart: undefined,
		messageComplete: undefined,
		userMessage: undefined,
		assistantMessage: undefined,
		thinking: undefined,
		toolUse: undefined,
		toolResult: undefined,
		systemMessage: undefined,
		codeExecution: undefined,
		jsonProperty: undefined,
		jsonString: undefined,
		jsonNumber: undefined,
		jsonBoolean: undefined,
		jsonBracket: undefined,
		searchResult: undefined,
		fileOperation: undefined,
		iterationInfo: undefined,
		promptSection: undefined,
		responseSection: undefined,
		timing: undefined,
	},
};

// Color manager class
export class ColorManager {
	private currentScheme: ColorScheme;
	private colorsDisabled: boolean;

	constructor(schemeName: string = 'default') {
		this.colorsDisabled = this.shouldDisableColors();
		if (this.colorsDisabled) {
			this.currentScheme = colorSchemes['none']!;
		} else {
			this.currentScheme = colorSchemes[schemeName] || colorSchemes['default']!;
		}
	}

	private shouldDisableColors(): boolean {
		// Check NO_COLOR environment variable (https://no-color.org/)
		if (process.env['NO_COLOR']) {
			return true;
		}
		
		// Check if stdout is not a TTY (e.g., when piping output)
		if (!process.stdout.isTTY) {
			return true;
		}
		
		// Check for CI environments
		if (process.env['CI']) {
			return true;
		}
		
		return false;
	}

	public setScheme(schemeName: string): boolean {
		if (this.colorsDisabled) {
			this.currentScheme = colorSchemes['none']!;
			return true;
		}
		
		const scheme = colorSchemes[schemeName];
		if (scheme) {
			this.currentScheme = scheme;
			return true;
		}
		return false;
	}

	public getScheme(): ColorScheme {
		return this.currentScheme;
	}

	public getCurrentSchemeName(): string {
		return this.currentScheme.name;
	}

	public getAvailableSchemes(): string[] {
		return Object.keys(colorSchemes);
	}

	public isColorsDisabled(): boolean {
		return this.colorsDisabled;
	}

	// Convenience methods for getting specific colors
	public primary(): ColorValue { return this.currentScheme.primary; }
	public secondary(): ColorValue { return this.currentScheme.secondary; }
	public accent(): ColorValue { return this.currentScheme.accent; }
	public success(): ColorValue { return this.currentScheme.success; }
	public warning(): ColorValue { return this.currentScheme.warning; }
	public error(): ColorValue { return this.currentScheme.error; }
	public info(): ColorValue { return this.currentScheme.info; }
	public text(): ColorValue { return this.currentScheme.text; }
	public textDim(): ColorValue { return this.currentScheme.textDim; }
	public border(): ColorValue { return this.currentScheme.border; }
	public borderSecondary(): ColorValue { return this.currentScheme.borderSecondary; }
	public messageStart(): ColorValue { return this.currentScheme.messageStart; }
	public messageComplete(): ColorValue { return this.currentScheme.messageComplete; }
	public userMessage(): ColorValue { return this.currentScheme.userMessage; }
	public assistantMessage(): ColorValue { return this.currentScheme.assistantMessage; }
	public thinking(): ColorValue { return this.currentScheme.thinking; }
	public toolUse(): ColorValue { return this.currentScheme.toolUse; }
	public toolResult(): ColorValue { return this.currentScheme.toolResult; }
	public systemMessage(): ColorValue { return this.currentScheme.systemMessage; }
	public codeExecution(): ColorValue { return this.currentScheme.codeExecution; }
	public jsonProperty(): ColorValue { return this.currentScheme.jsonProperty; }
	public jsonString(): ColorValue { return this.currentScheme.jsonString; }
	public jsonNumber(): ColorValue { return this.currentScheme.jsonNumber; }
	public jsonBoolean(): ColorValue { return this.currentScheme.jsonBoolean; }
	public jsonBracket(): ColorValue { return this.currentScheme.jsonBracket; }
	public searchResult(): ColorValue { return this.currentScheme.searchResult; }
	public fileOperation(): ColorValue { return this.currentScheme.fileOperation; }
	public iterationInfo(): ColorValue { return this.currentScheme.iterationInfo; }
	public promptSection(): ColorValue { return this.currentScheme.promptSection; }
	public responseSection(): ColorValue { return this.currentScheme.responseSection; }
	public timing(): ColorValue { return this.currentScheme.timing; }
}

// Global color manager instance
let globalColorManager: ColorManager | null = null;

export function getColorManager(): ColorManager {
	if (!globalColorManager) {
		globalColorManager = new ColorManager();
	}
	return globalColorManager;
}

export function setGlobalColorScheme(schemeName: string): boolean {
	const manager = getColorManager();
	return manager.setScheme(schemeName);
}

export function loadCustomColorScheme(scheme: ColorScheme): void {
	colorSchemes[scheme.name.toLowerCase().replace(/\s+/g, '-')] = scheme;
}