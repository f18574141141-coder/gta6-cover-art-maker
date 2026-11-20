// Vice Cover Studio — editor wiring: photo library, panel selection and
// drag-pan, toolbar controls, export, and the __exportCover hook.
// Owns all DOM; cover.js owns all drawing.

import { DEFAULT_STATE, GRADE_IDS, GRADES, LAYOUTS, LAYOUT_IDS, SIZES, cloneState, panelCount, panelRect, sizeById } from './state.js';
import { renderCover } from './cover.js';

export const state = cloneState(DEFAULT_STATE);
// photos[i] is an Image (or null while loading); names[i] is its label.
export const photos = [];
export const photoNames = [];

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
let dragging = null; // {x, y} last pointer position in canvas pixels
let fontReady = false;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load image'));
    img.src = url;
  });
}

export function redraw() {
  const size = sizeById(state.size);
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  renderCover(canvas, state, photos);
  updatePanelUI();
}

function setStatus(msg) {
  const el = $('status');
  if (el) el.textContent = msg;
}

// ---- Photo library -------------------------------------------------------

export async function addPhotoFile(file) {
  if (!file || !file.type.startsWith('image/')) return false;
  if (photos.length >= 4) {
    setStatus('Library is full — 4 photos max. Remove one first.');
    return false;
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    photos.push(img);
    photoNames.push(file.name.replace(/\.[^.]+$/, '').slice(0, 18) || `Photo ${photos.length}`);
  } finally {
    URL.revokeObjectURL(url);
  }
  renderLibrary();
  redraw();
  setStatus(`Added ${photoNames[photoNames.length - 1]} — click it to put it in the selected panel.`);
  return true;
}

export async function addPhotoUrl(url, name) {
  const img = await loadImage(url);
  photos.push(img);
  photoNames.push(name || `Photo ${photos.length}`);
  renderLibrary();
  redraw();
}

function renderLibrary() {
  const lib = $('library');
  lib.innerHTML = '';
  photos.forEach((img, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.title = `Use ${photoNames[i]} in the selected panel`;
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = photoNames[i];
    const label = document.createElement('span');
    label.textContent = photoNames[i];
    btn.append(thumb, label);
    btn.addEventListener('click', () => {
      assignPhoto(i);
    });
    lib.appendChild(btn);
  });
  if (photos.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No photos yet — add one below or drop it on the page.';
    lib.appendChild(empty);
  }
  $('count').textContent = `${photos.length} / 4 photos`;
}

function assignPhoto(i) {
  const slot = state.panels[state.selectedPanel];
  if (slot) slot.photo = i;
  redraw();
  setStatus(`${photoNames[i]} is now in panel ${state.selectedPanel + 1}.`);
}

function usePhotoInAllPanels() {
  if (photos.length === 0) return;
  const n = panelCount(state);
  for (let p = 0; p < n; p += 1) {
    state.panels[p].photo = p % photos.length;
    // A different crop offset per panel so one photo reads as a collage.
    state.panels[p].ox = (p % 3 - 1) * 0.12;
    state.panels[p].oy = (p % 2 === 0 ? -0.08 : 0.08);
    state.panels[p].zoom = 1.15;
  }
  redraw();
  setStatus('One photo across every panel, each cropped differently.');
}

// ---- Panel selection + drag-pan ------------------------------------------

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

function pickPanel(p) {
  const n = panelCount(state);
  for (let i = n - 1; i >= 0; i -= 1) {
    const r = panelRect(state, i, canvas.width, canvas.height);
    if (p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h) return i;
  }
  return 0;
}

function updatePanelUI() {
  const n = panelCount(state);
  $('panelLabel').textContent = `Panel ${state.selectedPanel + 1} of ${n}`;
  const slot = state.panels[state.selectedPanel] || { zoom: 1 };
  $('zoom').value = String(Math.round((slot.zoom || 1) * 100));
  $('zoomVal').textContent = `${Math.round((slot.zoom || 1) * 100)}%`;
  // Selected-panel outline, drawn on top of the cover.
  const ctx = canvas.getContext('2d');
  const r = panelRect(state, state.selectedPanel, canvas.width, canvas.height);
  ctx.save();
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = Math.max(4, canvas.width * 0.006);
  ctx.setLineDash([canvas.width * 0.02, canvas.width * 0.012]);
  ctx.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
  ctx.restore();
}

