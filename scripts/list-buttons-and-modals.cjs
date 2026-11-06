const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'live-editor' && f !== 'node_modules') scanDir(full);
    } else if (f.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (
          l.includes('<button') ||
          l.includes('<EditableButton') ||
          l.includes('btn-') ||
          l.includes('button-') ||
          l.includes('role="button"')
        ) {
          console.log(`${f}:${idx + 1} -> ${l.trim()}`);
        }
      });
    }
  }
}

console.log('=== BUTTONS IN COMPONENTS ===');
scanDir('src/components');
console.log('\n=== BUTTONS IN PAGES ===');
scanDir('src/pages');

