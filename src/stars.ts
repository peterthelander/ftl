import * as THREE from 'three';

// The surface stays at its catalog radius. Only the corona has a minimum
// apparent size, so unresolved stars remain findable at interstellar distances.
export function createStellarSphere(radiusKm: number, color: number) {
  const surface = new THREE.ShaderMaterial({
    uniforms: { starColor: { value: new THREE.Color(color) } },
    vertexShader: `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec3 surfaceNormal;
      varying vec3 viewDirection;
      varying vec3 surfacePoint;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        surfaceNormal = normalize(normalMatrix * normal);
        viewDirection = -mvPosition.xyz;
        surfacePoint = normal;
        gl_Position = projectionMatrix * mvPosition;
        #include <logdepthbuf_vertex>
        // Fragment logarithmic depth handles occlusion; keep clip-space Z
        // away from the far plane where astronomical coordinates lose precision.
        gl_Position.z = 0.0;
      }
    `,
    fragmentShader: `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform vec3 starColor;
      varying vec3 surfaceNormal;
      varying vec3 viewDirection;
      varying vec3 surfacePoint;
      void main() {
        #include <logdepthbuf_fragment>
        float facing = max(0.0, dot(normalize(surfaceNormal), normalize(viewDirection)));
        float limb = 0.4 + 0.6 * pow(facing, 0.4);
        float granules = sin(surfacePoint.x * 160.0 + sin(surfacePoint.z * 90.0))
          * sin(surfacePoint.y * 135.0 + surfacePoint.z * 55.0);
        gl_FragColor = vec4(starColor * limb * (0.94 + 0.06 * granules), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    toneMapped: false
  });
  const star = new THREE.Mesh(new THREE.SphereGeometry(radiusKm, 48, 32), surface);
  star.userData.radiusKm = radiusKm;
  star.userData.kind = 'star';

  const corona = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(color) } },
    vertexShader: `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec2 glowUv;
      void main() {
        glowUv = uv;
        vec4 mvPosition = modelViewMatrix[3];
        gl_Position = projectionMatrix * mvPosition;
        float diameter = length(modelMatrix[0].xyz);
        // Offset directly in clip space: a view-space billboard loses precision
        // and can collapse to half a quad at interstellar distances.
        gl_Position.xy += position.xy * diameter
          * vec2(projectionMatrix[0][0], projectionMatrix[1][1]);
        #include <logdepthbuf_vertex>
        // The billboard has constant depth, so normalize homogeneous coordinates
        // before rasterization. Huge W values otherwise corrupt UV interpolation.
        if (gl_Position.w > 0.0) {
          gl_Position /= gl_Position.w;
          gl_Position.z = 0.0;
        } else {
          gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        }
      }
    `,
    fragmentShader: `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform vec3 glowColor;
      varying vec2 glowUv;
      void main() {
        #include <logdepthbuf_fragment>
        float r = length(glowUv - 0.5) * 2.0;
        float alpha = exp(-r * 8.0) * (1.0 - smoothstep(0.5, 1.0, r));
        gl_FragColor = vec4(glowColor, alpha * 0.8);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  }));
  corona.name = 'stellar-corona';
  corona.scale.setScalar(radiusKm * 6);
  star.add(corona);
  return star;
}

export function updateStarGlows(
  stars: THREE.Mesh[], camera: THREE.PerspectiveCamera, viewportHeight: number
) {
  const projectionScale = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  for (const star of stars) {
    const corona = star.getObjectByName('stellar-corona');
    if (!corona) continue;
    const kmPerPixel = camera.position.distanceTo(star.position) * projectionScale / Math.max(1, viewportHeight);
    // Subpixel sphere vertices lose precision at light-year distances. Render
    // just their corona until the physical disk can resolve to at least a pixel.
    const materials = Array.isArray(star.material) ? star.material : [star.material];
    for (const material of materials) material.visible = star.userData.radiusKm * 2 >= kmPerPixel;
    corona.scale.setScalar(Math.max(star.userData.radiusKm * 6, kmPerPixel * 14));
  }
}
