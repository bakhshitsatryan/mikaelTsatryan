/* ============================================================
   LIGHTBOX — shared full-screen image / video viewer
   Auto-detects videos by file extension.
   ============================================================ */

const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
const isVideo = (src) => VIDEO_RE.test(src);

let mounted = null;

function mount() {
  if (mounted) return mounted;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Media viewer');
  lb.innerHTML = `
    <button class="lightbox__close" aria-label="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
    </button>
    <span class="lightbox__counter" aria-hidden="true"></span>
    <button class="lightbox__nav lightbox__nav--prev" aria-label="Previous">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
    </button>
    <button class="lightbox__nav lightbox__nav--next" aria-label="Next">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
    </button>
    <div class="lightbox__stage"></div>
  `;
  document.body.appendChild(lb);

  const stage    = lb.querySelector('.lightbox__stage');
  const counter  = lb.querySelector('.lightbox__counter');
  const closeBtn = lb.querySelector('.lightbox__close');
  const prevBtn  = lb.querySelector('.lightbox__nav--prev');
  const nextBtn  = lb.querySelector('.lightbox__nav--next');

  let items = [];
  let cursor = 0;

  function clearStage() {
    const v = stage.querySelector('video');
    if (v) { try { v.pause(); } catch (e) {} v.removeAttribute('src'); v.load(); }
    stage.innerHTML = '';
  }

  function buildMedia(src) {
    if (isVideo(src)) {
      const v = document.createElement('video');
      v.className = 'lightbox__video';
      v.src = src;
      v.controls = true;
      v.playsInline = true;
      v.preload = 'metadata';
      v.autoplay = true;
      return v;
    }
    const img = document.createElement('img');
    img.className = 'lightbox__img';
    img.src = src;
    img.alt = '';
    return img;
  }

  function show() {
    stage.classList.add('is-swapping');
    setTimeout(() => {
      clearStage();
      stage.appendChild(buildMedia(items[cursor]));
      counter.textContent = `${cursor + 1} / ${items.length}`;
      stage.classList.remove('is-swapping');
    }, 120);
  }

  function step(dir) {
    cursor = (cursor + dir + items.length) % items.length;
    show();
  }

  function open(srcArray, startIdx = 0) {
    items = srcArray.slice();
    cursor = Math.max(0, Math.min(startIdx, items.length - 1));
    lb.classList.toggle('is-single', items.length < 2);
    clearStage();
    stage.appendChild(buildMedia(items[cursor]));
    counter.textContent = `${cursor + 1} / ${items.length}`;
    lb.classList.add('is-open');
    document.body.classList.add('no-scroll');
  }

  function close() {
    lb.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(clearStage, 200);
  }

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', e => { e.stopPropagation(); step(-1); });
  nextBtn.addEventListener('click', e => { e.stopPropagation(); step(+1); });
  lb.addEventListener('click', e => {
    // close only when clicking the dim background, never the media itself or its controls
    if (e.target === lb || e.target === stage) close();
  });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  step(-1);
    if (e.key === 'ArrowRight') step(+1);
  });

  /* swipe inside lightbox (skip when touching a video so native scrubbing works) */
  let sx = null, sy = null;
  lb.addEventListener('touchstart', e => {
    if (e.target.closest('video')) { sx = sy = null; return; }
    const t = e.touches[0]; sx = t.clientX; sy = t.clientY;
  }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (sx === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      step(dx < 0 ? +1 : -1);
    } else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
      close();
    }
    sx = sy = null;
  }, { passive: true });

  mounted = { open, close };
  return mounted;
}

export function lightbox() {
  return mount();
}

export { isVideo };
