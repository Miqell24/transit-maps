#!/usr/bin/env node
// Renders miniature SVG network maps for the portal cards, straight from each
// sibling project's published docs/data/streets.geojson.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HUB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The sibling projects used to live next to this repo; on 2026-08-07 they moved
// into "folder bez nazwy" one level down. Both places are searched, so the tool
// keeps working wherever a project happens to sit.
const DESK = path.resolve(HUB, '..');
const ROOTS = [DESK, path.join(DESK, 'folder bez nazwy')];
const findRepo = (repo) => {
  for (const r of ROOTS) {
    const p = path.join(r, repo);
    if (fs.existsSync(path.join(p, 'docs', 'data', 'streets.geojson'))) return p;
  }
  throw new Error(`cannot find ${repo} under: ${ROOTS.join(' | ')}`);
};
const OUT = path.join(HUB, 'docs', 'thumbs');

const CITIES = [
  { repo: 'krakow-bus-map', slug: 'krakow' },
  { repo: 'krakow-mld-bus-map', slug: 'krakow-mld' },
  { repo: 'poznan-bus-map', slug: 'poznan' },
  { repo: 'gzm-bus-map', slug: 'gzm' },
  { repo: 'rybnik-bus-map', slug: 'rybnik' },
  { repo: 'trojmiasto-bus-map', slug: 'tricity' },
  { repo: 'grodzisk-bus-map', slug: 'grodzisk' },
  { repo: 'vienna-bus-map', slug: 'vienna' },
  { repo: 'bucharest-bus-map', slug: 'bucharest' },
  { repo: 'cluj-bus-map', slug: 'cluj' },
  { repo: 'timisoara-bus-map', slug: 'timisoara' },
  { repo: 'oradea-bus-map', slug: 'oradea' },
  { repo: 'brasov-bus-map', slug: 'brasov' },
  { repo: 'iasi-bus-map', slug: 'iasi' },
  { repo: 'constanta-bus-map', slug: 'constanta' },
  { repo: 'belgrade-bus-map', slug: 'belgrade' },
  { repo: 'sofia-bus-map', slug: 'sofia' },
  { repo: 'istanbul-bus-map', slug: 'istanbul' },
  { repo: 'athens-bus-map', slug: 'athens' },
  { repo: 'thessaloniki-bus-map', slug: 'thessaloniki' },
  { repo: 'naples-bus-map', slug: 'naples' },
  { repo: 'cairo-bus-map', slug: 'cairo' },
  { repo: 'addis-bus-map', slug: 'addis' },
  { repo: 'mexico-city-bus-map', slug: 'mexico-city' },
  { repo: 'sao-paulo-bus-map', slug: 'sao-paulo' },
  { repo: 'rio-bus-map', slug: 'rio' },
  { repo: 'ba-bus-map', slug: 'ba' },
  { repo: 'budapest-bus-map', slug: 'budapest' },
  { repo: 'paris-bus-map', slug: 'paris' },
  { repo: 'copenhagen-bus-map', slug: 'copenhagen' },
  { repo: 'warsaw-bus-map', slug: 'warsaw' },
  { repo: 'lodz-bus-map', slug: 'lodz' },
];

const W = 700; // viewBox width; height follows the network's aspect ratio
const TOL = 0.8; // px decimation tolerance
const BUS = '#0059a9';

for (const { repo, slug } of CITIES) {
  const file = path.join(findRepo(repo), 'docs', 'data', 'streets.geojson');
  const geo = JSON.parse(fs.readFileSync(file));
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const segs = [];
  for (const f of geo.features) {
    if (f.geometry.type !== 'LineString') continue;
    const color = f.properties.color || BUS;
    for (const [lon, lat] of f.geometry.coordinates) {
      if (lon < minX) minX = lon;
      if (lon > maxX) maxX = lon;
      if (lat < minY) minY = lat;
      if (lat > maxY) maxY = lat;
    }
    segs.push([color, f.geometry.coordinates]);
  }
  const midLat = ((minY + maxY) / 2) * Math.PI / 180;
  const kx = Math.cos(midLat);
  const spanX = (maxX - minX) * kx;
  const spanY = maxY - minY;
  const scale = W / spanX;
  const H = Math.round(spanY * scale);
  const px = (lon) => (lon - minX) * kx * scale;
  const py = (lat) => (maxY - lat) * scale;

  // One <path> per color; bus at the bottom so the rarer modes stay visible.
  const byColor = new Map();
  for (const [color, coords] of segs) {
    let d = byColor.get(color) || '';
    let lx = null, ly = null, first = true;
    for (let i = 0; i < coords.length; i++) {
      const x = px(coords[i][0]), y = py(coords[i][1]);
      const last = i === coords.length - 1;
      if (!first && !last && Math.hypot(x - lx, y - ly) < TOL) continue;
      d += (first ? 'M' : 'L') + Math.round(x) + ' ' + Math.round(y);
      lx = x; ly = y; first = false;
    }
    byColor.set(color, d);
  }
  const colors = [...byColor.keys()].sort((a, b) => (a === BUS ? -1 : 0) - (b === BUS ? -1 : 0));
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">\n`;
  for (const c of colors) {
    const wpx = c === BUS ? 1.0 : 1.4;
    const op = c === BUS ? 0.8 : 1;
    svg += `<path fill="none" stroke="${c}" stroke-width="${wpx}" stroke-opacity="${op}" stroke-linecap="round" stroke-linejoin="round" d="${byColor.get(c)}"/>\n`;
  }
  svg += '</svg>\n';
  const out = path.join(OUT, slug + '.svg');
  fs.writeFileSync(out, svg);
  console.log(slug, `${W}x${H}`, Math.round(svg.length / 1024) + 'KB');
}
