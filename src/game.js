import * as THREE from "https://unpkg.com/three@0.154.0/build/three.module.js";
import { TRACKS, LAPS_PER_RACE, RACE_PAYOUTS, ITEM_REWARDS } from "./tracks.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090b19);
scene.fog = new THREE.Fog(0x090b19, 200, 420);

const camera = createIsometricCamera();
scene.add(camera);

const hemi = new THREE.HemisphereLight(0xfff6e8, 0x070911, 0.7);
scene.add(hemi);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.65);
dirLight.position.set(120, 140, 90);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.near = 10;
dirLight.shadow.camera.far = 420;
dirLight.shadow.camera.left = -160;
dirLight.shadow.camera.right = 160;
dirLight.shadow.camera.top = 120;
dirLight.shadow.camera.bottom = -120;
scene.add(dirLight);

const groundGroup = new THREE.Group();
scene.add(groundGroup);

const itemGroup = new THREE.Group();
scene.add(itemGroup);

const obstacleGroup = new THREE.Group();
scene.add(obstacleGroup);

const rampGroup = new THREE.Group();
scene.add(rampGroup);

const wallGroup = new THREE.Group();
scene.add(wallGroup);

const ui = {
  lap: document.getElementById("lapDisplay"),
  position: document.getElementById("positionDisplay"),
  speed: document.getElementById("speedDisplay"),
  nitro: document.getElementById("nitroDisplay"),
  credits: document.getElementById("creditsDisplay"),
  message: document.getElementById("message"),
  leaderboard: document.getElementById("leaderboard"),
  shop: document.getElementById("shop"),
  shopCredits: document.getElementById("shopCredits"),
  upgrades: document.getElementById("upgradeList"),
  shopContinue: document.getElementById("shopContinue"),
  results: document.getElementById("results"),
  resultsList: document.getElementById("resultsList"),
  payout: document.getElementById("payout"),
  resultsContinue: document.getElementById("resultsContinue"),
};

const UPGRADE_CONFIG = {
  topSpeed: {
    label: "Top Speed",
    unit: "m/s",
    base: 30,
    perLevel: 2.8,
    costs: [0, 360, 520, 700, 880],
    maxLevel: 4,
  },
  acceleration: {
    label: "Acceleration",
    unit: "m/s²",
    base: 14,
    perLevel: 1.35,
    costs: [0, 340, 520, 690, 880],
    maxLevel: 4,
  },
  handling: {
    label: "Handling",
    unit: "deg/s",
    base: 1.6,
    perLevel: 0.18,
    costs: [0, 320, 480, 650, 820],
    maxLevel: 4,
  },
  nitro: {
    label: "Nitro Reserve",
    unit: "units",
    base: 60,
    perLevel: 18,
    costs: [0, 300, 460, 620, 780],
    maxLevel: 4,
    boostBase: 12,
    boostPerLevel: 1.1,
  },
};

const START_OFFSETS = [
  { x: 0, z: 4 },
  { x: 0, z: -4 },
  { x: -6, z: 4 },
  { x: -6, z: -4 },
];

const keyState = new Set();
window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
    e.preventDefault();
  }
  keyState.add(e.code);
});
window.addEventListener("keyup", (e) => {
  keyState.delete(e.code);
});

window.addEventListener("resize", onWindowResize);

const racers = [
  createRacer({ name: "Rally Red", color: 0xff3b3b, isPlayer: true }),
  createRacer({ name: "Sunburst", color: 0xffe55c, aiSkill: 1 }),
  createRacer({ name: "Oceanic", color: 0x53a7ff, aiSkill: 1.05 }),
  createRacer({ name: "Driven", color: 0xf3f4ff, aiSkill: 1.1 }),
];

const player = racers[0];

let currentTrackIndex = 0;
let currentTrack = null;
let raceStarted = false;
let raceCountdown = 3;
let raceClock = 0;
let raceFinished = false;
let raceResults = [];
let itemRewardsPending = 0;
let playerCredits = 0;
let playerUpgrades = { topSpeed: 0, acceleration: 0, handling: 0, nitro: 0 };
let lastFrame = 0;
let finishDelayTimer = 0;

