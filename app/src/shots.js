// Fixed scenes for screenshots.
// ?shot=cover  — the cover alone, full-bleed at w×h (editor UI hidden).
// ?shot=editor — the editor with a sample photo loaded in the panels.
// Query keys: photo (boulevard|pier), caption, subtitle, layout, grade,
// decor (0|1), w, h. window.__shotReady is set once the scene has painted.
import { GRADES, LAYOUTS } from './state.js';

export async function runShot(shot, query, api) {
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'Ocean Drive · Vice City';
  const layout = query.get('layout');
  const grade = query.get('grade');
  const decor = query.get('decor');
  const w = Number(query.get('w') || 0);
  const h = Number(query.get('h') || 0);

  if (layout && LAYOUTS[layout]) api.state.layout = layout;
  if (grade && GRADES[grade]) api.state.grade = grade;
  if (decor === '0') api.state.decorations = false;
  if (decor === '1') api.state.decorations = true;
  if (w > 0 && h > 0) {
    const match = api.sizes.find((s) => s.w === w && s.h === h);
    api.state.size = match ? match.id : 'wide';
    if (!match) {
      // Custom shot size: paint the canvas at exactly w×h.
      api.canvas.width = w;
      api.canvas.height = h;
    }
  }
  api.state.title = caption;
  api.state.subtitle = subtitle;

  if (shot === 'cover') document.body.classList.add('shot-cover');
  // Load the sample into every panel slot so all layouts are filled.
  await api.loadSample(photo);
  // Optional per-panel crop overrides: oy=0.5,0,-0.3 (fractions of panel
  // size), ox=..., zoom=1.1 — used by shots to frame faces nicely.
  const applyList = (key, field) => {
    const raw = query.get(key);
    if (!raw) return;
    raw.split(',').forEach((v, i) => {
      const n = Number(v);
      if (Number.isFinite(n) && api.state.panels[i]) api.state.panels[i][field] = n;
    });
  };
  applyList('oy', 'oy');
  applyList('ox', 'ox');
  const zoom = Number(query.get('zoom') || 0);
  if (zoom > 0) api.state.panels.forEach((p) => { p.zoom = zoom; });
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
