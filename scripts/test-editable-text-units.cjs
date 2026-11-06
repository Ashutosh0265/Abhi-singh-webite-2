const assert = require('assert');

// Simulate getNestedValue as currently implemented in LiveEditorContext.jsx
function getNestedValue(obj, path, defaultValue = undefined) {
  if (!obj || !path) return defaultValue;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object' || !(part in current)) {
      return defaultValue;
    }
    current = current[part];
  }
  return current !== undefined && current !== null ? current : defaultValue;
}

// Simulate EditableText displayText resolution logic
function getDisplayText({ activeContent, contentKey, defaultValue, children }) {
  const storedValue = contentKey ? getNestedValue(activeContent, contentKey, undefined) : undefined;

  if (storedValue !== undefined && storedValue !== null) {
    return String(storedValue);
  } else if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
    return String(defaultValue);
  } else if (children !== undefined && children !== null && (typeof children === 'string' || typeof children === 'number')) {
    return String(children);
  } else {
    return (defaultValue !== undefined && defaultValue !== null) ? String(defaultValue) : '';
  }
}

// Test 1: Empty activeContent, with contentKey and defaultValue
const text1 = getDisplayText({
  activeContent: {},
  contentKey: 'nav.content',
  defaultValue: 'Content'
});
assert.strictEqual(text1, 'Content', 'Test 1 Failed: Should fall back to defaultValue');

// Test 2: Unpopulated nav in activeContent (e.g. only hero is set)
const text2 = getDisplayText({
  activeContent: { hero: { line1: 'Train' } },
  contentKey: 'nav.store',
  defaultValue: 'E.L.R.x Store'
});
assert.strictEqual(text2, 'E.L.R.x Store', 'Test 2 Failed: Should fall back to defaultValue');

// Test 3: Explicitly set content in activeContent
const text3 = getDisplayText({
  activeContent: { nav: { content: 'All Content & Resources' } },
  contentKey: 'nav.content',
  defaultValue: 'Content'
});
assert.strictEqual(text3, 'All Content & Resources', 'Test 3 Failed: Should use storedValue');

// Test 4: Explicitly emptied string by user
const text4 = getDisplayText({
  activeContent: { nav: { content: '' } },
  contentKey: 'nav.content',
  defaultValue: 'Content'
});
assert.strictEqual(text4, '', 'Test 4 Failed: Should honor explicit empty string');

// Test 5: All navbar keys with empty activeContent
const navKeys = [
  { key: 'nav.by', def: 'by' },
  { key: 'nav.name', def: 'Abhi Singh' },
  { key: 'nav.content', def: 'Content' },
  { key: 'nav.newsletter', def: 'Newsletter' },
  { key: 'nav.store', def: 'E.L.R.x Store' },
  { key: 'nav.blog', def: 'Blog' },
  { key: 'nav.about', def: 'About' },
  { key: 'nav.cta', def: 'Work With Me' },
];

navKeys.forEach(({ key, def }) => {
  const result = getDisplayText({ activeContent: {}, contentKey: key, defaultValue: def });
  assert.strictEqual(result, def, `Test Failed for ${key}: expected ${def}, got ${result}`);
});

console.log('✅ ALL UNIT TESTS PASSED!');