loadTrack(TRACKS[currentTrackIndex]);
resetGrid();
updateLeaderboard();
ui.message.textContent = `Welcome to Turbo Stadium Rally! Track: ${TRACKS[currentTrackIndex].name}`;

animate(performance.now());

ui.resultsContinue.addEventListener("click", () => {
  ui.results.classList.add("hidden");
  playerCredits += itemRewardsPending;
  itemRewardsPending = 0;
  if (currentTrackIndex < TRACKS.length - 1) {
    openShop();
  } else {
    showFinale();
  }
});

ui.shopContinue.addEventListener("click", () => {
  ui.shop.classList.add("hidden");
  advanceTrack();
});

function createIsometricCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 230;
  const camera = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    -frustumSize / 2,
    1,
    600
  );
  camera.position.set(160, 220, 160);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  return camera;
}

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 230;
  camera.left = (-frustumSize * aspect) / 2;
  camera.right = (frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = -frustumSize / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function createRacer({ name, color, isPlayer = false, aiSkill = 1 }) {
  const group = new THREE.Group();
  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 2, 10),
    new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.65 })
  );
  chassis.position.y = 1.2;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(5, 1.6, 4.5),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color * 0.0002 })
  );
  cab.position.set(0, 2.2, -1.3);
  cab.castShadow = true;
  group.add(cab);

  const rollbar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 4.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x2f2f2f })
  );
  rollbar.rotation.z = Math.PI / 2;
  rollbar.position.set(0, 2.3, 1.5);
  group.add(rollbar);

  const wheelGeo = new THREE.CylinderGeometry(1.1, 1.1, 1.2, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f1f24, roughness: 0.9 });
  const wheelPositions = [
    [-2.4, 0.8, 3.5],
    [2.4, 0.8, 3.5],
    [-2.4, 0.8, -3.5],
    [2.4, 0.8, -3.5],
  ];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    group.add(wheel);
  }

  group.castShadow = true;
  group.receiveShadow = true;
  scene.add(group);

  return {
    name,
    mesh: group,
    color,
    isPlayer,
    aiSkill,
    position: new THREE.Vector2(),
    heading: 0,
    speed: 0,
    lap: 0,
    finished: false,
    finishTime: Infinity,
    nextCheckpoint: 0,
    nitroReserve: 0,
    nitroActive: false,
    stats: getBaseStats(aiSkill, isPlayer),
    bonusCredits: 0,
  };
}

function getBaseStats(aiSkill = 1, isPlayer = false) {
  if (isPlayer) {
    return computePlayerStats();
  }
  return {
    topSpeed: 28 * aiSkill,
    acceleration: 12 * aiSkill,
    handling: 1.4 * aiSkill,
    nitroCapacity: 45,
    nitroPower: 10,
  };
}

function computePlayerStats() {
  const stats = {
    topSpeed: UPGRADE_CONFIG.topSpeed.base + UPGRADE_CONFIG.topSpeed.perLevel * playerUpgrades.topSpeed,
    acceleration:
      UPGRADE_CONFIG.acceleration.base +
      UPGRADE_CONFIG.acceleration.perLevel * playerUpgrades.acceleration,
    handling: UPGRADE_CONFIG.handling.base + UPGRADE_CONFIG.handling.perLevel * playerUpgrades.handling,
    nitroCapacity: UPGRADE_CONFIG.nitro.base + UPGRADE_CONFIG.nitro.perLevel * playerUpgrades.nitro,
    nitroPower: UPGRADE_CONFIG.nitro.boostBase +
      UPGRADE_CONFIG.nitro.boostPerLevel * playerUpgrades.nitro,
  };
  return stats;
}

