import { useId, type RefObject } from 'react';

import { BODY_SPOTS, HEAD_SPOTS, type SealSpot } from './sealSpots';

export interface SealPartRefs {
  figure: RefObject<SVGGElement | null>;
  head: RefObject<SVGGElement | null>;
  tail: RefObject<SVGGElement | null>;
  flipper: RefObject<SVGGElement | null>;
  shadow: RefObject<SVGEllipseElement | null>;
  leftEye: RefObject<SVGGElement | null>;
  rightEye: RefObject<SVGGElement | null>;
}

interface SealProps {
  parts: SealPartRefs;
  className?: string;
}

const BODY_PATH =
  'M70 190 C 100 158, 148 112, 196 100 C 218 94, 232 86, 246 74 L 300 150 C 314 178, 302 210, 270 224 C 220 238, 140 236, 98 224 C 84 220, 72 214, 66 206 C 63 200, 65 194, 70 190 Z';

const Spot = ({ spot }: { spot: SealSpot }) => (
  <ellipse
    className={spot.ring ? 'seal-spot-ring' : 'seal-spot'}
    cx={spot.x}
    cy={spot.y}
    rx={spot.ring ? spot.rx + 0.8 : spot.rx}
    ry={spot.ring ? spot.ry + 0.6 : spot.ry}
    transform={`rotate(${spot.rotation} ${spot.x} ${spot.y})`}
  />
);

const Eye = ({
  eyeRef,
  x,
}: {
  eyeRef: RefObject<SVGGElement | null>;
  x: number;
}) => (
  <g transform={`translate(${x} 103)`}>
    <g ref={eyeRef} data-part="eye">
      <ellipse className="seal-eye" rx="12" ry="13" />
      <circle className="seal-eye-shine" cx="4.5" cy="-5.5" r="4.4" />
      <circle className="seal-eye-shine-soft" cx="-3.5" cy="5.5" r="1.9" />
    </g>
  </g>
);

/**
 * Hand-drawn harbor seal (Phoca vitulina): spotted silver-grey coat, no ear
 * flaps, short muzzle with whisker pads and the species' V-shaped nostrils.
 * Movable parts are exposed through refs so the animation loop can transform
 * them without re-rendering React.
 */
