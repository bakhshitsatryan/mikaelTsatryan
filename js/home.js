/* ============================================================
   HOME — interactive scroll story
   ============================================================ */

import { lightbox } from './lightbox.js';

(async function () {
  const story = document.getElementById('story');
  const progress = document.getElementById('progress');
  if (!story) return;

  let sections, photos;
  try {
    [sections, photos] = await Promise.all([
      fetch('texts/sections.json').then(r => r.json()),
      fetch('texts/photos.json').then(r => r.json())
    ]);
  } catch (e) {
    story.innerHTML = '<p style="padding:24px;text-align:center;color:var(--ink-soft)">Не удалось загрузить контент.</p>';
    return;
  }

  const list = sections.sections;
  const total = list.length;

  /* -------- render every scene -------- */
  list.forEach((sec, idx) => {
    const sectionPhotos = photos.sections[sec.slug] || [];
    const hasPhoto = sectionPhotos.length > 0;
    const photoSrc = hasPhoto ? sectionPhotos[0] : '';

    const scene = document.createElement('section');
    scene.className = 'scene' + (hasPhoto ? ' scene--with-media' : ' scene--text-only') + ` scene--${sec.slug}`;
    scene.dataset.idx  = idx;
    scene.dataset.slug = sec.slug;
    if (sec.slug === 'opening') scene.classList.add('scene--opening');

    /* ---- media block ---- */
    let mediaHTML = '';
    if (hasPhoto) {
      const numText = String(sec.id).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
      const multi = sectionPhotos.length > 1;

      const imgs = sectionPhotos.map((src, i) => `
        <img class="scene__media-img${i === 0 ? ' is-current' : ''}"
             src="${encodeURI(src)}"
             alt=""
             loading="${idx < 2 && i === 0 ? 'eager' : 'lazy'}"
             decoding="async"
             data-photo-idx="${i}">
      `).join('');

      const controls = multi ? `
        <button class="scene__nav scene__nav--prev" aria-label="Предыдущее фото">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <button class="scene__nav scene__nav--next" aria-label="Следующее фото">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        </button>
        <span class="scene__counter" aria-hidden="true">1 / ${sectionPhotos.length}</span>
        <div class="scene__dots" role="tablist">
          ${sectionPhotos.map((_, i) => `<button class="scene__dot${i === 0 ? ' is-current' : ''}" data-photo-idx="${i}" aria-label="Фото ${i + 1}"></button>`).join('')}
        </div>
      ` : '';

      mediaHTML = `
        <div class="scene__media" data-photo-count="${sectionPhotos.length}">
          ${imgs}
          ${controls}
        </div>
        ${sec.slug !== 'opening' ? `<span class="scene__num">${numText}</span>` : ''}
      `;
    }

    /* ---- body block ---- */
    let bodyHTML;
    if (sec.slug === 'opening') {
      bodyHTML = `
        <div class="scene__body" data-lang="am">
          <h1 class="scene__name">${sec.content.am.find(b => b.type==='heading').text}</h1>
          <span class="scene__years">${sec.content.am.find(b => b.type==='years').text}</span>
          ${sec.content.am.filter(b => b.type==='paragraph').map(b => `<p class="scene__lede">${b.text}</p>`).join('')}
          <span class="scene__hint">
            <span data-lang="am">թերթել ներքև</span><span data-lang="ru">листайте вниз</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          </span>
        </div>
        <div class="scene__body lang-hidden" data-lang="ru">
          <h1 class="scene__name">${sec.content.ru.find(b => b.type==='heading').text}</h1>
          <span class="scene__years">${sec.content.ru.find(b => b.type==='years').text}</span>
          ${sec.content.ru.filter(b => b.type==='paragraph').map(b => `<p class="scene__lede">${b.text}</p>`).join('')}
          <span class="scene__hint">
            <span data-lang="am">թերթել ներքև</span><span data-lang="ru">листайте вниз</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          </span>
        </div>
      `;
    } else {
      bodyHTML = ['am', 'ru'].map(lang => {
        const blocks = sec.content[lang] || [];
        const inner = blocks.map(b => renderBlock(b, lang)).join('');
        return `
          <div class="scene__body${lang === 'ru' ? ' lang-hidden' : ''}" data-lang="${lang}">
            <h2 class="scene__title">${sec.title[lang]}</h2>
            ${inner}
          </div>
        `;
      }).join('');
    }

    scene.innerHTML = mediaHTML + bodyHTML;
    story.appendChild(scene);
  });

  /* -------- progress dots -------- */
  list.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.className = 'progress__dot';
    dot.dataset.idx = idx;
    dot.setAttribute('aria-label', 'Section ' + (idx + 1));
    dot.addEventListener('click', () => {
      const target = story.querySelector(`.scene[data-idx="${idx}"]`);
      if (target) story.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    });
    progress.appendChild(dot);
  });

  /* -------- intersection observer for active scene -------- */
  const scenes = story.querySelectorAll('.scene');
  const dots   = progress.querySelectorAll('.progress__dot');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const idx = +entry.target.dataset.idx;
      if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
        scenes.forEach(s => s.classList.toggle('is-active', s === entry.target));
        dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));

        // dark-mode progress for opening scene (full-bleed photo)
        const isOpening = entry.target.classList.contains('scene--opening');
        progress.classList.toggle('on-dark', isOpening);
      }
    });
  }, { root: story, threshold: [0, 0.55, 1] });

  scenes.forEach(s => obs.observe(s));

  // mark first as active immediately
  scenes[0].classList.add('is-active');
  dots[0].classList.add('is-active');
  progress.classList.add('on-dark');

  // apply current language to all freshly rendered [data-lang] nodes
  if (window.MTApp) window.MTApp.applyLang(window.MTApp.getLang());

  /* -------- dynamic photo height per scene (mobile only) --------
     Measures each scene body's natural text height, then sizes the
     photo to fill the remaining space. Long text → smaller photo;
     short text → bigger photo. Clamped so neither feels off. */

  const DESKTOP = window.matchMedia('(min-width: 900px)');

  function naturalHeight(el, width) {
    const prev = el.style.cssText;
    el.style.cssText =
      'position:absolute;visibility:hidden;left:-99999px;top:0;' +
      `width:${width}px;height:auto;max-height:none;min-height:0;overflow:visible;`;
    const h = el.getBoundingClientRect().height;
    el.style.cssText = prev;
    return h;
  }

  function fitScene(scene) {
    if (!scene.classList.contains('scene--with-media')) return;
    if (scene.classList.contains('scene--opening')) return;
    if (DESKTOP.matches) {
      scene.style.removeProperty('--media-h');
      return;
    }

    const lang = window.MTApp ? window.MTApp.getLang() : 'am';
    const body = scene.querySelector(`.scene__body[data-lang="${lang}"]`)
              || scene.querySelector('.scene__body');
    if (!body) return;

    const sceneH = scene.clientHeight;
    if (!sceneH) return;
    const navH = parseFloat(getComputedStyle(scene).paddingTop) || 0;
    const available = sceneH - navH;
    if (available < 240) return;

    const contentH = naturalHeight(body, scene.clientWidth);

    const minMedia = Math.max(170, available * 0.26);
    const maxMedia = available * 0.58;
    const breath = 6;
    let mediaH = available - contentH - breath;
    mediaH = Math.max(minMedia, Math.min(maxMedia, mediaH));

    scene.style.setProperty('--media-h', `${Math.round(mediaH)}px`);
  }

  function fitAll() { scenes.forEach(fitScene); }

  // initial fit — wait for fonts so measurements reflect final metrics
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitAll);
  } else {
    requestAnimationFrame(fitAll);
  }

  // refit on resize / orientation change (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitAll, 150);
  }, { passive: true });

  // re-apply on language change so dynamic content updates + refit
  document.addEventListener('langchange', () => {
    if (window.MTApp) window.MTApp.applyLang(window.MTApp.getLang());
    // wait two frames so swapped body has its real layout
    requestAnimationFrame(() => requestAnimationFrame(fitAll));
  });

  /* -------- per-scene photo carousel -------- */
  scenes.forEach(scene => {
    const media = scene.querySelector('.scene__media');
    if (!media) return;
    const count = +(media.dataset.photoCount || 1);
    if (count < 2) return;

    const imgs    = media.querySelectorAll('.scene__media-img');
    const dotsEls = media.querySelectorAll('.scene__dot');
    const counter = media.querySelector('.scene__counter');
    let cur = 0;

    const set = (next) => {
      const n = (next + count) % count;
      if (n === cur) return;
      imgs[cur].classList.remove('is-current');
      dotsEls[cur].classList.remove('is-current');
      cur = n;
      imgs[cur].classList.add('is-current');
      dotsEls[cur].classList.add('is-current');
      if (counter) counter.textContent = `${cur + 1} / ${count}`;
    };

    media.querySelector('.scene__nav--prev')?.addEventListener('click', e => { e.stopPropagation(); set(cur - 1); });
    media.querySelector('.scene__nav--next')?.addEventListener('click', e => { e.stopPropagation(); set(cur + 1); });
    dotsEls.forEach(d => d.addEventListener('click', e => { e.stopPropagation(); set(+d.dataset.photoIdx); }));

    // touch swipe
    let startX = null, startY = null;
    media.addEventListener('touchstart', e => {
      const t = e.touches[0]; startX = t.clientX; startY = t.clientY;
    }, { passive: true });
    media.addEventListener('touchend', e => {
      if (startX === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        set(dx < 0 ? cur + 1 : cur - 1);
      }
      startX = startY = null;
    }, { passive: true });
  });

  /* -------- click on photo → fullscreen lightbox -------- */
  const lb = lightbox();
  scenes.forEach(scene => {
    if (scene.classList.contains('scene--opening')) return; // hero stays clean
    const media = scene.querySelector('.scene__media');
    if (!media) return;

    media.addEventListener('click', e => {
      // ignore clicks on carousel controls
      if (e.target.closest('.scene__nav, .scene__dot, .scene__counter')) return;
      const imgs = Array.from(media.querySelectorAll('.scene__media-img')).map(i => i.src);
      const cur = Array.from(media.querySelectorAll('.scene__media-img'))
        .findIndex(i => i.classList.contains('is-current'));
      lb.open(imgs, Math.max(0, cur));
    });

    media.style.cursor = 'zoom-in';
  });
})();

/* helpers */
function renderBlock(block, lang) {
  switch (block.type) {
    case 'paragraph':
      return `<p class="scene__text">${escapeHTML(block.text)}</p>`;
    case 'quote':
      return `<blockquote class="scene__quote">${escapeHTML(block.text)}</blockquote>`;
    case 'quote-secondary':
      return `<blockquote class="scene__quote scene__quote--secondary" lang="${block.lang || lang}">${escapeHTML(block.text)}</blockquote>`;
    case 'list':
      return `<ul class="scene__list">${block.items.map(i => `<li>${escapeHTML(i)}</li>`).join('')}</ul>`;
    case 'heading':
    case 'years':
      return ''; // handled in opening scene
    default:
      return '';
  }
}

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
