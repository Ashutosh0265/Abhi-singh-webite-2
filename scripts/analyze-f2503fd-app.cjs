const cp = require('child_process');
const fs = require('fs');

const code = cp.execSync('git show f2503fd:src/admin/AdminDashboardApp.jsx').toString();
console.log('Total characters in f2503fd:src/admin/AdminDashboardApp.jsx:', code.length);

// Check imports
const lines = code.split('\n');
console.log('--- IMPORTS ---');
lines.slice(0, 45).forEach((l, i) => console.log(l));

// Check activeTab conditions
const tabMatches = code.match(/activeTab === '[a-z]+'/g);
console.log('--- TABS ---', Array.from(new Set(tabMatches)));

// Check for orders tab
const hasOrders = code.includes("activeTab === 'orders'");
console.log('Has orders tab:', hasOrders);