export const Seal = ({ parts, className }: SealProps) => {
  const id = useId();
  const ids = {
    coat: `${id}-coat`,
    head: `${id}-head`,
    belly: `${id}-belly`,
    cheek: `${id}-cheek`,
    floe: `${id}-floe`,
    clip: `${id}-clip`,
  };

  return (
    <svg
      className={className}
      viewBox="0 0 400 290"
      role="img"
      aria-label="A cartoon harbor seal lying on its belly on an ice floe"
    >
      <defs>
        <linearGradient id={ids.coat} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="seal-stop-coat-top" />
          <stop offset="0.5" className="seal-stop-coat-middle" />
          <stop offset="1" className="seal-stop-coat-bottom" />
        </linearGradient>
        <radialGradient id={ids.head} cx="0.42" cy="0.32" r="0.78">
          <stop offset="0" className="seal-stop-head-light" />
          <stop offset="0.65" className="seal-stop-head-middle" />
          <stop offset="1" className="seal-stop-head-dark" />
        </radialGradient>
        <radialGradient id={ids.belly} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" className="seal-stop-belly-light" />
          <stop offset="0.6" className="seal-stop-belly" />
          <stop offset="1" className="seal-stop-belly seal-stop-transparent" />
        </radialGradient>
        <radialGradient id={ids.cheek} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" className="seal-stop-blush" />
          <stop offset="1" className="seal-stop-blush seal-stop-transparent" />
        </radialGradient>
        <radialGradient id={ids.floe} cx="0.5" cy="0.15" r="0.9">
          <stop offset="0" className="seal-stop-floe-top" />
          <stop offset="0.55" className="seal-stop-floe-middle" />
          <stop offset="1" className="seal-stop-floe-edge" />
        </radialGradient>
        <clipPath id={ids.clip}>
          <path d={BODY_PATH} />
        </clipPath>
      </defs>

      <g aria-hidden="true">
        <ellipse
          className="seal-floe-side"
          cx="192"
          cy="252"
          rx="182"
          ry="26"
        />
        <ellipse
          cx="192"
          cy="244"
          rx="182"
          ry="26"
          fill={`url(#${ids.floe})`}
        />
        <path
          className="seal-floe-glint"
          d="M70 248 q 30 6 64 4 M 270 238 q 26 4 46 1"
        />
      </g>

      <ellipse
        ref={parts.shadow}
        data-part="shadow"
        className="seal-shadow"
        cx="185"
        cy="236"
        rx="150"
        ry="11"
      />

      <g ref={parts.figure} data-part="figure">
        <g ref={parts.tail} data-part="tail">
          <path
            className="seal-flipper-far"
            d="M78 186 C 62 174, 46 158, 34 142 Q 30 135 24 139 Q 17 139 17 146 Q 11 149 13 156 Q 8 161 12 167 C 34 178, 56 190, 80 198 Z"
          />
          <path
            className="seal-flipper"
            d="M80 196 C 58 192, 36 186, 16 179 Q 8 179 8 186 Q 3 191 7 197 Q 4 203 10 206 Q 9 213 16 212 C 38 212, 60 210, 84 208 Z"
          />
          <path
            className="seal-flipper-lines"
            d="M18 186 L 46 192 M 14 198 L 46 200 M 16 208 L 46 206 M 26 145 L 50 168 M 18 155 L 44 174"
          />
        </g>

        <path d={BODY_PATH} fill={`url(#${ids.coat})`} />
        <g clipPath={`url(#${ids.clip})`}>
          <ellipse
            cx="195"
            cy="232"
            rx="150"
            ry="34"
            fill={`url(#${ids.belly})`}
          />
          {BODY_SPOTS.map((spot) => (
            <Spot key={`${spot.x}-${spot.y}`} spot={spot} />
          ))}
        </g>

        <g ref={parts.flipper} data-part="flipper">
          <path
            className="seal-flipper"
            d="M232 196 C 246 202, 260 212, 266 226 C 269 234, 262 238, 254 235 C 243 230, 233 220, 226 208 C 223 202, 226 194, 232 196 Z"
          />
          <path
            className="seal-claws"
            d="M256 232 q 3 3 7 2 M 260 228 q 3 3 7 2 M 263 224 q 2 3 6 3"
          />
        </g>

        <g ref={parts.head} data-part="head">
          <ellipse
            cx="290"
            cy="110"
            rx="60"
            ry="56"
            fill={`url(#${ids.head})`}
          />
          {HEAD_SPOTS.map((spot) => (
            <Spot key={`${spot.x}-${spot.y}`} spot={spot} />
          ))}
          <circle className="seal-ear" cx="237" cy="112" r="2" />

          <Eye eyeRef={parts.leftEye} x={266} />
          <Eye eyeRef={parts.rightEye} x={316} />

          <path
            className="seal-whiskers seal-brows"
            d="M258 86 q -4 -7 -10 -10 M 262 84 q -2 -8 -6 -12 M 322 84 q 2 -8 6 -12 M 326 86 q 4 -7 10 -10"
          />
          <ellipse
            cx="248"
            cy="128"
            rx="13"
            ry="8"
            fill={`url(#${ids.cheek})`}
          />
          <ellipse
            cx="334"
            cy="128"
            rx="13"
            ry="8"
            fill={`url(#${ids.cheek})`}
          />

          <ellipse
            className="seal-muzzle"
            cx="281"
            cy="134"
            rx="15.5"
            ry="12.5"
          />
          <ellipse
            className="seal-muzzle"
            cx="301"
            cy="134"
            rx="15.5"
            ry="12.5"
          />
          <g className="seal-whisker-dots">
            <circle cx="276" cy="131" r="1.2" />
            <circle cx="283" cy="136" r="1.2" />
            <circle cx="274" cy="138" r="1.2" />
            <circle cx="306" cy="131" r="1.2" />
            <circle cx="299" cy="136" r="1.2" />
            <circle cx="308" cy="138" r="1.2" />
          </g>

          <path
            className="seal-nose"
            d="M283 121 C 287 118.5, 295 118.5, 299 121 C 298 127, 294 131, 291 132 C 288 131, 284 127, 283 121 Z"
          />
          <path
            className="seal-nostrils"
            d="M286.5 122 L 290 128 M 295.5 122 L 292 128"
          />
          <ellipse
            className="seal-nose-shine"
            cx="289"
            cy="121.5"
            rx="3"
            ry="1.2"
          />
          <path
            className="seal-mouth"
            d="M284 146 C 287 150, 291 150, 291 146 C 291 150, 295 150, 298 146"
          />
          <path
            className="seal-whiskers"
            d="M270 131 C 256 127, 244 127, 232 129 M270 136 C 256 136, 244 139, 234 144 M271 141 C 260 145, 250 151, 242 157 M312 131 C 326 127, 338 127, 350 129 M312 136 C 326 136, 338 139, 348 144 M311 141 C 322 145, 332 151, 340 157"
          />
        </g>
      </g>
    </svg>
  );
};
