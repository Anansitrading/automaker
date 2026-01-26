
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of files reported by CI as unformatted
const files = [
  'apps/server/src/index.ts',
  'apps/server/src/lib/auth.ts',
  'apps/ui/src/lib/http-api-client.ts',
  'apps/ui/vite.simple.config.ts',
  'vite.proxy.config.ts',
  'vite.simple.config.ts'
];

try {
    // Try to find local prettier
    const prettierPath = path.resolve('./node_modules/.bin/prettier');
    
    if (fs.existsSync(prettierPath)) {
        console.log('Found local prettier, running...');
        execSync(`${prettierPath} --write ${files.join(' ')}`, { stdio: 'inherit' });
    } else {
        console.log('Local prettier not found. Attempting to use npx without install...');
        // Fallback or just error out.
        // Actually, we can try to install it locally to a temp dir
        execSync('npm install --no-save prettier', { stdio: 'inherit' });
        execSync('./node_modules/.bin/prettier --write .', { stdio: 'inherit' });
    }
} catch (e) {
    console.error(e);
    process.exit(1);
}