function loadTrack(trackData) {
  currentTrack = {
    ...trackData,
    bounds: calculateBounds(trackData.walls),
  };

  clearGroup(groundGroup);
  clearGroup(itemGroup);
  clearGroup(obstacleGroup);
  clearGroup(rampGroup);
  clearGroup(wallGroup);

  const baseMat = new THREE.MeshStandardMaterial({
    color: trackData.color,
    roughness: 0.9,
    metalness: 0.05,
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(160, 4, 100), baseMat);
  base.position.y = -2.5;
  base.receiveShadow = true;
  groundGroup.add(base);

  const centerMat = new THREE.MeshStandardMaterial({
    color: 0x784a2f,
    roughness: 0.85,
  });
  const center = new THREE.Mesh(new THREE.BoxGeometry(140, 1.5, 85), centerMat);
  center.position.y = -1.2;
  center.receiveShadow = true;
  groundGroup.add(center);

  const markingsMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
  const markings = new THREE.Mesh(new THREE.PlaneGeometry(140, 85, 4, 4), markingsMat);
  markings.rotation.x = -Math.PI / 2;
  markings.position.y = 0.05;
  groundGroup.add(markings);

  for (const wall of trackData.walls) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(wall.w, 8, wall.h),
      new THREE.MeshStandardMaterial({ color: 0x1b1f2c, roughness: 0.7 })
    );
    mesh.position.set(wall.x + wall.w / 2, 4, wall.z + wall.h / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    wallGroup.add(mesh);
  }

  for (const ramp of trackData.ramps ?? []) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(ramp.w, ramp.h, ramp.d),
      new THREE.MeshStandardMaterial({ color: 0xc2763e, roughness: 0.8 })
    );
    mesh.position.set(ramp.x, ramp.h / 2, ramp.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    rampGroup.add(mesh);
  }

  for (const obstacle of trackData.obstacles ?? []) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(obstacle.size / 2, obstacle.size, 4, 6),
      new THREE.MeshStandardMaterial({ color: 0x262b3a, roughness: 0.7 })
    );
    mesh.position.set(obstacle.x, 2, obstacle.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    obstacleGroup.add(mesh);
  }

  const startLine = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  startLine.rotation.x = -Math.PI / 2;
  startLine.position.set(trackData.checkpoints[0].x - 5, 0.1, trackData.checkpoints[0].z);
  groundGroup.add(startLine);

  spawnItems(trackData.items);
}

function calculateBounds(walls) {
  const xs = [];
  const zs = [];
  for (const wall of walls) {
    xs.push(wall.x, wall.x + wall.w);
    zs.push(wall.z, wall.z + wall.h);
  }
  return {
    minX: Math.min(...xs) + 3,
    maxX: Math.max(...xs) - 3,
    minZ: Math.min(...zs) + 3,
    maxZ: Math.max(...zs) - 3,
  };
}

function spawnItems(items) {
  clearGroup(itemGroup);
  const geometryCash = new THREE.DodecahedronGeometry(1.4, 0);
  const geometryNitro = new THREE.ConeGeometry(1.2, 2.6, 8);
  const matCash = new THREE.MeshStandardMaterial({ color: 0xffd35b, emissive: 0x332000, emissiveIntensity: 0.6 });
  const matNitro = new THREE.MeshStandardMaterial({ color: 0x57f0ff, emissive: 0x1f3640, emissiveIntensity: 0.5 });

  for (const item of items) {
    const mesh = new THREE.Mesh(
      item.type === "cash" ? geometryCash : geometryNitro,
      item.type === "cash" ? matCash : matNitro
    );
    const baseHeight = item.type === "cash" ? 1.5 : 2;
    mesh.position.set(item.x, baseHeight, item.z);
    mesh.castShadow = true;
    mesh.userData = { type: item.type, active: true, baseY: baseHeight };
    itemGroup.add(mesh);
  }
}

