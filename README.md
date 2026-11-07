# FTL

FTL is a browser-based 3D space flight toy built with TypeScript, Vite, and Three.js. It uses real-ish astronomical scale, local planet textures, object labels with distance readouts, orbit guides, proximity-aware flight speed, and a lightweight atmospheric sky fade near Earth.

**Status:** interactive browser prototype, supports desktop mouse/keyboard and phone touch controls.

[Try the space-flight demo](https://peterthelander.github.io/ftl/).
On a phone, use the **bottom-left thumbstick** to move and **swipe the scene** to
look around. You can do both at once with two thumbs. Hold **BRAKE** to stop.
On desktop, click the scene to capture the mouse, use W/S for thrust, and press Esc to release it.

## Engineering focus

The simulation explores a practical graphics problem: presenting astronomical
scale while retaining useful controls near a planet. Proximity-aware speed limits,
a floating-origin shift, and distance labels support navigation across very different
scales. Rendering, controls, movement, and HUD updates live in separate modules.
It is a flight toy, not a physically accurate orbital simulation. Stellar surfaces
keep their modeled radii; a minimum apparent corona makes unresolved stars visible
from far away without enlarging their physical surfaces. Colors and surface mottling
are illustrative. The view distance includes all of the listed star landmarks.

## Features

- Inertial first-person flight with local-axis mouse look and automatic damping.
- Solar system landmarks: Sun, Moon, Mercury through Neptune.
- Glowing stellar spheres using the existing approximate stellar radii, with warm/cool surface colors.
- Nearby and famous star landmarks including Alpha Centauri, Sirius, Barnard's Star, Vega, Arcturus, and Betelgeuse.
- On-object labels that show live distance from the camera.
- Bright mint planet orbit guides and pale-blue Moon guides, with thicker cores and a soft glow.
- Proximity-based speed limiting to make approaches easier.
- Earth atmosphere overlay that fades from space into daylight, sunset, or night sky tones.
- Local texture assets for offline-friendly development.

## Controls

### Phone / tablet

- Drag the left thumbstick **up/down** for forward/reverse, **left/right** to strafe.
- Move the stick a little for gentle thrust, or to its edge for full thrust.
- Swipe anywhere on the space view to look around while moving with your other thumb.
- Release the stick to coast down; hold **BRAKE** for an immediate stop.
- Touch controls appear automatically on touch devices and work in portrait or landscape.

### Desktop

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
npm ci
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

Run the browser control checks (Chromium):

```bash
npx playwright install chromium
npm test
```

The checks cover two-thumb movement and look, touch cancellation, braking,
landscape layout, focus loss, and desktop mouse/keyboard input. Visual checks also
verify stellar radii, distant-star visibility, and glowing orbit guides.

## Live Site

GitHub Pages deploys every push to `main`. Once GitHub Pages is enabled for the repository, the app is available at [peterthelander.github.io/ftl](https://peterthelander.github.io/ftl/).

If you are developing on Windows with WSL, it is best to run `npm ci`, `npm run dev`, and `npm run build` from the same WSL environment where the repo lives. Mixing Windows Node with WSL `node_modules` can cause native dependency issues.

## Project Structure

```text
src/
  atmosphere.ts  Earth atmosphere overlay and sun-angle color shift
  celestial.ts   Celestial body creation, textures, stars, orbit lines
  constants.ts   Shared physical and flight constants
  stars.ts       Stellar surfaces, coronas, and distance-aware glow sizing
  orbits.ts      Wide orbit lines with bright cores and soft outer glows
  controls.ts    Pointer lock, mouse, keyboard, and multi-touch flight input
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
