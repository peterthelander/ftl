# FTL

FTL is a browser-based 3D space flight toy built with TypeScript, Vite, and Three.js. It uses real-ish astronomical scale, local planet textures, object labels with distance readouts, orbit guides, proximity-aware flight speed, and a lightweight atmospheric sky fade near Earth.

## Features

- Inertial first-person flight with local-axis mouse look and automatic damping.
- Solar system landmarks: Sun, Moon, Mercury through Neptune.
- Nearby and famous star landmarks including Alpha Centauri, Sirius, Barnard's Star, Vega, Arcturus, and Betelgeuse.
- On-object labels that show live distance from the camera.
- Orbit guide lines for planets and the Moon.
- Proximity-based speed limiting to make approaches easier.
- Earth atmosphere overlay that fades from space into daylight, sunset, or night sky tones.
- Local texture assets for offline-friendly development.

## Controls

| Input | Action |
| --- | --- |
| Click canvas | Lock mouse for flight |
| Mouse | Look around using local camera axes |
| W / S | Thrust forward / reverse |
| A / D | Strafe left / right |
| Q / E | Roll |
| Esc | Release mouse lock |

## Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Live Site

GitHub Pages deploys every push to `main`. Once GitHub Pages is enabled for the repository, the app is available at [peterthelander.github.io/ftl](https://peterthelander.github.io/ftl/).

If you are developing on Windows with WSL, it is best to run `npm install`, `npm run dev`, and `npm run build` from the same WSL environment where the repo lives. Mixing Windows Node with WSL `node_modules` can cause native dependency issues.

## Project Structure

```text
src/
  atmosphere.ts  Earth atmosphere overlay and sun-angle color shift
  celestial.ts   Celestial body creation, textures, stars, orbit lines
  constants.ts   Shared physical and flight constants
  controls.ts    Pointer lock, mouse, keyboard, and wheel input
  dom.ts         Required DOM element lookup
  flight.ts      Speed model and proximity limiting
  hud.ts         Speed/mode display
  labels.ts      Screen-space object labels with distances
  main.ts        App wiring and animation loop
```

## Asset Credits

See [ATTRIBUTION.md](./ATTRIBUTION.md) for texture source credits.

## License

MIT. See [LICENSE](./LICENSE).
