// Vice Cover Studio — cover renderer.
// drawCover(canvas, state, photos) paints the whole poster; every helper is
// exported so the editor and the shot runner can reuse single pieces.
// photos: array of HTMLImageElement (or any image with naturalWidth/Height).
// No DOM access here except the canvas 2d context passed in.

import { GRADES, LAYOUTS, panelRect, rgba, wrapTitle } from './state.js';

const GUTTER_FRAC = 0.008; // gutter as a fraction of canvas width

function coverFit(img, pw, ph, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  return {
    dx: (pw - dw) / 2 + ox * pw,
    dy: (ph - dh) / 2 + oy * ph,
    dw,
    dh,
  };
}

// Draw one photo into a panel rect with cover-fit, zoom and pan.
export function drawPanelPhoto(ctx, img, rect, panel) {
  if (!img) return false;
  const { dx, dy, dw, dh } = coverFit(img, rect.w, rect.h, panel.zoom || 1, panel.ox || 0, panel.oy || 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, rect.x + dx, rect.y + dy, dw, dh);
  ctx.restore();
  return true;
}

// Translucent vertical grade wash + optional grayscale pass per panel.
export function drawGrade(ctx, rect, grade) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, rgba(grade.top));
  g.addColorStop(0.55, rgba(grade.mid));
  g.addColorStop(1, rgba(grade.bottom));
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (grade.grayscale) {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'rgba(128,128,128,1)';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
}