function resetGrid() {
  const start = TRACKS[currentTrackIndex].checkpoints[0];
  racers.forEach((racer, index) => {
    const offset = START_OFFSETS[index];
    const position = {
      x: start.x - 12 + offset.x,
      z: start.z + offset.z,
    };
    racer.position.set(position.x, position.z);
    racer.mesh.position.set(position.x, 0, position.z);
    racer.heading = 0;
    racer.mesh.rotation.y = Math.PI / 2;
    racer.speed = 0;
    racer.lap = 0;
    racer.finished = false;
    racer.finishTime = Infinity;
    racer.nextCheckpoint = 0;
    racer.nitroReserve = racer.isPlayer ? computePlayerStats().nitroCapacity : 50;
    racer.nitroActive = false;
    racer.bonusCredits = 0;
    racer.stats = getBaseStats(racer.aiSkill, racer.isPlayer);
  });

  itemRewardsPending = 0;
  raceStarted = false;
  raceCountdown = 3;
  raceClock = 0;
  raceFinished = false;
  raceResults = [];
  finishDelayTimer = 0;
  lastFrame = performance.now();
  updateUI();
}

function animate(time) {
  requestAnimationFrame(animate);

  const rawDelta = ((time - lastFrame) || 0) / 1000;
  const delta = Math.min(0.05, Math.max(0, rawDelta));
  lastFrame = time;

  if (!raceFinished) {
    if (!raceStarted) {
      raceCountdown -= delta;
      ui.message.textContent = raceCountdown > 0
        ? `Track: ${TRACKS[currentTrackIndex].name} — Race starts in ${Math.ceil(raceCountdown)}...`
        : "Green flag! Hammer down!";
      if (raceCountdown <= 0) {
        raceStarted = true;
        ui.message.textContent = "Green flag! Hammer down!";
      }
    } else {
      raceClock += delta;
      updateRacers(delta);
      updateItems(delta);
      updateUI();
      checkRaceCompletion(delta);
    }
  }

  renderer.render(scene, camera);
}

function updateRacers(dt) {
  const track = TRACKS[currentTrackIndex];
  for (const racer of racers) {
    if (racer.finished) {
      continue;
    }

    let accelInput = 0;
    let turnInput = 0;
    let brakeInput = 0;
    let wantsNitro = false;

    if (racer.isPlayer) {
      accelInput = (keyState.has("ArrowUp") || keyState.has("KeyW")) ? 1 : 0;
      brakeInput = (keyState.has("ArrowDown") || keyState.has("KeyS")) ? 1 : 0;
      turnInput = 0;
      if (keyState.has("ArrowLeft") || keyState.has("KeyA")) turnInput -= 1;
      if (keyState.has("ArrowRight") || keyState.has("KeyD")) turnInput += 1;
      wantsNitro = keyState.has("ShiftLeft") || keyState.has("ShiftRight") || keyState.has("Space");
    } else {
      const target = track.checkpoints[racer.nextCheckpoint];
      const desired = Math.atan2(target.z - racer.position.y, target.x - racer.position.x);
      let headingDiff = normalizeAngle(desired - racer.heading);
      turnInput = THREE.MathUtils.clamp(headingDiff * 1.6, -1.2, 1.2);
      const preferredSpeed = racer.stats.topSpeed * 0.9;
      accelInput = racer.speed < preferredSpeed ? 1 : 0.1;
      brakeInput = Math.abs(headingDiff) > 1.6 ? 0.9 : 0;
      wantsNitro = Math.abs(headingDiff) < 0.6 && racer.nitroReserve > 5 && Math.random() < 0.01;
    }

    applyDrivingModel(racer, dt, accelInput, brakeInput, turnInput, wantsNitro);
    applyTrackInteractions(racer, dt);
    updateCheckpointProgress(racer, dt);
    racer.mesh.position.set(racer.position.x, computeHeight(racer), racer.position.y);
    racer.mesh.rotation.y = -racer.heading + Math.PI / 2;
  }
}

