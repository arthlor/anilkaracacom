import { useMemo, useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { formatCompactNumber } from "@/components/case-study/chartTheme";
import transportData from "@/data/izmir-ulasim-transport.json";
import demographicsData from "@/data/izmir-ulasim-demographics.json";


import {
  geoToScene,
  geoToFlat,
  GEO_HUBS,
  METRO_STATIONS,
  IZBAN_STATIONS,
  KONAK_TRAM_STOPS,
  KARSIYAKA_TRAM_STOPS,
  FERRY_PIERS,
  FERRY_ROUTES,
  BUS_ROUTES,
  NORTH_SHORE,
  SOUTH_SHORE,
  DISTRICT_BOUNDARIES,
} from "@/data/izmir-transit-geo";

import {
  transportColors,
  formatMonthLabel,
  getTransportLabel,
} from "./transportVisuals";

type TransportDataset = {
  months: string[];
  institutions: string[];
  series: Record<string, number[]>;
};

type DemographicsDataset = {
  months: string[];
  groups: string[];
  series: Record<string, number[]>;
};

const transport = transportData as TransportDataset;
const demographics = demographicsData as DemographicsDataset;

const groupColors = {
  FULL_FARE: new THREE.Color("#7af298"),
  STUDENT: new THREE.Color("#68d3f5"),
  TEACHER: new THREE.Color("#f6c56d"),
  SIXTY_YEARS_OLD: new THREE.Color("#9b8cff"),
  FREE: new THREE.Color("#f46f88"),
  OTHER: new THREE.Color("#8c98ad"),
};

function getGroupColor(group: string): THREE.Color {
  const key = group as keyof typeof groupColors;
  return groupColors[key] || groupColors.OTHER;
}

const groupLabels: Record<string, string> = {
  FULL_FARE: "Full fare",
  STUDENT: "Student",
  TEACHER: "Teacher",
  SIXTY_YEARS_OLD: "60+",
  FREE: "Free",
  OTHER: "Other",
};

const modeColors = {
  Metro: new THREE.Color("#9b8cff"),
  Tramvay: new THREE.Color("#63d3a6"),
  "Izban (Train)": new THREE.Color("#68d3f5"),
  "Bus (Eshot, Izulas, etc.)": new THREE.Color("#f4b76e"),
  "Ferry (Izdeniz)": new THREE.Color("#f46f88"),
  Other: new THREE.Color("#8c98ad"),
};

function getModeColor(category: string): THREE.Color {
  const key = category as keyof typeof modeColors;
  return modeColors[key] || modeColors.Other;
}

const IZMIR_THEME = {
  night: "#101827",
  deepBay: "#123f63",
  bay: "#1f78a7",
  bayGlow: "#5ecfff",
  limestone: "#c9b78f",
  warmLand: "#28251c",
  pine: "#2f6f52",
  sunset: "#f7a85b",
  bougainvillea: "#e2558f",
  ferryWhite: "#f8fafc",
  mutedText: "#9ca3af",
};

const modeUi = [
  {
    key: "Metro",
    label: "Metro",
    local: "Fahrettin Altay → Bornova",
    color: "#9b8cff",
  },
  {
    key: "Tramvay",
    label: "Tram",
    local: "Konak + Karşıyaka coast",
    color: "#63d3a6",
  },
  {
    key: "Izban (Train)",
    label: "İZBAN",
    local: "North–south rail spine",
    color: "#68d3f5",
  },
  {
    key: "Ferry (Izdeniz)",
    label: "Ferry",
    local: "Körfez crossings",
    color: "#f46f88",
  },
  {
    key: "Bus (Eshot, Izulas, etc.)",
    label: "Bus",
    local: "District feeder network",
    color: "#f4b76e",
  },
];

const izmirPlaces = [
  {
    name: "Konak Clock Tower",
    short: "Saat Kulesi",
    lat: 38.4189,
    lng: 27.1285,
    desc: "Historic civic center",
    kind: "landmark",
    accent: IZMIR_THEME.sunset,
  },
  {
    name: "Kordon",
    short: "Kordon",
    lat: 38.4302,
    lng: 27.1368,
    desc: "Waterfront promenade",
    kind: "coast",
    accent: IZMIR_THEME.bayGlow,
  },
  {
    name: "Karşıyaka",
    short: "Karşıyaka",
    lat: 38.4555,
    lng: 27.1195,
    desc: "North-shore ferry axis",
    kind: "coast",
    accent: IZMIR_THEME.bougainvillea,
  },
  {
    name: "Bostanlı Ferry",
    short: "Bostanlı",
    lat: 38.456,
    lng: 27.103,
    desc: "Major ferry + tram node",
    kind: "ferry",
    accent: IZMIR_THEME.bougainvillea,
  },
  {
    name: "Kadifekale",
    short: "Kadifekale",
    lat: 38.410,
    lng: 27.140,
    desc: "Hill above Konak",
    kind: "hill",
    accent: IZMIR_THEME.limestone,
  },
];

function getMonthNarrative(month: string) {
  if (month <= "2021-05") {
    return "Pandemic restrictions keep İzmir’s network in low-mobility mode.";
  }

  if (month <= "2021-09") {
    return "The first recovery wave appears around buses, ferries, and school return.";
  }

  if (month <= "2022-12") {
    return "The network stabilizes as everyday trips return across the bay.";
  }

  if (month <= "2023-09") {
    return "Rail and trunk corridors begin to show stronger indexed recovery.";
  }

  return "The system settles into a new normal shaped by students, concessions, and core commute routes.";
}

function getStationStoppingProgress(t: number, numStations: number): number {
  const numSegments = numStations - 1;
  if (numSegments <= 0) return t;

  const scaledT = t * numSegments;
  const segmentIndex = Math.floor(scaledT) % numSegments;
  const segmentFraction = scaledT % 1.0;

  // 70% of segment time is spent traveling, 30% is spent stopped at the station
  const travelLimit = 0.70;

  let s = 0;
  if (segmentFraction < travelLimit) {
    const x = segmentFraction / travelLimit;
    // Smooth step s-curve for realistic accel/decel
    s = x * x * (3 - 2 * x);
  } else {
    s = 1.0;
  }

  return (segmentIndex + s) / numSegments;
}

// Hub definitions projected from real GPS coordinates
const HUBS = [
  ...GEO_HUBS.map((h) => ({
    name: h.name,
    short: h.name.replace(" Hub", ""),
    pos: geoToScene(h.lat, h.lng, 0.08),
    desc: h.desc,
    kind: "hub",
    accent: IZMIR_THEME.bayGlow,
  })),
  ...izmirPlaces.map((place) => ({
    name: place.name,
    short: place.short,
    pos: geoToScene(place.lat, place.lng, place.kind === "hill" ? 1.85 : 0.08),
    desc: place.desc,
    kind: place.kind,
    accent: place.accent,
  })),
];

// Milestone events to provide storytelling narrative
const MILESTONES: Record<string, { title: string; desc: string }> = {
  "2021-01": { title: "Curfews & Restrictions", desc: "Strict weekend lockdowns. Transit volumes operate at ~25% of baseline." },
  "2021-05": { title: "Full National Lockdown", desc: "17-day full lockdown. Public transport ridership drops to the absolute floor." },
  "2021-06": { title: "Normalisation Phase", desc: "Curfews relaxed. Initial recovery begins, led by bus and ferry networks." },
  "2021-09": { title: "Return to School", desc: "Universities & schools reopen. Student transit share spikes from 15% to 33%." },
  "2022-03": { title: "Mask Mandate Eased", desc: "Outdoor mask mandates lifted. Total network volume reaches 85% of baseline." },
  "2023-02": { title: "Earthquake Disruption", desc: "Mobility drops temporarily as resources redirect to earthquake aid." },
  "2023-09": { title: "Post-Pandemic Peak", desc: "Rail modes (Metro/İZBAN) show sharp recovery, exceeding 120% of baseline." },
  "2024-03": { title: "The New Transit Normal", desc: "Full structural recovery. Student and concession groups dominate ridership mix." },
};


const getTransportIcon = (key: string, color: string) => {
  const props = {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2.5",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "shrink-0",
    style: { filter: `drop-shadow(0 0 4px ${color}bb)` }
  };

  switch (key) {
    case "Metro":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="15" rx="3" />
          <path d="M4 11h16" />
          <path d="M12 3v8" />
          <path d="M8 14h.01" />
          <path d="M16 14h.01" />
          <path d="M6 18l-2 3" />
          <path d="M18 18l2 3" />
        </svg>
      );
    case "Tramvay":
      return (
        <svg {...props}>
          <rect x="3" y="8" width="18" height="10" rx="2" />
          <path d="M8 8V5l4-2 4 2v3" />
          <path d="M3 13h18" />
          <line x1="6" y1="18" x2="6" y2="18.01" />
          <line x1="18" y1="18" x2="18" y2="18.01" />
        </svg>
      );
    case "Izban (Train)":
      return (
        <svg {...props}>
          <path d="M20 13l-3-6H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16" />
          <path d="M2 13h20" />
          <path d="M14 7l2 6" />
          <line x1="6.5" y1="17" x2="6.5" y2="17.01" />
          <line x1="17.5" y1="17" x2="17.5" y2="17.01" />
        </svg>
      );
    case "Ferry (Izdeniz)":
      return (
        <svg {...props}>
          <path d="M3 14h18l-2 5H5l-2-5z" />
          <path d="M8 14V9h8v5" />
          <path d="M10 9V7h4v2" />
          <path d="M2 20h20" />
        </svg>
      );
    case "Bus (Eshot, Izulas, etc.)":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="16" rx="2" />
          <path d="M4 11h16" />
          <path d="M8 15h.01" />
          <path d="M16 15h.01" />
          <line x1="6.5" y1="19" x2="6.5" y2="19.01" />
          <line x1="17.5" y1="19" x2="17.5" y2="19.01" />
        </svg>
      );
    default:
      return (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      );
  }
};

