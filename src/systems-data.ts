import { AU_KM, EARTH_RADIUS_KM, SOLAR_RADIUS_KM, PARSEC_LY } from './constants';
import { seededRandom } from './random';
import { createGeneratedSystem } from './system-generation';
import type { SystemDefinition } from './types';
import snapshot from './data/exoplanets.json';

export const catalogMetadata = snapshot.metadata;
export const catalogHosts = snapshot.hosts;
type CatalogHost = typeof catalogHosts[number];

// Common names already used by the demo, resolved against NASA's aliases service.
const aliases: Record<string, string> = {
  'epsilon eridani': 'eps Eri', 'lalande 21185': 'GJ 411',
  'tau ceti': 'tau Cet', "barnard's star": "Barnard's star"
};
const normalize = (name: string) => name.toLowerCase().trim();
const hostsByName = new Map(catalogHosts.map(host => [normalize(host.name), host]));
export function getCatalogHost(name: string): CatalogHost | undefined {
  return hostsByName.get(normalize(aliases[normalize(name)] ?? name));
}

function positive(value: number | null, fallback: number) {
  return value !== null && Number.isFinite(value) && value > 0 ? value : fallback;
}

// The same broad piecewise mass-radius relation documented by the archive.
// This only fills missing sizes; it is an illustrative size, not a measurement.
function radiusFromMass(mass: number | null) {
  if (!mass || mass <= 0) return 2;
  if (mass < 2.04) return 10 ** 0.00346 * mass ** 0.279;
  if (mass < 132) return 10 ** -0.0925 * mass ** 0.589;
  return Math.min(18, 10 ** 1.25 * mass ** -0.044);
}

export function makeSystemDefinition(name: string, starRadiusKm: number): SystemDefinition {
  const host = getCatalogHost(name);
  if (host) {
    const planets = host.planets.map((planet, index) => {
      const random = seededRandom(planet.name);
      const derivedOrbit = planet.periodDays && host.massSolar
        ? ((planet.periodDays / 365.25) ** 2 * host.massSolar) ** (1 / 3)
        : Math.max(starRadiusKm * 8 / AU_KM, 0.1) * 1.8 ** index;
      return {
        name: planet.name,
        radiusKm: positive(planet.radiusEarth, radiusFromMass(planet.massEarth)) * EARTH_RADIUS_KM,
        orbitKm: positive(planet.semiMajorAxisAu, derivedOrbit) * AU_KM,
        phase: random() * Math.PI * 2,
        source: 'catalog' as const,
        radiusEstimated: !planet.radiusEarth || planet.radiusIsLimit || /calculated value/i.test(planet.radiusReference ?? ''),
        orbitEstimated: !planet.semiMajorAxisAu || planet.orbitIsLimit || /calculated value/i.test(planet.orbitReference ?? ''),
        periodDays: planet.periodDays
      };
    }).sort((a, b) => a.orbitKm - b.orbitKm);
    return { name, source: 'catalog', archiveHost: host.name, planets,
      outerRadiusKm: Math.max(...planets.map(planet => planet.orbitKm)) };
  }

  return createGeneratedSystem(name, starRadiusKm);
}

export function catalogStarData(host: CatalogHost) {
  const radiusSolar = positive(host.radiusSolar, positive(host.massSolar, 0.4) ** 0.8);
  const temperature = positive(host.temperatureK, 4500);
  return {
    name: host.name, distanceLy: host.distancePc * PARSEC_LY,
    raHours: host.raDegrees / 15, decDegrees: host.decDegrees,
    radiusKm: radiusSolar * SOLAR_RADIUS_KM,
    color: temperature < 3500 ? 0xffa174 : temperature < 5000 ? 0xffd09a
      : temperature < 6500 ? 0xffedc4 : 0xd4e7ff
  };
}
