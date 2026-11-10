import {mkdir, readFile, writeFile, rename} from 'node:fs/promises';
import {resolve} from 'node:path';
import {catalog} from '../src/hub-catalog.js';

// Aggregate project-entry/download clicks, not completed downloads or unique visitors.
// The short-lived rate-limit map is never persisted.
export function createPopularityApi({directory = resolve(process.env.ROBO_DATA_DIR || 'data', 'hub-popularity')} = {}) {
  const file = resolve(directory, 'counts.json');
  const ids = new Set(catalog.map(item => item.id));
  const recent = new Map();
  let queue = Promise.resolve();
  async function readStored() {
    let stored = {};
    try { stored = JSON.parse(await readFile(file, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    return stored;
  }
  const publishedCounts = stored => Object.fromEntries([...ids].map(id => [id, Number.isSafeInteger(stored[id]) && stored[id] >= 0 ? stored[id] : 0]));
  return async (req, res, next) => {
    if (new URL(req.url, 'http://localhost').pathname !== '/api/hub/popularity') return next();
    const send = (status, data) => {
      res.writeHead(status, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'});
      res.end(JSON.stringify(data));
    };
    try {
      if (req.method === 'GET') {
        await queue;
        return send(200, {counts: publishedCounts(await readStored())});
      }
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return send(405, {error:'method'});
      }
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return send(403, {error:'origin'});
      if (!req.headers['content-type']?.startsWith('application/json')) return send(415, {error:'type'});
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1024) return send(413, {error:'size'});
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { return send(400, {error:'invalid'}); }
      if (!body || !ids.has(body.id)) return send(400, {error:'id'});
      const now = Date.now();
      for (const [key, expiry] of recent) if (expiry <= now) recent.delete(key);
      const key = req.socket.remoteAddress + ':' + body.id;
      if (recent.has(key)) return send(200, {counted:false});
      if (recent.size >= 10000) return send(429, {error:'rate'});
      recent.set(key, now + 60000);
      const write = queue.then(async () => {
        const stored = await readStored();
        const counts = publishedCounts(stored);
        counts[body.id] = Math.min(Number.MAX_SAFE_INTEGER, counts[body.id] + 1);
        await mkdir(directory, {recursive:true});
        // Keep historical counters when an old resource is replaced by a product page.
        await writeFile(file + '.tmp', JSON.stringify({...stored, ...counts}), 'utf8');
        await rename(file + '.tmp', file);
      });
      queue = write.catch(() => {});
      try { await write; } catch (error) { recent.delete(key); throw error; }
      return send(201, {counted:true});
    } catch (error) {
      console.error('Hub popularity:', error.message);
      if (!res.headersSent) send(503, {error:'unavailable'});
    }
  };
}
