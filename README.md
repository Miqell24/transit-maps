# transit-maps — city picker portal

One-page portal for the twenty-eight-city transit map family. Live: **https://agcghub.github.io/transit-maps/**

Each card shows a miniature of the city's real route network (rendered from that map's published
`docs/data/streets.geojson`), line/stop counts per mode, and links to the interactive map:

| City | Repo | Live |
| --- | --- | --- |
| Kraków | `krakow-bus-map` | https://agcghub.github.io/krakow-bus-map/ |
| Kraków + MLD (Małopolska feeder lines) | `krakow-mld-bus-map` | https://agcghub.github.io/krakow-mld-bus-map/ |
| Poznań | `poznan-bus-map` | https://agcghub.github.io/poznan-bus-map/ |
| Katowice · GZM Metropolis | `gzm-bus-map` | https://agcghub.github.io/gzm-bus-map/ |
| Rybnik Region | `rybnik-bus-map` | https://agcghub.github.io/rybnik-bus-map/ |
| Tricity (Gdańsk–Gdynia–Sopot) | `trojmiasto-bus-map` | https://agcghub.github.io/trojmiasto-bus-map/ |
| Grodzisk Mazowiecki Region | `grodzisk-bus-map` | https://agcghub.github.io/grodzisk-bus-map/ |
| Warsaw Region (Warsaw · Grodzisk Maz. · communes) | `warsaw-bus-map` | https://agcghub.github.io/warsaw-bus-map/ |
| Vienna | `vienna-bus-map` | https://agcghub.github.io/vienna-bus-map/ |
| Budapest | `budapest-bus-map` | https://agcghub.github.io/budapest-bus-map/ |
| Bucharest & Ilfov | `bucharest-bus-map` | https://agcghub.github.io/bucharest-bus-map/ |
| Cluj-Napoca | `cluj-bus-map` | https://agcghub.github.io/cluj-bus-map/ |
| Timișoara | `timisoara-bus-map` | https://agcghub.github.io/timisoara-bus-map/ |
| Arad | `arad-bus-map` | https://agcghub.github.io/arad-bus-map/ |
| Oradea | `oradea-bus-map` | https://agcghub.github.io/oradea-bus-map/ |
| Brașov | `brasov-bus-map` | https://agcghub.github.io/brasov-bus-map/ |
| Iași | `iasi-bus-map` | https://agcghub.github.io/iasi-bus-map/ |
| Constanța | `constanta-bus-map` | https://agcghub.github.io/constanta-bus-map/ |
| Belgrade | `belgrade-bus-map` | https://agcghub.github.io/belgrade-bus-map/ |
| Sofia | `sofia-bus-map` | https://agcghub.github.io/sofia-bus-map/ |
| Istanbul | `istanbul-bus-map` | https://agcghub.github.io/istanbul-bus-map/ |
| Athens | `athens-bus-map` | https://agcghub.github.io/athens-bus-map/ |
| Thessaloniki | `thessaloniki-bus-map` | https://agcghub.github.io/thessaloniki-bus-map/ |
| Naples | `naples-bus-map` | https://agcghub.github.io/naples-bus-map/ |
| Paris | `paris-bus-map` | https://agcghub.github.io/paris-bus-map/ |
| Copenhagen | `copenhagen-bus-map` | https://agcghub.github.io/copenhagen-bus-map/ |
| Cairo | `cairo-bus-map` | https://agcghub.github.io/cairo-bus-map/ |
| Rio de Janeiro | `rio-bus-map` | https://agcghub.github.io/rio-bus-map/ |
| Buenos Aires | `ba-bus-map` | https://agcghub.github.io/ba-bus-map/ |

Every map also carries a "Switch city" control in its panel, linking the whole family and this portal.

## Layout

- `docs/` — the published site (GitHub Pages serves `main:/docs`): `index.html` + `thumbs/*.svg`.
- `tools/render-thumbs.mjs` — regenerates the twenty-seven SVG miniatures. Requires the sibling map
  projects checked out next to this repo (`../krakow-bus-map`, …). Run after any city is rebuilt:

  ```
  node tools/render-thumbs.mjs
  ```

- `tools/serve.mjs` — local static server for `docs/`: `node tools/serve.mjs 8132`.

## Updating stats

Line/stop counts in `docs/index.html` are baked in by hand. After a data refresh, recompute from each
city's `docs/data/meta.json` (`lines[]` per mode) and `docs/data/stops.geojson` (feature count).
