import test from 'node:test';
import assert from 'node:assert/strict';

import { convertToFongMiConfig, getSubscriptionUrls } from '../lib/server/fongmi-config';

test('reads the URL forms accepted by KVideo subscriptions', () => {
  assert.deepEqual(getSubscriptionUrls('https://example.com/video2.json'), ['https://example.com/video2.json']);
  assert.deepEqual(getSubscriptionUrls('https://a.test/1.json, https://b.test/2.json'), [
    'https://a.test/1.json', 'https://b.test/2.json',
  ]);
  assert.deepEqual(getSubscriptionUrls('[{"name":"Home","url":"https://example.com/video2.json"}]'), [
    'https://example.com/video2.json',
  ]);
});

test('converts enabled MacCMS sources and skips invalid or duplicate entries', () => {
  const result = convertToFongMiConfig([[
    { id: 'liangzi', name: '量子资源', baseUrl: 'https://example.com/api.php/provide/vod' },
    { id: 'off', name: 'Disabled', baseUrl: 'https://example.com/off', enabled: false },
    { id: 'liangzi', name: 'Duplicate', baseUrl: 'https://example.com/duplicate' },
    { id: 'bad', name: 'Invalid', baseUrl: 'file:///etc/passwd' },
  ]]);

  assert.deepEqual(result, {
    sites: [{
      key: 'liangzi', name: '量子资源', type: 1,
      api: 'https://example.com/api.php/provide/vod',
      searchable: 1, quickSearch: 1, changeable: 1,
    }],
  });
});

test('supports wrapped source lists and rejects an empty result', () => {
  assert.equal(convertToFongMiConfig([{ sources: [{ id: 'one', name: 'One', baseUrl: 'http://example.com/api' }] }]).sites.length, 1);
  assert.equal(convertToFongMiConfig([{ list: [{ id: 'two', name: 'Two', baseUrl: 'https://example.com/api' }] }]).sites.length, 1);
  assert.throws(() => convertToFongMiConfig([{ sources: [] }]), /No enabled video sources/);
  assert.throws(() => convertToFongMiConfig([{}]), /Invalid source list/);
});
