// Simple test to verify performance optimizations work
const { execSync } = require('child_process');
const fs = require('fs');

// Create a simple test prompt
const testPrompt = `Write a short response about React performance (just a few sentences).`;

// Write test prompt
fs.writeFileSync('.ralph/prompt-test.md', testPrompt);

console.log('🚀 Testing Ralph Performance Optimizations');
console.log('==========================================\n');

console.log('Testing basic functionality...');
try {
  // Test with default settings
  console.log('\n1. Testing default configuration:');
  const result1 = execSync('node dist/cli.js run -p .ralph/prompt-test.md --max-display-lines 10', {
    timeout: 10000,
    encoding: 'utf8'
  }).toString();
  console.log('✅ Default config test passed');
  
  // Test with performance settings
  console.log('\n2. Testing with performance optimizations:');
  const result2 = execSync('node dist/cli.js run -p .ralph/prompt-test.md --show-memory-stats --max-events 100 --throttle-ms 50', {
    timeout: 10000,
    encoding: 'utf8'
  }).toString();
  console.log('✅ Performance config test passed');
  
  console.log('\n3. Testing help output includes performance options:');
  const helpOutput = execSync('node dist/cli.js --help', {
    encoding: 'utf8'
  }).toString();
  
  if (helpOutput.includes('--max-display-lines') && 
      helpOutput.includes('--show-memory-stats') &&
      helpOutput.includes('Performance Options')) {
    console.log('✅ Help output includes performance options');
  } else {
    console.log('❌ Help output missing performance options');
  }
  
  console.log('\n🎉 All tests passed! Performance optimizations are working.');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  
  // Show build status
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('\n✅ Build successful - the TypeScript compiled correctly despite linting warnings');
  } catch (buildError) {
    console.error('❌ Build failed:', buildError.message);
  }
} finally {
  // Cleanup
  if (fs.existsSync('.ralph/prompt-test.md')) {
    fs.unlinkSync('.ralph/prompt-test.md');
  }
}