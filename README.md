# coriolis-api

An API that converts [Elite: Dangerous](https://www.elitedangerous.com/) loadout
events to the ship JSON format used by [Coriolis](https://coriolis.io/).

## Scope of this project

The original purpose of this project is its implementation in
[EDNeutronAssistant](https://github.com/Gobidev/EDNeutronAssistant). Because
Coriolis performs all of its conversion operations client-side, there was no
easy way to interface with its conversion functions from Python. This project
therefore exposes those functions through a small NodeJS API.

The API is built by importing the real Coriolis ES modules and bundling them
together with [esbuild](https://esbuild.github.io/). The Coriolis and
coriolis-data repositories are cloned automatically during the build, so new
ships and modules are picked up without changing this repository.

## Using the API

A public instance runs at `https://coriolis-api.gobidev.de`.

Convert a loadout event to a Coriolis build by sending a `POST` request to
`/convert` with the loadout event as the JSON request body:

```sh
curl -X POST https://coriolis-api.gobidev.de/convert \
  -H 'Content-Type: application/json' \
  --data @loadout.json
```

The converted Coriolis build is returned as JSON. Invalid requests return a
`4xx` status with a JSON body of the form `{"error": "..."}`.

### Endpoints

| Method | Path       | Description                              |
| ------ | ---------- | ---------------------------------------- |
| `POST` | `/convert` | Convert a loadout event to a Coriolis build |
| `GET`  | `/health`  | Liveness probe, returns `{"status":"ok"}` |

### Configuration

The API is configured through environment variables:

| Variable           | Default              | Description                                        |
| ------------------ | -------------------- | -------------------------------------------------- |
| `PORT`             | `7777`               | Port to listen on                                  |
| `HOST`             | `0.0.0.0`            | Interface to bind to                               |
| `CORS_ORIGIN`      | `*`                  | Value of the `Access-Control-Allow-Origin` header  |
| `BODY_LIMIT`       | `1mb`                | Maximum accepted request body size                 |
| `CONVERSIONS_FILE` | `./conversions.json` | File the conversion URLs are appended to           |
| `CONVERSIONS_MAX`  | `5000`               | Maximum number of entries kept in the log          |

## Building

Requirements: NodeJS 18+ and `git`.

```sh
npm ci        # install build dependencies
./build.sh    # clone/update coriolis + coriolis-data and bundle the API
```

`build.sh` clones the [EDCD/coriolis](https://github.com/EDCD/coriolis) and
[EDCD/coriolis-data](https://github.com/EDCD/coriolis-data) repositories,
generates the coriolis-data distribution and then runs `npm run build`, which
bundles `src/index.js` into the generated `coriolis-api.js`.

If the upstream repositories are already present, only `npm run build` is
needed to rebuild the API.

## Running

```sh
npm start
# or
node coriolis-api.js
```

Per default the API listens on port `7777` and processes requests on
`http://localhost:7777/convert`. Requests must be `POST` requests with a JSON
body that matches an Elite: Dangerous loadout event.

## Testing

```sh
npm test
```

The test suite builds the bundle and runs black-box HTTP tests against it,
including error handling and concurrent-request behaviour.

## Docker

```sh
docker build -t coriolis-api .
docker run -p 7777:7777 -v coriolis-data:/data coriolis-api
```

The image is a multi-stage build: the bundle is created in a build stage and
the runtime stage only contains NodeJS and `coriolis-api.js`. The container runs
as the unprivileged `node` user, and the conversion log is written to `/data`
(mount a volume to persist it).

## Development notes

- `coriolis-api.js` is a generated artifact and is not checked into git. Edit
  `src/index.js` (API and request handling) or `build.mjs` (bundling) instead.
- Coriolis ships JSX inside `.js` files. `build.mjs` loads those files with the
  JSX loader and aliases `react` to a stub, because the API never renders the
  UI components.
- `build.mjs` also patches a known upstream bug in `Calculations.js`
  (`this.jumpRange(...)` inside the standalone `totalJumpRange` function).
