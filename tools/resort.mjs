#!/usr/bin/env node
// Re-orders the line lists of a published build without rebuilding it:
// trolleybuses first, day lines next, NIGHT lines last — the rule the
// pipelines apply from 7.09.2026 (lineRank in build.mjs) — applied to the
// files a build already wrote. Every list the map prints is touched: the
// panel (meta.json), the number rows along streets (labels, lines-rows), the
// stop and corridor lists (stops, streets, lines-corridors) and the terminus
// badge grids (badges: the boxes keep their slots, the lines change seats).
//
//   node tools/resort.mjs <repo> [<repo>…]      (all repos of RULES when none given)
//
// Works on docs/data (the published build) and on data/out when it exists.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HUB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESK = path.resolve(HUB, '..');

// night(label, mode, key) → true for a night line; the label is what the map
// prints (the key minus any pipeline prefix), the mode 'bus' or 'tram'
const N = (re, modes = ['bus']) => (l, m) => modes.includes(m) && re.test(l);
const RULES = {
  'london-bus-map': N(/^N\d/),
  'randstad-bus-map': N(/^N\d/i),
  'paris-bus-map': N(/^N\d/),
  'naples-bus-map': N(/^N\d/),
  'vienna-bus-map': N(/^N\d/),
  'sofia-bus-map': N(/^N\d/),
  'bucharest-bus-map': N(/^N\d/),
  'warsaw-bus-map': N(/^N\d/),
  'trojmiasto-bus-map': N(/^N\d/),
  'lodz-bus-map': N(/^N\d/),
  'olsztyn-bus-map': N(/^N\d/),
  'rome-bus-map': N(/^n/),
  'poznan-bus-map': N(/^2\d\d$/),
  'krakow-bus-map': (l, m) => (m === 'tram' ? /^6\d$/.test(l) : /^[69]\d\d$/.test(l)),
  'krakow-mld-bus-map': (l, m) => (m === 'tram' ? /^6\d$/.test(l) : /^[69]\d\d$/.test(l)),
  'budapest-bus-map': N(/^9\d\d$/),
  'toronto-bus-map': N(/^3\d\d$/, ['bus', 'tram']),
  'athens-bus-map': N(/^(400|500|790)$/),
  'gzm-bus-map': N(/\dN$/),
  'thessaloniki-bus-map': N(/\dN$/),
  'stockholm-bus-map': N(/^9\d$/),
};
const TROLLEY = '#149a3f';

const keyParts = (s) => { const m = /^(\D*)(\d*)(.*)$/.exec(s); return [m[1], m[2] ? Number(m[2]) : Infinity, m[3]]; };
const numSort = (a, b) => { const A = keyParts(a), B = keyParts(b); return A[0].localeCompare(B[0]) || (A[1] - B[1]) || A[2].localeCompare(B[2]); };