function applyDrivingModel(racer, dt, accelInput, brakeInput, turnInput, wantsNitro) {
  const stats = racer.isPlayer ? computePlayerStats() : racer.stats;
  racer.stats = stats;
  if (stats.nitroCapacity && racer.nitroReserve > stats.nitroCapacity) {
    racer.nitroReserve = stats.nitroCapacity;
  }

  const maxSpeed = stats.topSpeed + (racer.nitroActive ? stats.nitroPower : 0);
  const accelForce = stats.acceleration * accelInput;
  const brakeForce = stats.acceleration * 1.4 * brakeInput;

  if (accelInput > 0) {
    racer.speed += accelForce * dt;
  }
  if (brakeInput > 0) {
    racer.speed -= brakeForce * dt;
  }

  const drag = 3.2 + Math.abs(racer.speed) * 0.55;
  if (accelInput === 0 && brakeInput === 0) {
    const dragAmount = drag * dt;
    if (Math.abs(racer.speed) <= dragAmount) {
      racer.speed = 0;
    } else {
      racer.speed -= Math.sign(racer.speed) * dragAmount;
    }
  }

  racer.speed = THREE.MathUtils.clamp(racer.speed, -maxSpeed * 0.35, maxSpeed);

  const turnStrength = stats.handling * (0.35 + Math.min(Math.abs(racer.speed) / maxSpeed, 1));
  racer.heading += turnInput * turnStrength * dt;
  racer.heading = normalizeAngle(racer.heading);

  if ((wantsNitro || racer.nitroActive) && racer.nitroReserve > 0) {
    racer.nitroActive = true;
    const usage = 18 * dt;
    racer.nitroReserve = Math.max(0, racer.nitroReserve - usage);
    if (racer.nitroReserve === 0) {
      racer.nitroActive = false;
    }
  } else {
    racer.nitroActive = false;
  }

  const forwardX = Math.cos(racer.heading);
  const forwardZ = Math.sin(racer.heading);
  racer.position.x += forwardX * racer.speed * dt;
  racer.position.y += forwardZ * racer.speed * dt;
}

function applyTrackInteractions(racer, dt) {
  const bounds = currentTrack.bounds;
  const cushion = 4.5;
  if (racer.position.x < bounds.minX + cushion) {
    racer.position.x = bounds.minX + cushion;
    racer.speed *= -0.25;
  } else if (racer.position.x > bounds.maxX - cushion) {
    racer.position.x = bounds.maxX - cushion;
    racer.speed *= -0.25;
  }
  if (racer.position.y < bounds.minZ + cushion) {
    racer.position.y = bounds.minZ + cushion;
    racer.speed *= -0.25;
  } else if (racer.position.y > bounds.maxZ - cushion) {
    racer.position.y = bounds.maxZ - cushion;
    racer.speed *= -0.25;
  }

  for (const obstacle of currentTrack.obstacles ?? []) {
    const dx = racer.position.x - obstacle.x;
    const dz = racer.position.y - obstacle.z;
    const dist = Math.hypot(dx, dz);
    const radius = obstacle.size;
    if (dist < radius) {
      const push = (radius - dist) + 0.3;
      const nx = dx / (dist || 1);
      const nz = dz / (dist || 1);
      racer.position.x += nx * push * 0.5;
      racer.position.y += nz * push * 0.5;
      racer.speed *= 0.45;
    }
  }

  itemGroup.children.forEach((item) => {
    if (!item.userData.active || !racer.isPlayer) return;
    const dx = racer.position.x - item.position.x;
    const dz = racer.position.y - item.position.z;
    if (dx * dx + dz * dz < 9) {
      item.userData.active = false;
      item.visible = false;
      if (item.userData.type === "cash") {
        itemRewardsPending += ITEM_REWARDS.cash;
        ui.message.textContent = "Money bag snagged!";
      } else {
        player.nitroReserve = Math.min(
          player.nitroReserve + ITEM_REWARDS.nitro,
          computePlayerStats().nitroCapacity
        );
        ui.message.textContent = "Nitro can collected!";
      }
    }
  });
}

