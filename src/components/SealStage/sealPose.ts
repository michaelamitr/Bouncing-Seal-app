import type { BeatFrame } from '../../audio/types.ts';

export interface SealPose {
  /** Vertical offset of the whole seal in SVG units (negative = up). */
  hop: number;
  scaleX: number;
  scaleY: number;
  headTilt: number;
  headLift: number;
  tailAngle: number;
  flipperAngle: number;
  shadowScale: number;
  shadowOpacity: number;
  /** Eye openness, 1 = open, ~0 = closed. */
  eyeOpen: number;
}

export interface SealPoseInput {
  beat: BeatFrame | null;
  isPlaying: boolean;
  /** Wall-clock seconds, used for idle breathing and blinking. */
  time: number;
  reducedMotion: boolean;
}

/** Above this tempo the seal hops on every other beat — nobody galumphs at 170. */
export const HALF_TIME_ABOVE_BPM = 140;

const BLINK_EVERY_SECONDS = 4.3;
const BLINK_SECONDS = 0.16;

const blinkAt = (time: number) => {
  const sinceBlink = time % BLINK_EVERY_SECONDS;
  return sinceBlink < BLINK_SECONDS
    ? 1 - Math.sin((Math.PI * sinceBlink) / BLINK_SECONDS) * 0.92
    : 1;
};

const restingPose = (time: number, eyeOpen: number): SealPose => {
  const breath = Math.sin((2 * Math.PI * time) / 3.4);

  return {
    hop: 0,
    scaleX: 1 - breath * 0.006,
    scaleY: 1 + breath * 0.018,
    headTilt: Math.sin((2 * Math.PI * time) / 7) * 2.5,
    headLift: breath * -1.2,
    tailAngle: 4 + Math.sin((2 * Math.PI * time) / 5.2) * 3,
    flipperAngle: 0,
    shadowScale: 1,
    shadowOpacity: 1,
    eyeOpen,
  };
};

/**
 * Pure motion model of a harbor seal "galumphing" on its belly. The beat
 * lands on phase 0: the seal hits the ground (squash, flipper slap), springs
 * up through the beat and comes down exactly on the next one, nodding its
 * head left and right on alternate beats.
 */
export const computeSealPose = ({
  beat,
  isPlaying,
  time,
  reducedMotion,
}: SealPoseInput): SealPose => {
  const eyeOpen = blinkAt(time);

  if (!isPlaying) {
    return restingPose(time, eyeOpen);
  }

  if (!beat) {
    // Music is playing but the beat is not known yet: an attentive little sway.
    const sway = Math.sin(2 * Math.PI * time * 0.9);
    const pose = restingPose(time, eyeOpen);
    return { ...pose, headTilt: sway * 6, tailAngle: 8 + sway * 6 };
  }

  const isHalfTime = beat.bpm > HALF_TIME_ABOVE_BPM;
  const phase = isHalfTime
    ? ((((beat.beatIndex % 2) + 2) % 2) + beat.phase) / 2
    : beat.phase;
  const hopIndex = isHalfTime ? Math.floor(beat.beatIndex / 2) : beat.beatIndex;
  const side = hopIndex % 2 === 0 ? 1 : -1;

  const strength =
    (0.45 + 0.55 * Math.min(1, Math.max(0, beat.energy))) *
    (0.55 + 0.45 * Math.min(1, Math.max(0, beat.confidence))) *
    (reducedMotion ? 0.3 : 1);

  const airborne = 4 * phase * (1 - phase); // 0 on the beat, 1 mid-hop
  const impact = Math.exp(-phase / 0.07); // 1 right on the beat, fades fast
  const scaleY = 1 - 0.13 * strength * impact + 0.05 * strength * airborne;

  return {
    hop: -22 * strength * airborne,
    scaleX: 1 / Math.sqrt(scaleY),
    scaleY,
    headTilt: side * 7 * strength * Math.sin(Math.PI * phase),
    headLift: -7 * strength * airborne + 3 * strength * impact,
    tailAngle: 6 + 16 * strength * Math.sin(Math.PI * phase) ** 2,
    flipperAngle: -26 * strength * Math.exp(-phase / 0.14),
    shadowScale: 1 - 0.28 * strength * airborne,
    shadowOpacity: 1 - 0.45 * strength * airborne,
    eyeOpen,
  };
};

export interface SealTransforms {
  figure: string;
  head: string;
  tail: string;
  flipper: string;
  shadow: string;
  eyeScale: string;
}

/** Pivot points in the seal's SVG coordinate system. */
export const SEAL_PIVOTS = {
  ground: { x: 185, y: 232 },
  neck: { x: 262, y: 150 },
  tail: { x: 80, y: 196 },
  flipper: { x: 232, y: 200 },
} as const;

const round = (value: number) => Math.round(value * 1000) / 1000;

const scaleAround = (x: number, y: number, scaleX: number, scaleY: number) =>
  `translate(${x} ${y}) scale(${round(scaleX)} ${round(scaleY)}) translate(${-x} ${-y})`;

/** Turns a pose into SVG `transform` attribute values. */
export const toSealTransforms = (pose: SealPose): SealTransforms => {
  const { ground, neck, tail, flipper } = SEAL_PIVOTS;

  return {
    figure: `translate(0 ${round(pose.hop)}) ${scaleAround(ground.x, ground.y, pose.scaleX, pose.scaleY)}`,
    head: `rotate(${round(pose.headTilt)} ${neck.x} ${neck.y}) translate(0 ${round(pose.headLift)})`,
    tail: `rotate(${round(pose.tailAngle)} ${tail.x} ${tail.y})`,
    flipper: `rotate(${round(pose.flipperAngle)} ${flipper.x} ${flipper.y})`,
    shadow: scaleAround(ground.x, ground.y + 4, pose.shadowScale, 1),
    eyeScale: `scale(1 ${round(pose.eyeOpen)})`,
  };
};
