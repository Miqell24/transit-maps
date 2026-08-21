# transit-maps — city picker portal

One-page portal for the twenty-six-city transit map family. Live: **https://miqell24.github.io/transit-maps/**

Each card shows a miniature of the city's real route network (rendered from that map's published
`docs/data/streets.geojson`), line/stop counts per mode, and links to the interactive map:

| City | Repo | Live |
| --- | --- | --- |
| Kraków | `krakow-bus-map` | https://miqell24.github.io/krakow-bus-map/ |
| Poznań | `poznan-bus-map` | https://miqell24.github.io/poznan-bus-map/ |
| Katowice · GZM Metropolis | `gzm-bus-map` | https://miqell24.github.io/gzm-bus-map/ |
| Rybnik Region | `rybnik-bus-map` | https://miqell24.github.io/rybnik-bus-map/ |
| Tricity (Gdańsk–Gdynia–Sopot) | `trojmiasto-bus-map` | https://miqell24.github.io/trojmiasto-bus-map/ |
| Grodzisk Mazowiecki Region | `grodzisk-bus-map` | https://miqell24.github.io/grodzisk-bus-map/ |
| Vienna | `vienna-bus-map` | https://miqell24.github.io/vienna-bus-map/ |
| Budapest | `budapest-bus-map` | https://miqell24.github.io/budapest-bus-map/ |
| Bucharest & Ilfov | `bucharest-bus-map` | https://miqell24.github.io/bucharest-bus-map/ |
| Cluj-Napoca | `cluj-bus-map` | https://miqell24.github.io/cluj-bus-map/ |
| Timișoara | `timisoara-bus-map` | https://miqell24.github.io/timisoara-bus-map/ |
| Oradea | `oradea-bus-map` | https://miqell24.github.io/oradea-bus-map/ |
| Brașov | `brasov-bus-map` | https://miqell24.github.io/brasov-bus-map/ |
| Iași | `iasi-bus-map` | https://miqell24.github.io/iasi-bus-map/ |
| Constanța | `constanta-bus-map` | https://miqell24.github.io/constanta-bus-map/ |
| Belgrade | `belgrade-bus-map` | https://miqell24.github.io/belgrade-bus-map/ |
| Sofia | `sofia-bus-map` | https://miqell24.github.io/sofia-bus-map/ |
| Istanbul | `istanbul-bus-map` | https://miqell24.github.io/istanbul-bus-map/ |
| Athens | `athens-bus-map` | https://miqell24.github.io/athens-bus-map/ |
| Thessaloniki | `thessaloniki-bus-map` | https://miqell24.github.io/thessaloniki-bus-map/ |
| Naples | `naples-bus-map` | https://miqell24.github.io/naples-bus-map/ |
| Paris | `paris-bus-map` | https://miqell24.github.io/paris-bus-map/ |
| Copenhagen | `copenhagen-bus-map` | https://miqell24.github.io/copenhagen-bus-map/ |
| Cairo | `cairo-bus-map` | https://miqell24.github.io/cairo-bus-map/ |
| Rio de Janeiro | `rio-bus-map` | https://miqell24.github.io/rio-bus-map/ |
| Buenos Aires | `ba-bus-map` | https://miqell24.github.io/ba-bus-map/ |

Every map also carries a "Switch city" control in its panel, linking the whole family and this portal.

## Layout

- `docs/` — the published site (GitHub Pages serves `main:/docs`): `index.html` + `thumbs/*.svg`.
- `tools/render-thumbs.mjs` — regenerates the twenty-six SVG miniatures. Requires the sibling map
  projects checked out next to this repo (`../krakow-bus-map`, …). Run after any city is rebuilt:

  ```
  node tools/render-thumbs.mjs
  ```

- `tools/serve.mjs` — local static server for `docs/`: `node tools/serve.mjs 8132`.

## Updating stats

Line/stop counts in `docs/index.html` are baked in by hand. After a data refresh, recompute from each
city's `docs/data/meta.json` (`lines[]` per mode) and `docs/data/stops.geojson` (feature count).
