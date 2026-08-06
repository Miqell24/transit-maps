# transit-maps — city picker portal

One-page portal for the ten-city transit map family. Live: **https://miqell24.github.io/transit-maps/**

Each card shows a miniature of the city's real route network (rendered from that map's published
`docs/data/streets.geojson`), line/stop counts per mode, and links to the interactive map:

| City | Repo | Live |
| --- | --- | --- |
| Kraków | `krakow-bus-map` | https://miqell24.github.io/krakow-bus-map/ |
| Poznań | `poznan-bus-map` | https://miqell24.github.io/poznan-bus-map/ |
| Katowice · GZM Metropolis | `gzm-bus-map` | https://miqell24.github.io/gzm-bus-map/ |
| Tricity (Gdańsk–Gdynia–Sopot) | `trojmiasto-bus-map` | https://miqell24.github.io/trojmiasto-bus-map/ |
| Athens | `athens-bus-map` | https://miqell24.github.io/athens-bus-map/ |
| Thessaloniki | `thessaloniki-bus-map` | https://miqell24.github.io/thessaloniki-bus-map/ |

Every map also carries a "Switch city" control in its panel, linking the whole family and this portal.

## Layout

- `docs/` — the published site (GitHub Pages serves `main:/docs`): `index.html` + `thumbs/*.svg`.
- `tools/render-thumbs.mjs` — regenerates the ten SVG miniatures. Requires the sibling map
  projects checked out next to this repo (`../krakow-bus-map`, …). Run after any city is rebuilt:

  ```
  node tools/render-thumbs.mjs
  ```

- `tools/serve.mjs` — local static server for `docs/`: `node tools/serve.mjs 8132`.

## Updating stats

Line/stop counts in `docs/index.html` are baked in by hand. After a data refresh, recompute from each
city's `docs/data/meta.json` (`lines[]` per mode) and `docs/data/stops.geojson` (feature count).
