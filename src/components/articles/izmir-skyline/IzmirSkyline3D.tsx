import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import {
  LOT,
  TIER_META,
  TIER_ORDER,
  addInstanceAttributes,
  buildTree,
  buildVariant,
  chooseMainPolygon,
  createDetailMaterial,
  createFacadeMaterial,
  createFolkartLandmark,
  layoutCity,
  polygonArea,
  variantKey,
  type DistrictData,
  type DistrictShape,
  type PlacedBuilding,
  type PlacedTree,
  type TierKey,
} from "./architecture";
import { loadJson } from "./loadJson";
import { TIER_DARK_HEX } from "./tierPalette";
import { withChartBoundary } from "../../case-study/ChartBoundary";

/** Top of the extruded district slabs; the city stands on it. */
const LAND_TOP = 1.05;
const PAD_HEIGHT = 0.012;
const GROUND = LAND_TOP + PAD_HEIGHT;

/** Low sun from just south of west: side light and long eastward shadows. */
const SUN_DIRECTION = new THREE.Vector3().setFromSphericalCoords(
  1,
  THREE.MathUtils.degToRad(66),
  THREE.MathUtils.degToRad(290),
);

/* Highlight brightness for buildings and trees. */
const STATE_NORMAL = 1;
const STATE_ACTIVE = 1.1;
const STATE_DIMMED = 0.14;

interface BuildingGroup {
  tier: TierKey;
  items: PlacedBuilding[];
  meshes: THREE.InstancedMesh[];
  states: THREE.InstancedBufferAttribute[];
}

interface TreeGroup {
  items: PlacedTree[];
  state: THREE.InstancedBufferAttribute;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function simplifyRing(
  points: [number, number][],
  tolerance: number,
): [number, number][] {
  if (points.length <= 34) return points;
  const toleranceSq = tolerance * tolerance;
  const simplified: [number, number][] = [points[0]!];
  let previous = points[0]!;
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index]!;
    const dx = point[0] - previous[0];
    const dy = point[1] - previous[1];
    if (dx * dx + dy * dy >= toleranceSq) {
      simplified.push(point);
      previous = point;
    }
  }
  const last = points[points.length - 1]!;
  simplified.push(last);
  return simplified.length >= 3 ? simplified : points;
}

function makeWaterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, "#1b4049");
    gradient.addColorStop(0.42, "#123240");
    gradient.addColorStop(1, "#0a2230");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    context.lineWidth = 1;
    for (let row = -12; row < 530; row += 18) {
      context.beginPath();
      context.strokeStyle = `rgba(255, 214, 160, ${0.03 + ((row + 12) % 54) / 1800})`;
      for (let x = -24; x <= 536; x += 8) {
        const y = row + Math.sin(x * 0.045 + row * 0.03) * 2.2;
        if (x === -24) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

function setSky(sky: Sky) {
  const uniforms = sky.material.uniforms;
  uniforms.turbidity!.value = 7.5;
  uniforms.rayleigh!.value = 1.6;
  uniforms.mieCoefficient!.value = 0.006;
  uniforms.mieDirectionalG!.value = 0.84;
  uniforms.sunPosition!.value.copy(SUN_DIRECTION);
  sky.scale.setScalar(10000);
}

function IzmirSkyline3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);
  const focusDistrictRef = useRef<
    ((district: DistrictData | null) => void) | null
  >(null);
  const renderRef = useRef<(() => void) | null>(null);
  const buildingGroupsRef = useRef<BuildingGroup[]>([]);
  const folkartLandmarkRef = useRef<THREE.Group | null>(null);
  const activeTierFilterRef = useRef<"all" | TierKey>("all");
  const hoveredDistrictRef = useRef<DistrictData | null>(null);
  const selectedDistrictRef = useRef<DistrictData | null>(null);

  const [districtData, setDistrictData] = useState<DistrictData[]>([]);
  const [districtShapes, setDistrictShapes] = useState<DistrictShape[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(
    null,
  );
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictData | null>(
    null,
  );
  const [activeTierFilter, setActiveTierFilter] = useState<"all" | TierKey>(
    "all",
  );
  const [isMobile, setIsMobile] = useState(false);
  const [is3dTouchActive, setIs3dTouchActive] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"filter" | "info">(
    "filter",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [showZoomHint, setShowZoomHint] = useState(false);
  // Bumping these re-runs the data load or rebuilds the scene from scratch.
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [glEpoch, setGlEpoch] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const updateMobile = () => setIsMobile(media.matches);
    updateMobile();
    media.addEventListener("change", updateMobile);
    return () => media.removeEventListener("change", updateMobile);
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(false);
    Promise.all([
      loadJson<DistrictData[]>("/data/izmir-kat/district_summary.json"),
      loadJson<DistrictShape[]>("/data/izmir-kat/district_shapes.json"),
    ])
      .then(([summary, shapes]) => {
        if (!active) return;
        setDistrictData(summary);
        setDistrictShapes(shapes);
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Failed to load İzmir map data:", error);
        setLoadError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || districtData.length === 0 || districtShapes.length === 0)
      return;

    const setupStarted = performance.now();
    const mobileDevice = isMobile;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    const scene = new THREE.Scene();
    // One neutral night tone: fog and background match, so the edge of the
    // water plane dissolves instead of showing the sky behind it.
    const fogColor = new THREE.Color(0x111413);
    scene.fog = new THREE.Fog(fogColor, mobileDevice ? 150 : 135, 315);
    scene.background = fogColor;

    const camera = new THREE.PerspectiveCamera(
      mobileDevice ? 47 : 35,
      width / height,
      0.05,
      520,
    );
    // Open on the metropolitan bay, where most of the buildings are; zoom
    // out for the whole province.
    const initialTarget = new THREE.Vector3(-12.5, LAND_TOP, 10.5);
    const initialCamera = initialTarget
      .clone()
      .add(
        new THREE.Vector3(-0.16, 0.6, 0.78)
          .normalize()
          .multiplyScalar(mobileDevice ? 94 : 72),
      );
    const entryCamera = initialTarget
      .clone()
      .add(initialCamera.clone().sub(initialTarget).multiplyScalar(1.25));
    camera.position.copy(reducedMotion ? initialCamera : entryCamera);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !mobileDevice,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
      });
    } catch (error) {
      console.error("WebGL renderer could not start:", error);
      setSceneError("Bu cihazda 3D harita başlatılamadı.");
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, mobileDevice ? 1 : 1.5),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.replaceChildren(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    const controls = new OrbitControls(camera, renderer.domElement);
    let zoomHintTimer: number | undefined;
    const handleWheelCapture = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      // Plain wheel scrolls the article; OrbitControls never sees it.
      event.stopImmediatePropagation();
      setShowZoomHint(true);
      window.clearTimeout(zoomHintTimer);
      zoomHintTimer = window.setTimeout(() => setShowZoomHint(false), 1400);
    };
    renderer.domElement.addEventListener("wheel", handleWheelCapture, {
      capture: true,
    });
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = !mobileDevice;
    // Close enough to read balconies and rooftop heaters.
    controls.minDistance = mobileDevice ? 9 : 5;
    controls.maxDistance = mobileDevice ? 285 : 245;
    controls.minPolarAngle = Math.PI * 0.12;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.target.copy(initialTarget);

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const environmentScene = new THREE.Scene();
    const environmentSky = new Sky();
    setSky(environmentSky);
    environmentScene.add(environmentSky);
    const environmentTarget = pmrem.fromScene(
      environmentScene,
      0.04,
      0.1,
      20000,
    );
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 0.42;

    scene.add(new THREE.HemisphereLight(0xc9d6e4, 0x2e2b22, 0.55));
    const sunLight = new THREE.DirectionalLight(0xffc68c, 2.7);
    sunLight.castShadow = true;
    const shadowSize = mobileDevice
      ? 2048
      : Math.min(4096, renderer.capabilities.maxTextureSize);
    sunLight.shadow.mapSize.set(shadowSize, shadowSize);
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 420;
    sunLight.shadow.radius = mobileDevice ? 1 : 2.5;
    scene.add(sunLight, sunLight.target);
    const bayFill = new THREE.DirectionalLight(0x9bc6ca, 0.45);
    bayFill.position.set(72, 38, -76);
    scene.add(bayFill);

    // The shadow frustum follows the view: the whole province from afar,
    // a single neighbourhood up close, so shadows stay sharp when zoomed.
    let shadowExtent = 0;
    const fitShadow = () => {
      const distance = camera.position.distanceTo(controls.target);
      const extent = clamp(distance * 0.62, 4, 84);
      const center = controls.target;
      sunLight.target.position.set(center.x, LAND_TOP, center.z);
      sunLight.position
        .copy(SUN_DIRECTION)
        .multiplyScalar(200)
        .add(sunLight.target.position);
      if (Math.abs(extent - shadowExtent) > shadowExtent * 0.04) {
        shadowExtent = extent;
        const shadowCamera = sunLight.shadow.camera;
        shadowCamera.left = -extent;
        shadowCamera.right = extent;
        shadowCamera.top = extent;
        shadowCamera.bottom = -extent;
        shadowCamera.updateProjectionMatrix();
        const texel = (extent * 2) / shadowSize;
        sunLight.shadow.normalBias = texel * 1.4;
        sunLight.shadow.bias = -0.00025;
      }
    };

    const waterTexture = makeWaterTexture();
    waterTexture.anisotropy = Math.min(
      4,
      renderer.capabilities.getMaxAnisotropy(),
    );
    const seaMaterial = new THREE.MeshStandardMaterial({
      map: waterTexture,
      color: 0x1a3c46,
      roughness: 0.62,
      metalness: 0.02,
      envMapIntensity: 0.22,
    });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(360, 300), seaMaterial);
    sea.rotation.x = -Math.PI / 2;
    // Just under the land: shores stand a storey above the water, not a cliff.
    sea.position.set(0, LAND_TOP - 0.035, 1);
    sea.receiveShadow = true;
    scene.add(sea);

    const dataMap = new Map(
      districtData.map((district) => [district.district, district]),
    );
    const districtArea = new Map(
      districtShapes.map((shape) => [
        shape.district,
        polygonArea(chooseMainPolygon(shape)),
      ]),
    );
    const pickableObjects: THREE.Object3D[] = [];
    const districtMaterials = new Map<
      string,
      { material: THREE.MeshStandardMaterial; base: THREE.Color }
    >();
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0xd5a06b,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    const borderSegments: THREE.Vector3[] = [];

    districtShapes.forEach((districtShape) => {
      const district = dataMap.get(districtShape.district);
      if (!district) return;
      // Countryside reads olive; the city reads from its streets and roofs.
      const base = new THREE.Color(0x4d5038);
      const material = new THREE.MeshStandardMaterial({
        color: base.clone(),
        roughness: 0.95,
        metalness: 0,
        emissive: 0x121c1d,
        emissiveIntensity: 0.12,
      });
      districtMaterials.set(district.district, { material, base });

      districtShape.polygons.forEach((polygon) => {
        if (polygon.length < 3) return;
        const simplified = simplifyRing(polygon, mobileDevice ? 0.22 : 0.12);
        const shape = new THREE.Shape();
        simplified.forEach(([x, y], index) => {
          if (index === 0) shape.moveTo(x, -y);
          else shape.lineTo(x, -y);
        });
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: LAND_TOP,
          steps: 1,
          bevelEnabled: false,
          curveSegments: 1,
        });
        geometry.rotateX(-Math.PI / 2);
        geometry.computeVertexNormals();
        const land = new THREE.Mesh(geometry, material);
        land.receiveShadow = true;
        land.castShadow = true;
        land.userData = { districtData: district };
        scene.add(land);
        pickableObjects.push(land);

        if (!mobileDevice) {
          simplified.forEach(([x, y], index) => {
            const [nextX, nextY] = simplified[(index + 1) % simplified.length]!;
            borderSegments.push(
              new THREE.Vector3(x, LAND_TOP + 0.03, y),
              new THREE.Vector3(nextX, LAND_TOP + 0.03, nextY),
            );
          });
        }
      });
    });
    if (borderSegments.length > 0) {
      const borders = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(borderSegments),
        borderMaterial,
      );
      borders.renderOrder = 4;
      scene.add(borders);
    }

    const city = layoutCity(districtData, districtShapes, {
      density: mobileDevice ? 3000 : 1700,
      treeDensity: mobileDevice ? 0.22 : 0.55,
    });

    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    // City blocks: pavements on every built lot, over an asphalt layer one
    // street wider, so the gaps between blocks read as roads.
    const paving = (
      size: number,
      thickness: number,
      color: number,
      roughness: number,
    ) => {
      const mesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(size, thickness, size),
        new THREE.MeshStandardMaterial({ color, roughness, envMapIntensity: 0.4 }),
        city.pads.length,
      );
      city.pads.forEach((pad, index) => {
        quaternion.setFromAxisAngle(up, pad.rotation);
        matrix.compose(
          position.set(pad.x, LAND_TOP + thickness / 2, pad.z),
          quaternion,
          scale.set(1, 1, 1),
        );
        mesh.setMatrixAt(index, matrix);
      });
      mesh.receiveShadow = true;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      scene.add(mesh);
    };
    paving(LOT + 0.13, PAD_HEIGHT * 0.4, 0x3a3c3d, 0.9);
    paving(LOT, PAD_HEIGHT, 0x9a948a, 0.92);

    // Bayraklı's first tower becomes the Folkart landmark.
    const bayrakli = dataMap.get("BAYRAKLI");
    const folkartSite = city.buildings.findIndex(
      (building) =>
        building.district.district === "BAYRAKLI" &&
        building.spec.kind === "tower",
    );
    const placedBuildings =
      folkartSite >= 0
        ? city.buildings.filter((_, index) => index !== folkartSite)
        : city.buildings;
    if (bayrakli && folkartSite >= 0) {
      const site = city.buildings[folkartSite]!;
      const landmark = createFolkartLandmark();
      landmark.position.set(site.x, GROUND, site.z);
      landmark.rotation.y = site.rotation;
      // 47 storeys at the model's storey height.
      landmark.scale.setScalar(0.21);
      landmark.userData.districtData = bayrakli;
      landmark.traverse((object) => {
        object.castShadow = true;
        object.receiveShadow = true;
      });
      scene.add(landmark);
      folkartLandmarkRef.current = landmark;
      landmark.visible =
        activeTierFilterRef.current === "all" ||
        activeTierFilterRef.current === "tier_20_plus";
    }

    const { material: facadeMaterial } = createFacadeMaterial(
      mobileDevice ? 0.55 : 0.7,
    );
    const detailMaterial = createDetailMaterial();
    const detailLevel = mobileDevice ? "lite" : "full";

    const byVariant = new Map<string, PlacedBuilding[]>();
    placedBuildings.forEach((building) => {
      const key = variantKey(building.spec);
      const list = byVariant.get(key);
      if (list) list.push(building);
      else byVariant.set(key, [building]);
    });

    const buildingGroups: BuildingGroup[] = [];
    byVariant.forEach((items) => {
      const variant = buildVariant(items[0]!.spec, detailLevel);
      const seeds = new Float32Array(items.map((item) => item.seed));
      const districts = items.map((item) => item.district);
      const meshes: THREE.InstancedMesh[] = [];
      const states: THREE.InstancedBufferAttribute[] = [];
      (
        [
          [variant.shell, facadeMaterial, "paint"],
          [variant.detail, detailMaterial, "tint"],
        ] as const
      ).forEach(([geometry, material, colorKey]) => {
        if (!geometry.getAttribute("position")?.count) {
          geometry.dispose();
          return;
        }
        states.push(addInstanceAttributes(geometry, seeds));
        const mesh = new THREE.InstancedMesh(geometry, material, items.length);
        items.forEach((item, index) => {
          quaternion.setFromAxisAngle(up, item.rotation);
          matrix.compose(
            position.set(item.x, GROUND, item.z),
            quaternion,
            scale.set(item.scale, 1, item.scale),
          );
          mesh.setMatrixAt(index, matrix);
          mesh.setColorAt(index, item[colorKey]);
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.computeBoundingSphere();
        mesh.userData = { instanceDistricts: districts };
        scene.add(mesh);
        meshes.push(mesh);
        // Walls are enough to hit; roofs sit inside the same footprint.
        if (material === facadeMaterial) pickableObjects.push(mesh);
      });
      buildingGroups.push({ tier: items[0]!.tier, items, meshes, states });
    });
    buildingGroupsRef.current = buildingGroups;
    buildingGroups.forEach((group) => {
      group.meshes.forEach((mesh) => {
        mesh.visible =
          activeTierFilterRef.current === "all" ||
          activeTierFilterRef.current === group.tier;
      });
    });

    const treeGroups: TreeGroup[] = [];
    (["round", "cypress"] as const).forEach((type) => {
      const items = city.trees.filter((tree) => tree.type === type);
      if (items.length === 0) return;
      const geometry = buildTree(type);
      const state = addInstanceAttributes(
        geometry,
        new Float32Array(items.length),
      );
      const mesh = new THREE.InstancedMesh(geometry, detailMaterial, items.length);
      items.forEach((tree, index) => {
        quaternion.setFromAxisAngle(up, tree.rotation);
        matrix.compose(
          position.set(tree.x, LAND_TOP, tree.z),
          quaternion,
          scale.setScalar(tree.scale),
        );
        mesh.setMatrixAt(index, matrix);
        mesh.setColorAt(index, tree.tint);
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      scene.add(mesh);
      treeGroups.push({ items, state });
    });

    const render = () => {
      fitShadow();
      renderer.render(scene, camera);
      container.dataset.drawCalls = String(renderer.info.render.calls);
      container.dataset.triangles = String(renderer.info.render.triangles);
      container.dataset.geometries = String(renderer.info.memory.geometries);
      container.dataset.textures = String(renderer.info.memory.textures);
      container.dataset.programs = String(renderer.info.programs?.length ?? 0);
      container.dataset.buildings = String(placedBuildings.length);
    };
    renderRef.current = render;
    let interactionFrame: number | null = null;
    let cameraFrame: number | null = null;
    let cameraAnimationToken = 0;
    let interactionEndsAt = 0;

    const animateInteraction = () => {
      controls.update();
      render();
      if (performance.now() < interactionEndsAt) {
        interactionFrame = requestAnimationFrame(animateInteraction);
      } else {
        interactionFrame = null;
      }
    };
    const requestInteractionFrames = (duration = 220) => {
      interactionEndsAt = performance.now() + duration;
      if (interactionFrame === null) {
        interactionFrame = requestAnimationFrame(animateInteraction);
      }
    };
    const handleControlChange = () => requestInteractionFrames(140);
    const handleControlEnd = () => requestInteractionFrames(280);
    controls.addEventListener("change", handleControlChange);
    controls.addEventListener("end", handleControlEnd);

    const animateCamera = (
      nextPosition: THREE.Vector3,
      nextTarget: THREE.Vector3,
      duration = 650,
      onComplete?: () => void,
    ) => {
      if (cameraFrame !== null) cancelAnimationFrame(cameraFrame);
      cameraAnimationToken += 1;
      const token = cameraAnimationToken;
      if (reducedMotion) {
        camera.position.copy(nextPosition);
        controls.target.copy(nextTarget);
        controls.update();
        render();
        onComplete?.();
        return;
      }
      const startPosition = camera.position.clone();
      const startTarget = controls.target.clone();
      const startedAt = performance.now();
      const step = (now: number) => {
        const linear = Math.min((now - startedAt) / duration, 1);
        const eased =
          linear < 0.5
            ? 4 * linear * linear * linear
            : 1 - Math.pow(-2 * linear + 2, 3) / 2;
        camera.position.lerpVectors(startPosition, nextPosition, eased);
        controls.target.lerpVectors(startTarget, nextTarget, eased);
        controls.update();
        render();
        if (linear < 1) cameraFrame = requestAnimationFrame(step);
        else {
          cameraFrame = null;
          if (token === cameraAnimationToken) onComplete?.();
        }
      };
      cameraFrame = requestAnimationFrame(step);
    };

    const setHighlight = (district: DistrictData | null) => {
      districtMaterials.forEach(({ material, base }, districtName) => {
        const active = districtName === district?.district;
        material.color
          .copy(base)
          .lerp(new THREE.Color(0xc9a979), active ? 0.22 : 0);
        material.emissive.set(active ? 0x4a3525 : 0x121c1d);
        material.emissiveIntensity = active ? 0.24 : 0.12;
      });
      const stateFor = (name: string) =>
        !district
          ? STATE_NORMAL
          : name === district.district
            ? STATE_ACTIVE
            : STATE_DIMMED;
      buildingGroups.forEach((group) => {
        group.states.forEach((state) => {
          group.items.forEach((item, index) => {
            state.setX(index, stateFor(item.district.district));
          });
          state.needsUpdate = true;
        });
      });
      treeGroups.forEach((group) => {
        group.items.forEach((tree, index) => {
          // Trees fade less than buildings, so dimmed land doesn't go black.
          group.state.setX(
            index,
            clamp(stateFor(tree.district.district), 0.45, STATE_NORMAL),
          );
        });
        group.state.needsUpdate = true;
      });
      const landmark = folkartLandmarkRef.current;
      if (landmark) {
        const active = !district || district.district === "BAYRAKLI";
        landmark.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          materials.forEach((material) => {
            if (
              "emissiveIntensity" in material &&
              typeof material.emissiveIntensity === "number"
            ) {
              material.emissiveIntensity = active ? 0.08 : 0.02;
            }
            if ("opacity" in material) {
              material.transparent = !active;
              material.opacity = active ? 1 : 0.42;
            }
          });
        });
      }
      render();
    };

    const clearSelection = (moveCamera: boolean) => {
      selectedDistrictRef.current = null;
      hoveredDistrictRef.current = null;
      setSelectedDistrict(null);
      setHoveredDistrict(null);
      setHighlight(null);
      if (moveCamera) animateCamera(initialCamera, initialTarget, 650);
    };

    const focusDistrict = (district: DistrictData | null) => {
      if (!district) {
        clearSelection(true);
        return;
      }
      selectedDistrictRef.current = district;
      setSelectedDistrict(district);
      setHoveredDistrict(null);
      setActiveMobileTab("info");
      setHighlight(district);
      const nextTarget = new THREE.Vector3(district.x, LAND_TOP + 0.3, district.z);
      const offset = camera.position.clone().sub(controls.target).normalize();
      // Small city districts get a close look; big rural ones stay wide.
      const size = Math.sqrt(districtArea.get(district.district) ?? 64);
      const distance = clamp(
        size * (mobileDevice ? 4.6 : 3.4),
        mobileDevice ? 16 : 10,
        mobileDevice ? 92 : 64,
      );
      animateCamera(
        nextTarget.clone().add(offset.multiplyScalar(distance)),
        nextTarget,
        700,
      );
    };
    focusDistrictRef.current = focusDistrict;
    resetCameraRef.current = () => clearSelection(true);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerFrame: number | null = null;
    let pointerPosition: { x: number; y: number } | null = null;

    const resolveDistrict = () => {
      pointerFrame = null;
      if (!pointerPosition) return null;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((pointerPosition.x - rect.left) / rect.width) * 2 - 1,
        -((pointerPosition.y - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(
        pickableObjects.filter((object) => object.visible),
        false,
      );
      let district: DistrictData | null = null;
      for (const intersection of intersections) {
        const instanceDistricts = intersection.object.userData
          .instanceDistricts as DistrictData[] | undefined;
        if (instanceDistricts && intersection.instanceId !== undefined) {
          district = instanceDistricts[intersection.instanceId] ?? null;
          break;
        }
        const shapeDistrict = intersection.object.userData.districtData as
          | DistrictData
          | undefined;
        if (shapeDistrict) {
          district = shapeDistrict;
          break;
        }
      }
      if (hoveredDistrictRef.current?.district !== district?.district) {
        hoveredDistrictRef.current = district;
        setHoveredDistrict(district);
        if (!selectedDistrictRef.current) setHighlight(district);
      }
      return district;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerPosition = { x: event.clientX, y: event.clientY };
      if (pointerFrame === null)
        pointerFrame = requestAnimationFrame(resolveDistrict);
    };
    const handlePointerLeave = () => {
      pointerPosition = null;
      hoveredDistrictRef.current = null;
      setHoveredDistrict(null);
      setHighlight(selectedDistrictRef.current);
    };
    let pointerDownPosition: { x: number; y: number } | null = null;
    const handlePointerDown = (event: PointerEvent) => {
      pointerDownPosition = { x: event.clientX, y: event.clientY };
    };
    const handlePointerUp = (event: PointerEvent) => {
      const travel = pointerDownPosition
        ? Math.hypot(
            event.clientX - pointerDownPosition.x,
            event.clientY - pointerDownPosition.y,
          )
        : 0;
      pointerDownPosition = null;
      if (travel > 7) return;
      pointerPosition = { x: event.clientX, y: event.clientY };
      const district = resolveDistrict();
      if (!district) return;
      if (selectedDistrictRef.current?.district === district.district) {
        clearSelection(true);
      } else {
        focusDistrict(district);
      }
    };
    // Mobile browsers drop WebGL contexts under memory pressure and don't
    // always hand them back. Wait briefly, then rebuild on a fresh canvas.
    let rebuildTimer = 0;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setSceneError("3D harita yeniden başlatılıyor…");
      window.clearTimeout(rebuildTimer);
      rebuildTimer = window.setTimeout(() => {
        setSceneError(null);
        setGlEpoch((epoch) => epoch + 1);
      }, 1800);
    };
    const handleContextRestored = () => {
      window.clearTimeout(rebuildTimer);
      setSceneError(null);
      render();
    };

    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.addEventListener(
      "webglcontextrestored",
      handleContextRestored,
    );

    const resizeObserver = new ResizeObserver(() => {
      const nextWidth = Math.max(container.clientWidth, 1);
      const nextHeight = Math.max(container.clientHeight, 1);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, mobileDevice ? 1 : 1.5),
      );
      renderer.setSize(nextWidth, nextHeight, false);
      render();
    });
    resizeObserver.observe(container);

    controls.update();
    setHighlight(selectedDistrictRef.current);
    container.dataset.setupMs = String(Math.round(performance.now() - setupStarted));
    if (!reducedMotion) animateCamera(initialCamera, initialTarget, 900);

    return () => {
      resizeObserver.disconnect();
      window.clearTimeout(zoomHintTimer);
      window.clearTimeout(rebuildTimer);
      renderer.domElement.removeEventListener("wheel", handleWheelCapture, {
        capture: true,
      });
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        handleContextLost,
      );
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
      );
      controls.removeEventListener("change", handleControlChange);
      controls.removeEventListener("end", handleControlEnd);
      if (pointerFrame !== null) cancelAnimationFrame(pointerFrame);
      if (interactionFrame !== null) cancelAnimationFrame(interactionFrame);
      if (cameraFrame !== null) cancelAnimationFrame(cameraFrame);
      controls.dispose();
      buildingGroupsRef.current = [];
      folkartLandmarkRef.current = null;
      if (renderRef.current === render) renderRef.current = null;
      resetCameraRef.current = null;
      focusDistrictRef.current = null;

      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        const renderable = object as THREE.Object3D & {
          geometry?: THREE.BufferGeometry;
          material?: THREE.Material | THREE.Material[];
          dispose?: () => void;
        };
        if (renderable.geometry && !geometries.has(renderable.geometry)) {
          renderable.geometry.dispose();
          geometries.add(renderable.geometry);
        }
        const objectMaterials = Array.isArray(renderable.material)
          ? renderable.material
          : renderable.material
            ? [renderable.material]
            : [];
        objectMaterials.forEach((material) => {
          if (materials.has(material)) return;
          material.dispose();
          materials.add(material);
        });
        if (object instanceof THREE.InstancedMesh) object.dispose();
      });
      sunLight.shadow.dispose();
      waterTexture.dispose();
      if (mobileDevice) borderMaterial.dispose();
      environmentTarget.dispose();
      environmentSky.geometry.dispose();
      environmentSky.material.dispose();
      pmrem.dispose();
      renderer.renderLists.dispose();
      // Free the GPU context now rather than whenever GC gets to it; browsers
      // cap live contexts and kill the oldest when a page makes too many.
      if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [districtData, districtShapes, isMobile, glEpoch]);

  useEffect(() => {
    activeTierFilterRef.current = activeTierFilter;
    buildingGroupsRef.current.forEach((group) => {
      group.meshes.forEach((mesh) => {
        mesh.visible =
          activeTierFilter === "all" || activeTierFilter === group.tier;
      });
    });
    if (folkartLandmarkRef.current) {
      folkartLandmarkRef.current.visible =
        activeTierFilter === "all" || activeTierFilter === "tier_20_plus";
    }
    renderRef.current?.();
  }, [activeTierFilter]);

  useEffect(() => {
    selectedDistrictRef.current = selectedDistrict;
  }, [selectedDistrict]);

  const activeDistrict = hoveredDistrict || selectedDistrict;
  const selectDistrict = (districtName: string) => {
    const district =
      districtData.find((item) => item.district === districtName) ?? null;
    focusDistrictRef.current?.(district);
  };

  return (
    <section
      data-story-root
      role="group"
      aria-label="İzmir ilçelerinin kat dağılımı 3D görselleştirmesi"
      aria-describedby="izmir-map-description"
      className="group relative my-12 h-[68svh] max-h-[620px] min-h-[500px] w-full min-w-0 max-w-full overflow-hidden rounded-[18px] border border-border bg-[#111413] text-white md:h-[min(78svh,760px)] md:max-h-[760px] md:min-h-[620px]"
    >
      <p id="izmir-map-description" className="sr-only">
        Harita, İzmir’in 30 ilçesindeki 899.436 bina kaydını temsili bir kent
        modeliyle gösterir: her model bina yüzlerce gerçek binayı temsil eder,
        konumlar gerçek bina ayak izleri değildir. İlçe seçmek ve kat filtresi
        uygulamak için kontrolleri kullanabilirsiniz.
      </p>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 bg-gradient-to-b from-[#111413]/90 to-transparent px-3 pb-14 pt-3 text-white sm:px-4 sm:pt-4 md:px-6 md:pt-5">
        <h3 className="m-0 min-w-0 pt-1 text-lg font-semibold tracking-[-0.025em] !text-white md:text-xl">
          İzmir kat haritası
        </h3>

        <div className="pointer-events-auto flex min-w-0 shrink-0 flex-row items-center justify-end gap-1.5 sm:gap-2">
          <label className="sr-only" htmlFor="izmir-district-select">
            İlçe seçin
          </label>
          <select
            id="izmir-district-select"
            value={selectedDistrict?.district ?? ""}
            onChange={(event) => selectDistrict(event.target.value)}
            className="min-h-10 w-[6.9rem] rounded-full border border-white/15 bg-black/45 px-3 text-xs font-medium text-white backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-[8.6rem]"
          >
            <option value="">İlçe seçin</option>
            {districtData.map((district) => (
              <option key={district.district} value={district.district}>
                {district.district}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => resetCameraRef.current?.()}
            aria-label="Görünümü sıfırla"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 text-xs font-medium text-white backdrop-blur-md transition hover:bg-black/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">↺</span>
            <span className="hidden sm:inline">Sıfırla</span>
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#111413] text-white">
          <span className="mb-4 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-white/70 motion-reduce:animate-none" />
          <div className="font-mono text-[11px] text-white/55">
            Harita hazırlanıyor
          </div>
        </div>
      )}

      {(loadError || sceneError) && !isLoading && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-[#111413] p-6 text-center text-white">
          <div className="max-w-sm">
            <div className="text-lg font-semibold">
              {sceneError ?? "Harita verisi yüklenemedi."}
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-300">
              İlçe dağılımını makalenin devamındaki erişilebilir grafikten
              inceleyebilirsiniz.
            </div>
            {loadError && !sceneError && (
              <button
                type="button"
                onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                className="mt-5 min-h-11 rounded-full bg-white px-5 text-sm font-medium text-[#111413] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Tekrar dene
              </button>
            )}
          </div>
        </div>
      )}

      <div
        ref={mountRef}
        className={`h-full w-full overflow-hidden ${
          isMobile && !is3dTouchActive
            ? "pointer-events-none touch-pan-y"
            : "pointer-events-auto cursor-grab touch-none active:cursor-grabbing"
        }`}
      />

      {isMobile &&
        !is3dTouchActive &&
        !isLoading &&
        !loadError &&
        !sceneError && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center px-4 pb-[12rem]">
            <button
              type="button"
              onClick={() => setIs3dTouchActive(true)}
              className="pointer-events-auto flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-medium text-[#111413] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Haritayı etkinleştir
            </button>
          </div>
        )}

      {isMobile && is3dTouchActive && (
        <button
          type="button"
          onClick={() => setIs3dTouchActive(false)}
          className="absolute right-3 top-[4.25rem] z-30 min-h-10 rounded-full border border-white/15 bg-black/55 px-3 text-xs font-medium text-white backdrop-blur-md"
        >
          Sayfayı kaydır
        </button>
      )}

      {!isMobile && activeDistrict && (
        <DistrictInfo district={activeDistrict} />
      )}

      {isMobile && (
        <div className="absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#111413]/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] text-white backdrop-blur-md">
          <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl bg-white/[0.06] p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveMobileTab("filter")}
              className={`min-h-9 rounded-lg px-3 transition ${activeMobileTab === "filter" ? "bg-white text-slate-950" : "text-slate-300"}`}
            >
              Kat filtresi
            </button>
            <button
              type="button"
              onClick={() => setActiveMobileTab("info")}
              className={`min-h-9 rounded-lg px-3 transition ${activeMobileTab === "info" ? "bg-white text-slate-950" : "text-slate-300"}`}
            >
              İlçe detayı
            </button>
          </div>

          {activeMobileTab === "filter" ? (
            <TierFilter
              activeTier={activeTierFilter}
              onChange={setActiveTierFilter}
              mobile
            />
          ) : activeDistrict ? (
            <div className="flex min-h-11 items-center justify-between gap-3 px-1 text-xs">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">
                  {activeDistrict.district}
                </div>
                <div className="mt-0.5 text-slate-400">
                  {formatNumber(activeDistrict.total_buildings)} kayıt · 20+
                  kat:{" "}
                  <span className="text-white">
                    {activeDistrict.tiers.tier_20_plus}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => focusDistrictRef.current?.(null)}
                className="min-h-10 shrink-0 rounded-full border border-white/10 px-3 text-slate-300"
              >
                Temizle
              </button>
            </div>
          ) : (
            <div className="min-h-11 px-2 py-2 text-center text-xs leading-5 text-slate-400">
              Üstteki menüden bir ilçe seçin veya 3D etkileşimi açıp haritaya
              dokunun.
            </div>
          )}
        </div>
      )}

      {showZoomHint && !isMobile && (
        <div
          className="pointer-events-none absolute inset-0 z-30 grid place-items-center"
          aria-hidden="true"
        >
          <span className="rounded-full bg-black/70 px-4 py-2 text-xs text-white backdrop-blur-md">
            Yakınlaştırmak için ⌘ ya da Ctrl ile kaydırın
          </span>
        </div>
      )}

      {!isMobile && (
        <div className="absolute bottom-5 left-1/2 z-20 w-[min(680px,calc(100%-3rem))] -translate-x-1/2">
          <TierFilter
            activeTier={activeTierFilter}
            onChange={setActiveTierFilter}
          />
        </div>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {selectedDistrict
          ? `${selectedDistrict.district} seçildi. ${formatNumber(selectedDistrict.total_buildings)} bina kaydı.`
          : "İlçe seçimi yok."}
      </p>
    </section>
  );
}

