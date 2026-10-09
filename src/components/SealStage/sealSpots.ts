export interface SealSpot {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rotation: number;
  /** Harbor seals have a mix of solid spots and pale-centred rings. */
  ring?: boolean;
}

/** Pre-generated so the coat pattern is stable across renders. */
export const BODY_SPOTS: SealSpot[] = [
  { x: 228.2, y: 189.1, rx: 1.7, ry: 1.4, rotation: -24 },
  { x: 186.9, y: 161.3, rx: 2.7, ry: 2, rotation: 10 },
  { x: 104.6, y: 173.7, rx: 3.9, ry: 2.6, rotation: -12 },
  { x: 247.4, y: 173.1, rx: 4.5, ry: 3, rotation: -8 },
  { x: 137.4, y: 192.5, rx: 3.8, ry: 3.4, rotation: 14 },
  { x: 175, y: 154.7, rx: 3.2, ry: 2.4, rotation: -15 },
  { x: 162.1, y: 153.2, rx: 2.3, ry: 2.1, rotation: -21 },
  { x: 231.8, y: 143.6, rx: 2, ry: 1.6, rotation: -18 },
  { x: 213.7, y: 125.9, rx: 1.9, ry: 1.4, rotation: 24 },
  { x: 205.5, y: 135.9, rx: 1.7, ry: 1.4, rotation: -10 },
  { x: 169, y: 123, rx: 1.6, ry: 1.1, rotation: -26, ring: true },
  { x: 268, y: 177.6, rx: 2.7, ry: 1.8, rotation: 9 },
  { x: 146.3, y: 144.2, rx: 3, ry: 2.3, rotation: 8 },
  { x: 133, y: 141.5, rx: 3, ry: 2.4, rotation: 10 },
  { x: 228.6, y: 158.8, rx: 3.2, ry: 2.3, rotation: 12, ring: true },
  { x: 284, y: 189.5, rx: 2.1, ry: 1.6, rotation: -13 },
  { x: 109.8, y: 162.8, rx: 4.3, ry: 3.4, rotation: -25 },
  { x: 146.7, y: 167.9, rx: 4.5, ry: 3.8, rotation: -18 },
  { x: 215.2, y: 152.3, rx: 3, ry: 2.4, rotation: 16 },
  { x: 221.3, y: 178.9, rx: 3.6, ry: 2.5, rotation: 1 },
  { x: 158.5, y: 137.6, rx: 2.9, ry: 2.4, rotation: 4 },
  { x: 165.6, y: 184.3, rx: 3.3, ry: 2.2, rotation: 2 },
  { x: 255.6, y: 193.3, rx: 4.2, ry: 3.2, rotation: -9 },
  { x: 197.8, y: 116.5, rx: 3.4, ry: 2.8, rotation: -12 },
  { x: 197.4, y: 181.9, rx: 3.9, ry: 2.9, rotation: -30 },
  { x: 206.1, y: 162.8, rx: 4.3, ry: 3.8, rotation: -8 },
  { x: 183.1, y: 124.5, rx: 1.4, ry: 1, rotation: 4 },
  { x: 235.6, y: 170.6, rx: 2.8, ry: 2.3, rotation: -4 },
  { x: 120.5, y: 153, rx: 4.2, ry: 3.4, rotation: 8 },
  { x: 157.9, y: 194.7, rx: 4.3, ry: 3.5, rotation: -5 },
  { x: 220.2, y: 137.7, rx: 2.2, ry: 1.8, rotation: 21 },
  { x: 171.3, y: 194.1, rx: 2.6, ry: 1.7, rotation: 27, ring: true },
  { x: 205.5, y: 197.3, rx: 1.7, ry: 1.4, rotation: -2 },
  { x: 245.1, y: 186.2, rx: 2.1, ry: 1.8, rotation: -12 },
  { x: 186.2, y: 180.7, rx: 2.3, ry: 2, rotation: -2 },
  { x: 215.9, y: 189.6, rx: 2.1, ry: 1.7, rotation: 11 },
  { x: 179.2, y: 171.8, rx: 2, ry: 1.6, rotation: 20, ring: true },
  { x: 106.2, y: 185.6, rx: 2.5, ry: 2.2, rotation: 2 },
  { x: 218.6, y: 115.5, rx: 1.8, ry: 1.3, rotation: -26 },
  { x: 242.8, y: 159.1, rx: 1.5, ry: 1, rotation: 28 },
  { x: 86.5, y: 191.1, rx: 3.3, ry: 2.9, rotation: 5 },
  { x: 217.1, y: 167.5, rx: 3.1, ry: 2.2, rotation: 26 },
  { x: 148, y: 182.5, rx: 4.5, ry: 3.2, rotation: 18 },
  { x: 182.3, y: 145.5, rx: 2.4, ry: 1.9, rotation: 8 },
  { x: 258.2, y: 168, rx: 1.5, ry: 1.2, rotation: -22 },
  { x: 207.2, y: 107.4, rx: 2, ry: 1.3, rotation: 27 },
  { x: 128.2, y: 174.3, rx: 4.4, ry: 2.9, rotation: 10 },
  { x: 270.4, y: 194.4, rx: 2.7, ry: 1.8, rotation: -13 },
  { x: 117.3, y: 171.2, rx: 2.1, ry: 1.6, rotation: 26 },
  { x: 171.7, y: 134.1, rx: 1.7, ry: 1.4, rotation: -25 },
  { x: 140.4, y: 153.6, rx: 4.1, ry: 3.2, rotation: -27, ring: true },
  { x: 193.8, y: 198.9, rx: 4.5, ry: 3.7, rotation: -6 },
];

export const HEAD_SPOTS: SealSpot[] = [
  { x: 276, y: 62, rx: 3, ry: 2.2, rotation: 0 },
  { x: 302, y: 60, rx: 2.4, ry: 1.8, rotation: 0 },
  { x: 256, y: 72, rx: 2.6, ry: 2, rotation: 0 },
  { x: 326, y: 72, rx: 2.4, ry: 1.9, rotation: 0 },
  { x: 290, y: 74, rx: 1.8, ry: 1.4, rotation: 0 },
  { x: 240, y: 96, rx: 2.2, ry: 1.7, rotation: 0 },
];
