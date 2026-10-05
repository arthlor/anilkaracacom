import * as THREE from "three";

/*
  Two materials draw every building.

  Facade: walls painted with the instance colour, with windows drawn in the
  fragment shader from the shell's `facade` coordinates (window column,
  storey). Windows are box-filtered with fwidth, so a façade fades to its
  average tone with distance instead of shimmering. Glass gets its own
  roughness and metalness; some windows and most shop fronts are lit.

  Detail: roofs, balconies and props coloured per vertex.

  Both read two per-instance attributes:
  - aSeed: a random number per building, for lit windows and glass tints.
  - aState: brightness for highlighting (1 normal, below 1 dimmed).
*/

const SHARED_VERTEX = /* glsl */ `
attribute float aSeed;
attribute float aState;
varying float vSeed;
varying float vState;
`;

const SHARED_FRAGMENT = /* glsl */ `
varying float vSeed;
varying float vState;
`;

export function createFacadeMaterial(litStrength: number) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0,
    envMapIntensity: 0.7,
  });
  const uniforms = { uLit: { value: litStrength } };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
${SHARED_VERTEX}
attribute vec2 facade;
attribute vec2 facadeStyle;
varying vec2 vFacade;
varying vec2 vFacadeStyle;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vFacade = facade;
vFacadeStyle = facadeStyle;
vSeed = aSeed;
vState = aState;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
${SHARED_FRAGMENT}
uniform float uLit;
varying vec2 vFacade;
varying vec2 vFacadeStyle;

float facadeHash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

// Share of [x - w/2, x + w/2] where fract(t) lies in [a, b]: a box-filtered
// window edge that settles on the average coverage as the cells shrink.
float facadePulse(float a, float b, float x, float w) {
  float x0 = x - 0.5 * w;
  float x1 = x + 0.5 * w;
  float i0 = floor(x0) * (b - a) + clamp(fract(x0), a, b) - a;
  float i1 = floor(x1) * (b - a) + clamp(fract(x1), a, b) - a;
  return clamp((i1 - i0) / w, 0.0, 1.0);
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec3 facadePaint = diffuseColor.rgb;
vec2 facadeWidth = max(fwidth(vFacade), vec2(1e-4));
float facadeFar = smoothstep(0.3, 0.85, max(facadeWidth.x, facadeWidth.y));
vec2 facadeCell = floor(vFacade);
float facadeRandom = facadeHash(vec3(facadeCell, vSeed * 97.0));
float isCurtain = step(0.5, vFacadeStyle.x) * step(vFacadeStyle.x, 1.5);
float isHouse = step(1.5, vFacadeStyle.x);
float shopChance = step(0.5, vFacadeStyle.y) * step(vFacadeStyle.y, 1.5)
  * step(facadeHash(vec3(vSeed * 13.0, 3.1, 7.7)), 0.55);
float isShop = clamp(step(1.5, vFacadeStyle.y) + shopChance, 0.0, 1.0)
  * (1.0 - step(1.0, vFacade.y));

vec2 windowLow = vec2(0.22, 0.3);
vec2 windowHigh = vec2(0.78, 0.8);
windowLow = mix(windowLow, vec2(0.06, 0.15), isCurtain);
windowHigh = mix(windowHigh, vec2(0.94, 0.97), isCurtain);
windowLow = mix(windowLow, vec2(0.33, 0.32), isHouse);
windowHigh = mix(windowHigh, vec2(0.67, 0.78), isHouse);
windowLow = mix(windowLow, vec2(0.05, 0.08), isShop);
windowHigh = mix(windowHigh, vec2(0.95, 0.84), isShop);
float facadeWindow = facadePulse(windowLow.x, windowHigh.x, vFacade.x, facadeWidth.x)
  * facadePulse(windowLow.y, windowHigh.y, vFacade.y, facadeWidth.y);

// Shutters beside village-house windows, green or brown per house.
float shutter = isHouse * (1.0 - facadeFar)
  * (facadePulse(0.2, 0.33, vFacade.x, facadeWidth.x) + facadePulse(0.67, 0.8, vFacade.x, facadeWidth.x))
  * facadePulse(windowLow.y, windowHigh.y, vFacade.y, facadeWidth.y);
vec3 shutterColor = mix(vec3(0.07, 0.2, 0.2), vec3(0.2, 0.11, 0.06),
  step(0.5, facadeHash(vec3(vSeed * 31.0, 1.7, 2.3))));

vec3 glass = vec3(0.035, 0.045, 0.055);
// Some windows have curtains drawn; curtain walls stay even.
glass = mix(glass, vec3(0.22, 0.2, 0.18),
  step(0.74, facadeRandom) * (1.0 - facadeFar) * (1.0 - isCurtain));
vec3 curtainGlass = mix(vec3(0.05, 0.09, 0.12), vec3(0.08, 0.1, 0.09),
  facadeHash(vec3(vSeed * 7.0, 5.0, 1.0)));
glass = mix(glass, curtainGlass, isCurtain);
glass = mix(glass, vec3(0.1, 0.09, 0.08), isShop);
vec3 frame = mix(facadePaint, facadePaint * vec3(0.62, 0.66, 0.7), isCurtain);

diffuseColor.rgb = mix(frame, glass, facadeWindow);
diffuseColor.rgb = mix(diffuseColor.rgb, shutterColor, clamp(shutter, 0.0, 1.0));
// Contact shadow where the wall meets the ground.
diffuseColor.rgb *= mix(0.58, 1.0, smoothstep(0.0, 0.9, vFacade.y));
diffuseColor.rgb *= vState;

float litChance = mix(mix(0.14, 0.1, isCurtain), 0.62, isShop);
float facadeLit = mix(step(facadeRandom, litChance), litChance, facadeFar) * facadeWindow;
vec3 litColor = mix(vec3(1.0, 0.64, 0.34), vec3(0.95, 0.86, 0.7), isCurtain);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, mix(0.2, 0.07, isCurtain), facadeWindow);`,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
metalnessFactor = mix(metalnessFactor, mix(0.1, 0.5, isCurtain), facadeWindow);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
totalEmissiveRadiance += litColor * facadeLit * uLit * vState * vState;`,
      );
  };
  material.customProgramCacheKey = () => "izmir-facade";
  return { material, uniforms };
}

export function createDetailMaterial() {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.82,
    metalness: 0,
    envMapIntensity: 0.6,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${SHARED_VERTEX}`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>\nvSeed = aSeed;\nvState = aState;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${SHARED_FRAGMENT}`)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>\ndiffuseColor.rgb *= vState;`,
      );
  };
  material.customProgramCacheKey = () => "izmir-detail";
  return material;
}

/** Adds the per-instance seed and highlight attributes to an instanced geometry. */
export function addInstanceAttributes(
  geometry: THREE.BufferGeometry,
  seeds: Float32Array,
) {
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
  const state = new THREE.InstancedBufferAttribute(
    new Float32Array(seeds.length).fill(1),
    1,
  );
  state.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("aState", state);
  return state;
}