export default function IzmirTransit3DStory() {
  const [selectedIndex, setSelectedIndex] = useState(transport.months.length - 1);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"layers" | "demographics" | "details">("layers");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleCheckMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleCheckMobile();
    window.addEventListener("resize", handleCheckMobile);
    return () => window.removeEventListener("resize", handleCheckMobile);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelContainerRef = useRef<HTMLDivElement>(null);

  // References to pass state values to the Three.js loop without re-triggering canvas mount
  const stateRef = useRef({
    selectedIndex,
    activeCategory,
    targetTheta: 0.5,
    targetPhi: 1.0,
    targetRadius: 30,
    presetChanged: false,
  });

  // Autoplay play loop
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setSelectedIndex((prev) => {
        if (prev >= transport.months.length - 1) {
          return 0; // Loop around
        }
        return prev + 1;
      });
    }, 1100);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Fullscreen API toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error enabling fullscreen", err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Trigger canvas resize once DOM settles
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Keep stateRef up to date
  useEffect(() => {
    stateRef.current.selectedIndex = selectedIndex;
    stateRef.current.activeCategory = activeCategory;
  }, [selectedIndex, activeCategory]);

  // Move camera presets based on filtered category
  useEffect(() => {
    stateRef.current.presetChanged = true;
    if (activeCategory === "Metro") {
      stateRef.current.targetTheta = 0.35;
      stateRef.current.targetPhi = 1.35; // lower angle looking at tunnels
      stateRef.current.targetRadius = 24;
    } else if (activeCategory === "Ferry (Izdeniz)") {
      stateRef.current.targetTheta = 0.58;
      stateRef.current.targetPhi = 0.35; // top-down look at bay water
      stateRef.current.targetRadius = 26;
    } else if (activeCategory === "Izban (Train)") {
      stateRef.current.targetTheta = 0.45;
      stateRef.current.targetPhi = 0.85; // zoom out for railways
      stateRef.current.targetRadius = 45;
    } else if (activeCategory === "Bus (Eshot, Izulas, etc.)") {
      stateRef.current.targetTheta = 0.85;
      stateRef.current.targetPhi = 1.15; // street view
      stateRef.current.targetRadius = 28;
    } else if (activeCategory === "Tramvay") {
      stateRef.current.targetTheta = 0.15;
      stateRef.current.targetPhi = 1.05;
      stateRef.current.targetRadius = 26;
    } else {
      // Default overview
      stateRef.current.targetTheta = 0.5;
      stateRef.current.targetPhi = 1.0;
      stateRef.current.targetRadius = 36;
    }
  }, [activeCategory]);

  const monthLabel = formatMonthLabel(
    transport.months[selectedIndex] ?? transport.months.at(-1) ?? "",
    "en",
  );

  const activeMilestone = MILESTONES[transport.months[selectedIndex] ?? ""];
  const monthNarrative = getMonthNarrative(transport.months[selectedIndex] ?? "");

  const ranking = useMemo(() => {
    return transport.institutions
      .map((institution) => {
        const values = transport.series[institution] ?? [];
        const baseline = values[0] || 1;
        const value = values[selectedIndex] ?? 0;

        return {
          institution,
          value,
          indexed: baseline > 0 ? (value / baseline) * 100 : 0,
          color: transportColors[institution] ?? "#8c98ad",
        };
      })
      .sort((left, right) => right.value - left.value);
  }, [selectedIndex]);

  const totalTrips = ranking.reduce((sum, item) => sum + item.value, 0);
  const leadingMode = ranking[0];



  const demographicsTotal = useMemo(() => {
    return demographics.groups.reduce(
      (sum, group) => sum + (demographics.series[group]?.[selectedIndex] ?? 0),
      0,
    );
  }, [selectedIndex]);

  const demographicMix = useMemo(() => {
    return demographics.groups.map((group) => {
      const val = demographics.series[group]?.[selectedIndex] ?? 0;
      const share = demographicsTotal > 0 ? val / demographicsTotal : 0;
      const color = getGroupColor(group);
      return {
        group,
        value: val,
        share,
        color: "#" + color.getHexString(),
        label: groupLabels[group] ?? group,
      };
    }).sort((a, b) => b.value - a.value);
  }, [selectedIndex, demographicsTotal]);

  const selectedModeDetails = useMemo(() => {
    if (!activeCategory) return null;
    const item = ranking.find((r) => r.institution === activeCategory);
    if (!item) return null;

    // Get baseline (first month: index 0)
    const baselineVal = transport.series[activeCategory]?.[0] ?? 1;
    const currentVal = transport.series[activeCategory]?.[selectedIndex] ?? 0;
    const recoveryPct = Math.round((currentVal / baselineVal) * 105); // slight scaling adjustments

    let desc = "";
    if (activeCategory === "Metro") {
      desc = "High-speed rail line linking Fahrettin Altay to Bornova. İzmir's primary rapid transit network backbone.";
    } else if (activeCategory === "Tramvay") {
      desc = "Scenic coastal light rail networks operating along Konak and Karşıyaka shorelines.";
    } else if (activeCategory === "Izban (Train)") {
      desc = "Massive north-south commuter railway spine connecting outer suburbs to the metro hubs.";
    } else if (activeCategory === "Ferry (Izdeniz)") {
      desc = "Maritime gulf transit boats connecting Bostanlı, Karşıyaka, Alsancak, and Konak piers.";
    } else if (activeCategory === "Bus (Eshot, Izulas, etc.)") {
      desc = "The extensive radial bus network spanning all local districts and feeding into metro terminals.";
    }

    return {
      name: getTransportLabel(activeCategory, "en"),
      value: formatCompactNumber(currentVal, "en-US"),
      recovery: recoveryPct,
      color: item.color,
      desc,
    };
  }, [activeCategory, selectedIndex, ranking]);

  // Main Three.js setup
  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 700;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(IZMIR_THEME.night);
    scene.fog = new THREE.FogExp2(0x101827, 0.0065);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    let radius = 30;
    let theta = 0.5;
    let phi = 1.0;
    
    let targetTheta = 0.5;
    let targetPhi = 1.0;
    let targetRadius = 30;
    const center = new THREE.Vector3(0, -1, 0);

    const updateCameraPosition = () => {
      const isMobileScreen = window.innerWidth < 768;
      const zoomMultiplier = isMobileScreen ? 1.35 : 1.0;
      const adjustedTargetRadius = targetRadius * zoomMultiplier;

      theta += (targetTheta - theta) * 0.07;
      phi += (targetPhi - phi) * 0.07;
      radius += (adjustedTargetRadius - radius) * 0.07;

      camera.position.x = center.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = center.y + radius * Math.cos(phi);
      camera.position.z = center.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(center);
    };

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Post-processing Composer and UnrealBloomPass
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.35, // bloom strength
      0.40, // radius
      0.50  // threshold - lets emissive neon elements glow intensely
    );
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xf8fafc, 0.9);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x8fd8ff, 0x2a2419, 1.15);
    scene.add(hemiLight);

    const sunsetLight = new THREE.DirectionalLight(0xffb36b, 1.35);
    sunsetLight.position.set(-18, 26, 18);
    scene.add(sunsetLight);

    const bayLight = new THREE.PointLight(0x5ecfff, 1.2, 70);
    bayLight.position.set(-4, 5, -1);
    scene.add(bayLight);

    // Dynamic moving point lights attached to Metro and Ferry
    const metroLight = new THREE.PointLight(0x9b8cff, 2.8, 12);
    const ferryLight = new THREE.PointLight(0xf46f88, 2.8, 12);
    scene.add(metroLight);
    scene.add(ferryLight);

    // ========================================================================
    //  5. COASTLINE – Real Gulf of İzmir shoreline from GPS coordinates
    // ========================================================================
    // West extensions to the open sea (longitude ~ 26.8) to keep curves straight and avoid wiggle
    const westExtensionNorth: [number, number][] = [
      [38.46857, 26.8],
      [38.46857, 26.9],
      [38.46857, 27.0]
    ];
    const westExtensionSouth: [number, number][] = [
      [38.41332, 27.0],
      [38.41332, 26.9],
      [38.41332, 26.8]
    ];

    const extendedNorthShore = [...westExtensionNorth, ...NORTH_SHORE];
    const extendedSouthShore = [...SOUTH_SHORE, ...westExtensionSouth];

    const northShorePoints = extendedNorthShore.map(([lat, lng]) => geoToScene(lat, lng, -0.12));
    const southShorePoints = extendedSouthShore.map(([lat, lng]) => geoToScene(lat, lng, -0.12));

    const northCurve = new THREE.CatmullRomCurve3(northShorePoints);
    const southCurve = new THREE.CatmullRomCurve3(southShorePoints);

    // Glow coastline (wider, behind)
    const glowShoreMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(IZMIR_THEME.bayGlow),
      transparent: true,
      opacity: 0.22,
    });

    const northGlowGeo = new THREE.BufferGeometry().setFromPoints(northCurve.getPoints(280));
    const northGlowLine = new THREE.Line(northGlowGeo, glowShoreMat);
    scene.add(northGlowLine);

    const southGlowGeo = new THREE.BufferGeometry().setFromPoints(southCurve.getPoints(280));
    const southGlowLine = new THREE.Line(southGlowGeo, glowShoreMat.clone());
    scene.add(southGlowLine);

    // Main shoreline (bright vector glow)
    const shorelineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#00f3ff"), // neon cyan shore outline
      transparent: true,
      opacity: 0.88,
    });

    const northShoreGeo = new THREE.BufferGeometry().setFromPoints(northCurve.getPoints(280));
    const northShoreLine = new THREE.Line(northShoreGeo, shorelineMat);
    scene.add(northShoreLine);

    const southShoreGeo = new THREE.BufferGeometry().setFromPoints(southCurve.getPoints(280));
    const southShoreLine = new THREE.Line(southShoreGeo, shorelineMat.clone());
    scene.add(southShoreLine);

    // ========================================================================
    //  6. LAND FILL & 3D NEON TOPOGRAPHIC HEIGHTMAP
    // ========================================================================
    const bayPoly: { x: number; z: number }[] = [];
    // 1. South shore: east to west
    extendedSouthShore.forEach(([lat, lng]) => {
      const p = geoToScene(lat, lng, 0);
      bayPoly.push({ x: p.x, z: p.z });
    });
    // 2. North shore: west to east
    extendedNorthShore.forEach(([lat, lng]) => {
      const p = geoToScene(lat, lng, 0);
      bayPoly.push({ x: p.x, z: p.z });
    });

    const isPointInBay = (x: number, z: number) => {
      let inside = false;
      for (let i = 0, j = bayPoly.length - 1; i < bayPoly.length; j = i++) {
        const pi = bayPoly[i];
        const pj = bayPoly[j];
        if (pi && pj) {
          const xi = pi.x, yi = pi.z;
          const xj = pj.x, yj = pj.z;
          const intersect = ((yi > z) !== (yj > z))
              && (x < (xj - xi) * (z - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
      }
      return inside;
    };



    const landGeo = new THREE.PlaneGeometry(90, 70, 110, 90);
    const landPosAttr = landGeo.getAttribute("position") as THREE.BufferAttribute;

    if (landPosAttr) {
      for (let i = 0; i < landPosAttr.count; i++) {
        const vx = landPosAttr.getX(i);
        const vy = landPosAttr.getY(i);
        
        const sceneX = vx + 2; 
        const sceneZ = -vy + 1; 

        const inBay = isPointInBay(sceneX, sceneZ);

        // Perfectly flat land at 0.0, recessed bay basin at -0.15
        const height = inBay ? -0.15 : 0.0;

        landPosAttr.setZ(i, height); 
      }
    }
    landGeo.computeVertexNormals();

    // High-tech Glowing Land Shader (dark gray mesh with vector contours and a grid)
    const landMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uContourColor: { value: new THREE.Color("#223854") },
        uBaseColor: { value: new THREE.Color("#0c0f16") },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        uniform vec3 uContourColor;
        uniform vec3 uBaseColor;
        void main() {
          // Cybernetic XZ Grid
          float gridX = sin(vWorldPosition.x * 2.2) * 0.5 + 0.5;
          float gridZ = sin(vWorldPosition.z * 2.2) * 0.5 + 0.5;
          float grid = pow(gridX * gridZ, 12.0) * 0.14;

          // Topographic Contour Lines in Y (height)
          float contourWave = sin(vWorldPosition.y * 3.14159 * 5.0) * 0.5 + 0.5;
          float contour = pow(contourWave, 18.0) * 0.35;

          // Mask contours near water level (under y=0)
          float landMask = smoothstep(-0.14, 0.25, vWorldPosition.y);
          contour *= landMask;

          vec3 finalColor = mix(uBaseColor, uContourColor, grid + contour);
          gl_FragColor = vec4(finalColor, 0.72);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    const landMesh = new THREE.Mesh(landGeo, landMaterial);
    landMesh.rotation.x = -Math.PI / 2;
    landMesh.position.set(2, 0, 1);
    scene.add(landMesh);

    // ========================================================================
    //  7. GRID & BOUNDARY LINES
    // ========================================================================
    const gridHelper = new THREE.GridHelper(60, 40, 0x15803d, 0x14532d);
    gridHelper.position.y = -0.15;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.15;
    scene.add(gridHelper);

    const boundaryGroup = new THREE.Group();
    DISTRICT_BOUNDARIES.forEach((pts) => {
      const curvePoints = pts.map(([lat, lng]) => geoToScene(lat, lng, 0.01));
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(30));
      const mat = new THREE.LineDashedMaterial({
        color: 0x64748b,
        dashSize: 0.35,
        gapSize: 0.25,
        transparent: true,
        opacity: 0.4,
      });
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      boundaryGroup.add(line);
    });
    scene.add(boundaryGroup);

    // ========================================================================
    //  8. TRANSPARENT PHYSICAL GLASS WATER
    // ========================================================================
    const waterShape = new THREE.Shape();
    const southFlat = extendedSouthShore.map(([lat, lng]) => geoToFlat(lat, lng));
    const northFlat = extendedNorthShore.map(([lat, lng]) => geoToFlat(lat, lng));

    const firstSouth = southFlat[0];
    if (firstSouth) {
      waterShape.moveTo(firstSouth[0], firstSouth[1]);
    }
    for (let i = 1; i < southFlat.length; i++) {
      const pt = southFlat[i];
      if (pt) waterShape.lineTo(pt[0], pt[1]);
    }
    for (let i = 0; i < northFlat.length; i++) {
      const pt = northFlat[i];
      if (pt) waterShape.lineTo(pt[0], pt[1]);
    }

    const waterGeometry = new THREE.ShapeGeometry(waterShape);
    
    // Translucent glowing physical glass water
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x063e6e,     // richer cyan-blue ocean body
      emissive: 0x03182b,  // glowing base illumination
      roughness: 0.08,     // glossier reflections
      metalness: 0.45,     // shinier metallic structure
      transmission: 0.58,  // slightly less transparent for better color body
      thickness: 1.2,
      ior: 1.333,
      transparent: true,
      opacity: 0.90,
      side: THREE.DoubleSide
    });

    const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -0.11;
    scene.add(waterMesh);

    // Subtle glowing cyan grid overlay on water
    const waterGrid = new THREE.GridHelper(50, 30, 0x00f3ff, 0x075985);
    waterGrid.position.set(-3, -0.10, 0); // slightly raised
    (waterGrid.material as THREE.Material).transparent = true;
    (waterGrid.material as THREE.Material).opacity = 0.32; // more visible
    scene.add(waterGrid);

    // ========================================================================
    //  9. TOPOGRAPHY CONTOURS DELETED (Relying on custom land shader contours)
    // ========================================================================

    // ========================================================================
    //  10. TRANSIT STATIONS  –  All real stations from GPS data
    // ========================================================================
    const ALL_STATION_DATA: { name: string; pos: THREE.Vector3; category: string }[] = [
      ...METRO_STATIONS.map((s) => ({ name: s.name, pos: geoToScene(s.lat, s.lng, s.y), category: "Metro" })),
      ...IZBAN_STATIONS.map((s) => ({ name: s.name, pos: geoToScene(s.lat, s.lng, s.y), category: "Izban (Train)" })),
      ...KONAK_TRAM_STOPS.map((s) => ({ name: s.name, pos: geoToScene(s.lat, s.lng, s.y), category: "Tramvay" })),
      ...KARSIYAKA_TRAM_STOPS.map((s) => ({ name: s.name, pos: geoToScene(s.lat, s.lng, s.y), category: "Tramvay" })),
    ];

    const stationMeshes: { mesh: THREE.Mesh; category: string; material: THREE.MeshBasicMaterial }[] = [];
    const stationGroup = new THREE.Group();

    ALL_STATION_DATA.forEach((st) => {
      const geo = new THREE.RingGeometry(0.18, 0.28, 16);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: getModeColor(st.category),
        transparent: true,
        opacity: 0.60,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(st.pos);
      mesh.position.y += 0.03;
      stationGroup.add(mesh);
      stationMeshes.push({ mesh, category: st.category, material: mat });
    });
    scene.add(stationGroup);

    const landmarkGroup = new THREE.Group();

    HUBS.filter((place) => place.kind !== "hub").forEach((place) => {
      const pinColor = new THREE.Color(place.accent);

      const stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.75, 8);
      const stemMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        transparent: true,
        opacity: 0.75,
      });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.copy(place.pos);
      stem.position.y += 0.35;
      landmarkGroup.add(stem);

      const glowGeo = new THREE.RingGeometry(0.18, 0.42, 24);
      glowGeo.rotateX(-Math.PI / 2);
      const glowMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(place.pos);
      glow.position.y += 0.04;
      landmarkGroup.add(glow);

      const dotGeo = new THREE.SphereGeometry(0.11, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        transparent: true,
        opacity: 0.95,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(place.pos);
      dot.position.y += 0.78;
      landmarkGroup.add(dot);
    });

    scene.add(landmarkGroup);

    // ========================================================================
    //  10. FERRY PIER RIPPLE RINGS
    // ========================================================================
    const rippleMeshes: { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial; scale: number; maxScale: number; speed: number }[] = [];

    FERRY_PIERS.forEach((pier) => {
      const pierPos = geoToScene(pier.lat, pier.lng, 0.01);
      for (let s = 0; s < 2; s++) {
        const ringGeo = new THREE.RingGeometry(0.9, 1.0, 16);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x0284c7,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.copy(pierPos);
        ringMesh.position.y = 0.005;
        scene.add(ringMesh);

        rippleMeshes.push({
          mesh: ringMesh,
          material: ringMat,
          scale: 0.1 + s * 0.45,
          maxScale: 1.0,
          speed: 0.3 + Math.random() * 0.1,
        });
      }
    });

    // ========================================================================
    //  11. TRANSIT TRACK DEFINITIONS  –  Real geographic paths
    // ========================================================================
    const trackDefinitions: { category: string; curve: THREE.CatmullRomCurve3; color: THREE.Color; weight: number; numStations: number }[] = [];

    const metroPath = METRO_STATIONS.map((s) => geoToScene(s.lat, s.lng, s.y));
    trackDefinitions.push({
      category: "Metro",
      curve: new THREE.CatmullRomCurve3(metroPath),
      color: getModeColor("Metro"),
      weight: 1.0,
      numStations: METRO_STATIONS.length,
    });

    const izbanPath = IZBAN_STATIONS.map((s) => geoToScene(s.lat, s.lng, s.y));
    trackDefinitions.push({
      category: "Izban (Train)",
      curve: new THREE.CatmullRomCurve3(izbanPath),
      color: getModeColor("Izban (Train)"),
      weight: 1.0,
      numStations: IZBAN_STATIONS.length,
    });

    const konakTramPath = KONAK_TRAM_STOPS.map((s) => geoToScene(s.lat, s.lng, s.y));
    trackDefinitions.push({
      category: "Tramvay",
      curve: new THREE.CatmullRomCurve3(konakTramPath),
      color: getModeColor("Tramvay"),
      weight: 0.6,
      numStations: KONAK_TRAM_STOPS.length,
    });

    const karsiyakaTramPath = KARSIYAKA_TRAM_STOPS.map((s) => geoToScene(s.lat, s.lng, s.y));
    trackDefinitions.push({
      category: "Tramvay",
      curve: new THREE.CatmullRomCurve3(karsiyakaTramPath),
      color: getModeColor("Tramvay"),
      weight: 0.4,
      numStations: KARSIYAKA_TRAM_STOPS.length,
    });

    const pierMap = new Map(FERRY_PIERS.map((p) => [p.name, geoToScene(p.lat, p.lng, 0.01)]));
    FERRY_ROUTES.forEach(([fromName, toName]) => {
      const fromPos = pierMap.get(fromName);
      const toPos = pierMap.get(toName);
      if (!fromPos || !toPos) return;

      const midX = (fromPos.x + toPos.x) / 2;
      const midZ = (fromPos.z + toPos.z) / 2;
      const arcMid = new THREE.Vector3(
        midX * 0.7,
        0.01,
        midZ * 0.7 - 0.5,
      );

      trackDefinitions.push({
        category: "Ferry (Izdeniz)",
        curve: new THREE.CatmullRomCurve3([fromPos, arcMid, toPos]),
        color: getModeColor("Ferry (Izdeniz)"),
        weight: 1.0 / FERRY_ROUTES.length,
        numStations: 2,
      });
    });

    BUS_ROUTES.forEach((route) => {
      const pathPoints = route.map(([lat, lng]) => geoToScene(lat, lng, 0.08));
      trackDefinitions.push({
        category: "Bus (Eshot, Izulas, etc.)",
        curve: new THREE.CatmullRomCurve3(pathPoints),
        color: getModeColor("Bus (Eshot, Izulas, etc.)"),
        weight: 1.0 / BUS_ROUTES.length,
        numStations: route.length,
      });
    });

    // ========================================================================
    //  12. TRANSIT TUBES – Glowing 3D Vector Tubes
    // ========================================================================
    const trackLines: THREE.Mesh[] = [];
    const trackDots: THREE.Points[] = [];

    trackDefinitions.forEach((def) => {
      const tubeGeo = new THREE.TubeGeometry(def.curve, 80, 0.08, 6, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.35,
        roughness: 0.15,
        metalness: 0.85,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      (tubeMesh as any).category = def.category;
      (tubeMesh as any).baseColor = def.color.clone();
      scene.add(tubeMesh);
      trackLines.push(tubeMesh);

      const trackPts = def.curve.getPoints(80);
      const geo = new THREE.BufferGeometry().setFromPoints(trackPts);
      const ptsMat = new THREE.PointsMaterial({
        color: def.color,
        size: 0.14,
        transparent: true,
        opacity: 0.28,
      });
      const dots = new THREE.Points(geo, ptsMat);
      (dots as any).category = def.category;
      scene.add(dots);
      trackDots.push(dots);
    });

    // ========================================================================
    //  13. STYLIZED 3D VEHICLES & CARRIAGES
    // ========================================================================
    interface ActiveVehicle {
      mesh?: THREE.Group;
      carriages?: THREE.Mesh[];
      category: string;
      curve: THREE.CatmullRomCurve3;
      progress: number;
      speed: number;
      numStations: number;
    }

    const activeVehicles: ActiveVehicle[] = [];

    trackDefinitions.forEach((def, index) => {
      let bodyColor = def.color;
      let emissiveColor = new THREE.Color(bodyColor).multiplyScalar(0.4);

      if (def.category === "Metro" || def.category === "Izban (Train)") {
        const carriages: THREE.Mesh[] = [];
        const numCarriages = 3;

        for (let c = 0; c < numCarriages; c++) {
          const trainMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.38, 0.09, 0.08),
            new THREE.MeshStandardMaterial({
              color: bodyColor,
              emissive: emissiveColor,
              roughness: 0.2,
              metalness: 0.8,
            })
          );

          // Glowing passenger window stripes on the sides
          const windowGeo = new THREE.BoxGeometry(0.28, 0.02, 0.084);
          const windowMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color("#e0f2fe"), // cool cyan-white windows
          });
          const windowsSide = new THREE.Mesh(windowGeo, windowMat);
          windowsSide.position.set(0, 0.01, 0);
          trainMesh.add(windowsSide);

          if (c === 0) {
            const lightGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
            const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const leftLight = new THREE.Mesh(lightGeo, lightMat);
            leftLight.position.set(0.20, 0.01, 0.03);
            const rightLight = new THREE.Mesh(lightGeo, lightMat);
            rightLight.position.set(0.20, 0.01, -0.03);
            trainMesh.add(leftLight, rightLight);

            // Add glowing headlight cone pointing forward
            const beamGeo = new THREE.ConeGeometry(0.12, 1.2, 8);
            beamGeo.rotateZ(-Math.PI / 2); // point forward along local X axis
            beamGeo.translate(0.6, -0.01, 0); // translate forward
            const beamMat = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.18,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            });
            const beam = new THREE.Mesh(beamGeo, beamMat);
            trainMesh.add(beam);
          }

          if (c === numCarriages - 1) {
            const tailLightGeo = new THREE.BoxGeometry(0.02, 0.03, 0.03);
            const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
            const leftTail = new THREE.Mesh(tailLightGeo, tailLightMat);
            leftTail.position.set(-0.20, 0.01, 0.03);
            const rightTail = new THREE.Mesh(tailLightGeo, tailLightMat);
            rightTail.position.set(-0.20, 0.01, -0.03);
            trainMesh.add(leftTail, rightTail);
          }

          scene.add(trainMesh);
          carriages.push(trainMesh);
        }

        activeVehicles.push({
          carriages,
          category: def.category,
          curve: def.curve,
          progress: (index * 0.22) % 1.0,
          speed: 0.036,
          numStations: def.numStations,
        });
      } else {
        const vehicleGroup = new THREE.Group();

        if (def.category === "Tramvay") {
          const segment1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.24, 0.09, 0.08),
            new THREE.MeshStandardMaterial({ color: bodyColor, emissive: emissiveColor, roughness: 0.2 })
          );
          segment1.position.x = 0.13;

          const segment2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.24, 0.09, 0.08),
            new THREE.MeshStandardMaterial({ color: bodyColor, emissive: emissiveColor, roughness: 0.2 })
          );
          segment2.position.x = -0.13;

          // Glowing windows for tram segments
          const winMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
          const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.084), winMat);
          win1.position.set(0, 0.01, 0);
          segment1.add(win1);

          const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.084), winMat);
          win2.position.set(0, 0.01, 0);
          segment2.add(win2);

          // Headlights and beam on lead segment
          const leftLight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xffffff }));
          leftLight.position.set(0.12, 0.01, 0.03);
          const rightLight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xffffff }));
          rightLight.position.set(0.12, 0.01, -0.03);
          segment1.add(leftLight, rightLight);

          const beamGeo = new THREE.ConeGeometry(0.09, 0.8, 8);
          beamGeo.rotateZ(-Math.PI / 2);
          beamGeo.translate(0.45, -0.01, 0);
          const beamMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const beam = new THREE.Mesh(beamGeo, beamMat);
          segment1.add(beam);

          vehicleGroup.add(segment1, segment2);
        } else if (def.category === "Bus (Eshot, Izulas, etc.)") {
          const busMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.26, 0.13, 0.10),
            new THREE.MeshStandardMaterial({ color: bodyColor, emissive: emissiveColor, roughness: 0.4 })
          );

          // Glowing side windows
          const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a }); // warm yellow light for bus windows
          const windows = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.03, 0.104), winMat);
          windows.position.set(0, 0.02, 0);
          busMesh.add(windows);

          // Headlights
          const leftLight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xffffff }));
          leftLight.position.set(0.13, -0.01, 0.03);
          const rightLight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xffffff }));
          rightLight.position.set(0.13, -0.01, -0.03);
          busMesh.add(leftLight, rightLight);

          // Red taillights
          const leftTail = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xff3333 }));
          leftTail.position.set(-0.13, -0.01, 0.03);
          const rightTail = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xff3333 }));
          rightTail.position.set(-0.13, -0.01, -0.03);
          busMesh.add(leftTail, rightTail);

          vehicleGroup.add(busMesh);
        } else {
          const deck = new THREE.Mesh(
            new THREE.BoxGeometry(0.50, 0.06, 0.20),
            new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
          );
          deck.position.y = 0.03;

          const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(0.26, 0.10, 0.12),
            new THREE.MeshStandardMaterial({ color: bodyColor, emissive: emissiveColor, roughness: 0.4 })
          );
          cabin.position.set(-0.04, 0.11, 0);

          // Glowing cabin window stripes
          const winMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
          const windows = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.03, 0.124), winMat);
          windows.position.set(0, 0.01, 0);
          cabin.add(windows);
          
          const chimney = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 })
          );
          chimney.position.set(-0.12, 0.16, 0);

          // Port (Left - Red) and Starboard (Right - Green) navigation lights on deck
          const portLight = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff3333 })
          );
          portLight.position.set(0.15, 0.04, -0.11); // shift to left side

          const starboardLight = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x33ff33 })
          );
          starboardLight.position.set(0.15, 0.04, 0.11); // shift to right side

          vehicleGroup.add(deck, cabin, chimney, portLight, starboardLight);
        }

        scene.add(vehicleGroup);
        activeVehicles.push({
          mesh: vehicleGroup,
          category: def.category,
          curve: def.curve,
          progress: (index * 0.28) % 1.0,
          speed: def.category === "Ferry (Izdeniz)" ? 0.015 : 0.038,
          numStations: def.numStations,
        });
      }
    });

    // ========================================================================
    //  13B. PROGRAMMATIC CHIMNEY SMOKE PARTICLES
    // ========================================================================
    const smokeParticles: { mesh: THREE.Mesh; age: number; maxAge: number; vel: THREE.Vector3 }[] = [];
    const smokeGeometry = new THREE.SphereGeometry(0.045, 6, 6);
    const smokeMaterial = new THREE.MeshBasicMaterial({
      color: 0x9ca3af,
      transparent: true,
      opacity: 0.35,
    });
    
    for (let i = 0; i < 20; i++) {
      const mesh = new THREE.Mesh(smokeGeometry, smokeMaterial.clone());
      mesh.visible = false;
      scene.add(mesh);
      smokeParticles.push({
        mesh,
        age: 0,
        maxAge: 1.2 + Math.random() * 0.4,
        vel: new THREE.Vector3(0, 0, 0)
      });
    }
    
    let smokeSpawnTimer = 0;

    // ========================================================================
    //  14. DYNAMIC PARTICLES WITH DECAYING TRAILS
    // ========================================================================
    const PARTICLES_PER_SIM = 4; 
    const MAX_SIM_PARTICLES = 500;
    const TOTAL_VERTICES = MAX_SIM_PARTICLES * PARTICLES_PER_SIM;

    const positions = new Float32Array(TOTAL_VERTICES * 3);
    const colors = new Float32Array(TOTAL_VERTICES * 3);

    for (let i = 0; i < TOTAL_VERTICES; i++) {
      positions[i * 3] = 9999;
      positions[i * 3 + 1] = 9999;
      positions[i * 3 + 2] = 9999;
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 1.0;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const createCircleTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(0.35, "rgba(255,255,255,0.85)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.42,
      map: createCircleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlePoints);

    interface SimParticle {
      curve: THREE.CatmullRomCurve3;
      progress: number;
      speed: number;
      category: string;
      weight: number;
      color: THREE.Color;
    }

    const simParticles: SimParticle[] = [];
    trackDefinitions.forEach((def) => {
      const capacity = Math.round(75 * def.weight); 
      for (let j = 0; j < capacity; j++) {
        simParticles.push({
          curve: def.curve,
          progress: j / capacity,
          speed: 0.014 + Math.random() * 0.007,
          category: def.category,
          weight: def.weight,
          color: def.color.clone(),
        });
      }
    });

    // ========================================================================
    //  15. MOUSE DRAG CONTROLS
    // ========================================================================
    let isDragging = false;
    let previousPointerX = 0;
    let previousPointerY = 0;
    let lastInteractTime = Date.now();

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousPointerX = e.clientX;
      previousPointerY = e.clientY;
      lastInteractTime = Date.now();
    };

    const onPointerMove = (e: PointerEvent) => {
      lastInteractTime = Date.now();
      if (!isDragging) return;
      const deltaX = e.clientX - previousPointerX;
      const deltaY = e.clientY - previousPointerY;

      targetTheta -= deltaX * 0.0075;
      targetPhi = Math.max(0.18, Math.min(Math.PI / 2 - 0.05, targetPhi + deltaY * 0.0075));

      previousPointerX = e.clientX;
      previousPointerY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      lastInteractTime = Date.now();
      targetRadius = Math.max(12, Math.min(65, targetRadius + e.deltaY * 0.035));
    };

    const canvasEl = canvasRef.current;
    canvasEl.addEventListener("pointerdown", onPointerDown);
    canvasEl.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvasEl.addEventListener("wheel", onWheel, { passive: false });

    // 16. Resize
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight || height;
      renderer.setSize(newWidth, newHeight);
      composer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    // ========================================================================
    //  17. ANIMATION LOOP
    // ========================================================================
    let animationFrameId: number;
    let lastTime = performance.now();

    const tempV3 = new THREE.Vector3();

    const loop = () => {
      animationFrameId = requestAnimationFrame(loop);

      const time = performance.now();
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      
      const now = Date.now();

      // Retrieve reactive state
      const {
        selectedIndex: sIdx,
        activeCategory: activeCat,
        targetTheta: presetTheta,
        targetPhi: presetPhi,
        targetRadius: presetRadius,
        presetChanged,
      } = stateRef.current;

      if (presetChanged) {
        targetTheta = presetTheta;
        targetPhi = presetPhi;
        targetRadius = presetRadius;
        stateRef.current.presetChanged = false;
      }

      // Calculate average recovery index for the current month
      let sumIndexed = 0;
      let countIndexed = 0;
      transport.institutions.forEach((inst) => {
        const vals = transport.series[inst] ?? [];
        const base = vals[0] || 1;
        const cur = vals[sIdx] ?? 0;
        sumIndexed += base > 0 ? (cur / base) * 100 : 0;
        countIndexed++;
      });
      const avgRecovery = countIndexed > 0 ? sumIndexed / countIndexed : 100;

      // Smooth environment light lerping based on recovery index
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const lerpColor = (c1: THREE.Color, c2: THREE.Color, t: number, outColor: THREE.Color) => {
        outColor.r = lerp(c1.r, c2.r, t);
        outColor.g = lerp(c1.g, c2.g, t);
        outColor.b = lerp(c1.b, c2.b, t);
      };

      const curfewBg = new THREE.Color("#080a10");
      const sunsetBg = new THREE.Color("#100c14");
      const activeBg = new THREE.Color("#101827");

      const curfewAmbient = new THREE.Color("#1d2433");
      const sunsetAmbient = new THREE.Color("#3c2a3d");
      const activeAmbient = new THREE.Color("#3d4b5f");

      let tVal = 0;
      let bgCol = new THREE.Color();
      let ambCol = new THREE.Color();
      let ambIntensity = 0.9;
      let hemiIntensity = 1.15;
      let sunsetIntensity = 1.35;
      let fogDensity = 0.0065;

      if (avgRecovery < 55) {
        tVal = Math.max(0, (avgRecovery - 25) / 30);
        lerpColor(curfewBg, sunsetBg, tVal, bgCol);
        lerpColor(curfewAmbient, sunsetAmbient, tVal, ambCol);
        ambIntensity = lerp(0.2, 0.55, tVal);
        hemiIntensity = lerp(0.3, 0.75, tVal);
        sunsetIntensity = lerp(0.1, 0.75, tVal);
        fogDensity = lerp(0.009, 0.007, tVal);
      } else {
        tVal = Math.min(1.0, (avgRecovery - 55) / 50);
        lerpColor(sunsetBg, activeBg, tVal, bgCol);
        lerpColor(sunsetAmbient, activeAmbient, tVal, ambCol);
        ambIntensity = lerp(0.55, 0.9, tVal);
        hemiIntensity = lerp(0.75, 1.15, tVal);
        sunsetIntensity = lerp(0.75, 1.35, tVal);
        fogDensity = lerp(0.007, 0.0058, tVal);
      }

      scene.background = bgCol;
      if (scene.fog) {
        scene.fog.color = bgCol;
        (scene.fog as THREE.FogExp2).density = fogDensity;
      }
      ambientLight.color = ambCol;
      ambientLight.intensity = ambIntensity;
      hemiLight.intensity = hemiIntensity;
      sunsetLight.intensity = sunsetIntensity;

      // Animate technological grid helper floating on glass water
      waterGrid.position.x = -3 + Math.sin(time * 0.0006) * 0.18;
      waterGrid.position.z = Math.cos(time * 0.0006) * 0.18;

      // Max monthly volume mapping
      const maxVolumeMap: Record<string, number> = {};
      transport.institutions.forEach((inst) => {
        maxVolumeMap[inst] = Math.max(...(transport.series[inst] ?? []), 1);
      });



      // Slow orbit rotation when idle
      if (now - lastInteractTime > 8000 && !isDragging) {
        targetTheta += 0.024 * dt;
      }

      // Update camera smooth movement
      updateCameraPosition();

      // Highlight/dim 3D Tube Lines & Dots based on activeCategory
      const isAnyActive = activeCat !== null;
      trackLines.forEach((tube) => {
        const isTubeActive = activeCat === (tube as any).category;
        const tubeMat = tube.material as THREE.MeshStandardMaterial;
        if (isTubeActive) {
          tubeMat.opacity = 0.90;
          tubeMat.emissiveIntensity = 2.2; 
        } else {
          tubeMat.opacity = isAnyActive ? 0.02 : 0.35;
          tubeMat.emissiveIntensity = isAnyActive ? 0.05 : 0.9;
        }
      });

      trackDots.forEach((dots) => {
        const isDotsActive = activeCat === (dots as any).category;
        const dotsMat = dots.material as THREE.PointsMaterial;
        if (isDotsActive) {
          dotsMat.opacity = 0.95;
          dotsMat.size = 0.38; 
        } else {
          dotsMat.opacity = isAnyActive ? 0.01 : 0.22;
          dotsMat.size = 0.14;
        }
      });

      // Update ripples
      rippleMeshes.forEach((ripple) => {
        ripple.scale += dt * ripple.speed;
        if (ripple.scale > ripple.maxScale) {
          ripple.scale = 0.1;
        }
        ripple.mesh.scale.set(ripple.scale * 3.6, ripple.scale * 3.6, 1);
        ripple.material.opacity = Math.max(0, 0.28 * (1 - ripple.scale / ripple.maxScale));
      });

      // Animate/Glow station stops based on activeCategory filter
      stationMeshes.forEach((st) => {
        const isStActive = activeCat === st.category;
        const isAnyActive = activeCat !== null;
        if (isStActive) {
          st.material.opacity = 0.95;
          const scale = 1.0 + Math.sin(now * 0.006) * 0.15;
          st.mesh.scale.set(scale, 1, scale);
        } else {
          st.material.opacity = isAnyActive ? 0.06 : 0.45;
          st.mesh.scale.set(1.0, 1.0, 1.0);
        }
      });

      // Animate Stylized 3D Vehicles
      activeVehicles.forEach((vehicle) => {
        const val = transport.series[vehicle.category]?.[sIdx] ?? 0;
        const baseline = transport.series[vehicle.category]?.[0] ?? 1;
        const indexVal = baseline > 0 ? (val / baseline) * 100 : 0;
        const speedMultiplier = Math.max(0.3, Math.min(2.5, indexVal / 100));

        vehicle.progress += dt * vehicle.speed * speedMultiplier;
        if (vehicle.progress > 1.0) vehicle.progress -= 1.0;

        const isDimmed = activeCat !== null && activeCat !== vehicle.category;

        let yOffset = 0.05;
        if (vehicle.category === "Ferry (Izdeniz)") {
          yOffset = -0.04;
        } else if (vehicle.category === "Bus (Eshot, Izulas, etc.)") {
          yOffset = 0.08;
        } else if (vehicle.category === "Metro") {
          yOffset = 0.08; 
        } else if (vehicle.category === "Tramvay") {
          yOffset = 0.04;
        }

        // Apply station stopping & dwell progress logic
        const leadProgress = getStationStoppingProgress(vehicle.progress, vehicle.numStations || 2);

        if (vehicle.carriages) {
          // Animate multi-carriage trains winding smoothly
          vehicle.carriages.forEach((mesh, cIdx) => {
            let carriageProgress = leadProgress - cIdx * 0.012;
            if (carriageProgress < 0.0) carriageProgress += 1.0;

            vehicle.curve.getPointAt(carriageProgress, tempV3);
            mesh.position.set(tempV3.x, tempV3.y + yOffset, tempV3.z);

            const tangent = vehicle.curve.getTangentAt(carriageProgress);
            const targetPos = tempV3.clone().add(tangent);
            mesh.lookAt(targetPos);
            mesh.visible = !isDimmed;
          });
        } else if (vehicle.mesh) {
          // Animate single carriage vehicles
          vehicle.curve.getPointAt(leadProgress, tempV3);
          vehicle.mesh.position.set(tempV3.x, tempV3.y + yOffset, tempV3.z);

          const tangent = vehicle.curve.getTangentAt(leadProgress);
          const targetPos = tempV3.clone().add(tangent);
          vehicle.mesh.lookAt(targetPos);
          vehicle.mesh.visible = !isDimmed;
          
          if (vehicle.category === "Ferry (Izdeniz)") {
            const beacon = vehicle.mesh.children.find(child => child instanceof THREE.PointLight);
            if (beacon) {
              (beacon as THREE.PointLight).intensity = Math.sin(now * 0.01) > 0 ? 1.5 : 0;
            }
          }
        }
      });

      // Update Ferry chimney smoke puffs
      smokeSpawnTimer += dt;
      if (smokeSpawnTimer > 0.12) {
        smokeSpawnTimer = 0;
        activeVehicles.forEach((vehicle) => {
          if (vehicle.category === "Ferry (Izdeniz)" && vehicle.mesh && vehicle.mesh.visible) {
            const particle = smokeParticles.find(p => !p.mesh.visible);
            if (particle) {
              const pos = new THREE.Vector3(-0.12, 0.16, 0); 
              pos.applyMatrix4(vehicle.mesh.matrixWorld); 
              particle.mesh.position.copy(pos);
              particle.mesh.scale.setScalar(1.0);
              (particle.mesh.material as THREE.MeshBasicMaterial).opacity = 0.35;
              particle.mesh.visible = true;
              particle.age = 0;
              particle.vel.set(
                (Math.random() - 0.5) * 0.15,
                0.6 + Math.random() * 0.3, 
                (Math.random() - 0.5) * 0.15
              );
            }
          }
        });
      }

      smokeParticles.forEach((p) => {
        if (p.mesh.visible) {
          p.age += dt;
          if (p.age >= p.maxAge) {
            p.mesh.visible = false;
          } else {
            const ratio = p.age / p.maxAge;
            p.mesh.position.addScaledVector(p.vel, dt);
            p.mesh.scale.setScalar(1.0 + ratio * 2.2); 
            (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1.0 - ratio); 
          }
        }
      });

      // Copy lead positions to moving spotlights
      const metroTrain = activeVehicles.find(v => v.category === "Metro");
      if (metroTrain && metroTrain.carriages && metroTrain.carriages[0]) {
        metroLight.position.copy(metroTrain.carriages[0].position);
        metroLight.position.y += 0.2;
        metroLight.visible = metroTrain.carriages[0].visible;
      }
      const ferryBoat = activeVehicles.find(v => v.category === "Ferry (Izdeniz)");
      if (ferryBoat && ferryBoat.mesh) {
        ferryLight.position.copy(ferryBoat.mesh.position);
        ferryLight.position.y += 0.2;
        ferryLight.visible = ferryBoat.mesh.visible;
      }

      // Animate and render active particles with trailing ribbons
      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
      const colAttr = particleGeometry.attributes.color as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;
      const colArr = colAttr.array as Float32Array;

      let activeParticleIndex = 0;

      simParticles.forEach((particle, pIdx) => {
        const val = transport.series[particle.category]?.[sIdx] ?? 0;
        const baseline = transport.series[particle.category]?.[0] ?? 1;
        const maxVol = maxVolumeMap[particle.category] || 1;

        const isModeDimmed = activeCat !== null && activeCat !== particle.category;
        const indexVal = baseline > 0 ? (val / baseline) * 100 : 0;

        const particlesPerTrack = Math.round(MAX_SIM_PARTICLES * 0.12 * particle.weight);
        const activeCountForThisTrack = Math.max(
          2,
          Math.round(particlesPerTrack * (val / maxVol))
        );

        const trackSubIndex = pIdx % particlesPerTrack;
        const isActive = trackSubIndex < activeCountForThisTrack;

        if (isActive && activeParticleIndex < TOTAL_VERTICES - PARTICLES_PER_SIM) {
          const speedMultiplier = Math.max(0.3, Math.min(2.5, indexVal / 100));
          
          particle.progress += dt * particle.speed * speedMultiplier;
          if (particle.progress > 1.0) particle.progress -= 1.0;

          const baseColor = getModeColor(particle.category);

          // Lead particle
          particle.curve.getPointAt(particle.progress, tempV3);
          posArr[activeParticleIndex * 3] = tempV3.x;
          posArr[activeParticleIndex * 3 + 1] = tempV3.y;
          posArr[activeParticleIndex * 3 + 2] = tempV3.z;

          if (isModeDimmed) {
            colArr[activeParticleIndex * 3] = baseColor.r * 0.02;
            colArr[activeParticleIndex * 3 + 1] = baseColor.g * 0.02;
            colArr[activeParticleIndex * 3 + 2] = baseColor.b * 0.02;
          } else {
            colArr[activeParticleIndex * 3] = baseColor.r;
            colArr[activeParticleIndex * 3 + 1] = baseColor.g;
            colArr[activeParticleIndex * 3 + 2] = baseColor.b;
          }
          activeParticleIndex++;

          // 3 trailing particles
          for (let t = 1; t < PARTICLES_PER_SIM; t++) {
            let tailProgress = particle.progress - t * 0.012;
            if (tailProgress < 0.0) tailProgress += 1.0;

            particle.curve.getPointAt(tailProgress, tempV3);
            posArr[activeParticleIndex * 3] = tempV3.x;
            posArr[activeParticleIndex * 3 + 1] = tempV3.y;
            posArr[activeParticleIndex * 3 + 2] = tempV3.z;

            const decay = 1.0 - t * 0.28;
            if (isModeDimmed) {
              colArr[activeParticleIndex * 3] = baseColor.r * 0.02 * decay;
              colArr[activeParticleIndex * 3 + 1] = baseColor.g * 0.02 * decay;
              colArr[activeParticleIndex * 3 + 2] = baseColor.b * 0.02 * decay;
            } else {
              colArr[activeParticleIndex * 3] = baseColor.r * decay;
              colArr[activeParticleIndex * 3 + 1] = baseColor.g * decay;
              colArr[activeParticleIndex * 3 + 2] = baseColor.b * decay;
            }
            activeParticleIndex++;
          }
        }
      });

      for (let i = activeParticleIndex; i < TOTAL_VERTICES; i++) {
        posArr[i * 3] = 9999;
        posArr[i * 3 + 1] = 9999;
        posArr[i * 3 + 2] = 9999;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      // Render scene via Composer (for Bloom effect)
      composer.render();

      // Project floating 3D labels with screen-space overlap resolution
      if (labelContainerRef.current) {
        const labels = labelContainerRef.current.children;
        const tempProjectV = new THREE.Vector3();

        const containerW = renderer.domElement.clientWidth || width;
        const containerH = renderer.domElement.clientHeight || height;

        const occupiedBoxes: { x1: number; y1: number; x2: number; y2: number }[] = [];

        // Sort HUBS by priority (Major hubs take precedence over landmarks)
        const sortedHubs = HUBS.map((hub, index) => ({ hub, originalIndex: index }))
          .sort((a, b) => {
            const prioA = a.hub.kind === "hub" ? 1 : 2;
            const prioB = b.hub.kind === "hub" ? 1 : 2;
            return prioA - prioB;
          });

        sortedHubs.forEach(({ hub, originalIndex }) => {
          const el = labels[originalIndex] as HTMLElement;
          if (!el) return;

          tempProjectV.copy(hub.pos);
          tempProjectV.project(camera);

          // Hide if behind camera
          if (tempProjectV.z > 1.0) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            return;
          }

          const lx = (tempProjectV.x * 0.5 + 0.5) * containerW;
          const ly = (-(tempProjectV.y * 0.5) + 0.5) * containerH;

          // Estimate label dimensions for overlap checking
          const labelW = hub.short.length * 7 + 60; 
          const labelH = 34; 

          const x1 = lx - labelW / 2;
          const y1 = ly - labelH / 2;
          const x2 = lx + labelW / 2;
          const y2 = ly + labelH / 2;

          let hasOverlap = false;
          for (const box of occupiedBoxes) {
            const margin = 6;
            if (!(x2 + margin < box.x1 || x1 - margin > box.x2 || y2 + margin < box.y1 || y1 - margin > box.y2)) {
              hasOverlap = true;
              break;
            }
          }

          // Bound check edges of screen
          if (lx < 40 || lx > containerW - 40 || ly < 40 || ly > containerH - 40) {
            hasOverlap = true;
          }

          // De-clutter unrelated labels if active category is selected
          const isCategorySelected = activeCat !== null;
          let shouldHideByFilter = false;
          if (isCategorySelected) {
            if (activeCat === "Metro" && hub.name !== "Konak Hub" && hub.name !== "Halkapınar Hub" && hub.name !== "Bornova") {
              shouldHideByFilter = true;
            }
            if (activeCat === "Ferry (Izdeniz)" && hub.name !== "Konak Hub" && hub.name !== "Bostanlı" && hub.name !== "Karşıyaka") {
              shouldHideByFilter = true;
            }
            if (activeCat === "Izban (Train)" && hub.name !== "Halkapınar Hub" && hub.name !== "Bornova") {
              shouldHideByFilter = true;
            }
          }

          if (hasOverlap || shouldHideByFilter) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
          } else {
            occupiedBoxes.push({ x1, y1, x2, y2 });
            el.style.opacity = "1";
            el.style.pointerEvents = "auto";
            el.style.transform = `translate(-50%, -50%) translate(${lx}px, ${ly}px)`;
          }
        });
      }
    };

    loop();

    // ========================================================================
    //  18. CLEANUP
    // ========================================================================
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (canvasEl) {
        canvasEl.removeEventListener("pointerdown", onPointerDown);
        canvasEl.removeEventListener("pointermove", onPointerMove);
        canvasEl.removeEventListener("wheel", onWheel);
      }
      window.removeEventListener("pointerup", onPointerUp);

      // Remove items from scene graph
      scene.remove(landMesh);
      scene.remove(gridHelper);
      scene.remove(boundaryGroup);
      scene.remove(stationGroup);
      scene.remove(waterMesh);
      scene.remove(waterGrid);
      scene.remove(northShoreLine);
      scene.remove(southShoreLine);
      scene.remove(northGlowLine);
      scene.remove(southGlowLine);
      scene.remove(particlePoints);
      
      scene.remove(landmarkGroup);
      scene.remove(metroLight);
      scene.remove(ferryLight);
      
      rippleMeshes.forEach((r) => scene.remove(r.mesh));
      smokeParticles.forEach((p) => scene.remove(p.mesh));
      
      activeVehicles.forEach((vehicle) => {
        if (vehicle.mesh) scene.remove(vehicle.mesh);
        if (vehicle.carriages) {
          vehicle.carriages.forEach((mesh) => scene.remove(mesh));
        }
      });

      renderer.dispose();
      composer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      waterGeometry.dispose();
      waterMaterial.dispose();
      landGeo.dispose();
      landMaterial.dispose();
      waterGrid.geometry.dispose();
      (waterGrid.material as THREE.Material).dispose();
      northShoreGeo.dispose();
      southShoreGeo.dispose();
      northGlowGeo.dispose();
      southGlowGeo.dispose();
      shorelineMat.dispose();
      smokeGeometry.dispose();
      smokeMaterial.dispose();

      metroLight.dispose();
      ferryLight.dispose();

      landmarkGroup.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });

      gridHelper.geometry.dispose();
      (gridHelper.material as THREE.Material).dispose();

      boundaryGroup.children.forEach((child) => {
        (child as THREE.Line).geometry.dispose();
        ((child as THREE.Line).material as THREE.Material).dispose();
      });

      stationGroup.children.forEach((child) => {
        (child as THREE.Mesh).geometry.dispose();
        ((child as THREE.Mesh).material as THREE.Material).dispose();
      });



      rippleMeshes.forEach((ripple) => {
        ripple.mesh.geometry.dispose();
        ripple.material.dispose();
      });

      smokeParticles.forEach((p) => {
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
      });

      activeVehicles.forEach((vehicle) => {
        if (vehicle.mesh) {
          vehicle.mesh.children.forEach((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              child.material.dispose();
            }
          });
        }
        if (vehicle.carriages) {
          vehicle.carriages.forEach((mesh) => {
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
          });
        }
      });
    };  }, []);

  return (
    <ArticleChartFrame
      eyebrow="İzmir Körfezi Data Story"
      title="How İzmir’s Transit Network Recovered Across the Bay"
      description="Scrub through the recovery timeline and watch trips move across İzmir’s ferry crossings, rail spine, coastal tram lines, and district bus network."
      takeaway={monthNarrative}
      primaryMetric={{
        label: monthLabel,
        value: formatCompactNumber(totalTrips, "en-US"),
        detail: leadingMode
          ? `${getTransportLabel(leadingMode.institution, "en")} leads this month`
          : "Network total",
      }}
      interactionHint="Rotate İzmir Bay or select a transit layer to explore the recovery flows."
      density="explorer"
      controls={null}
      aside={undefined}
      footer={
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="viz-note text-xs text-muted-foreground">
            * The scene is an analytical abstraction of İzmir's public transport recovery.
            Particle density follows absolute trips, particle speed follows the January 2021 recovery index,
            and place labels anchor the story around İzmir Körfezi.
          </div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
            Konak · Kordon · Karşıyaka · Bostanlı · Kadifekale
          </div>
        </div>
      }
      className="xl:max-w-[1320px] 2xl:max-w-[1420px] mx-auto transition-all duration-300"
    >
      <div className="space-y-6">
        {/* Three.js viewport */}
        <div
          ref={containerRef}
          className={`relative overflow-hidden border border-white/[0.07] bg-black/40 shadow-inner group transition-all duration-300 ${
            isFullscreen ? "w-screen h-screen rounded-none border-none" : "rounded-2xl"
          }`}
          style={
            isFullscreen
              ? { height: "100vh" }
              : isMobile
              ? { height: "400px" }
              : { height: "700px" }
          }
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
            onPointerDown={() => setHasInteracted(true)}
            onWheel={() => setHasInteracted(true)}
          />

          {/* Projected 3D floating labels */}
          <div
            ref={labelContainerRef}
            className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden"
          >
            {HUBS.map((hub) => (
              <div
                key={hub.name}
                className="absolute pointer-events-none transition-opacity duration-200"
                style={{ opacity: 0, transform: "translate(-50%, -50%)" }}
              >
                <div
                  className={`rounded-xl border px-2.5 py-1.5 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md ${
                    hub.kind === "hub"
                      ? "bg-[#07111f]/80 border-white/[0.08]"
                      : "bg-[#120b16]/80 border-white/[0.10]"
                  }`}
                  style={{
                    boxShadow: `0 0 18px ${hub.accent}24, 0 10px 30px rgba(0,0,0,0.35)`,
                  }}
                >
                  <div
                    className="text-[9px] font-bold tracking-wide"
                    style={{ color: hub.accent }}
                  >
                    {hub.short}
                  </div>
                  <div className="mt-0.5 text-[7px] leading-none text-zinc-400">
                    {hub.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contextual Milestone Event Overlays with fluid slide animation floating above scrubber */}
          <AnimatePresence mode="wait">
            {activeMilestone && (
              <motion.div
                key={activeMilestone.title}
                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1.0 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className="absolute bottom-20 left-4 right-4 sm:right-auto sm:max-w-xs md:max-w-sm hidden md:block bg-[#09090b]/85 backdrop-blur-md border border-white/[0.08] p-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] z-20"
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7af298] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7af298]"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7af298]">Milestone Event</span>
                </div>
                <h4 className="mt-1.5 text-sm font-semibold text-foreground">{activeMilestone.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{activeMilestone.desc}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Tutorial Overlay (Drag to Rotate) */}
          {!hasInteracted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 pointer-events-none z-10 transition-opacity duration-500 animate-pulse">
              <div className="flex flex-col items-center gap-2.5 bg-[#09090b]/90 border border-white/[0.08] px-5 py-3 rounded-2xl backdrop-blur-md shadow-2xl">
                <svg className="animate-bounce text-[#7af298]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18H9.5a5.5 5.5 0 0 1-5.5-5.5v0A5.5 5.5 0 0 1 9.5 7H15" />
                  <path d="M15 6v12" />
                  <path d="M18 9l-3-3-3 3" />
                  <path d="M18 15l-3 3-3-3" />
                </svg>
                <span className="text-[10px] text-foreground font-semibold uppercase tracking-wider">
                  Drag across İzmir Körfezi
                </span>
                <span className="text-[8px] text-zinc-500">
                  Follow ferries, rail lines, and coastal corridors
                </span>
              </div>
            </div>
          )}

          {/* Floating Controls / Metric HUD in the top right */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 z-10">
            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#09090b]/85 backdrop-blur-md border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200 shadow-lg active:scale-95 cursor-pointer"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3M10 21v-6H4M14 3v6h6" />
                </svg>
              )}
            </button>

            {/* Metric HUD Card */}
            <div className="bg-[#09090b]/85 backdrop-blur-md border border-white/[0.08] px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl text-right shadow-lg pointer-events-none">
              <span className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7af298] block">
                {monthLabel} Total
              </span>
              <span className="text-base sm:text-xl font-display font-bold text-foreground block mt-0.5">
                {formatCompactNumber(totalTrips, "en-US")}
              </span>
              {leadingMode && (
                <span className="text-[8px] sm:text-[9px] text-muted-foreground block mt-0.5">
                  {getTransportLabel(leadingMode.institution, "en")} leads
                </span>
              )}
            </div>
          </div>

          {/* Demographic Mix Overlay (Fare Numbers) */}
          <div className="absolute top-[88px] right-4 z-10 hidden md:block w-[220px] bg-[#09090b]/85 backdrop-blur-md border border-white/[0.08] rounded-xl p-3 shadow-lg pointer-events-auto select-none">
            <div className="text-[7px] font-bold uppercase tracking-[0.18em] text-[#7af298] mb-2 px-0.5">
              Rider demographic mix (fare groups)
            </div>
            <div className="space-y-1.5">
              {demographicMix.map((mix) => (
                <div key={`map-mix-${mix.group}`} className="px-0.5 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 ring-1 ring-white/10"
                        style={{ backgroundColor: mix.color }}
                      />
                      <span className="text-[9px] text-muted-foreground truncate leading-tight">
                        {mix.label}
                      </span>
                    </div>
                    <span className="text-[9px] font-semibold text-foreground tabular-nums shrink-0 ml-1">
                      {(mix.share * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${mix.share * 100}%`,
                        backgroundColor: mix.color,
                        boxShadow: `0 0 4px ${mix.color}66`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Stacked composition bar */}
            <div className="mt-2.5 pt-2 border-t border-white/[0.06]">
              <div className="flex h-1.5 w-full rounded-full overflow-hidden">
                {demographicMix.map((mix) => (
                  <div
                    key={`stack-${mix.group}`}
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${mix.share * 100}%`,
                      backgroundColor: mix.color,
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mt-1.5">
                {demographicMix.slice(0, 3).map((mix) => (
                  <div key={`legend-${mix.group}`} className="flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: mix.color }}
                    />
                    <span className="text-[7px] text-muted-foreground leading-none">{mix.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* İzmir mode selector */}
          <div className="absolute top-4 left-4 z-10 hidden md:block w-[250px] rounded-2xl border border-white/[0.08] bg-[#07111f]/78 p-3.5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5ecfff]">
                  İzmir Bay Layers
                </p>
                <p className="mt-1 text-[10px] leading-snug text-zinc-400">
                  Follow the gulf, rail spine, ferries, and coastal tram corridors.
                </p>
              </div>
              <span className="rounded-full border border-[#f7a85b]/25 bg-[#f7a85b]/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-[#f7a85b]">
                Körfez
              </span>
            </div>

            <div className="mt-3 space-y-1">
              {modeUi.map((item) => {
                const isItemDimmed = activeCategory !== null && activeCategory !== item.key;
                const isItemActive = activeCategory === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setActiveCategory((current) =>
                        current === item.key ? null : item.key,
                      )
                    }
                    className="group/mode flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition-all duration-200 hover:bg-white/[0.05]"
                    style={{
                      background: isItemActive ? `${item.color}14` : "transparent",
                      opacity: isItemDimmed ? 0.45 : 1,
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {getTransportIcon(item.key, item.color)}
                      <div className="min-w-0">
                        <div
                          className={`text-[10px] font-semibold leading-tight ${
                            isItemActive ? "text-white" : "text-zinc-300"
                          }`}
                        >
                          {item.label}
                        </div>
                        <div className="truncate text-[8px] leading-tight text-zinc-500">
                          {item.local}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[8px] font-bold uppercase tracking-[0.12em] ${
                        isItemActive ? "text-[#7af298]" : "text-zinc-600 group-hover/mode:text-zinc-400"
                      }`}
                    >
                      {isItemActive ? "Focus" : "View"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Mode Detail KPI HUD Card */}
          {selectedModeDetails && (
            <div className="absolute top-44 left-4 hidden md:block w-60 bg-[#09090b]/92 backdrop-blur-md border border-white/[0.08] p-3.5 rounded-xl shadow-xl z-10 text-left pointer-events-auto transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: selectedModeDetails.color }}>
                  {selectedModeDetails.name} Details
                </span>
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className="text-zinc-500 hover:text-white transition-colors duration-150 cursor-pointer"
                  aria-label="Clear filter"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-display text-white">{selectedModeDetails.value}</span>
                  <span className="text-[8px] text-muted-foreground">trips this month</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[8px] text-muted-foreground">Baseline Recovery:</span>
                  <span className="text-xs font-bold font-display" style={{ color: selectedModeDetails.recovery >= 100 ? "#7af298" : "#f4b76e" }}>
                    {selectedModeDetails.recovery}%
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(selectedModeDetails.recovery, 100)}%`,
                      backgroundColor: selectedModeDetails.color,
                      boxShadow: `0 0 8px ${selectedModeDetails.color}`,
                    }}
                  />
                </div>
                <p className="mt-2.5 text-[9px] text-muted-foreground leading-relaxed">
                  {selectedModeDetails.desc}
                </p>
              </div>
            </div>
          )}



          {/* İzmir geographic context strip */}
          <div className="absolute bottom-[88px] left-4 right-4 z-10 hidden lg:flex items-center justify-between gap-3 pointer-events-none">
            {[
              { label: "Konak", detail: "historic hub", color: IZMIR_THEME.sunset },
              { label: "Kordon", detail: "waterfront edge", color: IZMIR_THEME.bayGlow },
              { label: "Karşıyaka", detail: "north shore", color: IZMIR_THEME.bougainvillea },
              { label: "Kadifekale", detail: "hill contour", color: IZMIR_THEME.limestone },
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-[#07111f]/58 px-3 py-2 backdrop-blur-md shadow-[0_8px_26px_rgba(0,0,0,0.28)]"
              >
                <div
                  className="text-[9px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: item.color }}
                >
                  {item.label}
                </div>
                <div className="mt-0.5 truncate text-[8px] text-zinc-500">
                  {item.detail}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Scrubber floating at the bottom */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <CustomMonthScrubber
              index={selectedIndex}
              months={transport.months}
              onSelect={setSelectedIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
            />
          </div>

          {/* Mobile Tabbed Panel (Visible only on mobile/tablet) */}
          <div className="block md:hidden space-y-4">
            {/* Milestone Event Overlay (Header) */}
            {activeMilestone && (
              <motion.div
                key={`mobile-milestone-${activeMilestone.title}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#09090b]/80 border border-white/[0.08] p-4 rounded-2xl shadow-lg backdrop-blur-md"
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7af298] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7af298]"></span>
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7af298]">Milestone Event</span>
                </div>
                <h4 className="mt-1.5 text-sm font-semibold text-white">{activeMilestone.title}</h4>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{activeMilestone.desc}</p>
              </motion.div>
            )}

            {/* Tabbed Card */}
            <div className="bg-[#09090b]/80 border border-white/[0.08] rounded-2xl p-4 shadow-lg backdrop-blur-md">
              {/* Tabs Header */}
              <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/[0.05] mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("layers")}
                  className={`flex-1 py-2 text-center text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                    activeTab === "layers"
                      ? "bg-[#7af298]/10 text-[#7af298] border border-[#7af298]/20 shadow-[0_0_8px_rgba(122,242,152,0.15)]"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Bay Layers
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("demographics")}
                  className={`flex-1 py-2 text-center text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                    activeTab === "demographics"
                      ? "bg-[#7af298]/10 text-[#7af298] border border-[#7af298]/20 shadow-[0_0_8px_rgba(122,242,152,0.15)]"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Demographics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={`flex-1 py-2 text-center text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                    activeTab === "details"
                      ? "bg-[#7af298]/10 text-[#7af298] border border-[#7af298]/20 shadow-[0_0_8px_rgba(122,242,152,0.15)]"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Details
                </button>
              </div>

              {/* Tab Contents */}
              <AnimatePresence mode="wait">
                {activeTab === "layers" && (
                  <motion.div
                    key="tab-layers"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2"
                  >
                    <div className="text-[10px] text-zinc-400 mb-2 px-1">
                      Select a transit mode layer to focus the 3D camera and highlight paths.
                    </div>
                    <div className="space-y-1.5">
                      {modeUi.map((item) => {
                        const isItemActive = activeCategory === item.key;
                        const isItemDimmed = activeCategory !== null && activeCategory !== item.key;

                        // Get current value and baseline for stats display
                        const values = transport.series[item.key] ?? [];
                        const baselineVal = values[0] || 1;
                        const currentVal = values[selectedIndex] ?? 0;
                        const recoveryPct = Math.round((currentVal / baselineVal) * 105);

                        return (
                          <button
                            key={`mobile-mode-${item.key}`}
                            type="button"
                            onClick={() => {
                              setActiveCategory((current) =>
                                current === item.key ? null : item.key,
                              );
                              // Auto-switch to Details tab if selecting a mode
                              if (activeCategory !== item.key) {
                                setActiveTab("details");
                              }
                            }}
                            className="group/mode flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.04] p-3 text-left transition-all duration-200 bg-white/[0.01]"
                            style={{
                              borderColor: isItemActive ? `${item.color}33` : "rgba(255,255,255,0.04)",
                              background: isItemActive ? `${item.color}0a` : "rgba(255,255,255,0.01)",
                              opacity: isItemDimmed ? 0.5 : 1,
                            }}
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              {getTransportIcon(item.key, item.color)}
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white leading-snug">
                                  {item.label}
                                </div>
                                <div className="truncate text-[9px] text-zinc-500">
                                  {item.local}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-[11px] font-semibold text-white tabular-nums">
                                {formatCompactNumber(currentVal, "en-US")}
                              </div>
                              <div
                                className="text-[9px] font-bold tabular-nums"
                                style={{ color: recoveryPct >= 100 ? "#7af298" : "#f4b76e" }}
                              >
                                {recoveryPct}% rec
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {activeTab === "demographics" && (
                  <motion.div
                    key="tab-demographics"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3.5"
                  >
                    <div className="text-[10px] text-[#7af298] font-bold uppercase tracking-[0.12em] px-0.5">
                      Rider Fare Mix
                    </div>
                    <div className="space-y-2.5">
                      {demographicMix.map((mix) => (
                        <div key={`mobile-mix-${mix.group}`} className="px-0.5 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/10"
                                style={{ backgroundColor: mix.color }}
                              />
                              <span className="text-xs text-zinc-300 truncate">
                                {mix.label}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-white tabular-nums shrink-0 ml-1">
                              {(mix.share * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${mix.share * 100}%`,
                                backgroundColor: mix.color,
                                boxShadow: `0 0 4px ${mix.color}66`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Stacked composition bar */}
                    <div className="pt-3 border-t border-white/[0.06]">
                      <div className="flex h-2.5 w-full rounded-full overflow-hidden">
                        {demographicMix.map((mix) => (
                          <div
                            key={`mobile-stack-${mix.group}`}
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${mix.share * 100}%`,
                              backgroundColor: mix.color,
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
                        {demographicMix.map((mix) => (
                          <div key={`mobile-legend-${mix.group}`} className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: mix.color }}
                            />
                            <span className="text-[9px] text-zinc-400 leading-none">{mix.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "details" && (
                  <motion.div
                    key="tab-details"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                  >
                    {selectedModeDetails ? (
                      <div className="text-left space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: selectedModeDetails.color }}>
                            {selectedModeDetails.name} Focus
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveCategory(null)}
                            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.02]"
                          >
                            Clear Focus
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                          <div>
                            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Trips this month</div>
                            <div className="text-base font-bold font-display text-white mt-0.5">{selectedModeDetails.value}</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Baseline Recovery</div>
                            <div
                              className="text-base font-bold font-display mt-0.5"
                              style={{ color: selectedModeDetails.recovery >= 100 ? "#7af298" : "#f4b76e" }}
                            >
                              {selectedModeDetails.recovery}%
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500">
                            <span>Recovery progress relative to Jan 2021:</span>
                            <span style={{ color: selectedModeDetails.color }}>{selectedModeDetails.recovery}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(selectedModeDetails.recovery, 100)}%`,
                                backgroundColor: selectedModeDetails.color,
                                boxShadow: `0 0 8px ${selectedModeDetails.color}`,
                              }}
                            />
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400 leading-relaxed pt-1.5 border-t border-white/[0.05]">
                          {selectedModeDetails.desc}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-white/[0.08] rounded-xl bg-white/[0.01]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 mb-2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <div className="text-xs font-medium text-zinc-400">No transit mode focused</div>
                        <div className="text-[10px] text-zinc-500 mt-1 max-w-[200px]">
                          Select a mode under the <span className="text-zinc-300 font-semibold cursor-pointer underline" onClick={() => setActiveTab("layers")}>Bay Layers</span> tab to view full details.
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </div>
      </div>
    </ArticleChartFrame>
  );
}

function CustomMonthScrubber({
  index,
  months,
  onSelect,
  isPlaying,
  setIsPlaying,
}: {
  index: number;
  months: string[];
  onSelect: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}) {
  const maxIndex = months.length - 1;
  const percentage = (index / maxIndex) * 100;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateValue(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      updateValue(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updateValue = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPlaying(false); // Stop autoplay when user interacts
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(clickX / rect.width, 1));
    const nextIndex = Math.round(ratio * maxIndex);
    if (nextIndex >= 0 && nextIndex <= maxIndex) {
      onSelect(nextIndex);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full bg-[#09090b]/85 backdrop-blur-md border border-white/[0.08] p-3 sm:px-5 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={() => setIsPlaying(!isPlaying)}
        className="flex items-center justify-center w-8 h-8 rounded-full border border-[#7af298]/30 bg-[#7af298]/10 text-[#7af298] hover:bg-[#7af298]/20 transition-all duration-200 shadow-[0_0_8px_rgba(122,242,152,0.15)] shrink-0"
        aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
      >
        {isPlaying ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="4" height="16"></rect>
            <rect x="16" y="4" width="4" height="16"></rect>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        )}
      </button>

      <button
        type="button"
        disabled={index === 0}
        onClick={() => {
          setIsPlaying(false);
          onSelect(index - 1);
        }}
        className="flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.08] bg-white/[0.02] text-zinc-400 disabled:opacity-30 disabled:pointer-events-none hover:text-white hover:bg-white/[0.06] transition-all duration-200 shrink-0"
        aria-label="Previous month"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div
        className="relative flex-grow h-6 flex items-center cursor-pointer select-none group touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="absolute inset-0 flex items-center">
          <div className="h-[4px] w-full rounded-full bg-white/[0.08] relative">
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 bottom-0 rounded-full bg-[#7af298]"
                animate={{ width: `${percentage}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              />
            </div>
            {/* Milestone Indicators on Timeline Scrubber */}
            {months.map((m, idx) => {
              const milestone = MILESTONES[m];
              if (!milestone) return null;
              const leftPct = (idx / maxIndex) * 100;
              const isPast = idx <= index;
              return (
                <div
                  key={m}
                  className={`absolute top-1/2 w-2 h-2 rounded-full border border-[#09090b] -translate-x-1/2 -translate-y-1/2 hover:scale-150 transition-all duration-200 cursor-pointer shadow-md z-20 ${
                    isPast ? "bg-[#7af298] shadow-[#7af298]/30" : "bg-orange-500 shadow-orange-500/30"
                  }`}
                  style={{ left: `${leftPct}%` }}
                  title={`${m}: ${milestone.title}`}
                  onClick={(e) => {
                    e.stopPropagation(); // prevent scrubber click handler
                    onSelect(idx);
                  }}
                />
              );
            })}
          </div>
        </div>

        <motion.div
          className="absolute w-5 h-5 rounded-full bg-[#7af298] border-4 border-[#111111] shadow-[0_0_12px_rgba(122,242,152,0.4)] z-10"
          animate={{ left: `calc(${percentage}% - 10px)` }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          whileHover={{ scale: 1.2 }}
        />
      </div>

      <button
        type="button"
        disabled={index === maxIndex}
        onClick={() => {
          setIsPlaying(false);
          onSelect(index + 1);
        }}
        className="flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.08] bg-white/[0.02] text-zinc-400 disabled:opacity-30 disabled:pointer-events-none hover:text-white hover:bg-white/[0.06] transition-all duration-200 shrink-0"
        aria-label="Next month"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  );
}