function TierFilter({
  activeTier,
  onChange,
  mobile = false,
}: {
  activeTier: "all" | TierKey;
  onChange: (tier: "all" | TierKey) => void;
  mobile?: boolean;
}) {
  const filters: { key: "all" | TierKey; label: string }[] = [
    { key: "all", label: "Tümü" },
    ...TIER_ORDER.map((tier) => ({
      key: tier,
      label: TIER_META[tier].shortLabel,
    })),
  ];
  return (
    <div
      aria-label="Kat aralığı filtresi"
      className={
        mobile
          ? "grid w-full grid-cols-3 gap-1 rounded-2xl bg-white/[0.06] p-1 text-xs sm:flex"
          : "flex justify-center gap-1 text-xs"
      }
    >
      {filters.map((filter) => {
        const active = activeTier === filter.key;
        const color =
          filter.key === "all" ? "#ffffff" : TIER_DARK_HEX[filter.key];
        return (
          <button
            type="button"
            key={filter.key}
            onClick={() => onChange(filter.key)}
            aria-pressed={active}
            className={`min-h-9 rounded-full px-2 font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white sm:shrink-0 sm:px-3 ${active ? "bg-white text-[#111413]" : "bg-black/45 text-white/80 backdrop-blur-md hover:bg-black/65 hover:text-white"}`}
          >
            <span
              aria-hidden="true"
              className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
              style={{ backgroundColor: color }}
            />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

function DistrictInfo({ district }: { district: DistrictData }) {
  const total = Math.max(district.total_buildings, 1);
  return (
    <aside className="absolute bottom-20 left-6 z-20 w-[min(300px,calc(100%-3rem))] rounded-xl border border-white/10 bg-black/55 p-4 text-xs text-white/65 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] text-white/55">İlçe profili</div>
          <div className="mt-1 text-base font-semibold text-white">
            {district.district}
          </div>
        </div>
        <div className="font-mono text-[11px] tabular-nums text-white/55">
          {formatNumber(district.total_buildings)} kayıt
        </div>
      </div>
      <div className="mt-3 flex h-2 gap-[2px] overflow-hidden rounded-full bg-white/10">
        {TIER_ORDER.map((tier) => (
          <span
            key={tier}
            title={`${TIER_META[tier].label}: %${((district.tiers[tier] / total) * 100).toFixed(1)}`}
            style={{
              width: `${(district.tiers[tier] / total) * 100}%`,
              backgroundColor: TIER_DARK_HEX[tier],
            }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
        <span>
          <span className="block text-sm font-semibold text-white">
            %{((district.tiers.tier_1_2 / total) * 100).toFixed(0)}
          </span>
          1–2 kat
        </span>
        <span>
          <span className="block text-sm font-semibold text-white">
            {formatNumber(district.tiers.tier_10_19)}
          </span>
          10–19 kat
        </span>
        <span>
          <span className="block text-sm font-semibold text-white">
            {formatNumber(district.tiers.tier_20_plus)}
          </span>
          20+ kat
        </span>
      </div>
    </aside>
  );
}

export default withChartBoundary(IzmirSkyline3D, "IzmirSkyline3D");
