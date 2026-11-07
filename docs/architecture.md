# FTL architecture and data

The entry point wires modules together. Catalog loading, generation, rendering,
input, and UI code each have a separate owner; there is no framework or backend.
Strict TypeScript checking is part of every production build. Browser checks run
before GitHub Pages deployment.

## Catalog and scientific boundaries

`scripts/update-exoplanets.py` downloads a committed snapshot from NASA's
[Planetary Systems Composite Parameters table](https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html).
The exact TAP query and UTC retrieval time are in `src/data/exoplanets.json`.
The selection is all rows within 15 pc with `pl_controv_flag = 0`, not the entire
exoplanet archive or a complete nearby-star survey. This avoids presenting entries
flagged as controversial as established planets. Per-planet radius/orbit references
are retained verbatim as provenance, never inserted into page HTML.

The catalog adapter preserves host/planet identities and never fills a known
system with additional fictional planets. Four existing common star names are
matched using the archive's [alias lookup](https://exoplanetarchive.ipac.caltech.edu/docs/sysaliases.html).
Host positions use archive RA/Dec and distance; host radius/temperature use the
first available composite value, with an explicit display fallback for missing
values. Legacy non-catalog landmark positions and sizes remain approximate.

The [composite table](https://exoplanetarchive.ipac.caltech.edu/docs/pscp_calc.html)
mixes references and includes empirical estimates. Calculated values and limits
are marked as estimated in the UI. Missing planet radii use a broad mass-radius
estimate, or a 2-Earth-radius display placeholder without mass. Missing semi-major
axes use period and stellar mass through Kepler's law when available; otherwise a
clearly marked display orbit is assigned. No placeholder is a new planet discovery.

All displayed orbits are illustrative circles at the modeled semi-major axis;
planes and phases are seeded display choices, not measured/current ephemerides.
Planet colors, surfaces, and compositions are illustrative. Planetary evolution,
binary-star dynamics, eccentricity, N-body stability, and habitability are not modeled.

## Generated systems

Only stars without a matching catalog host receive generated systems. Names and
planet labels say "generated" and orbit guides are amber rather than mint.
The versioned, name-based seed reproduces a system after reload or revisiting.

The toy model creates 3–7 worlds: a broad mixture of rocky-sized bodies,
sub-Neptunes, and giants; inner orbits start outside six stellar radii, with a
0.03–0.15 AU floor. Successive orbital radii increase by factors of 1.7–2.4.
It is an exploration model inspired by broad system architectures, not a fitted
population model or a prediction of undiscovered planets. Generated radii range
from 0.5 to 11 Earth radii; generation is independent of the rendering layer.

## Detail, coordinates, and ownership

- The star field stays loaded. Each star has a real modeled sphere plus a minimum
  apparent corona; only the corona is enlarged when the surface is unresolved.
- A system reveals within the maximum of four outer-orbit radii, 20 AU, or 20
  stellar radii. A 25% exit margin prevents rebuilding at the boundary. The two
  nearest qualifying systems are active at most.
- Exoplanets, lights, and guides live in a group positioned at their host. Planet
  offsets stay local to avoid losing precision at astronomical coordinates.
- Flight proximity and labels resolve world positions; the floating origin shifts
  root objects together. The Solar System keeps its existing root layout and
  hides as a unit on departure. Its original resources stay cached.
- On leaving an exoplanet system, its owner removes labels and navigation targets,
  disposes geometries/materials/procedural textures, then detaches the group.
  Shared line geometry is disposed once. No unbounded visited-system cache exists.
- Labels have separate caps: 12 nearest visible stars and 10 local planets, plus
  overlap filtering. Labels avoid screen edges and the HUD/touch controls. Hidden ancestors suppress their children's labels.

## Review and maintenance

The cleanup separated Solar System setup, landmark data, shaders, styles, catalog
adaptation, generation, and system lifecycle. Shared units/types are independent
of scene assembly. DOM lookups fail with explicit missing-element errors. HUD
updates avoid unnecessary text writes, and labels reuse their position vectors.
The frame clock uses the browser's monotonic timer instead of deprecated Three.Clock.

Bug fixes include world-coordinate proximity checks for nested planets, form typing
being mistaken for thrust, a zero-radius thumbstick edge case, and synchronous
pointer-lock rejection. Navigation resets held controls before changing systems.
Compatible development-dependency updates resolve the previously reported npm
audit findings; the lockfile pins the checked toolchain. Deployment actions are pinned
to verified release commits, and CI uses an explicit Ubuntu image.

Tests exercise catalog identity preservation, generated-system repeatability,
resource disposal, detail limits, recentering, label limits, input cancellation,
phone travel/flight, and stellar/orbit rendering. They use the bundled snapshot and
local assets; there is no live NASA request in normal operation or CI tests.
