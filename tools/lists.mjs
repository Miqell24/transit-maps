#!/usr/bin/env node
// Line lists of a finished build, re-ordered and re-labelled WITHOUT a rebuild
// (17.09.2026) — for maps whose rebuild needs a download the moment cannot
// afford (Stockholm's Sweden extract, Berlin's 26 GB graph, Naples' Overpass).
// The successor of resort.mjs, which paired printed tokens with keys BY
// POSITION and so could not touch Berlin, whose rows print labels in label
// order and keep keys ("bvg:N1") in key order.
//
// Per repo (RULES below):
//   night   — regex on the PRINTED label: black, last of all (family rule 8.09)
//   first   — regex on the label: printed right after the trolleybuses, ahead
//             of the day lines (GZM/Berlin metro lines, Burgas' Б lines)
//   relabel — key → printed label (Naples ALIB → Alibus)
//
// Order inside every list = trolleybus (green) → first → day → night; within a
// rank the existing order stays, except the night rank, which is sorted
// naturally (Stockholm: 91, 93 … 96 before 191, 291 …). The panel (meta.json)
// keeps the family layout: day lines in mode blocks, then ALL night lines.
// Number-row sections (l0/c0 …) are recomputed by the repo's own night.mjs.
//
//   node tools/lists.mjs <repo> [<repo>…]     (docs/data and data/out when present)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HUB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESK = path.resolve(HUB, '..');
const TROLLEY = '#149a3f';

export const RULES = {
  // SL night buses: 9x in the city, x9x in the suburbs (91, 191, 592, 890) —
  // the second digit from the end is a 9 (user 17.09.2026)
  'stockholm-bus-map': { night: /^\d*9\d$/ },
  // MetroBus and MetroTram open their lists (user 17.09.2026)
  'berlin-bus-map': { night: /^N\d/, first: /^M\d+$/ },
  // Б — Burgas' quasi-BRT — opens the bus list (user 17.09.2026)
  'burgas-bus-map': { night: /^$/, first: /^Б/ },
  // ANM's airport shuttle prints as the city writes it (user 17.09.2026)
  'naples-bus-map': { night: /^N\d/, relabel: { ALIB: 'Alibus' } },
};

const keyParts = (s) => { const m = /^(\D*)(\d*)(.*)$/.exec(s); return [m[1], m[2] ? Number(m[2]) : Infinity, m[3]]; };
const natural = (a, b) => { const A = keyParts(a), B = keyParts(b); return A[0].localeCompare(B[0]) || (A[1] - B[1]) || A[2].localeCompare(B[2]); };
const split = (s) => (typeof s === 'string' && s ? s.split(', ') : []);

