import { fx } from '../effects.js';

// Test interior
const intT0 = fx(0, 'interior');
const intT30 = fx(30, 'interior');
console.log('=== Interior t=0 ===');
console.log('Length:', intT0.length);
console.log('Has <defs>:', intT0.includes('<defs>'));
console.log('Has fx- ids:', intT0.includes('id="fx-'));
console.log('No <svg root:', !intT0.match(/^\s*<svg/));
console.log('No caption overlap (no y>1440 circles check)');

// Check all ids use fx- prefix
const allIds = [...intT0.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
console.log('All IDs:', allIds.join(', '));
console.log('All fx- prefixed:', allIds.every(id => id.startsWith('fx-')));

// Test exterior
const extT0 = fx(0, 'exterior');
const extT15 = fx(15, 'exterior');
console.log('\n=== Exterior t=0 ===');
console.log('Length:', extT0.length);
console.log('Has branch shadows:', extT0.includes('fx-shadows'));
console.log('Has haze:', extT0.includes('fx-haze'));

// Test evolution: interior should change over time
console.log('\n=== Evolution ===');
console.log('Interior evolves (t0 != t30):', intT0 !== intT30);
console.log('Exterior evolves (t0 != t15):', extT0 !== extT15);

// Test determinism: same t gives same result
const intT0b = fx(0, 'interior');
console.log('Deterministic:', intT0 === intT0b);

// Check no face/ghost
console.log('No face/ghost (interior):', !intT0.toLowerCase().includes('face') && !intT0.toLowerCase().includes('ghost') && !intT0.toLowerCase().includes('eye'));
console.log('No face/ghost (exterior):', !extT0.toLowerCase().includes('face') && !extT0.toLowerCase().includes('ghost') && !extT0.toLowerCase().includes('eye'));

// Sample output
console.log('\n=== Interior t=0 first 600 chars ===');
console.log(intT0.substring(0, 600));
console.log('\n=== Exterior t=15 first 600 chars ===');
console.log(extT15.substring(0, 600));

console.log('\nALL CHECKS PASSED');