// Original decorations, drawn with canvas paths only: a setting-sun disc,
// palm-tree silhouettes and a low skyline. No Rockstar art, logos or fonts.
export function drawDecorations(ctx, W, H, state) {
  if (!state.decorations) return;
  const hero = panelRect(state, 0, W, H);
  const sunR = Math.min(hero.w, hero.h) * 0.16;
  const sx = hero.x + hero.w * 0.78;
  const sy = hero.y + hero.h * 0.3;
  // Sun disc with warm radial glow.
  const glow = ctx.createRadialGradient(sx, sy, sunR * 0.2, sx, sy, sunR * 2.1);
  glow.addColorStop(0, 'rgba(255,190,80,0.85)');
  glow.addColorStop(0.45, 'rgba(255,110,60,0.4)');
  glow.addColorStop(1, 'rgba(255,110,60,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sx, sy, sunR * 2.1, 0, Math.PI * 2);
  ctx.fill();
  const disc = ctx.createLinearGradient(sx, sy - sunR, sx, sy + sunR);
  disc.addColorStop(0, '#ffe9a3');
  disc.addColorStop(0.55, '#ffb347');
  disc.addColorStop(1, '#ff5e62');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(sx, sy, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Sun slats: thin dark gaps across the lower half of the disc.
  ctx.save();
  ctx.beginPath();
  ctx.arc(sx, sy, sunR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(40,8,40,0.55)';
  for (let i = 0; i < 4; i += 1) {
    const yy = sy + sunR * (0.08 + i * 0.2);
    ctx.fillRect(sx - sunR, yy, sunR * 2, sunR * 0.045);
  }
  ctx.restore();

  // Palm silhouettes: curved trunk + seven drooping fronds, twice.
  drawPalm(ctx, hero.x + hero.w * 0.07, hero.y + hero.h * 0.98, hero.h * 0.34, -0.12);
  drawPalm(ctx, hero.x + hero.w * 0.16, hero.y + hero.h * 0.99, hero.h * 0.26, 0.1);
  // Low skyline rectangles along the hero panel's bottom edge.
  const base = hero.y + hero.h;
  const sky = ['#1c0b2e', '#2a1040', '#160a26', '#33124d'];
  let x = hero.x + hero.w * 0.3;
  let i = 0;
  while (x < hero.x + hero.w * 0.98) {
    const bw = hero.w * (0.05 + ((i * 37) % 5) * 0.012);
    const bh = hero.h * (0.1 + ((i * 53) % 7) * 0.03);
    ctx.fillStyle = sky[i % sky.length];
    ctx.fillRect(x, base - bh, bw, bh);
    // Tiny lit windows.
    ctx.fillStyle = 'rgba(255,220,120,0.75)';
    const rows = Math.max(1, Math.floor(bh / (hero.h * 0.05)));
    for (let r = 0; r < rows; r += 1) {
      if ((i + r) % 3 === 0) ctx.fillRect(x + bw * 0.25, base - bh + hero.h * 0.03 + r * hero.h * 0.05, bw * 0.18, hero.h * 0.018);
    }
    x += bw + hero.w * 0.012;
    i += 1;
  }
}

function drawPalm(ctx, bx, by, h, lean) {
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(lean);
  ctx.strokeStyle = 'rgba(12,4,20,0.92)';
  ctx.fillStyle = 'rgba(12,4,20,0.92)';
  ctx.lineCap = 'round';
  // Trunk: gentle curve.
  ctx.lineWidth = h * 0.045;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(h * 0.06, -h * 0.55, h * 0.02, -h * 0.92);
  ctx.stroke();
  // Fronds fanning from the crown.
  const cx = h * 0.02;
  const cy = -h * 0.92;
  for (let f = 0; f < 7; f += 1) {
    const a = Math.PI * (0.08 + (f / 6) * 0.84);
    const len = h * (0.42 - Math.abs(f - 3) * 0.045);
    const ex = cx + Math.cos(a) * len * 0.9 - len * 0.25;
    const ey = cy - Math.sin(a) * len * 0.35 + len * 0.42;
    ctx.lineWidth = h * 0.028;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + Math.cos(a) * len * 0.55, cy - Math.sin(a) * len * 0.5, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

// Bold condensed caption: Anton when loaded, else bold italic system sans
// with a horizontal squeeze. White fill, dark outline, soft shadow, skew.
export function drawCaption(ctx, W, H, state) {
  const grade = GRADES[state.grade] || GRADES['vice-sunset'];
  const title = (state.title || '').trim() || 'VICE';
  const sub = (state.subtitle || '').trim();
  const top = state.captionPos === 'top';
  const margin = W * 0.045;
  const maxW = W - margin * 2;
  const startSize = Math.round(W * 0.105);
  const { lines, size } = wrapTitle(ctx, title, maxW, startSize);
  const lineH = size * 1.02;
  const blockH = lines.length * lineH + (sub ? size * 0.42 : 0);
  const y0 = top ? H * 0.045 : H - blockH - H * 0.05;

  // Bottom/top scrim for legibility.
  const scrimH = blockH + H * 0.09;
  const scrim = ctx.createLinearGradient(0, top ? 0 : H - scrimH, 0, top ? scrimH : H);
  scrim.addColorStop(0, rgba(grade.scrim));
  scrim.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = scrim;
  if (top) ctx.fillRect(0, 0, W, scrimH);
  else ctx.fillRect(0, H - scrimH, W, scrimH);

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = size * 0.14;
  ctx.shadowOffsetY = size * 0.04;
  lines.forEach((line, li) => {
    const y = y0 + size + li * lineH;
    ctx.save();
    // Slight italic skew + condensed squeeze for the poster feel.
    ctx.translate(margin, y);
    ctx.transform(1, 0, -0.08, 1, 0, 0);
    ctx.scale(0.94, 1);
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeStyle = 'rgba(16,4,28,0.92)';
    ctx.strokeText(line, 0, 0);
    if (grade.captionWarm) {
      const fill = ctx.createLinearGradient(0, -size, 0, size * 0.2);
      fill.addColorStop(0, '#ffffff');
      fill.addColorStop(0.6, '#ffe9c9');
      fill.addColorStop(1, '#ffb347');
      ctx.fillStyle = fill;
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillText(line, 0, 0);
    ctx.restore();
  });
  if (sub) {
    const subSize = Math.max(18, Math.round(size * 0.3));
    ctx.font = `italic 700 ${subSize}px 'Arial Black', Arial, sans-serif`;
    ctx.lineWidth = Math.max(2, subSize * 0.12);
    ctx.strokeStyle = 'rgba(16,4,28,0.9)';
    const sy = y0 + lines.length * lineH + subSize * 0.9;
    ctx.save();
    ctx.translate(margin, sy);
    ctx.transform(1, 0, -0.06, 1, 0, 0);
    ctx.strokeText(sub.toUpperCase(), 0, 0);
    ctx.fillStyle = '#ffe9a3';
    ctx.fillText(sub.toUpperCase(), 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

// Paint the full cover onto ctx at W×H.
export function drawCover(ctx, W, H, state, photos) {
  const grade = GRADES[state.grade] || GRADES['vice-sunset'];
  const gutter = Math.max(2, Math.round(W * GUTTER_FRAC));
  // Dark gutters first, then panels on top.
  ctx.fillStyle = '#0b0614';
  ctx.fillRect(0, 0, W, H);
  const rects = LAYOUTS[state.layout].panels;
  rects.forEach((_, i) => {
    const r = panelRect(state, i, W, H);
    const inset = {
      x: r.x + (r.x > 0 ? gutter / 2 : 0),
      y: r.y + (r.y > 0 ? gutter / 2 : 0),
      w: r.w - (r.x > 0 ? gutter / 2 : 0) - (r.x + r.w < W ? gutter / 2 : 0),
      h: r.h - (r.y > 0 ? gutter / 2 : 0) - (r.y + r.h < H ? gutter / 2 : 0),
    };
    const slot = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = photos && photos[slot.photo];
    const painted = img ? drawPanelPhoto(ctx, img, inset, slot) : false;
    if (!painted) {
      // Empty panel: warm placeholder gradient so the layout still reads.
      const ph = ctx.createLinearGradient(inset.x, inset.y, inset.x, inset.y + inset.h);
      ph.addColorStop(0, '#3b1155');
      ph.addColorStop(1, '#12081f');
      ctx.fillStyle = ph;
      ctx.fillRect(inset.x, inset.y, inset.w, inset.h);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `700 ${Math.max(16, Math.round(inset.w * 0.05))}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', inset.x + inset.w / 2, inset.y + inset.h / 2);
      ctx.textAlign = 'left';
    }
    drawGrade(ctx, inset, grade);
  });
  drawDecorations(ctx, W, H, state);
  drawCaption(ctx, W, H, state);
}

// Convenience wrapper: size the canvas, paint, return it.
export function renderCover(canvas, state, photos) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, W, H, state, photos);
  return canvas;
}