async function runDir(repo, dir, rule) {
  const rd = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const metaFile = path.join(dir, 'meta.json');
  const meta = rd('meta.json');
  const relabel = rule.relabel || {};
  const LIST_KEYS = new Set(Object.keys(relabel));
  for (const l of meta.lines) if (relabel[l.line]) l.label = relabel[l.line];

  const modeOrder = [...new Set(meta.lines.map((l) => l.mode))];
  const info = new Map();
  const byLabel = new Map();
  for (const l of meta.lines) {
    const label = String(l.label ?? l.line);
    const i = { key: l.line, mode: l.mode, color: String(l.color).toLowerCase(), label };
    info.set(l.line, i);
    if (!byLabel.has(label)) byLabel.set(label, []);
    byLabel.get(label).push(i);
  }
  const rankOf = (i) => (i.color === TROLLEY ? 0
    : rule.night.test(i.label) ? 2
    : rule.first && rule.first.test(i.label) ? 0.5 : 1);
  const tokInfo = (tok, mode) => {
    const c = byLabel.get(tok);
    if (!c) return { label: tok, mode, color: '' };
    return c.find((x) => x.mode === mode) || c[0];
  };
  const cmpItems = (a, b) => rankOf(a.i) - rankOf(b.i)
    || (rankOf(a.i) === 2 ? natural(a.i.label, b.i.label) : 0) || a.n - b.n;
  const printTok = (t) => (LIST_KEYS.has(t) && byLabel.has(relabel[t]) && !byLabel.has(t) ? relabel[t] : t);
  // a printed list: relabel, then the new order
  const sortTokens = (str, mode) => {
    const toks = split(str).map(printTok);
    const items = toks.map((t, n) => ({ t, n, i: tokInfo(t, mode) }));
    return items.sort(cmpItems).map((x) => x.t).join(', ');
  };
  // a key list: mode blocks kept when the list had them
  const sortKeys = (arr) => {
    const items = arr.map((k, n) => ({ k, n, i: info.get(k) || { label: k, mode: '', color: '' } }));
    const mi = (x) => modeOrder.indexOf(x.i.mode);
    const grouped = items.every((x, j) => j === 0 || mi(items[j - 1]) <= mi(x));
    return items.sort((a, b) => (grouped ? mi(a) - mi(b) : 0) || cmpItems(a, b)).map((x) => x.k);
  };
  const stats = { files: 0, changed: 0, badges: 0 };

  // ---- meta: day lines in mode blocks, every night line after them ----
  const idx = new Map(meta.lines.map((l, n) => [l.line, n]));
  meta.lines = meta.lines.map((l) => ({ ...l, rank: rankOf(info.get(l.line)) }))
    .sort((a, b) => ((a.rank === 2) - (b.rank === 2))
      || modeOrder.indexOf(a.mode) - modeOrder.indexOf(b.mode)
      || a.rank - b.rank
      || (a.rank === 2 ? natural(info.get(a.line).label, info.get(b.line).label) : 0)
      || idx.get(a.line) - idx.get(b.line));
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));

  const PRINTED = ['lines', 'busLines', 'tLines', 'ntLines', 'mLines', 'nmLines', 'badgeLines'];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.geojson')) continue;
    if (['route.geojson', 'gtfs-shape.geojson', 'street-names.geojson', 'lines-strands.geojson'].includes(f)) continue;
    const file = path.join(dir, f);
    const before = fs.readFileSync(file, 'utf8');
    const fc = JSON.parse(before);
    if (f === 'badges.geojson') {
      const groups = new Map();
      for (const ft of fc.features) {
        const p = ft.properties;
        if (Array.isArray(p.arr)) p.arr = sortKeys(p.arr);
        for (const k of PRINTED) if (typeof p[k] === 'string') p[k] = sortTokens(p[k], p.mode);
        if (p.line === undefined) continue;
        if (relabel[p.line]) p.lbl = relabel[p.line];
        const g = ft.geometry.coordinates.join(',') + '|' + p.band;
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(ft);
      }
      // the boxes keep their slots, the lines change seats
      for (const g of groups.values()) {
        if (g.length < 2 || !g.every((ft) => Array.isArray(ft.properties.off))) continue;
        const slots = g.map((ft) => ft.properties.off).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
        const order = sortKeys(g.map((ft) => ft.properties.line));
        const byLine = new Map(g.map((ft) => [ft.properties.line, ft]));
        if (byLine.size !== g.length) continue;
        let moved = false;
        order.forEach((line, n) => {
          const p = byLine.get(line).properties;
          if (p.off[0] !== slots[n][0] || p.off[1] !== slots[n][1]) moved = true;
          p.off = slots[n];
        });
        if (moved) stats.badges++;
      }
    } else if (f === 'lines-rows.geojson') {
      // Lines view rows: one l<i>/c<i> pair per line, aligned with arr
      for (const ft of fc.features) {
        const p = ft.properties;
        if (!Array.isArray(p.arr)) continue;
        const pairs = new Map();
        p.arr.forEach((k, n) => { if (p['l' + n] !== undefined) pairs.set(k, { l: printTok(p['l' + n].replace(/, $/, '')), c: p['c' + n] }); });
        if (typeof p.lines === 'string') p.lines = sortTokens(p.lines, p.mode);
        const sorted = sortKeys(p.arr);
        if (pairs.size === p.arr.length) {
          sorted.forEach((k, n) => { const q = pairs.get(k); p['l' + n] = q.l + (n < sorted.length - 1 ? ', ' : ''); p['c' + n] = q.c; });
        }
        p.arr = sorted;
      }
    } else {
      for (const ft of fc.features) {
        const p = ft.properties;
        if (!p) continue;
        if (Array.isArray(p.arr)) p.arr = sortKeys(p.arr);
        for (const k of PRINTED) {
          if (typeof p[k] !== 'string') continue;
          const mode = k === 'lines' ? p.mode : 'bus';
          p[k] = sortTokens(p[k], mode);
        }
      }
    }
    const after = JSON.stringify(fc);
    if (after !== before) { fs.writeFileSync(file, after); stats.files++; }
  }

  // the coloured sections of the number rows follow the new order
  const nightMod = path.join(DESK, repo, 'pipeline', 'night.mjs');
  let night = null;
  if (fs.existsSync(nightMod)) night = (await import(pathToFileURL(nightMod).href)).nightPass(dir, rule.night, { sort: false });
  const nNight = meta.lines.filter((l) => l.rank === 2).length;
  const nFirst = meta.lines.filter((l) => l.rank === 0.5).length;
  console.log(`${repo} ${path.relative(path.join(DESK, repo), dir)}: ${nNight} night, ${nFirst} first, ${Object.keys(relabel).length} relabelled — ${stats.files} files rewritten, ${stats.badges} badge grids reseated${night ? `, night rows ${night.rows}` : ''}`);
}

const only = process.argv.slice(2);
for (const repo of Object.keys(RULES)) {
  if (only.length && !only.includes(repo)) continue;
  const root = path.join(DESK, repo);
  for (const d of ['docs/data', 'data/out']) {
    const dir = path.join(root, d);
    if (fs.existsSync(path.join(dir, 'meta.json'))) await runDir(repo, dir, RULES[repo]);
  }
}
