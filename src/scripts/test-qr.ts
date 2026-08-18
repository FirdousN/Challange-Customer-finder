import { normalizeInstagramUsername, getInstagramIdentityKey } from '../lib/identity/instagram';
import { parseInstagramQr } from '../lib/qr/parser';
import assert from 'assert';

function testIdentity() {
  console.log('Testing Identity Normalization...');
  
  const cases = [
    { input: 'YesBharathWeddingCollections', expected: 'yesbharathweddingcollections' },
    { input: 'yesbharathweddingcollections', expected: 'yesbharathweddingcollections' },
    { input: 'YESBHARATHWEDDINGCOLLECTIONS', expected: 'yesbharathweddingcollections' },
    { input: '@yesbharathweddingcollections', expected: 'yesbharathweddingcollections' },
    { input: '  @user.name_123  ', expected: 'user.name_123' },
  ];

  for (const c of cases) {
    assert.strictEqual(normalizeInstagramUsername(c.input), c.expected, `Failed on ${c.input}`);
    assert.strictEqual(getInstagramIdentityKey(c.input), `instagram:${c.expected}`, `Identity Key Failed on ${c.input}`);
  }

  const failingCases = [
    '',
    '   ',
    'thisusernameiswaytoolongtobeallowedoninstagram123',
    'user name',
    'user@name',
    'user/name',
  ];

  for (const c of failingCases) {
    assert.throws(() => normalizeInstagramUsername(c), `Should have thrown on ${c}`);
  }
  
  console.log('✅ Identity Normalization passed.');
}

function testParser() {
  console.log('Testing QR Parser...');
  
  const validUrl = 'https://www.instagram.com/yesbharathweddingcollections?igsh=MTZzZnFqZXR5ZjM=&utm_source=qr';
  const parsed = parseInstagramQr(validUrl);
  
  assert.strictEqual(parsed.instagramUsername, 'yesbharathweddingcollections');
  assert.strictEqual(parsed.normalizedUsername, 'yesbharathweddingcollections');
  assert.strictEqual(parsed.hostname, 'www.instagram.com');
  assert.strictEqual(parsed.pathname, '/yesbharathweddingcollections');
  assert.strictEqual(parsed.igsh, 'MTZzZnFqZXR5ZjM=');
  assert.strictEqual(parsed.utm_source, 'qr');
  assert.strictEqual(parsed.rawPayload, validUrl);
  assert.ok(parsed.payloadHash);
  
  const diffIgshUrl = 'https://www.instagram.com/yesbharathweddingcollections?igsh=DIF_IGSH&utm_source=qr';
  const parsedDiff = parseInstagramQr(diffIgshUrl);
  assert.strictEqual(parsedDiff.normalizedUsername, 'yesbharathweddingcollections');
  assert.notStrictEqual(parsed.payloadHash, parsedDiff.payloadHash);
  
  const failingUrls = [
    'http://www.instagram.com/user', // Not https
    'https://twitter.com/user', // Not instagram
    'javascript:alert(1)', // malicious
    'https://www.instagram.com/', // no user
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==', // malicious
  ];

  for (const u of failingUrls) {
    assert.throws(() => parseInstagramQr(u), `Should have thrown on ${u}`);
  }
  
  console.log('✅ QR Parser passed.');
}

function runTests() {
  try {
    testIdentity();
    testParser();
    console.log('🎉 All tests passed successfully.');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();