function resortDir(repo, dir, night) {
  const metaFile = path.join(dir, 'meta.json');
  if (!fs.existsSync(metaFile)) return;
  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  const info = new Map(); // key → { mode, color, label }
  for (const l of meta.lines) info.set(l.line, { mode: l.mode, color: l.color, label: l.label ?? l.line });
  const rankOf = (k) => {
    const i = info.get(k);
    if (!i) return 1;
    if (i.color === TROLLEY) return 0;
    return night(i.label, i.mode, k) ? 2 : 1;
  };
  const disp = (k) => info.get(k)?.label ?? k;
  const cmp = (a, b) => rankOf(a) - rankOf(b) || numSort(disp(a), disp(b)) || a.localeCompare(b);
  const stats = { files: 0, lists: 0, badges: 0 };

  // meta: the panel order — modes keep their block order, ranks inside
  const modeOrder = [...new Set(meta.lines.map((l) => l.mode))];
  meta.lines = meta.lines.map((l) => ({ ...l, rank: rankOf(l.line) }))
    .sort((a, b) => modeOrder.indexOf(a.mode) - modeOrder.indexOf(b.mode) || cmp(a.line, b.line));
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));

  // a printed list ("5, 12, N1") re-joined in the new order; tokens are what
  // the map prints, keys are what arr holds — paired by position when they
  // match one to one, otherwise the string is left alone
  const rejoin = (str, arr, sorted) => {
    if (typeof str !== 'string') return str;
    const tok = str.split(', ');
    if (tok.length === arr.length) {
      const m = new Map(arr.map((k, i) => [k, tok[i]]));
      return sorted.map((k) => m.get(k)).join(', ');
    }
    const cap = /^(.*) \+(\d+)$/.exec(str);
    if (cap) {
      const head = cap[1].split(', ');
      if (head.every((t, i) => t === arr[i])) return sorted.slice(0, head.length).join(', ') + ' +' + cap[2];
    }
    return str;
  };
  const LIST_FIELDS = ['lines', 'busLines', 'tLines', 'ntLines', 'mLines', 'nmLines'];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.geojson')) continue;
    if (['route.geojson', 'gtfs-shape.geojson', 'street-names.geojson', 'lines-strands.geojson'].includes(f)) continue;
    const file = path.join(dir, f);
    const fc = JSON.parse(fs.readFileSync(file, 'utf8'));
    let touched = 0;
    if (f === 'badges.geojson') {
      // boxes: one complex = one coordinate + band; the slots stay, the lines change seats
      const groups = new Map();
      for (const ft of fc.features) {
        const p = ft.properties;
        if (p.line === undefined) {
          if (Array.isArray(p.arr)) { const s = p.arr.slice().sort(cmp); if (s.join() !== p.arr.join()) { p.arr = s; touched++; } }
          continue;
        }
        const k = ft.geometry.coordinates.join(',') + '|' + p.band;
        let g = groups.get(k);
        if (!g) groups.set(k, (g = []));
        g.push(ft);
      }
      for (const g of groups.values()) {
        if (g.length < 2) continue;
        const slots = g.map((ft) => ft.properties.off).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
        const order = g.map((ft) => ft.properties.line).sort(cmp);
        const byLine = new Map(g.map((ft) => [ft.properties.line, ft]));
        let changed = false;
        order.forEach((line, i) => {
          const ft = byLine.get(line);
          if (ft.properties.off[0] !== slots[i][0] || ft.properties.off[1] !== slots[i][1]) changed = true;
          ft.properties.off = slots[i];
        });
        if (changed) { touched++; stats.badges++; }
      }
    } else if (f === 'lines-rows.geojson') {
      for (const ft of fc.features) {
        const p = ft.properties;
        if (!Array.isArray(p.arr)) continue;
        const sorted = p.arr.slice().sort(cmp);
        if (sorted.join() === p.arr.join()) continue;
        // l0/c0 … pairs: text with its trailing ", " and colour, per position
        const pairs = new Map();
        p.arr.forEach((k, i) => { if (p['l' + i] !== undefined) pairs.set(k, { l: p['l' + i].replace(/, $/, ''), c: p['c' + i] }); });
        if (pairs.size !== p.arr.length) { touched += 0; continue; }
        sorted.forEach((k, i) => { const q = pairs.get(k); p['l' + i] = q.l + (i < sorted.length - 1 ? ', ' : ''); p['c' + i] = q.c; });
        p.lines = rejoin(p.lines, p.arr, sorted);
        p.arr = sorted;
        touched++;
      }
    } else {
      for (const ft of fc.features) {
        const p = ft.properties;
        if (!Array.isArray(p.arr)) continue;
        const sorted = p.arr.slice().sort(cmp);
        // the other printed lists carry a subset of arr (the bus half, the tram half…)
        for (const fld of LIST_FIELDS) {
          if (typeof p[fld] !== 'string') continue;
          if (fld === 'lines') { p[fld] = rejoin(p[fld], p.arr, sorted); continue; }
          const tok = p[fld].split(', ');
          const m = new Map(); p.arr.forEach((k, i) => { const t = (p.lines || '').split(', ')[i]; if (t !== undefined) m.set(t, k); });
          const keyed = tok.map((t) => [t, m.get(t) ?? t]);
          if (!keyed.every(([, k]) => info.has(k))) continue;
          p[fld] = keyed.sort((a, b) => cmp(a[1], b[1])).map(([t]) => t).join(', ');
        }
        if (sorted.join() !== p.arr.join()) { p.arr = sorted; touched++; }
      }
    }
    if (touched) { fs.writeFileSync(file, JSON.stringify(fc)); stats.files++; stats.lists += touched; }
  }
  console.log(`${repo} ${path.relative(path.join(DESK, repo), dir)}: ${meta.lines.filter((l) => l.rank === 2).length} night, ${meta.lines.filter((l) => l.rank === 0).length} trolleybus — ${stats.lists} lists in ${stats.files} files, ${stats.badges} badge grids reseated`);
}

const only = process.argv.slice(2);
for (const repo of Object.keys(RULES)) {
  if (only.length && !only.includes(repo)) continue;
  const root = path.join(DESK, repo);
  if (!fs.existsSync(root)) { console.log(`${repo}: not found`); continue; }
  // …and the archived versions of the timeline (Kraków: docs/data/versions/<date>/)
  const dirs = ['docs/data', 'data/out'];
  for (const base of ['docs/data/versions', 'data/out/versions']) {
    const vb = path.join(root, base);
    if (fs.existsSync(vb)) for (const v of fs.readdirSync(vb)) dirs.push(path.join(base, v));
  }
  for (const d of dirs) {
    const dir = path.join(root, d);
    if (fs.existsSync(path.join(dir, 'meta.json'))) resortDir(repo, dir, RULES[repo]);
  }
}
