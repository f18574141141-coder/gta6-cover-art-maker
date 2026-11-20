// Vice Cover Studio — shared state, layouts, colour grades and sizes.
// Pure data + helpers only: no DOM, no canvas, so Node can import it too.

export const SIZES = [
  { id: 'square', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

// Every panel rect is a fraction of the canvas: [x, y, w, h].
// Gutter is drawn dark between panels by the renderer.
export const LAYOUTS = {
  'vice-grid': {
    label: 'Vice Grid',
    hint: 'Hero on top, three panels below',
    panels: [
      [0, 0, 1, 0.58],
      [0, 0.58, 1 / 3, 0.42],
      [1 / 3, 0.58, 1 / 3, 0.42],
      [2 / 3, 0.58, 1 / 3, 0.42],
    ],
  },
  'sunset-strip': {
    label: 'Sunset Strip',
    hint: 'Three tall vertical panels',
    panels: [
      [0, 0, 1 / 3, 1],
      [1 / 3, 0, 1 / 3, 1],
      [2 / 3, 0, 1 / 3, 1],
    ],
  },
  'neon-trio': {
    label: 'Neon Trio',
    hint: 'Three wide horizontal bands',
    panels: [
      [0, 0, 1, 1 / 3],
      [0, 1 / 3, 1, 1 / 3],
      [0, 2 / 3, 1, 1 / 3],
    ],
  },
  solo: {
    label: 'Solo',
    hint: 'One full-bleed photo',
    panels: [[0, 0, 1, 1]],
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);

// A grade is a translucent vertical wash over every panel plus a bottom
// scrim so the caption stays readable. Colours are [r, g, b, alpha] stops.
export const GRADES = {
  'vice-sunset': {
    label: 'Vice Sunset',
    top: [255, 46, 136, 0.22],
    mid: [255, 122, 26, 0.14],
    bottom: [88, 28, 135, 0.34],
    scrim: [20, 4, 40, 0.62],
    captionWarm: true,
  },
  'neon-nights': {
    label: 'Neon Nights',
    top: [0, 229, 255, 0.2],
    mid: [255, 46, 136, 0.16],
    bottom: [8, 16, 64, 0.42],
    scrim: [4, 8, 32, 0.62],
    captionWarm: false,
  },
  'palm-dusk': {
    label: 'Palm Dusk',
    top: [124, 58, 237, 0.24],
    mid: [255, 170, 60, 0.12],
    bottom: [48, 16, 80, 0.36],
    scrim: [24, 10, 48, 0.6],
    captionWarm: true,
  },
  'mono-noir': {
    label: 'Mono Noir',
    top: [255, 255, 255, 0.06],
    mid: [128, 128, 128, 0.1],
    bottom: [0, 0, 0, 0.42],
    scrim: [0, 0, 0, 0.6],
    captionWarm: false,
    grayscale: true,
  },
};

export const GRADE_IDS = Object.keys(GRADES);

export const DEFAULT_STATE = {
  layout: 'vice-grid',
  grade: 'vice-sunset',
  size: 'wide',
  title: 'VICE CITY NIGHTS',
  subtitle: 'Sunset heist · Ocean Drive',
  captionPos: 'bottom', // 'top' | 'bottom'
  decorations: true,
  selectedPanel: 0,
  // One entry per panel slot (max 4 panels): which library photo it shows,
  // zoom 1..3 and pan offsets as fractions of the panel size.
  panels: [
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
    { photo: 1, zoom: 1, ox: 0, oy: 0 },
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
    { photo: 1, zoom: 1, ox: 0, oy: 0 },
  ],
};

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function panelCount(state) {
  return LAYOUTS[state.layout].panels.length;
}

export function panelRect(state, index, W, H) {
  const r = LAYOUTS[state.layout].panels[index];
  return { x: r[0] * W, y: r[1] * H, w: r[2] * W, h: r[3] * H };
}

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) || SIZES[0];
}

export function rgba(c) {
  return `rgba(${c[0]},${c[1]},${c[2]},${c[3]})`;
}

// Split a title into at most two lines that fit maxWidth at the given
// canvas font string; returns the lines and the font size that fits.
export function wrapTitle(ctx, text, maxWidth, startSize) {
  const words = String(text || 'VICE').trim().split(/\s+/);
  let size = startSize;
  for (;;) {
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    const lines = [];
    let line = '';
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width <= maxWidth || !line) line = trial;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    if ((lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= maxWidth)) || size <= 28) {
      return { lines: lines.slice(0, 2), size };
    }
    size = Math.floor(size * 0.92);
  }
}
