import * as THREE from 'three';

type AtmosphereInput = {
  camera: THREE.Camera;
  earth: THREE.Object3D;
  earthRadiusKm: number;
  overlay: HTMLDivElement;
  sun: THREE.Object3D;
  scene: THREE.Scene;
  skybox: THREE.CubeTexture;
  distantStars: THREE.Object3D[];
};

const atmosphereEntryAltitudeKm = 1000;
const atmosphereFullEffectAltitudeKm = 100;
const maxAtmosphereOpacity = 0.55;
const opaqueSkyThreshold = 0.9;

const surfaceNormal = new THREE.Vector3();
const sunDirection = new THREE.Vector3();
const nightColor = new THREE.Color('#07162f');
const sunsetColor = new THREE.Color('#ff8a45');
const dayColor = new THREE.Color('#62b7ff');
const baseSkyColor = new THREE.Color();
const skyColor = new THREE.Color();

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function mixColor(target: THREE.Color, a: THREE.Color, b: THREE.Color, amount: number) {
  return target.copy(a).lerp(b, clamp01(amount));
}

export function updateAtmosphere({
  camera,
  earth,
  earthRadiusKm,
  overlay,
  sun,
  scene,
  skybox,
  distantStars
}: AtmosphereInput) {
  const altitudeKm = Math.max(0, camera.position.distanceTo(earth.position) - earthRadiusKm);

  const atmosphereAmount = clamp01(
    (atmosphereEntryAltitudeKm - altitudeKm) / (atmosphereEntryAltitudeKm - atmosphereFullEffectAltitudeKm)
  );

  if (atmosphereAmount <= 0) {
    overlay.style.opacity = '0';
    scene.background = skybox;
    distantStars.forEach((star) => {
      star.visible = true;
    });
    return;
  }

  surfaceNormal.copy(camera.position).sub(earth.position).normalize();
  sunDirection.copy(sun.position).sub(camera.position).normalize();

  const sunHeight = surfaceNormal.dot(sunDirection);
  const daylight = clamp01((sunHeight + 0.08) / 0.22);
  const sunset = 1 - Math.abs(clamp01((sunHeight + 0.22) / 0.44) * 2 - 1);

  mixColor(baseSkyColor, nightColor, dayColor, daylight);
  mixColor(skyColor, baseSkyColor, sunsetColor, sunset * 0.65);
  const isOpaqueSky = atmosphereAmount >= opaqueSkyThreshold;

  overlay.style.background = `#${skyColor.getHexString()}`;
  overlay.style.opacity = isOpaqueSky ? '0' : (atmosphereAmount * maxAtmosphereOpacity).toFixed(3);
  scene.background = isOpaqueSky ? skyColor : skybox;
  distantStars.forEach((star) => {
    star.visible = !isOpaqueSky;
  });
}
