/**
 * Scan the public/photos/ directory and rebuild public/texts/photos.json.
 * Run via: `npm run scan-photos`.
 *
 *   public/photos/
 *     forMainPage/        → home page (linked by section slug)
 *     videos/             → videos tab
 *     <anything else>/    → photo galleries tab
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT      = new URL('..', import.meta.url).pathname;
const PUBLIC    = join(ROOT, 'public');
const PHOTOS    = join(PUBLIC, 'photos');
const SECTIONS  = join(PUBLIC, 'texts/sections.json');
const TARGET    = join(PUBLIC, 'texts/photos.json');

/* ----- titles for galleries (extend when new folders appear) ----- */
const GALLERY_TITLES = {
  studentYears: { ru: 'Студенческие годы',   am: 'Ուսանողական տարիներ' },
  work:         { ru: 'Работа',              am: 'Աշխատանք' },
  adultYears:   { ru: 'Зрелые годы',         am: 'Հասուն տարիներ' },
  rewards:      { ru: 'Награды',             am: 'Մրցանակներ' },
  // legacy/optional
  firstPhotos:  { ru: 'Ранние годы',         am: 'Վաղ տարիներ' },
  lastYears:    { ru: 'Последние годы',      am: 'Վերջին տարիներ' }
};

/* explicit ordering for the gallery tab */
const GALLERY_ORDER = [
  'firstPhotos', 'studentYears', 'work', 'adultYears', 'rewards', 'lastYears'
];

/* ----- helpers ----- */
const IMG_RE   = /\.(webp|jpe?g|png|avif|gif)$/i;
const VIDEO_RE = /\.(mp4|webm|mov|m4v)$/i;

async function listMatching(dir, re) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir);
  return entries
    .filter(name => re.test(name) && statSync(join(dir, name)).isFile())
    .sort((a, b) => a.localeCompare(b));
}

const listImages = (dir) => listMatching(dir, IMG_RE);
const listVideos = (dir) => listMatching(dir, VIDEO_RE);

async function listDirs(dir) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort((a, b) => {
      const na = parseInt(a, 10), nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
}

function folderToSlug(name) {
  return name.replace(/^\d+/, '');
}

/* maps forMainPage subfolder slug → sections.json slug */
const slugAliases = {
  student:    'student',
  origins:    'origins',
  hungary:    'hungary',
  engineer:   'engineer',
  military:   'military-educator',
  garden:     'garden',
  bananas:    'bananas',
  poet:       'words-poetry-vodka',
  teacher:    'teacher',
  family:     'family',
  lastFight:  'last-fight',
  remain:     'legacy',
  firstPhotos:'origins'
};

function titleFor(id) {
  return GALLERY_TITLES[id] || { ru: id, am: id };
}

/* ----- main ----- */
async function main() {
  const sections = JSON.parse(await readFile(SECTIONS, 'utf8')).sections;
  const sectionSlugs = sections.map(s => s.slug);

  const out = {
    hero: 'photos/forMainPage/1mainPhoto.webp',
    sections: {},
    galleries: [],
    videos: []
  };

  sectionSlugs.forEach(slug => { out.sections[slug] = []; });

  /* hero — first image directly inside forMainPage */
  const mainPageRoot = await listImages(join(PHOTOS, 'forMainPage'));
  if (mainPageRoot.length) {
    out.hero = `photos/forMainPage/${mainPageRoot[0]}`;
    out.sections['opening'] = [out.hero];
  }

  /* home-page sections — walk forMainPage subfolders */
  const mainSubs = await listDirs(join(PHOTOS, 'forMainPage'));
  for (const folder of mainSubs) {
    const folderSlug  = folderToSlug(folder);
    const sectionSlug = slugAliases[folderSlug] || folderSlug;
    if (!out.sections[sectionSlug]) out.sections[sectionSlug] = [];

    const files = await listImages(join(PHOTOS, 'forMainPage', folder));
    files.forEach(f => out.sections[sectionSlug].push(`photos/forMainPage/${folder}/${f}`));
  }

  /* photo galleries — every top-level folder except forMainPage/videos */
  const topDirs = await listDirs(PHOTOS);
  const galleryDirs = topDirs.filter(d => d !== 'forMainPage' && d !== 'videos');

  /* keep stable curated order, then any unknown ones */
  const ordered = [
    ...GALLERY_ORDER.filter(id => galleryDirs.includes(id)),
    ...galleryDirs.filter(id => !GALLERY_ORDER.includes(id))
  ];

  for (const id of ordered) {
    const items = await listImages(join(PHOTOS, id));
    if (!items.length) continue;
    out.galleries.push({
      id,
      title: titleFor(id),
      folder: `photos/${id}`,
      items: items.map(f => `photos/${id}/${f}`)
    });
  }

  /* videos */
  const videoFiles = await listVideos(join(PHOTOS, 'videos'));
  out.videos = videoFiles.map(f => `photos/videos/${f}`);

  await writeFile(TARGET, JSON.stringify(out, null, 2) + '\n');

  /* report */
  const sCount = Object.entries(out.sections)
    .map(([k, v]) => `${k}:${v.length}`)
    .join('  ');
  const gCount = out.galleries.map(g => `${g.id}:${g.items.length}`).join('  ');
  console.log('✓ texts/photos.json updated');
  console.log('  sections:  ' + sCount);
  console.log('  galleries: ' + gCount);
  console.log('  videos:    ' + out.videos.length);
}

main().catch(err => {
  console.error('build-photos-json failed:', err);
  process.exit(1);
});
