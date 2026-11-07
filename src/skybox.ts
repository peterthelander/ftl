import * as THREE from 'three';

const textureBaseUrl = `${import.meta.env.BASE_URL}textures/`;

export function createSkybox(scene: THREE.Scene) {
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  const skyboxTexture = cubeTextureLoader.load([
    `${textureBaseUrl}skybox/milkyway/dark-s_px.jpg`,
    `${textureBaseUrl}skybox/milkyway/dark-s_nx.jpg`,
    `${textureBaseUrl}skybox/milkyway/dark-s_py.jpg`,
    `${textureBaseUrl}skybox/milkyway/dark-s_ny.jpg`,
    `${textureBaseUrl}skybox/milkyway/dark-s_pz.jpg`,
    `${textureBaseUrl}skybox/milkyway/dark-s_nz.jpg`
  ]);

  skyboxTexture.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyboxTexture;
  scene.environment = skyboxTexture;

  return skyboxTexture;
}
