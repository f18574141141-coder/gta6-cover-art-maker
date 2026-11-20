// Vice Cover Studio — bootstrap: start the editor, or a fixed ?shot= scene.
// A `?shot=` query sets up a screenshot scene instead of the plain editor.
import { SIZES } from './state.js';
import { initEditor, photos, photoNames, redraw, exportCoverDataUrl, state, syncToolbar } from './editor.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');

// The shot runner needs a way to load a sample into the panels and repaint.
async function loadSample(name) {
  // initEditor already preloaded boulevard + pier; reuse them when present.
  const idx = photoNames.findIndex((n) => n.toLowerCase() === name.toLowerCase());
  const use = idx >= 0 ? idx : 0;
  const n = Math.max(1, state.panels.length);
  for (let p = 0; p < n; p += 1) {
    state.panels[p].photo = use;
    state.panels[p].zoom = 1.1;
    state.panels[p].ox = (p % 3 - 1) * 0.1;
    state.panels[p].oy = p % 2 === 0 ? -0.06 : 0.06;
  }
  // Title/subtitle inputs follow the shot state.
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  if (title) title.value = state.title;
  if (subtitle) subtitle.value = state.subtitle;
}

const api = {
  state,
  sizes: SIZES,
  canvas,
  loadSample,
  redraw,
};

await initEditor();

if (shot) {
  await runShot(shot, params, api);
  syncToolbar();
} else {
  window.__exportCover = (w, h) => Promise.resolve(exportCoverDataUrl(w, h));
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
