export const TRACKS = [
  {
    name: "Dust Bowl Dome",
    color: 0x4f2f1c,
    walls: [
      { x: -60, z: -35, w: 120, h: 6 },
      { x: -60, z: 35, w: 120, h: 6 },
      { x: -60, z: -35, w: 6, h: 70 },
      { x: 54, z: -35, w: 6, h: 70 },
    ],
    checkpoints: [
      { x: -40, z: 0 },
      { x: -10, z: -20 },
      { x: 30, z: -5 },
      { x: 20, z: 20 },
      { x: -10, z: 15 },
    ],
    ramps: [
      { x: -15, z: -8, w: 16, d: 12, h: 5 },
      { x: 18, z: 12, w: 12, d: 10, h: 4 },
    ],
    obstacles: [
      { x: -15, z: 6, size: 6 },
      { x: 12, z: -15, size: 7 },
    ],
    items: [
      { x: -25, z: -5, type: "cash" },
      { x: 10, z: -10, type: "nitro" },
      { x: 25, z: 10, type: "cash" },
    ],
  },
  {
    name: "Thunderloop Arena",
    color: 0x3f3d2f,
    walls: [
      { x: -65, z: -40, w: 130, h: 6 },
      { x: -65, z: 40, w: 130, h: 6 },
      { x: -65, z: -40, w: 6, h: 80 },
      { x: 59, z: -40, w: 6, h: 80 },
    ],
    checkpoints: [
      { x: -45, z: -10 },
      { x: -10, z: -30 },
      { x: 35, z: -25 },
      { x: 10, z: 10 },
      { x: -20, z: 25 },
    ],
    ramps: [
      { x: -30, z: -18, w: 14, d: 11, h: 4 },
      { x: 12, z: 15, w: 12, d: 12, h: 5 },
    ],
    obstacles: [
      { x: -32, z: 8, size: 7 },
      { x: 25, z: -12, size: 6 },
      { x: -5, z: 20, size: 5 },
    ],
    items: [
      { x: -30, z: -15, type: "cash" },
      { x: 5, z: -20, type: "nitro" },
      { x: 20, z: 5, type: "cash" },
      { x: -15, z: 20, type: "nitro" },
    ],
  },
  {
    name: "Silt Storm Pavilion",
    color: 0x2f4438,
    walls: [
      { x: -70, z: -45, w: 140, h: 6 },
      { x: -70, z: 45, w: 140, h: 6 },
      { x: -70, z: -45, w: 6, h: 90 },
      { x: 64, z: -45, w: 6, h: 90 },
    ],
    checkpoints: [
      { x: -50, z: 15 },
      { x: -15, z: -20 },
      { x: 25, z: -30 },
      { x: 40, z: 10 },
      { x: 5, z: 30 },
    ],
    ramps: [
      { x: -35, z: 10, w: 16, d: 10, h: 5 },
      { x: 30, z: -15, w: 14, d: 11, h: 4 },
    ],
    obstacles: [
      { x: -45, z: -5, size: 6 },
      { x: -5, z: -12, size: 7 },
      { x: 18, z: 18, size: 6 },
    ],
    items: [
      { x: -40, z: 5, type: "nitro" },
      { x: -5, z: -15, type: "cash" },
      { x: 25, z: -10, type: "cash" },
      { x: 10, z: 20, type: "nitro" },
    ],
  },
  {
    name: "Granite Gauntlet",
    color: 0x3a2f47,
    walls: [
      { x: -75, z: -42, w: 150, h: 6 },
      { x: -75, z: 42, w: 150, h: 6 },
      { x: -75, z: -42, w: 6, h: 84 },
      { x: 69, z: -42, w: 6, h: 84 },
    ],
    checkpoints: [
      { x: -55, z: 0 },
      { x: -20, z: -25 },
      { x: 25, z: -35 },
      { x: 35, z: 0 },
      { x: 0, z: 28 },
    ],
    ramps: [
      { x: -25, z: -20, w: 14, d: 12, h: 5 },
      { x: 20, z: 5, w: 12, d: 9, h: 4 },
    ],
    obstacles: [
      { x: -45, z: 10, size: 7 },
      { x: -5, z: -25, size: 6 },
      { x: 18, z: 15, size: 7 },
    ],
    items: [
      { x: -45, z: -5, type: "cash" },
      { x: -15, z: -20, type: "nitro" },
      { x: 20, z: -15, type: "cash" },
      { x: 10, z: 15, type: "nitro" },
    ],
  },
  {
    name: "Nitro Nexus Coliseum",
    color: 0x353b48,
    walls: [
      { x: -80, z: -46, w: 160, h: 6 },
      { x: -80, z: 46, w: 160, h: 6 },
      { x: -80, z: -46, w: 6, h: 92 },
      { x: 74, z: -46, w: 6, h: 92 },
    ],
    checkpoints: [
      { x: -60, z: 10 },
      { x: -25, z: -30 },
      { x: 15, z: -40 },
      { x: 45, z: -5 },
      { x: 10, z: 35 },
    ],
    ramps: [
      { x: -45, z: 12, w: 18, d: 12, h: 6 },
      { x: 15, z: -25, w: 14, d: 11, h: 5 },
      { x: 30, z: 10, w: 12, d: 9, h: 4 },
    ],
    obstacles: [
      { x: -55, z: -5, size: 7 },
      { x: -10, z: -30, size: 6 },
      { x: 15, z: -10, size: 7 },
      { x: 0, z: 25, size: 6 },
    ],
    items: [
      { x: -50, z: 5, type: "nitro" },
      { x: -10, z: -25, type: "cash" },
      { x: 15, z: -20, type: "nitro" },
      { x: 20, z: 15, type: "cash" },
      { x: -5, z: 30, type: "nitro" },
    ],
  },
];

export const LAPS_PER_RACE = 6;
export const RACE_PAYOUTS = [700, 500, 350, 220];
export const ITEM_REWARDS = {
  cash: 80,
  nitro: 35,
};