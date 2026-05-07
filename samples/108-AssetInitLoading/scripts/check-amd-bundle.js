const fs = require('node:fs');
const path = require('node:path');

const bundlePath = path.resolve(__dirname, '..', 'web', 'js', 'bundle.js');

if (!fs.existsSync(bundlePath)) {
  console.error(`Bundle not found: ${bundlePath}`);
  console.error('Run `npm run build` before this check.');
  process.exit(1);
}

const bundle = fs.readFileSync(bundlePath, 'utf8');

const failures = [];

if (/define\(\s*\[/.test(bundle)) {
  failures.push('Found anonymous AMD define (`define([...)`) in bundle.js');
}

const unexpectedNodeDeps = ['path', 'process', 'crypto', 'stream', 'buffer', 'util', 'os'];
for (const dep of unexpectedNodeDeps) {
  const depRegex = new RegExp(`["']${dep}["']`, 'g');
  if (depRegex.test(bundle)) {
    failures.push(`Found unexpected Node core dependency in bundle: ${dep}`);
  }
}

if (failures.length > 0) {
  console.error('AMD bundle validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('AMD bundle validation passed.');
