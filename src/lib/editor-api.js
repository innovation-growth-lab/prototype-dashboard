// The page's side of the dev server's save endpoints
// (scripts/dashboard-editor.js). Only `npm run dev` has them.

async function post(path, body, contentType) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: {'Content-Type': contentType, 'x-dashboard-editor': '1'},
      body,
    });
  } catch {
    throw new Error('Couldn’t reach the dev server. Is `npm run dev` running?');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Saving failed (${res.status}).`);
  return json;
}

// Writes the whole dashboard to src/data/dashboard.json.
export function saveDashboard(data) {
  return post('/__save', JSON.stringify(data), 'application/json');
}

// Writes a link's thumbnail to public/thumbs/ and returns its path there.
export async function uploadThumb(linkId, blob) {
  const {thumb} = await post(
    `/__thumb?id=${encodeURIComponent(linkId)}`,
    blob,
    blob.type,
  );
  return thumb;
}

// Shrinks a pasted or dropped image to a thumbnail: at most 1200px wide, as
// WebP, so a full-size screenshot doesn't put megabytes into the repo.
export async function toThumbnail(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((done) =>
    canvas.toBlob(done, 'image/webp', 0.85),
  );
  // A browser that can't write WebP returns a PNG, which the server takes too.
  return blob ?? new Promise((done) => canvas.toBlob(done, 'image/png'));
}
