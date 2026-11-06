const fs = require('fs');
const bak = fs.readFileSync('src/admin/AdminDashboard.css.typography-optimized.bak', 'utf8').split('\n');
const curr = fs.readFileSync('src/admin/AdminDashboard.css', 'utf8').split('\n');

for (let i = 0; i < bak.length; i++) {
  if (bak[i] !== curr[i]) {
    console.log(`Line ${i+1}:`);
    console.log(`  BAK : ${bak[i]}`);
    console.log(`  CURR: ${curr[i]}`);
  }
}

