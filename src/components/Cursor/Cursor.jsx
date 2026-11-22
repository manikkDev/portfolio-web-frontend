import { useEffect, useRef } from 'react';
import './Cursor.css';

/**
 * The cursor's extras (mouse and trackpad only). The pointer itself is the system cursor drawn
 * as a HUD reticle in Cursor.css, so it never lags behind the mouse. This adds:
 *   - lock-on: over a link or button, brackets snap out to frame it, with a tag saying what a
 *     click does
 *   - a ping where you click
 * The animation loop only runs while something is locked on, so it costs nothing otherwise.
 */
const CLICKABLE = 'a, button, [role="button"], summary, label[for], [data-cursor]';
const LOCK_MAX = { w: 400, h: 220 }; // bigger than this (a whole card) and it is not framed
const PAD = 7; // gap between the target and the brackets
const SIGNS = [[-1, -1], [1, -1], [-1, 1], [1, 1]]; // tl, tr, bl, br

function tagFor(el) {
  if (el.dataset.cursor) return el.dataset.cursor;
  if (el.tagName === 'A') {
    const href = el.getAttribute('href') || '';
    if (el.hasAttribute('download') || /\.pdf($|\?)/i.test(href)) return 'save';
    if (href.startsWith('mailto:')) return 'mail';
    if (href.startsWith('#')) return 'go';
    if (el.target === '_blank' || /^https?:/i.test(href)) return 'open ↗';
    return 'go';
  }
  if (el.type === 'submit') return 'send';
  return 'press';
}

export default function Cursor() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tag = root.querySelector('.cur-tag');
    const corners = [...root.querySelectorAll('.cur-corner')];

    const pointer = { x: 0, y: 0 };
    const box = { x: 0, y: 0, w: 0, h: 0 }; // where the brackets are now
    let target = null;
    let frame = 0;
    let last = 0;

    const draw = () => {
      for (let i = 0; i < 4; i++) {
        const x = box.x + SIGNS[i][0] * box.w * 0.5;
        const y = box.y + SIGNS[i][1] * box.h * 0.5;
        corners[i].style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
      tag.style.transform = `translate3d(${(box.x - box.w / 2).toFixed(1)}px, ${(box.y - box.h / 2 - 5).toFixed(1)}px, 0) translateY(-100%)`;
    };

    const release = () => {
      target = null;
      root.classList.remove('is-locked');
    };

    const tick = (time) => {
      if (!target) {
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(tick);
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      const r = target.getBoundingClientRect();
      if (!target.isConnected || r.width === 0) {
        release();
        return;
      }
      const k = calm ? 1 : 1 - Math.exp(-dt * 30); // snappy: settles in about a tenth of a second
      box.x += (r.left + r.width / 2 - box.x) * k;
      box.y += (r.top + r.height / 2 - box.y) * k;
      box.w += (r.width + PAD * 2 - box.w) * k;
      box.h += (r.height + PAD * 2 - box.h) * k;
      draw();
    };

    const lock = (el) => {
      const r = el.getBoundingClientRect();
      if (!el.dataset.cursor && (r.width > LOCK_MAX.w || r.height > LOCK_MAX.h)) {
        release();
        return;
      }
      if (target === el) return;
      if (!target) {
        // the brackets spring out from the pointer to the target
        Object.assign(box, { x: pointer.x, y: pointer.y, w: 24, h: 24 });
        draw();
      }
      target = el;
      tag.textContent = tagFor(el);
      root.classList.add('is-locked');
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    const onOver = (e) => {
      if (e.pointerType !== 'mouse') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      const hit = e.target instanceof Element ? e.target.closest(CLICKABLE) : null;
      if (hit && !hit.disabled) lock(hit);
      else release();
    };
    const onDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || calm) return;
      const ping = document.createElement('span');
      ping.className = `cur-ping${target ? ' cur-ping--lock' : ''}`;
      ping.style.setProperty('--x', `${e.clientX}px`);
      ping.style.setProperty('--y', `${e.clientY}px`);
      root.appendChild(ping);
      setTimeout(() => ping.remove(), 520);
    };
    const onOut = (e) => {
      if (!e.relatedTarget) release(); // left the window
    };

    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerout', onOut, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerout', onOut);
    };
  }, []);

  return (
    <div className="cur" ref={rootRef} aria-hidden="true">
      <span className="cur-corner cur-corner--tl" />
      <span className="cur-corner cur-corner--tr" />
      <span className="cur-corner cur-corner--bl" />
      <span className="cur-corner cur-corner--br" />
      <span className="cur-tag" />
    </div>
  );
}
