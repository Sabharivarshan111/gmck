import React, { useMemo } from 'react';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import {
  basis,
  project,
  surface,
  type Angles,
  type Vec3,
  type Vessel,
} from '@/lib/coronaryLab';

interface Props {
  vessels: Vessel[];
  selected: string;
  onSelect: (id: string) => void;
  angles: Angles;
  orbit: Angles;
  mode: 'anatomy' | 'projection' | 'room';
  shell: boolean;
  labels: boolean;
  zoom: number;
}
const W = 360,
  H = 290;
const xyz = (p: Vec3, a: Angles, scale: number): Vec3 => {
  const q = project(p, a);
  return [W / 2 + q[0] * scale, H / 2 - q[1] * scale, q[2]];
};
const linePath = (points: readonly Vec3[]) =>
  points
    .map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`)
    .join(' ');
const pointString = (points: readonly Vec3[]) =>
  points.map(p => `${p[0]},${p[1]}`).join(' ');
const mul = (p: Vec3, s: number): Vec3 => [p[0] * s, p[1] * s, p[2] * s];

/** Real 3D coordinates projected to native SVG; no hosted page or WebGL fallback. */
export default function CoronaryLabScene({
  vessels,
  selected,
  onSelect,
  angles,
  orbit,
  mode,
  shell,
  labels,
  zoom,
}: Props) {
  const view = useMemo(
    () =>
      mode === 'projection'
        ? angles
        : mode === 'room'
        ? { oblique: 36, tilt: 27 }
        : orbit,
    [mode, angles, orbit],
  );
  const scale = (mode === 'room' ? 42 : 75) * zoom;
  const p = (v: Vec3) => xyz(v, view, scale);
  const mesh = useMemo(() => {
    const faces: Array<{ points: Vec3[]; depth: number; tone: string }> = [];
    if (mode === 'projection' || !shell) return faces;
    for (let row = 0; row < 18; row++)
      for (let t = 0; t < 360; t += 15) {
        const y = -1.57 + (row * 3.14) / 18,
          next = -1.57 + ((row + 1) * 3.14) / 18;
        const points = [
          surface(t, y),
          surface(t + 15, y),
          surface(t + 15, next),
          surface(t, next),
        ];
        const depth = points.reduce((s, v) => s + project(v, view)[2], 0) / 4;
        const luminance = Math.round(
          65 + 42 * Math.max(0, Math.cos((t * Math.PI) / 180)),
        );
        faces.push({
          points: points.map(v => xyz(v, view, scale)),
          depth,
          tone: `rgb(${luminance + 30},${luminance / 3},${luminance / 2})`,
        });
      }
    return faces.sort((a, b) => a.depth - b.depth);
  }, [view, scale, mode, shell]);
  const n = basis(angles).n,
    det = p(mul(n, 2.25)),
    tube = p(mul(n, -2.25)),
    centre = p([0, 0, 0]);
  const detectorCorners = (() => {
    const b = basis(angles);
    return [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([u, v]) =>
      p([
        n[0] * 2.25 + 0.45 * (b.u[0] * u + b.v[0] * v),
        n[1] * 2.25 + 0.45 * (b.u[1] * u + b.v[1] * v),
        n[2] * 2.25 + 0.45 * (b.u[2] * u + b.v[2] * v),
      ]),
    );
  })();
  const rendered = vessels
    .map(v => ({
      ...v,
      screen: v.points.map(p),
      depth:
        v.points.reduce((s, q) => s + project(q, view)[2], 0) / v.points.length,
    }))
    .sort((a, b) => a.depth - b.depth);
  const active = rendered.find(v => v.id === selected);
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      accessibilityLabel={
        mode === 'projection'
          ? 'Simulated coronary projection'
          : mode === 'room'
          ? 'C-arm geometry teaching diagram'
          : 'Three-dimensional schematic coronary anatomy'
      }
    >
      <Rect width={W} height={H} fill="#11111b" />
      {mode === 'projection' ? (
        <>
          <Rect
            x={18}
            y={15}
            width={324}
            height={260}
            rx={20}
            fill="#1d1c29"
            stroke="#383542"
          />
          <SvgText x={32} y={39} fill="#bbb6d0" fontSize={10}>
            SIMULATED PROJECTION
          </SvgText>
        </>
      ) : (
        <>
          {[55, 105, 155, 205, 255].map(y => (
            <Line
              key={y}
              x1={18}
              y1={y}
              x2={342}
              y2={y}
              stroke="#252332"
              strokeDasharray="2 8"
            />
          ))}
          <Circle cx={180} cy={147} r={106} stroke="#343041" fill="none" />
          <Circle
            cx={180}
            cy={147}
            r={124}
            stroke="#252332"
            fill="none"
            strokeDasharray="3 8"
          />
        </>
      )}
      {mode === 'room' && (
        <>
          <Path
            d={linePath(
              Array.from({ length: 41 }, (_, i) => {
                const b = basis(angles),
                  t = (i * Math.PI) / 40;
                return p(
                  [0, 1, 2].map(
                    k => 2.25 * (b.n[k] * Math.cos(t) - b.u[k] * Math.sin(t)),
                  ) as unknown as Vec3,
                );
              }),
            )}
            fill="none"
            stroke="#59596f"
            strokeWidth={12}
            strokeLinecap="round"
          />
          <Path
            d={linePath(
              Array.from({ length: 41 }, (_, i) => {
                const b = basis(angles),
                  t = (i * Math.PI) / 40;
                return p(
                  [0, 1, 2].map(
                    k => 2.25 * (b.n[k] * Math.cos(t) - b.u[k] * Math.sin(t)),
                  ) as unknown as Vec3,
                );
              }),
            )}
            fill="none"
            stroke="#9692a9"
            strokeWidth={5}
            strokeLinecap="round"
          />
          <Polygon
            points={pointString([
              p([-1.2, -3, -0.8]),
              p([1.2, -3, -0.8]),
              p([1.2, 3, -0.8]),
              p([-1.2, 3, -0.8]),
            ])}
            fill="#292a3b"
            stroke="#71718c"
          />
          <Line
            x1={p([0, -2, -0.5])[0]}
            y1={p([0, -2, -0.5])[1]}
            x2={p([0, 1.8, -0.5])[0]}
            y2={p([0, 1.8, -0.5])[1]}
            stroke="#767588"
            strokeWidth={30}
            strokeLinecap="round"
          />
          <Circle
            cx={p([0, 2.35, -0.5])[0]}
            cy={p([0, 2.35, -0.5])[1]}
            r={12}
            fill="#a19aac"
          />
          <SvgText
            x={p([0, 2.8, -0.5])[0]}
            y={p([0, 2.8, -0.5])[1] - 4}
            textAnchor="middle"
            fill="#e4dbf5"
            fontSize={11}
          >
            HEAD
          </SvgText>
        </>
      )}
      {mode !== 'projection' &&
        shell &&
        mesh.map((face, i) => (
          <Polygon
            key={i}
            points={pointString(face.points)}
            fill={face.tone}
            opacity={0.38}
            stroke="none"
          />
        ))}
      {rendered.map(v => {
        const chosen = v.id === selected;
        const color = chosen
          ? '#f4b5ff'
          : mode === 'projection'
          ? '#e3dee9'
          : '#ef6e78';
        return (
          <G key={v.id}>
            {chosen && (
              <Path
                d={linePath(v.screen)}
                stroke="#cf68e6"
                strokeWidth={v.radius * scale * 2 + 5}
                strokeOpacity={0.15}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <Path
              d={linePath(v.screen)}
              fill="none"
              stroke={color}
              strokeWidth={Math.max(1.2, v.radius * scale * 2)}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={chosen ? 1 : 0.78}
            />
            {mode !== 'projection' && (
              <Path
                d={linePath(v.screen)}
                fill="none"
                stroke={chosen ? '#fff4ff' : '#ffc1b5'}
                strokeWidth={Math.max(0.35, v.radius * scale * 0.5)}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.5}
              />
            )}
            {/* Wide transparent hit path; branch picker is the screen-reader alternative. */}
            <Path
              d={linePath(v.screen)}
              fill="none"
              stroke="transparent"
              strokeWidth={16}
              onPress={() => onSelect(v.id)}
            />
          </G>
        );
      })}
      {mode !== 'projection' && (
        <>
          {detectorCorners.map((corner, i) => (
            <Line
              key={i}
              x1={tube[0]}
              y1={tube[1]}
              x2={corner[0]}
              y2={corner[1]}
              stroke="#80d7e2"
              strokeWidth={0.8}
              opacity={0.4}
            />
          ))}
          <Line
            x1={tube[0]}
            y1={tube[1]}
            x2={det[0]}
            y2={det[1]}
            stroke="#80d7e2"
            strokeDasharray="4 5"
          />
          <Polygon
            points={pointString(detectorCorners)}
            fill="#276270"
            fillOpacity={0.45}
            stroke="#80d7e2"
            strokeWidth={2}
          />
          <Circle cx={tube[0]} cy={tube[1]} r={6} fill="#80d7e2" />
          {labels && (
            <>
              <SvgText
                x={Math.max(36, Math.min(322, det[0]))}
                y={Math.max(20, Math.min(265, det[1] - 16))}
                textAnchor="middle"
                fill="#b3eff4"
                fontSize={11}
              >
                Detector
              </SvgText>
              <SvgText
                x={Math.max(32, Math.min(325, tube[0]))}
                y={Math.max(20, Math.min(270, tube[1] + 20))}
                textAnchor="middle"
                fill="#b3eff4"
                fontSize={11}
              >
                X-ray tube
              </SvgText>
            </>
          )}
          <Circle cx={centre[0]} cy={centre[1]} r={2} fill="#fff" />
        </>
      )}
      {labels && active && (
        <>
          <Circle
            cx={active.screen[Math.floor(active.screen.length / 2)][0]}
            cy={active.screen[Math.floor(active.screen.length / 2)][1]}
            r={4}
            fill="#f4b5ff"
            stroke="#11111b"
            strokeWidth={1.5}
          />
          <SvgText
            x={Math.max(
              35,
              Math.min(
                320,
                active.screen[Math.floor(active.screen.length / 2)][0] + 12,
              ),
            )}
            y={Math.max(
              52,
              Math.min(
                254,
                active.screen[Math.floor(active.screen.length / 2)][1] - 10,
              ),
            )}
            fill="#fff0ff"
            stroke="#11111b"
            strokeWidth={0.25}
            fontSize={13}
            fontWeight="bold"
          >
            {active.id}
          </SvgText>
        </>
      )}
      {mode === 'projection' && (
        <>
          <SvgText x={30} y={255} fill="#bbb6d0" fontSize={11}>
            R
          </SvgText>
          <SvgText x={323} y={255} fill="#bbb6d0" fontSize={11}>
            L
          </SvgText>
        </>
      )}
      <SvgText x={180} y={285} textAnchor="middle" fill="#aaa5bd" fontSize={10}>
        {mode === 'room'
          ? 'Spatial illustration · no collision or dose model'
          : mode === 'anatomy'
          ? 'Original schematic · drag to inspect'
          : 'Parallel projection · no acquired X-ray data'}
      </SvgText>
    </Svg>
  );
}
