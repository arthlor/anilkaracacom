import * as THREE from "three";

/**
 * Unique Folkart-like landmark for Bayraklı only.
 * Massing from apt/3.webp: flared white base, dark glass shaft, white ribs.
 * No signage, no twin clone — one glyph for the district's 20+ cluster.
 */
export function createFolkartLandmark() {
  const root = new THREE.Group();
  root.name = "folkart-landmark";
  root.userData.tier = "tier_20_plus";
  root.userData.district = "BAYRAKLI";

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x2f445e,
    roughness: 0.16,
    metalness: 0.18,
    clearcoat: 0.55,
    clearcoatRoughness: 0.14,
    envMapIntensity: 1.45,
  });
  const white = new THREE.MeshStandardMaterial({
    color: 0xf2f4f6,
    roughness: 0.42,
    metalness: 0.06,
    envMapIntensity: 0.85,
  });
  const crown = new THREE.MeshStandardMaterial({
    color: 0x6c7371,
    roughness: 0.58,
    metalness: 0.16,
  });

  const podium = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.85, 1.55), white);
  podium.position.y = 0.42;
  root.add(podium);

  const flare = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.98, 1.55, 8),
    white,
  );
  flare.position.y = 1.6;
  root.add(flare);

  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.92, 14.2, 0.78), glass);
  shaft.position.y = 9.05;
  root.add(shaft);

  const ribOffsets: [number, number][] = [
    [-0.5, 0.42],
    [0.5, 0.42],
    [-0.5, -0.42],
    [0.5, -0.42],
  ];
  ribOffsets.forEach(([x, z]) => {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.1, 14.4, 0.1), white);
    rib.position.set(x, 9.05, z);
    root.add(rib);
  });

  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.28, 0.88), crown);
  cap.position.y = 16.28;
  root.add(cap);

  const plant = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.34), crown);
  plant.position.y = 16.62;
  root.add(plant);

  root.userData.sculptRuntime = {
    nodes: { podium, flare, shaft, cap },
    sockets: { crown: cap },
  };
  return root;
}
