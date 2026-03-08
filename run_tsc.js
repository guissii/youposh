const { execSync } = require('child_process');
const fs = require('fs');

try {
    const out = execSync('npx tsc --noEmit --pretty false', { encoding: 'utf-8' });
    fs.writeFileSync('tsc_errors.log', out);
} catch (e) {
    fs.writeFileSync('tsc_errors.log', e.stdout + '\n' + e.stderr);
}
