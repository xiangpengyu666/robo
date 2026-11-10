import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {catalog, filterCatalog, downloadUrl} from '../src/hub-catalog.js';

// Different dates and categories exercise the static directory filters.
const fixture = [
  {...catalog[0], id:'older', listedAt:'2026-01-01'},
  {...catalog[0], id:'newer', listedAt:'2026-02-01', source:'community', category:'plugin'},
];
assert.deepEqual(filterCatalog(fixture, {sort:'recent'}).map(x=>x.id), ['newer','older']);
assert.deepEqual(filterCatalog(fixture, {category:'software',source:'community'}).map(x=>x.id), ['newer']);
assert.deepEqual(filterCatalog(catalog, {category:'robot'}).map(x=>x.id), ['robo-1']);
assert.equal(filterCatalog(catalog, {category:'3d'}).length, 0);
assert.equal(filterCatalog(fixture, {query:'nonexistent'}).length, 0);
assert.equal(filterCatalog(fixture, {query:'  STEP  '}).length, 2);
assert.equal(filterCatalog(catalog, {category:'software'}).length, 7);
assert.equal(catalog.filter(item => item.packageType === 'plugin').length, 6);
assert.equal(filterCatalog(catalog)[0].id, 'robo-1');
assert.equal(filterCatalog(catalog, {category:'software'})[0].id, 'robo-base');
assert.deepEqual(filterCatalog(catalog, {category:'software', query:'Seed'}).map(x=>x.id), ['seed-ai']);
const packages = JSON.parse(await readFile(new URL('../public/downloads/packages.json', import.meta.url), 'utf8'));
assert.equal(packages.length, 7);
assert.equal(new Set(catalog.map(item => item.id)).size, catalog.length);
for (const item of catalog) {
  if (item.page) assert.ok((await readFile(new URL('../' + item.page, import.meta.url),'utf8')).includes('/src/main.js'));
  const file = await stat(new URL('../public/' + item.file, import.meta.url));
  assert.ok(file.size > 0);
  if (item.image) assert.ok((await stat(new URL('../public/' + item.image, import.meta.url))).size > 0);
  if (item.packageType) {
    assert.equal(file.size, item.bytes);
    const record = packages.find(p => p.file === item.file);
    assert.ok(record);
    assert.equal(record.name, item.fileName);
    assert.equal(record.bytes, item.bytes);
    assert.match(record.sha256, /^[a-f0-9]{64}$/);
    assert.equal(downloadUrl(item, '/robo/'), '/robo/' + item.file);
  }
}
assert.equal(downloadUrl({...catalog[1], downloadUrl:'https://example.com/release.zip'}, '/robo/'), 'https://example.com/release.zip');

console.log('PASS: product routing; seven packages and sizes; category, search, ordering and subpath download links.');