function updateItems(dt) {
  itemGroup.children.forEach((mesh) => {
    if (!mesh.userData.active) return;
    mesh.rotation.y += dt * 2;
    const bounce = Math.sin(performance.now() * 0.003 + mesh.position.x) * 0.4;
    mesh.position.y = (mesh.userData.baseY ?? 1.5) + bounce;
  });
}

function computeHeight(racer) {
  let y = 0.6 + Math.sin((raceClock + racer.position.x) * 2) * 0.03;
  for (const ramp of currentTrack.ramps ?? []) {
    const dx = (racer.position.x - ramp.x) / (ramp.w * 0.5);
    const dz = (racer.position.y - ramp.z) / (ramp.d * 0.5);
    const falloff = 1 - Math.min(1, Math.sqrt(dx * dx + dz * dz));
    if (falloff > 0) {
      y += ramp.h * 0.15 * falloff + Math.max(0, racer.speed * 0.02 * falloff);
    }
  }
  return y;
}

function updateCheckpointProgress(racer) {
  const track = TRACKS[currentTrackIndex];
  const checkpoints = track.checkpoints;
  const current = checkpoints[racer.nextCheckpoint];
  const dx = racer.position.x - current.x;
  const dz = racer.position.y - current.z;
  const threshold = 9;
  if (dx * dx + dz * dz < threshold) {
    racer.nextCheckpoint = (racer.nextCheckpoint + 1) % checkpoints.length;
    if (racer.nextCheckpoint === 0) {
      racer.lap += 1;
      if (racer.lap >= LAPS_PER_RACE) {
        racer.finished = true;
        racer.finishTime = raceClock;
        raceResults.push(racer);
      }
    }
  }
}

function updateUI() {
  ui.lap.textContent = Math.min(player.lap + 1, LAPS_PER_RACE);
  ui.speed.textContent = `${Math.abs(player.speed).toFixed(1)}`;
  ui.nitro.textContent = `${Math.round((player.nitroReserve / computePlayerStats().nitroCapacity) * 100)}%`;
  ui.credits.textContent = `${playerCredits}`;
  updateLeaderboard();
}

function updateLeaderboard() {
  const entries = racers
    .slice()
    .sort((a, b) => computeProgress(b) - computeProgress(a))
    .map((racer, idx) => ({ racer, place: idx + 1 }));

  const playerEntry = entries.find((entry) => entry.racer === player);
  if (playerEntry) {
    ui.position.textContent = ordinal(playerEntry.place);
  }

  ui.leaderboard.innerHTML = "<h3>Race Order</h3>";
  const list = document.createElement("ul");
  entries.forEach(({ racer, place }) => {
    const li = document.createElement("li");
    const lapText = racer.finished ? "Finished" : `Lap ${Math.min(racer.lap + 1, LAPS_PER_RACE)}`;
    li.innerHTML = `<span>${place}. ${racer.name}</span><span>${lapText}</span>`;
    list.appendChild(li);
  });
  ui.leaderboard.appendChild(list);
}

function computeProgress(racer) {
  if (racer.finished) {
    return LAPS_PER_RACE + 1 - racer.finishTime * 0.001;
  }
  const track = TRACKS[currentTrackIndex];
  const checkpoints = track.checkpoints;
  const currentIndex = racer.nextCheckpoint;
  const prevIndex = (currentIndex - 1 + checkpoints.length) % checkpoints.length;
  const current = checkpoints[currentIndex];
  const previous = checkpoints[prevIndex];
  const segmentLength = Math.hypot(current.x - previous.x, current.z - previous.z) || 1;
  const distToCurrent = Math.hypot(current.x - racer.position.x, current.z - racer.position.y);
  const segmentProgress = 1 - THREE.MathUtils.clamp(distToCurrent / segmentLength, 0, 1);
  return racer.lap + (prevIndex + segmentProgress) / checkpoints.length;
}

function checkRaceCompletion(dt) {
  const everyoneFinished = racers.every((racer) => racer.finished);
  if (player.finished) {
    finishDelayTimer += dt;
  }
  if (!raceFinished && (everyoneFinished || finishDelayTimer > 8)) {
    raceFinished = true;
    finalizeRace();
  }
}

