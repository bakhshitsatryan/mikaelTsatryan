/* ============================================================
   PHOTOS — gallery + videos with tab switcher and lightbox
   ============================================================ */

import { lightbox } from './lightbox.js';

(async function () {
  const root        = document.getElementById('gallery');
  const photoPanel  = document.getElementById('panel-photos');
  const videoPanel  = document.getElementById('panel-videos');
  if (!root || !photoPanel || !videoPanel) return;

  let data;
  try {
    data = await fetch('texts/photos.json').then(r => r.json());
  } catch (e) {
    photoPanel.innerHTML = '<p style="text-align:center;color:var(--ink-soft);padding:40px 0">Не удалось загрузить медиа.</p>';
    return;
  }

  /* ---------- PHOTO PANEL ---------- */
  const allPhotos = []; // for lightbox sequencing across all groups

  const groups = (data.galleries || [])
    .filter(g => Array.isArray(g.items) && g.items.length)
    .map(g => {
      const startIdx = allPhotos.length;
      g.items.forEach(src => allPhotos.push(src));

      const cells = g.items.map((src, i) => `
        <button class="gallery__cell" data-kind="photo" data-idx="${startIdx + i}" aria-label="Open photo">
          <img src="${encodeURI(src)}" alt="" loading="lazy" decoding="async">
        </button>
      `).join('');

      return `
        <section class="gallery__group">
          <h2 class="gallery__group-title">
            <span data-lang="am">${esc(g.title.am)}</span>
            <span class="lang-hidden" data-lang="ru">${esc(g.title.ru)}</span>
          </h2>
          <div class="gallery__grid">${cells}</div>
        </section>
      `;
    }).join('');

  photoPanel.innerHTML = groups || emptyState('am: Չկան լուսանկարներ', 'ru: Фотографий пока нет');

  /* ---------- VIDEO PANEL ---------- */
  const videos = Array.isArray(data.videos) ? data.videos : [];

  if (videos.length) {
    const cells = videos.map((src, i) => `
      <button class="gallery__cell gallery__cell--video" data-kind="video" data-idx="${i}" aria-label="Play video">
        <video src="${encodeURI(src)}#t=0.5" preload="metadata" muted playsinline></video>
        <span class="gallery__play" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </span>
      </button>
    `).join('');

    videoPanel.innerHTML = `
      <section class="gallery__group">
        <h2 class="gallery__group-title">
          <span data-lang="am">Տեսանյութեր</span>
          <span class="lang-hidden" data-lang="ru">Видеозаписи</span>
        </h2>
        <div class="gallery__grid gallery__grid--videos">${cells}</div>
      </section>
    `;
  } else {
    videoPanel.innerHTML = emptyState(
      '<span data-lang="am">Տեսանյութեր չկան</span>',
      '<span class="lang-hidden" data-lang="ru">Видео пока нет</span>'
    );
  }

  /* ---------- shared visuals: fade in images ---------- */
  root.querySelectorAll('img').forEach(img => {
    if (img.complete) img.classList.add('is-loaded');
    else img.addEventListener('load', () => img.classList.add('is-loaded'));
  });

  /* ---------- TABS ---------- */
  const tabBtns = root.querySelectorAll('.tabs__btn');
  const panels  = { photos: photoPanel, videos: videoPanel };

  function activate(tab) {
    tabBtns.forEach(b => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    Object.entries(panels).forEach(([name, el]) => el.classList.toggle('is-active', name === tab));
    try { localStorage.setItem('mt_media_tab', tab); } catch (e) {}
  }

  tabBtns.forEach(b => b.addEventListener('click', () => activate(b.dataset.tab)));

  /* restore last-used tab */
  let initial = 'photos';
  try {
    const saved = localStorage.getItem('mt_media_tab');
    if (saved === 'videos' || saved === 'photos') initial = saved;
  } catch (e) {}
  activate(initial);

  /* ---------- language ---------- */
  if (window.MTApp) window.MTApp.applyLang(window.MTApp.getLang());
  document.addEventListener('langchange', () => {
    if (window.MTApp) window.MTApp.applyLang(window.MTApp.getLang());
  });

  /* ---------- lightbox ---------- */
  const lb = lightbox();

  root.addEventListener('click', e => {
    const cell = e.target.closest('.gallery__cell');
    if (!cell) return;
    const kind = cell.dataset.kind;
    const idx  = +cell.dataset.idx;
    if (kind === 'photo') {
      lb.open(allPhotos.map(s => encodeURI(s)), idx);
    } else if (kind === 'video') {
      lb.open(videos.map(s => encodeURI(s)), idx);
    }
  });
})();

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function emptyState(am, ru) {
  return `<p class="gallery__empty">
    <span data-lang="am">${am}</span>
    <span class="lang-hidden" data-lang="ru">${ru}</span>
  </p>`;
}
