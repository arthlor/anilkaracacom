import { useEffect, useRef, useState } from "react";
import { scaleSqrt } from "d3-scale";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import {
  TIER_META,
  TIER_ORDER,
  VARIANTS_BY_TIER,
  createArchitectureVariants,
  createFolkartLandmark,
  createMaterial,
  makeFacadeTextures,
  type BuildingFinish,
  type TierKey,
} from "./architecture";
import { loadJson } from "./loadJson";
import { TIER_DARK_HEX } from "./tierPalette";
import { withChartBoundary } from "../../case-study/ChartBoundary";

interface DistrictTier {
  tier_1_2: number;
  tier_3_5: number;
  tier_6_9: number;
  tier_10_19: number;
  tier_20_plus: number;
}

interface DistrictData {
  district: string;
  total_buildings: number;
  raw_max_floor: number;
  clean_max_floor: number;
  x: number;
  z: number;
  tiers: DistrictTier;
}

interface DistrictShape {
  district: string;
  centroid: [number, number];
  polygons: [number, number][][];
}

interface BuildingInstance {
  district: DistrictData;
  tier: TierKey;
  variant: number;
  position: THREE.Vector3;
  rotation: number;
  scale: THREE.Vector3;
  baseColor: THREE.Color;
}

interface InstanceMeshEntry {
  mesh: THREE.InstancedMesh;
  tier: TierKey;
  finish: BuildingFinish;
  instances: BuildingInstance[];
}

interface NearMeshEntry {
  mesh: THREE.InstancedMesh;
  variant: number;
  tier: TierKey;
  finish: BuildingFinish;
}

const ACTIVE_INSTANCE = new THREE.Color(0xfff0cf);
const DIMMED_INSTANCE = new THREE.Color(0x686762);
const WHITE_INSTANCE = new THREE.Color(0xffffff);

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(values: T[], random: () => number) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [values[index], values[next]] = [values[next]!, values[index]!];
  }
  return values;
}

function pointInPolygon(point: [number, number], polygon: [number, number][]) {
  let inside = false;
  for (
    let current = 0, previous = polygon.length - 1;
    current < polygon.length;
    previous = current++
  ) {
    const [x, y] = polygon[current]!;
    const [previousX, previousY] = polygon[previous]!;
    const intersects =
      y > point[1] !== previousY > point[1] &&
      point[0] <
        ((previousX - x) * (point[1] - y)) / (previousY - y || 1e-9) + x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function polygonArea(polygon: [number, number][]) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index]!;
    const next = polygon[(index + 1) % polygon.length]!;
    sum += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(sum / 2);
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

function chooseMainPolygon(shape: DistrictShape) {
  const containing = shape.polygons.find((polygon) =>
    pointInPolygon(shape.centroid, polygon),
  );
  if (containing) return containing;
  return [...shape.polygons].sort(
    (first, second) => polygonArea(second) - polygonArea(first),
  )[0]!;
}

function findInteriorCenter(
  polygon: [number, number][],
  preferred: [number, number],
  random: () => number,
) {
  if (pointInPolygon(preferred, polygon)) return preferred;
  const xs = polygon.map(([x]) => x);
  const ys = polygon.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const average: [number, number] = [
    polygon.reduce((sum, [x]) => sum + x, 0) / polygon.length,
    polygon.reduce((sum, [, y]) => sum + y, 0) / polygon.length,
  ];
  if (pointInPolygon(average, polygon)) return average;
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const candidate: [number, number] = [
      minX + random() * (maxX - minX),
      minY + random() * (maxY - minY),
    ];
    if (pointInPolygon(candidate, polygon)) return candidate;
  }
  return polygon[0]!;
}

function sampleClusterPositions(
  shape: DistrictShape,
  count: number,
  random: () => number,
) {
  const polygon = chooseMainPolygon(shape);
  const area = Math.max(polygonArea(polygon), 1);
  const center = findInteriorCenter(polygon, shape.centroid, random);
  const radius = clamp(Math.sqrt(area) * 0.28, 2.2, 7.8);
  const placed: [number, number][] = [];

  for (let index = 0; index < count; index += 1) {
    let accepted: [number, number] | null = null;
    for (let attempt = 0; attempt < 180; attempt += 1) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * radius;
      const candidate: [number, number] = [
        center[0] + Math.cos(angle) * distance,
        center[1] + Math.sin(angle) * distance * 0.76,
      ];
      const minimumDistance = attempt > 120 ? 0.58 : 0.88;
      const clear = placed.every(
        ([x, y]) =>
          Math.hypot(candidate[0] - x, candidate[1] - y) > minimumDistance,
      );
      if (clear && pointInPolygon(candidate, polygon)) {
        accepted = candidate;
        break;
      }
    }
    placed.push(accepted ?? center);
  }
  return placed;
}

