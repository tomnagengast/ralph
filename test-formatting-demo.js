#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { formatClaudeEvent, groupTextDeltas, formatGroupedTextDeltas } from './dist/utils/claude-formatter.js';
import fs from 'fs';

// Load test data
const testData = JSON.parse(fs.readFileSync('./test/test-data/sample-claude-events.json', 'utf-8'));

console.log('='.repeat(80));
console.log('CLAUDE FORMATTING DEMO - Testing All Event Types');
console.log('='.repeat(80));

// Function to render each test scenario
function testScenario(scenario) {
    console.log(`\n📋 Testing: ${scenario.description}`);
    console.log('-'.repeat(50));
    
    if (scenario.events && Array.isArray(scenario.events)) {
        scenario.events.forEach((event, index) => {
            try {
                // Get the formatted React component
                const formatted = formatClaudeEvent(event, index);
                
                if (formatted) {
                    // Try to render it to get string output
                    const { lastFrame, clear } = render(React.createElement('div', {}, formatted));
                    const output = lastFrame();
                    clear();
                    
                    console.log(`  Event ${index} (${event.type}):`);
                    console.log(`    ${output.split('\n').join('\n    ')}`);
                } else {
                    console.log(`  Event ${index} (${event.type}): [No output]`);
                }
            } catch (error) {
                console.log(`  Event ${index} (${event.type}): ERROR - ${error.message}`);
            }
        });
        
        // Test text delta grouping if applicable
        const textDeltas = scenario.events.filter(e => 
            e.type === 'content_block_delta' && e.delta?.type === 'text_delta'
        );
        
        if (textDeltas.length > 1) {
            console.log('\n  📍 Testing text delta grouping:');
            const grouped = groupTextDeltas(scenario.events);
            const textGroup = grouped.find(item => Array.isArray(item));
            if (textGroup) {
                const combined = formatGroupedTextDeltas(textGroup);
                console.log(`    Combined text: "${combined}"`);
            }
        }
    }
}

// Test all scenarios
testData.forEach(testScenario);

console.log('\n' + '='.repeat(80));
console.log('FORMATTING DEMO COMPLETE');
console.log('='.repeat(80));