function bindCanvas() {
  canvas.addEventListener('pointerdown', (e) => {
    const p = canvasPoint(e);
    state.selectedPanel = pickPanel(p);
    dragging = p;
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = canvasPoint(e);
    const r = panelRect(state, state.selectedPanel, canvas.width, canvas.height);
    const slot = state.panels[state.selectedPanel];
    if (slot) {
      slot.ox = (slot.ox || 0) + (p.x - dragging.x) / r.w;
      slot.oy = (slot.oy || 0) + (p.y - dragging.y) / r.h;
      slot.ox = Math.max(-0.6, Math.min(0.6, slot.ox));
      slot.oy = Math.max(-0.6, Math.min(0.6, slot.oy));
    }
    dragging = p;
    redraw();
  });
  const stop = () => {
    dragging = null;
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
}

// ---- Toolbar + export ----------------------------------------------------

function buildToolbar() {
  const layoutBox = $('layouts');
  LAYOUT_IDS.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.layout = id;
    b.textContent = LAYOUTS[id].label;
    b.title = LAYOUTS[id].hint;
    b.addEventListener('click', () => {
      state.layout = id;
      if (state.selectedPanel >= panelCount(state)) state.selectedPanel = 0;
      syncToolbar();
      redraw();
    });
    layoutBox.appendChild(b);
  });
  const gradeBox = $('grades');
  GRADE_IDS.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.grade = id;
    b.textContent = GRADES[id].label;
    b.addEventListener('click', () => {
      state.grade = id;
      syncToolbar();
      redraw();
    });
    gradeBox.appendChild(b);
  });
  const sizeBox = $('sizes');
  SIZES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.size = s.id;
    b.textContent = s.label;
    b.addEventListener('click', () => {
      state.size = s.id;
      syncToolbar();
      redraw();
    });
    sizeBox.appendChild(b);
  });
}

export function syncToolbar() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('on', b.dataset.size === state.size));
  $('decor').checked = state.decorations;
  $('capTop').checked = state.captionPos === 'top';
  $('capBottom').checked = state.captionPos === 'bottom';
}

function bindControls() {
  $('fileInput').addEventListener('change', async (e) => {
    for (const f of e.target.files) await addPhotoFile(f);
    e.target.value = '';
  });
  $('useAll').addEventListener('click', usePhotoInAllPanels);
  $('zoom').addEventListener('input', (e) => {
    const slot = state.panels[state.selectedPanel];
    if (slot) slot.zoom = Number(e.target.value) / 100;
    redraw();
  });
  $('resetPanel').addEventListener('click', () => {
    const slot = state.panels[state.selectedPanel];
    if (slot) {
      slot.zoom = 1;
      slot.ox = 0;
      slot.oy = 0;
    }
    redraw();
    setStatus(`Panel ${state.selectedPanel + 1} reset to fit.`);
  });
  $('title').addEventListener('input', (e) => {
    state.title = e.target.value;
    redraw();
  });
  $('subtitle').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    redraw();
  });
  $('capTop').addEventListener('change', () => {
    state.captionPos = 'top';
    redraw();
  });
  $('capBottom').addEventListener('change', () => {
    state.captionPos = 'bottom';
    redraw();
  });
  $('decor').addEventListener('change', (e) => {
    state.decorations = e.target.checked;
    redraw();
  });
  $('exportBtn').addEventListener('click', () => exportPng());
  // Drag & drop anywhere on the page.
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    for (const f of e.dataTransfer.files) await addPhotoFile(f);
  });
}

export function exportPng() {
  const size = sizeById(state.size);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const name = `vice-cover-${size.w}x${size.h}.png`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setStatus(`Saved ${name} — share it anywhere.`);
      resolve(name);
    }, 'image/png');
  });
}

// Headless / screenshot hook: paint at w×h off the live state and resolve
// with a PNG data URL. The visible canvas is restored afterwards.
export function exportCoverDataUrl(w, h) {
  const prevW = canvas.width;
  const prevH = canvas.height;
  const prevSize = state.size;
  canvas.width = w;
  canvas.height = h;
  renderCover(canvas, state, photos);
  const url = canvas.toDataURL('image/png');
  canvas.width = prevW;
  canvas.height = prevH;
  state.size = prevSize;
  redraw();
  return url;
}

export async function initEditor() {
  buildToolbar();
  bindControls();
  bindCanvas();
  syncToolbar();
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  // Anton (SIL OFL, shipped under app/fonts/) for the poster lettering.
  try {
    await document.fonts.load('100px Anton');
    fontReady = true;
  } catch {
    fontReady = false; // fallback: bold system sans with a squeeze
  }
  // Preload the two kit sample photos so the editor is never empty.
  await addPhotoUrl('samples/boulevard.jpg', 'Boulevard');
  await addPhotoUrl('samples/pier.jpg', 'Pier');
  redraw();
  window.__exportCover = (w, h) => Promise.resolve(exportCoverDataUrl(w, h));
  return fontReady;
}
