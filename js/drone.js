// Procedural quadcopter rendered on a fixed, transparent canvas.
// The page decides where the drone should be through getPose(); this module
// eases toward that pose every frame, adds idle hover and mouse tilt, spins
// the props and renders.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const POSE_KEYS = ['x', 'y', 'z', 'scale', 'rx', 'ry', 'rz', 'prop'];

// Drone half-width (motor reach + prop radius) is ~1.35 model units. This
// factor makes scale 1 span about a quarter of a wide viewport.
const SIZE = 0.26;

export function createDrone(canvas, { getPose, reducedMotion = false, accent = '#2b59ff' }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(4, 8, 6);
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dee7, 0.9));

  const drone = buildDrone(accent);
  scene.add(drone.group);

  const state = { ...getPose() };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const clock = new THREE.Clock();

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (reducedMotion) renderOnce();
  }

  function place(t) {
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const halfW = halfH * camera.aspect;
    const unit = Math.min(halfW, halfH * 1.25);
    const bob = reducedMotion ? 0 : Math.sin(t * 1.6) * 0.035 * unit;

    const g = drone.group;
    g.position.set(state.x * halfW * 0.85, state.y * halfH * 0.85 + bob, state.z);
    g.scale.setScalar(unit * SIZE * state.scale);
    g.rotation.set(
      state.rx + mouse.y * 0.12 + (reducedMotion ? 0 : Math.sin(t * 1.1) * 0.02),
      state.ry + mouse.x * 0.3,
      state.rz + (reducedMotion ? 0 : Math.sin(t * 0.9) * 0.025),
    );
  }

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    const target = getPose();
    const k = 1 - Math.exp(-dt * 4.5);
    for (const key of POSE_KEYS) state[key] += (target[key] - state[key]) * k;

    const km = 1 - Math.exp(-dt * 3);
    mouse.x += (mouse.tx - mouse.x) * km;
    mouse.y += (mouse.ty - mouse.y) * km;

    place(t);

    const spin = dt * (14 + state.prop * 26);
    for (const p of drone.props) p.group.rotation.y += p.dir * spin;
    const blur = Math.min(0.1, 0.035 * state.prop);
    for (const m of drone.blurMats) m.opacity = blur;
    drone.tailLed.emissiveIntensity = (t % 1.4) < 0.1 ? 4 : 0.3;

    renderer.render(scene, camera);
  }

  function renderOnce() {
    Object.assign(state, getPose());
    place(0);
    renderer.render(scene, camera);
  }

  new ResizeObserver(resize).observe(canvas);
  resize();

  if (reducedMotion) {
    renderOnce();
  } else {
    renderer.setAnimationLoop(frame);
    document.addEventListener('visibilitychange', () => {
      renderer.setAnimationLoop(document.hidden ? null : frame);
      if (!document.hidden) clock.getDelta();
    });
  }

  return { renderOnce };
}

function buildDrone(accent) {
  const group = new THREE.Group();

  const graphite = new THREE.MeshStandardMaterial({ color: 0x1c2026, metalness: 0.45, roughness: 0.38 });
  const carbon = new THREE.MeshStandardMaterial({ color: 0x2b3038, metalness: 0.3, roughness: 0.55 });
  const shell = new THREE.MeshStandardMaterial({ color: 0xeef1f5, metalness: 0.1, roughness: 0.3 });
  const glow = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.7, metalness: 0.2, roughness: 0.3 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x07090c, metalness: 0.9, roughness: 0.08 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x15181d, metalness: 0.2, roughness: 0.5 });
  const tailLed = new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff3b30, emissiveIntensity: 0.3 });

  const add = (geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    group.add(m);
    return m;
  };
  const UP = new THREE.Vector3(0, 1, 0);

  // Fuselage
  add(new RoundedBoxGeometry(0.95, 0.26, 1.35, 4, 0.11), graphite);
  add(new RoundedBoxGeometry(0.7, 0.14, 0.95, 4, 0.06), shell, 0, 0.17, -0.02);
  add(new THREE.BoxGeometry(0.08, 0.02, 0.9), glow, 0, 0.245, -0.02);
  add(new RoundedBoxGeometry(0.6, 0.16, 0.9, 3, 0.04), carbon, 0, -0.2, -0.02);

  // Arms, motors, props
  const props = [];
  const blurMats = [];
  const armGeo = new THREE.CylinderGeometry(0.045, 0.06, 1.0, 12);
  const motorGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.18, 24);
  const ringGeo = new THREE.TorusGeometry(0.128, 0.016, 8, 32);
  const hubGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 16);
  const bladeGeo = new THREE.BoxGeometry(0.44, 0.012, 0.075);
  const discGeo = new THREE.CircleGeometry(0.47, 48);

  [45, 135, 225, 315].forEach((deg, i) => {
    const a = THREE.MathUtils.degToRad(deg);
    const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    const motorPos = dir.clone().multiplyScalar(1.25);

    const arm = add(armGeo, carbon);
    arm.quaternion.setFromUnitVectors(UP, dir);
    arm.position.copy(dir).multiplyScalar(0.75);

    add(motorGeo, graphite, motorPos.x, 0.06, motorPos.z);
    const ring = add(ringGeo, glow, motorPos.x, 0.12, motorPos.z);
    ring.rotation.x = Math.PI / 2;

    const prop = new THREE.Group();
    prop.position.set(motorPos.x, 0.2, motorPos.z);
    prop.add(new THREE.Mesh(hubGeo, shell));
    for (const side of [-1, 1]) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.x = side * 0.24;
      blade.rotation.x = side * 0.18;
      prop.add(blade);
    }
    const blurMat = new THREE.MeshBasicMaterial({ color: 0x8a93a3, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const disc = new THREE.Mesh(discGeo, blurMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(motorPos.x, 0.2, motorPos.z);
    group.add(prop, disc);

    props.push({ group: prop, dir: i % 2 ? 1 : -1 });
    blurMats.push(blurMat);
  });

  // Landing gear: two skids, each on two legs splayed outward
  const legGeo = new THREE.CylinderGeometry(0.022, 0.022, 1, 8);
  const skidGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.15, 10);
  for (const s of [-1, 1]) {
    const skid = add(skidGeo, carbon, s * 0.5, -0.58, 0);
    skid.rotation.x = Math.PI / 2;
    for (const z of [-0.36, 0.36]) {
      const top = new THREE.Vector3(s * 0.28, -0.2, z);
      const bottom = new THREE.Vector3(s * 0.5, -0.58, z);
      const span = bottom.clone().sub(top);
      const leg = add(legGeo, carbon);
      leg.scale.y = span.length();
      leg.quaternion.setFromUnitVectors(UP, span.clone().normalize());
      leg.position.copy(top).addScaledVector(span, 0.5);
    }
  }

  // Gimbal camera under the nose
  add(new THREE.BoxGeometry(0.18, 0.1, 0.14), graphite, 0, -0.21, 0.6);
  add(new THREE.SphereGeometry(0.11, 24, 16), shell, 0, -0.31, 0.63);
  const lens = add(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 20), glass, 0, -0.31, 0.735);
  lens.rotation.x = Math.PI / 2;

  // GPS mast and tail light
  add(new THREE.CylinderGeometry(0.016, 0.016, 0.3, 8), carbon, 0, 0.36, -0.45);
  add(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 24), shell, 0, 0.53, -0.45);
  add(new THREE.SphereGeometry(0.035, 12, 8), tailLed, 0, 0.02, -0.69);

  return { group, props, blurMats, tailLed };
}
