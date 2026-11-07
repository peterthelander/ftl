import { AU_KM, EARTH_RADIUS_KM } from './constants';
import { seededRandom } from './random';
import type { SystemDefinition, SystemPlanet } from './types';

export function createGeneratedSystem(name: string, starRadiusKm: number): SystemDefinition {
  const random = seededRandom(`ftl-system-v1:${name}`);
  const count = 3 + Math.floor(random() * 5);
  // Toy architecture: compact inner orbits, increasing spacing, and a mix of
  // rocky worlds, sub-Neptunes, and outer giants. Not an N-body stability model.
  let orbitAu = Math.max(starRadiusKm * 6 / AU_KM, 0.03 + random() * 0.12);
  const planets: SystemPlanet[] = [];
  for (let index = 0; index < count; index++) {
    const draw = random();
    const radiusEarth = draw < 0.6 ? 0.5 + random() * 1.2
      : draw < 0.88 ? 1.8 + random() * 2.2 : 4 + random() * 7;
    planets.push({
      name: `${name} · generated ${index + 1}`,
      radiusKm: radiusEarth * EARTH_RADIUS_KM,
      orbitKm: orbitAu * AU_KM,
      phase: random() * Math.PI * 2,
      source: 'generated', radiusEstimated: true, orbitEstimated: true, periodDays: null
    });
    orbitAu *= 1.7 + random() * 0.7;
  }
  return { name, source: 'generated', planets, outerRadiusKm: planets.at(-1)!.orbitKm };
}
