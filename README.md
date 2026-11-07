# FTL

FTL is a browser-based 3D space flight toy built with TypeScript, Vite, and Three.js. It uses real-ish astronomical scale, local planet textures, object labels with distance readouts, orbit guides, proximity-aware flight speed, and a lightweight atmospheric sky fade near Earth.

**Status:** interactive browser prototype, supports desktop mouse/keyboard and phone touch controls.

[Try the space-flight demo](https://peterthelander.github.io/ftl/).
On a phone, use the **bottom-left thumbstick** to move and **swipe the scene** to
look around. You can do both at once with two thumbs. Hold **BRAKE** to stop.
On desktop, click the scene to capture the mouse, use W/S for thrust, and press Esc to release it.

## Explore planetary systems

Tap **Explore systems**, search for a star, and choose a system overview or a planet
to approach. Try **TRAPPIST-1**, **Proxima Cen**, **Lalande 21185**, or **55 Cnc**.
On desktop, press Esc first to release mouse look and use the picker.

- **NASA catalog / mint orbits:** bundled confirmed exoplanets within 15 parsecs
  (about 49 light-years), excluding records the archive flags as controversial.
- **Generated system / amber orbits:** repeatable fictional worlds for a landmark
  with no planets in this snapshot. They are always labeled as generated.
- Planets, their labels, lights, and orbit guides load only near their host star.
  At most two systems are detailed at once. Leaving releases their resources.
- Star labels show up to the **12 nearest visible stars**; nearby planets have a
  separate cap of 10 labels. Distant systems appear as stars, not clouds of labels.

The snapshot currently contains **202 catalog planets around 116 hosts**. Together
with the existing landmarks and Sun, the demo has **124 stars**. This is a selection
of planet hosts plus landmarks, not a complete census of nearby stars.
The [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/) supplies the
catalog; its [composite table](https://exoplanetarchive.ipac.caltech.edu/docs/pscp_calc.html)
includes calculated values as well as measurements. Estimated sizes/orbits are
marked. Surfaces, colors, circular orbit planes, and orbital phases are illustrative;
they are not current ephemerides or evidence of habitability.

See [data provenance and architecture](docs/architecture.md) for the model and limits.

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

Run the strict type check and browser checks (Chromium):

```bash
npm run typecheck
npx playwright install chromium
npm test
```

The checks cover two-thumb movement and look, touch cancellation, braking,
landscape layout, focus loss, and desktop mouse/keyboard input. Visual checks also
verify stellar radii, distant-star visibility, and glowing orbit guides. System
checks cover catalog identities, deterministic generation, detail budgets, resource
cleanup, floating-origin coordinates, and the phone system picker.

To refresh the bundled NASA snapshot (requires Python 3 and internet access):

```bash
npm run data:update
npm run build
npm test
```

Normal play and builds use the committed snapshot and make no calls to the NASA API.

## Live Site

GitHub Pages deploys every push to `main`. Once GitHub Pages is enabled for the repository, the app is available at [peterthelander.github.io/ftl](https://peterthelander.github.io/ftl/).

If you are developing on Windows with WSL, it is best to run `npm ci`, `npm run dev`, and `npm run build` from the same WSL environment where the repo lives. Mixing Windows Node with WSL `node_modules` can cause native dependency issues.

## Project Structure

```text
src/
  main.ts                Initialization and frame orchestration
  celestial.ts           Star field and system assembly
  solar-system.ts        Existing Solar System bodies and textures
  landmarks.ts           Legacy landmark star data
  data/exoplanets.json    NASA snapshot with source metadata
  systems-data.ts        Catalog adapter and explicit parameter estimates
  system-generation.ts   Pure, seeded fictional system model
  systems.ts             Detail loading, local rendering, resource disposal
  planet-surfaces.ts     Illustrative procedural surfaces
  navigation.ts          System picker and deliberate travel
  labels.ts              World-space labels and visibility budgets
  controls.ts            Mouse, keyboard, and multi-touch input
  flight.ts / world.ts   Inertial movement and floating origin
  stars.ts / orbits.ts   Stellar surfaces, coronas, and glowing orbit guides
  atmosphere.ts          Earth atmosphere
  hud.ts / dom.ts        HUD formatting and required elements
  styles.css             Responsive presentation
  constants.ts/types.ts  Shared units and domain types
```

## Asset Credits

See [ATTRIBUTION.md](./ATTRIBUTION.md) for texture source credits.

## License

MIT. See [LICENSE](./LICENSE).
