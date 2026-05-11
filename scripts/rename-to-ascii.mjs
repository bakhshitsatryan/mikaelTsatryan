/**
 * Rename all media files with non-ASCII / space characters in public/photos/
 * to safe ASCII slugs so GitHub Pages CDN serves them reliably.
 *
 * Run once: node scripts/rename-to-ascii.mjs
 * Then:     npm run scan-photos
 */

import { readdir, rename } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT   = new URL('..', import.meta.url).pathname;
const PHOTOS = join(ROOT, 'public', 'photos');

/* ---- Cyrillic → Latin transliteration table ---- */
const TRANSLIT = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh',
  'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
  'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
  'ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu',
  'я':'ya',
  'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'Zh',
  'З':'Z','И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O',
  'П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F','Х':'Kh','Ц':'Ts',
  'Ч':'Ch','Ш':'Sh','Щ':'Sch','Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'Yu',
  'Я':'Ya',
};

function toSlug(name) {
  // transliterate Cyrillic
  let s = name.split('').map(c => TRANSLIT[c] !== undefined ? TRANSLIT[c] : c).join('');
  // lowercase, replace spaces/special chars with hyphens, collapse repeats
  s = s
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return s;
}

function isNonAscii(str) {
  return /[^\x00-\x7F]/.test(str);
}

function hasSpaces(str) {
  return /[ \t]/.test(str);
}

/* recursively walk dirs and collect files needing rename */
async function collect(dir, list = []) {
  if (!existsSync(dir)) return list;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      await collect(full, list);
    } else if (/\.(webp|jpe?g|png|avif|gif|mp4|webm|mov|m4v)$/i.test(e.name)) {
      if (isNonAscii(e.name) || hasSpaces(e.name)) {
        list.push(full);
      }
    }
  }
  return list;
}

/* rename, handle collisions by appending a counter */
async function safeName(dir, slug) {
  let candidate = slug;
  let n = 1;
  while (existsSync(join(dir, candidate))) {
    const ext = extname(slug);
    const base = slug.slice(0, slug.length - ext.length);
    candidate = `${base}-${n}${ext}`;
    n++;
  }
  return candidate;
}

async function main() {
  const files = await collect(PHOTOS);
  if (!files.length) {
    console.log('No files need renaming.');
    return;
  }

  console.log(`Found ${files.length} files to rename:\n`);

  for (const from of files) {
    const dir  = dirname(from);
    const base = from.slice(dir.length + 1);
    const ext  = extname(base);
    const stem = base.slice(0, base.length - ext.length);

    const newStem = toSlug(stem);
    const newBase = newStem + ext.toLowerCase();
    const newName = await safeName(dir, newBase);
    const to = join(dir, newName);

    await rename(from, to);
    // trim the PHOTOS prefix from display
    const rel = from.replace(ROOT, '').replace(/^\//, '');
    const relNew = to.replace(ROOT, '').replace(/^\//, '');
    console.log(`  ${rel}\n    → ${relNew}`);
  }

  console.log(`\n✓ Renamed ${files.length} files.`);
  console.log('  Run: npm run scan-photos');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
