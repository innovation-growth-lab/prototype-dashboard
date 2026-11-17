// The dashboard's editor, server side: two endpoints on the dev server only
// (`apply: 'serve'`), so `npm run build` and the live site have neither.
//
//   POST /__save              The whole dashboard as JSON. Checked with the
//                             same rules as the page (src/lib/dashboard.js),
//                             then written to src/data/dashboard.json. A
//                             thumbnail the old data used and the new one
//                             doesn't is deleted.
//   POST /__thumb?id=<link>   An image's bytes. Written to
//                             public/thumbs/<link>.<ext>, replacing any other
//                             image for that link. Returns {thumb: 'thumbs/…'}.
//
// Both need the header `x-dashboard-editor: 1`, which a form on another site
// can't send, so only this page can write while the dev server runs.

import {access, readdir, readFile, unlink, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {ID_PATTERN, thumbsIn, validateDashboard} from '../src/lib/dashboard.js';

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_JSON = 1024 * 1024;

// Content type → extension, and the bytes each format starts with.
const IMAGES = {
  'image/png': {ext: 'png', magic: [0x89, 0x50, 0x4e, 0x47]},
  'image/jpeg': {ext: 'jpg', magic: [0xff, 0xd8, 0xff]},
  'image/gif': {ext: 'gif', magic: [0x47, 0x49, 0x46, 0x38]},
  'image/webp': {ext: 'webp', magic: [0x52, 0x49, 0x46, 0x46]},
};

export default function dashboardEditor() {
  let dataFile;
  let thumbDir;
  // What /__save last wrote, so that write doesn't reload the page, unless an
  // image was uploaded since: then a reload shows it.
  let lastWritten = null;
  let newImage = false;

  async function save(body) {
    const data = validateDashboard(JSON.parse(body.toString('utf8')));
    for (const thumb of thumbsIn(data)) {
      try {
        await access(join(thumbDir, '..', thumb));
      } catch {
        throw new Error(`The thumbnail ${thumb} isn't in public/thumbs.`);
      }
    }
    let before = {projects: []};
    try {
      before = JSON.parse(await readFile(dataFile, 'utf8'));
    } catch {}
    const text = `${JSON.stringify(data, null, 2)}\n`;
    lastWritten = text;
    await writeFile(dataFile, text);
    const kept = thumbsIn(data);
    for (const thumb of thumbsIn(before)) {
      if (!kept.has(thumb) && /^thumbs\/[a-z0-9-]+\.[a-z]+$/.test(thumb)) {
        await unlink(join(thumbDir, '..', thumb)).catch(() => {});
      }
    }
    return {ok: true};
  }

  async function thumb(body, id, type) {
    if (!ID_PATTERN.test(id ?? '')) throw new Error('Bad link id.');
    const image = IMAGES[type];
    if (!image?.magic.every((b, i) => body[i] === b)) {
      throw new Error('That file isn’t a PNG, JPEG, GIF or WebP image.');
    }
    // Any earlier image for this link in another format goes.
    for (const name of await readdir(thumbDir)) {
      if (name.startsWith(`${id}.`) && name !== `${id}.${image.ext}`) {
        await unlink(join(thumbDir, name));
      }
    }
    await writeFile(join(thumbDir, `${id}.${image.ext}`), body);
    newImage = true;
    return {thumb: `thumbs/${id}.${image.ext}`};
  }

  function endpoint(handle, limit) {
    return async (req, res) => {
      const reply = (status, json) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(json));
      };
      if (req.method !== 'POST' || req.headers['x-dashboard-editor'] !== '1') {
        return reply(405, {error: 'Not allowed.'});
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > limit) return reply(413, {error: 'That’s too big to save.'});
        chunks.push(chunk);
      }
      try {
        const url = new URL(req.url, 'http://localhost');
        reply(200, await handle(Buffer.concat(chunks), url, req));
      } catch (error) {
        reply(400, {error: error.message});
      }
    };
  }

  return {
    name: 'dashboard-editor',
    apply: 'serve',
    configResolved(config) {
      dataFile = resolve(config.root, 'src/data/dashboard.json');
      thumbDir = resolve(config.publicDir, 'thumbs');
    },
    configureServer(server) {
      server.middlewares.use('/__save', endpoint(save, MAX_JSON));
      server.middlewares.use(
        '/__thumb',
        endpoint(
          (body, url, req) =>
            thumb(
              body,
              url.searchParams.get('id'),
              req.headers['content-type'],
            ),
          MAX_IMAGE,
        ),
      );
    },
    // The page already shows what it saved, so its own saves don't reload it,
    // except to show a new image. Editing the file by hand still does.
    async handleHotUpdate({file, read, server}) {
      if (file !== dataFile || (await read()) !== lastWritten) return;
      if (newImage) {
        newImage = false;
        server.ws.send({type: 'full-reload'});
      }
      return [];
    },
  };
}