function finalizeRace() {
  ui.message.textContent = "Race complete!";
  const placements = racers
    .slice()
    .sort((a, b) => computeProgress(b) - computeProgress(a));
  ui.resultsList.innerHTML = "";
  placements.forEach((racer, idx) => {
    const li = document.createElement("li");
    const finish = racer.finished ? `${racer.finishTime.toFixed(1)}s` : "DNF";
    li.textContent = `${idx + 1}. ${racer.name} — ${finish}`;
    ui.resultsList.appendChild(li);
  });

  const playerPlacement = placements.findIndex((r) => r === player);
  const payout = RACE_PAYOUTS[playerPlacement] ?? 0;
  playerCredits += payout;
  ui.payout.textContent = `You earned ${payout} credits for finishing ${ordinal(
    playerPlacement + 1
  )}! Bonus pickups pending: ${itemRewardsPending} credits.`;
  updateUI();
  ui.results.classList.remove("hidden");
}

function openShop() {
  ui.shopCredits.textContent = `Available credits: ${playerCredits}`;
  ui.upgrades.innerHTML = "";
  Object.entries(UPGRADE_CONFIG).forEach(([key, config]) => {
    const level = playerUpgrades[key];
    const nextLevel = Math.min(level + 1, config.maxLevel);
    const button = document.createElement("button");
    button.textContent = level >= config.maxLevel
      ? "Maxed"
      : `Buy (${config.costs[nextLevel]} cr)`;
    button.disabled = level >= config.maxLevel || playerCredits < config.costs[nextLevel];
    button.addEventListener("click", () => {
      if (playerCredits >= config.costs[nextLevel] && level < config.maxLevel) {
        playerCredits -= config.costs[nextLevel];
        playerUpgrades[key] += 1;
        ui.shopCredits.textContent = `Available credits: ${playerCredits}`;
        updateUI();
        openShop();
      }
    });

    const stats = document.createElement("div");
    stats.className = "upgrade-row";
    const statValue =
      config.label === "Nitro Reserve"
        ? `${UPGRADE_CONFIG.nitro.base + playerUpgrades.nitro * UPGRADE_CONFIG.nitro.perLevel}${config.unit}`
        : `${(UPGRADE_CONFIG[key].base + playerUpgrades[key] * UPGRADE_CONFIG[key].perLevel).toFixed(1)}${config.unit}`;
    const nextValue = level >= config.maxLevel
      ? "MAX"
      : config.label === "Nitro Reserve"
      ? `${(UPGRADE_CONFIG.nitro.base + (playerUpgrades.nitro + 1) * UPGRADE_CONFIG.nitro.perLevel)}${config.unit}`
      : `${(UPGRADE_CONFIG[key].base + (playerUpgrades[key] + 1) * UPGRADE_CONFIG[key].perLevel).toFixed(1)}${config.unit}`;

    stats.innerHTML = `
      <div>
        <strong>${config.label}</strong><br/>
        Level ${level}/${config.maxLevel} → ${nextValue} (now ${statValue})
      </div>
    `;
    stats.appendChild(button);
    ui.upgrades.appendChild(stats);
  });

  ui.shop.classList.remove("hidden");
}

function advanceTrack() {
  currentTrackIndex += 1;
  if (currentTrackIndex >= TRACKS.length) {
    showFinale();
    return;
  }
  loadTrack(TRACKS[currentTrackIndex]);
  resetGrid();
  raceStarted = false;
  ui.message.textContent = `Track: ${TRACKS[currentTrackIndex].name} — Ready up!`;
}

function showFinale() {
  ui.shop.classList.add("hidden");
  ui.results.classList.add("hidden");
  ui.message.textContent = `Championship complete! Final bankroll: ${playerCredits} credits.`;
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children[group.children.length - 1];
    group.remove(child);
    child.geometry?.dispose?.();
    child.material?.dispose?.();
  }
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}