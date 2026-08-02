# NERV MAGI Systems

An Evangelion-flavoured console PWA with two subsystems:

- **SUPERCOMPUTER** — an animated MAGI core array. Feed it single tasks, a continuous
  task stream, or a yes/no question that all six cores vote on. Output goes to the
  line printer log.
- **TIMER** — a seven-segment countdown with internal/external power states,
  power-draw telemetry and a recharge cycle.

Installable to a phone home screen and fully offline-capable after the first load.

## Structure

```
index.html              markup for both subsystems + modals
manifest.webmanifest    PWA metadata (name, icons, shortcuts, standalone display)
sw.js                   service worker — offline app-shell cache
css/styles.css          all styling
js/app.js               nav, shared helpers, stage scaling, install prompt, SW registration
js/supercomputer.js     core array simulation
js/timer.js             countdown subsystem
icons/                  generated PNG app icons
```

## Running locally

A service worker needs `http://` or `https://` — opening `index.html` straight from
disk (`file://`) still works, but without offline caching or install. To serve it:

```bash
npx serve .
```

Then open the printed `http://localhost:...` URL.

## Deploying with GitHub Pages

1. Push this folder to a repository.
2. **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Open `https://<user>.github.io/<repo>/` on your phone.

All paths are relative, so it works from a repo subpath without changes. HTTPS from
Pages is what makes the app installable.

## Installing on a phone

- **Android / Chrome** — tap the **INSTALL** button in the nav bar, or menu → *Add to Home screen*.
- **iOS / Safari** — Share → *Add to Home Screen*. (iOS never shows an install button;
  that is a Safari limitation, not a bug here.)

Launched from the home screen it runs standalone, with no browser chrome.

## Updating

Browsers cache the service worker aggressively. After changing any file, bump
`CACHE_VERSION` in [`sw.js`](sw.js) — that invalidates the old cache and clients pick
up the new build on their next launch.

## Notes

- The core array is authored on a fixed 1280×720 grid and scaled to fit the viewport
  by `fitStage()` in `js/app.js`, so the layout is identical on desktop and phone.
- The `Share Tech Mono` webfont loads from Google Fonts and is runtime-cached by the
  service worker; offline before it has ever been fetched, it falls back to
  Courier New / the system monospace.