function allocateTierCounts(tiers: DistrictTier, count: number) {
  const allocations = Object.fromEntries(
    TIER_ORDER.map((tier) => [tier, 0]),
  ) as Record<TierKey, number>;
  const active = TIER_ORDER.filter((tier) => tiers[tier] > 0);
  active.forEach((tier) => {
    allocations[tier] = 1;
  });
  const total = Math.max(
    active.reduce((sum, tier) => sum + tiers[tier], 0),
    1,
  );
  let remaining = Math.max(0, count - active.length);
  while (remaining > 0) {
    const nextTier = active.reduce((best, tier) => {
      const deficit = (tiers[tier] / total) * count - allocations[tier];
      const bestDeficit = (tiers[best] / total) * count - allocations[best];
      return deficit > bestDeficit ? tier : best;
    }, active[0]!);
    allocations[nextTier] += 1;
    remaining -= 1;
  }
  return allocations;
}

function makeWaterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, "#173b43");
    gradient.addColorStop(0.42, "#0c2934");
    gradient.addColorStop(1, "#061923");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    context.lineWidth = 1;
    for (let row = -12; row < 530; row += 22) {
      context.beginPath();
      context.strokeStyle = `rgba(255, 198, 130, ${0.025 + ((row + 12) % 66) / 2200})`;
      for (let x = -24; x <= 536; x += 10) {
        const y = row + Math.sin(x * 0.038 + row * 0.02) * 2;
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
  texture.repeat.set(2.5, 2.5);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

function setSky(sky: Sky) {
  const uniforms = sky.material.uniforms;
  uniforms.turbidity!.value = 8.5;
  uniforms.rayleigh!.value = 1.45;
  uniforms.mieCoefficient!.value = 0.006;
  uniforms.mieDirectionalG!.value = 0.82;
  const sun = new THREE.Vector3().setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(82),
    THREE.MathUtils.degToRad(238),
  );
  uniforms.sunPosition!.value.copy(sun);
  sky.scale.setScalar(10000);
}

function IzmirSkyline3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);
  const focusDistrictRef = useRef<
    ((district: DistrictData | null) => void) | null
  >(null);
  const renderRef = useRef<(() => void) | null>(null);
  const filterEntriesRef = useRef<InstanceMeshEntry[]>([]);
  const nearEntriesRef = useRef<NearMeshEntry[]>([]);
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
      0.1,
      520,
    );
    const initialCamera = mobileDevice
      ? new THREE.Vector3(8, 154, 148)
      : new THREE.Vector3(-20, 116, 134);
    const entryCamera = initialCamera.clone().multiplyScalar(1.12);
    const initialTarget = new THREE.Vector3(-2, 0, 7);
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
      Math.min(window.devicePixelRatio, mobileDevice ? 1 : 1.35),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
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
    controls.minDistance = mobileDevice ? 74 : 44;
    controls.maxDistance = mobileDevice ? 285 : 245;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.maxPolarAngle = Math.PI * 0.47;
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

    scene.add(new THREE.HemisphereLight(0xf6d7bb, 0x35413e, 1.68));
    const sunLight = new THREE.DirectionalLight(0xffc67e, 3.2);
    sunLight.position.set(-86, 92, 58);
    scene.add(sunLight);
    const bayFill = new THREE.DirectionalLight(0x9bc6ca, 1.08);
    bayFill.position.set(72, 38, -76);
    scene.add(bayFill);

    const waterTexture = makeWaterTexture();
    waterTexture.anisotropy = Math.min(
      4,
      renderer.capabilities.getMaxAnisotropy(),
    );
    const seaMaterial = new THREE.MeshStandardMaterial({
      map: waterTexture,
      color: 0x15343d,
      roughness: 0.66,
      metalness: 0.2,
      envMapIntensity: 0.75,
    });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(360, 300), seaMaterial);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(0, -1.05, 1);
    scene.add(sea);

    const dataMap = new Map(
      districtData.map((district) => [district.district, district]),
    );
    const shapeMap = new Map(
      districtShapes.map((shape) => [shape.district, shape]),
    );
    const pickableObjects: THREE.Object3D[] = [];
    const districtMaterials = new Map<
      string,
      { material: THREE.MeshStandardMaterial; base: THREE.Color }
    >();
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0xd5a06b,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
    });
    const borderSegments: THREE.Vector3[] = [];

    districtShapes.forEach((districtShape) => {
      const district = dataMap.get(districtShape.district);
      if (!district) return;
      const verticalShare =
        (district.tiers.tier_10_19 + district.tiers.tier_20_plus) /
        Math.max(district.total_buildings, 1);
      const base = new THREE.Color(0x32423f).lerp(
        new THREE.Color(0x62554a),
        Math.min(verticalShare * 58, 0.72),
      );
      const material = new THREE.MeshStandardMaterial({
        color: base,
        roughness: 0.88,
        metalness: 0.02,
        emissive: 0x121c1d,
        emissiveIntensity: 0.12,
      });
      districtMaterials.set(district.district, { material, base });

      districtShape.polygons.forEach((polygon) => {
        if (polygon.length < 3) return;
        const simplified = simplifyRing(polygon, mobileDevice ? 0.22 : 0.16);
        const shape = new THREE.Shape();
        simplified.forEach(([x, y], index) => {
          if (index === 0) shape.moveTo(x, -y);
          else shape.lineTo(x, -y);
        });
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 1.05,
          steps: 1,
          bevelEnabled: false,
          curveSegments: 1,
        });
        geometry.rotateX(-Math.PI / 2);
        geometry.computeVertexNormals();
        const land = new THREE.Mesh(geometry, material);
        land.userData = { districtData: district };
        scene.add(land);
        pickableObjects.push(land);

        if (!mobileDevice) {
          simplified.forEach(([x, y], index) => {
            const [nextX, nextY] = simplified[(index + 1) % simplified.length]!;
            borderSegments.push(
              new THREE.Vector3(x, 1.12, y),
              new THREE.Vector3(nextX, 1.12, nextY),
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

    const totals = districtData.map((district) => district.total_buildings);
    const buildingCount = scaleSqrt()
      .domain([Math.min(...totals), Math.max(...totals)])
      .range([6, 18])
      .clamp(true);
    const instancesByVariant = Array.from(
      { length: 13 },
      () => [] as BuildingInstance[],
    );
    const allInstances: BuildingInstance[] = [];

    districtData.forEach((district) => {
      const shape = shapeMap.get(district.district);
      if (!shape) return;
      const random = mulberry32(hashString(district.district));
      const count = Math.round(buildingCount(district.total_buildings));
      const allocations = allocateTierCounts(district.tiers, count);
      const tierList = shuffle(
        TIER_ORDER.flatMap((tier) =>
          Array.from({ length: allocations[tier] }, () => tier),
        ),
        random,
      );
      const positions = sampleClusterPositions(shape, count, random);
      tierList.forEach((tier, index) => {
        const variants = VARIANTS_BY_TIER[tier];
        const variant = variants[Math.floor(random() * variants.length)]!;
        const [x, z] = positions[index]!;
        const baseScale = (0.76 + random() * 0.2) * (mobileDevice ? 1.12 : 1);
        const heightScale =
          tier === "tier_20_plus"
            ? 0.76 + clamp((district.clean_max_floor - 20) / 38, 0, 1) * 0.28
            : tier === "tier_10_19"
              ? 0.82 + clamp((district.clean_max_floor - 10) / 10, 0, 1) * 0.16
              : 0.9 + random() * 0.12;
        const baseColor = new THREE.Color(0xffffff);
        baseColor.offsetHSL(
          0,
          (random() - 0.5) * 0.025,
          (random() - 0.5) * 0.1,
        );
        const instance: BuildingInstance = {
          district,
          tier,
          variant,
          position: new THREE.Vector3(x, 1.08, z),
          rotation: random() * Math.PI,
          scale: new THREE.Vector3(baseScale, heightScale, baseScale),
          baseColor,
        };
        instancesByVariant[variant]!.push(instance);
        allInstances.push(instance);
      });
    });

    const facadeTextures = makeFacadeTextures(renderer);
    const variants = createArchitectureVariants(mobileDevice);
    const meshEntries: InstanceMeshEntry[] = [];
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();

    variants.forEach((variant, variantIndex) => {
      const instances = instancesByVariant[variantIndex]!;
      if (instances.length === 0) return;
      (
        Object.entries(variant.far) as [BuildingFinish, THREE.BufferGeometry][]
      ).forEach(([finish, geometry]) => {
        const material = createMaterial(
          variantIndex,
          finish,
          variant.tier,
          facadeTextures,
        );
        const mesh = new THREE.InstancedMesh(
          geometry,
          material,
          instances.length,
        );
        instances.forEach((instance, instanceIndex) => {
          quaternion.setFromEuler(new THREE.Euler(0, instance.rotation, 0));
          matrix.compose(instance.position, quaternion, instance.scale);
          mesh.setMatrixAt(instanceIndex, matrix);
          mesh.setColorAt(
            instanceIndex,
            finish === "facade" || finish === "roof"
              ? instance.baseColor
              : WHITE_INSTANCE,
          );
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.computeBoundingSphere();
        const districts = instances.map((instance) => instance.district);
        mesh.userData = { instanceDistricts: districts };
        scene.add(mesh);
        pickableObjects.push(mesh);
        meshEntries.push({
          mesh,
          tier: variant.tier,
          finish,
          instances,
        });
      });
    });
    filterEntriesRef.current = meshEntries;
    meshEntries.forEach((entry) => {
      entry.mesh.visible =
        activeTierFilterRef.current === "all" ||
        activeTierFilterRef.current === entry.tier;
    });

    const nearMeshEntries: NearMeshEntry[] = [];
    variants.forEach((variant, variantIndex) => {
      (
        Object.entries(variant.near) as [BuildingFinish, THREE.BufferGeometry][]
      ).forEach(([finish, geometry]) => {
        const mesh = new THREE.InstancedMesh(
          geometry,
          createMaterial(variantIndex, finish, variant.tier, facadeTextures),
          18,
        );
        mesh.count = 0;
        mesh.visible = false;
        mesh.frustumCulled = false;
        scene.add(mesh);
        nearMeshEntries.push({
          mesh,
          variant: variantIndex,
          tier: variant.tier,
          finish,
        });
      });
    });
    nearEntriesRef.current = nearMeshEntries;

    const updateNearDetails = (district: DistrictData | null) => {
      const selectedInstances = district
        ? allInstances
            .filter(
              (instance) => instance.district.district === district.district,
            )
            .slice(0, 18)
        : [];
      nearMeshEntries.forEach((entry) => {
        const matches = selectedInstances.filter(
          (instance) => instance.variant === entry.variant,
        );
        entry.mesh.count = matches.length;
        matches.forEach((instance, index) => {
          quaternion.setFromEuler(new THREE.Euler(0, instance.rotation, 0));
          matrix.compose(instance.position, quaternion, instance.scale);
          entry.mesh.setMatrixAt(index, matrix);
          entry.mesh.setColorAt(
            index,
            entry.finish === "facade" || entry.finish === "roof"
              ? instance.baseColor
              : WHITE_INSTANCE,
          );
        });
        entry.mesh.instanceMatrix.needsUpdate = true;
        if (entry.mesh.instanceColor)
          entry.mesh.instanceColor.needsUpdate = true;
        entry.mesh.visible =
          matches.length > 0 &&
          (activeTierFilterRef.current === "all" ||
            activeTierFilterRef.current === entry.tier);
      });
    };

    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 64;
    const shadowContext = shadowCanvas.getContext("2d");
    if (shadowContext) {
      const gradient = shadowContext.createRadialGradient(
        34,
        32,
        3,
        74,
        32,
        60,
      );
      gradient.addColorStop(0, "rgba(4, 9, 12, .44)");
      gradient.addColorStop(0.46, "rgba(4, 9, 12, .19)");
      gradient.addColorStop(1, "rgba(4, 9, 12, 0)");
      shadowContext.fillStyle = gradient;
      shadowContext.fillRect(0, 0, 128, 64);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: mobileDevice ? 0.26 : 0.36,
      depthWrite: false,
    });
    const shadowMesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(2.45, 1),
      shadowMaterial,
      allInstances.length,
    );
    allInstances.forEach((instance, index) => {
      quaternion.setFromEuler(
        new THREE.Euler(-Math.PI / 2, THREE.MathUtils.degToRad(58), 0),
      );
      matrix.compose(
        new THREE.Vector3(instance.position.x, 1.1, instance.position.z),
        quaternion,
        new THREE.Vector3(1.35 * instance.scale.x, 1.18 * instance.scale.z, 1),
      );
      shadowMesh.setMatrixAt(index, matrix);
    });
    shadowMesh.instanceMatrix.needsUpdate = true;
    scene.add(shadowMesh);

    const bayrakli = dataMap.get("BAYRAKLI");
    if (bayrakli) {
      const landmark = createFolkartLandmark();
      const heightScale =
        0.82 + clamp((bayrakli.clean_max_floor - 20) / 38, 0, 1) * 0.28;
      landmark.position.set(bayrakli.x + 1.15, 1.08, bayrakli.z - 0.85);
      landmark.rotation.y = 0.42;
      landmark.scale.setScalar(1.08 * heightScale);
      landmark.userData.districtData = bayrakli;
      scene.add(landmark);
      folkartLandmarkRef.current = landmark;
      landmark.visible =
        activeTierFilterRef.current === "all" ||
        activeTierFilterRef.current === "tier_20_plus";
    }

    const render = () => {
      renderer.render(scene, camera);
      container.dataset.drawCalls = String(renderer.info.render.calls);
      container.dataset.triangles = String(renderer.info.render.triangles);
      container.dataset.geometries = String(renderer.info.memory.geometries);
      container.dataset.textures = String(renderer.info.memory.textures);
      container.dataset.programs = String(renderer.info.programs?.length ?? 0);
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
          .lerp(new THREE.Color(0xc9a979), active ? 0.38 : 0);
        material.emissive.set(active ? 0x4a3525 : 0x121c1d);
        material.emissiveIntensity = active ? 0.28 : 0.12;
      });
      meshEntries.forEach((entry) => {
        entry.instances.forEach((instance, index) => {
          const base =
            entry.finish === "facade" || entry.finish === "roof"
              ? instance.baseColor
              : WHITE_INSTANCE;
          const color = base.clone();
          if (district) {
            if (instance.district.district === district.district)
              color.lerp(ACTIVE_INSTANCE, 0.2);
            else color.multiply(DIMMED_INSTANCE);
          }
          entry.mesh.setColorAt(index, color);
        });
        if (entry.mesh.instanceColor)
          entry.mesh.instanceColor.needsUpdate = true;
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
      if (moveCamera) {
        animateCamera(initialCamera, initialTarget, 650, () => {
          updateNearDetails(null);
          render();
        });
      } else {
        updateNearDetails(null);
      }
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
      updateNearDetails(district);
      const nextTarget = new THREE.Vector3(district.x, 4, district.z);
      const offset = camera.position.clone().sub(controls.target).normalize();
      const distance = mobileDevice ? 88 : 58;
      animateCamera(
        nextTarget.clone().add(offset.multiplyScalar(distance)),
        nextTarget,
        650,
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
      const intersections = raycaster.intersectObjects(pickableObjects, false);
      let district: DistrictData | null = null;
      for (const intersection of intersections) {
        const instanceDistricts = intersection.object.userData
          .instanceDistricts as DistrictData[] | undefined;
        if (instanceDistricts && intersection.instanceId !== undefined) {
          district = instanceDistricts[intersection.instanceId] ?? null;
          break;
        }
        const shapeDistrict = intersection.object.userData.districtData as
          DistrictData | undefined;
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
        Math.min(window.devicePixelRatio, mobileDevice ? 1 : 1.35),
      );
      renderer.setSize(nextWidth, nextHeight, false);
      render();
    });
    resizeObserver.observe(container);

    controls.update();
    updateNearDetails(selectedDistrictRef.current);
    setHighlight(selectedDistrictRef.current);
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
      filterEntriesRef.current = [];
      nearEntriesRef.current = [];
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
      });
      facadeTextures.albedo.dispose();
      facadeTextures.surface.dispose();
      facadeTextures.emissive.dispose();
      waterTexture.dispose();
      shadowTexture.dispose();
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
    filterEntriesRef.current.forEach((entry) => {
      entry.mesh.visible =
        activeTierFilter === "all" || activeTierFilter === entry.tier;
    });
    nearEntriesRef.current.forEach((entry) => {
      entry.mesh.visible =
        entry.mesh.count > 0 &&
        (activeTierFilter === "all" || activeTierFilter === entry.tier);
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
        Harita, İzmir’in 30 ilçesindeki 899.436 bina kaydını küçük temsili kent
        kümeleriyle gösterir. Mimari tipler gerçek bina ayak izleri değildir.
        İlçe seçmek ve kat filtresi uygulamak için kontrolleri
        kullanabilirsiniz.
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
          <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center px-4 pb-[7.9rem]">
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

      <div className="absolute right-6 top-[5.5rem] z-10 hidden w-40 rounded-xl border border-white/10 bg-black/45 p-3 text-[11px] text-white/80 backdrop-blur-md lg:block">
        <div className="mb-2 text-white/55">Kat aralıkları</div>
        <div className="space-y-1.5">
          {TIER_ORDER.map((tier) => (
            <div key={tier} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: TIER_DARK_HEX[tier],
                  }}
                />
                {TIER_META[tier].label}
              </span>
              {tier === "tier_20_plus" && (
                <span className="font-mono tabular-nums text-white/55">
                  176
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

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
