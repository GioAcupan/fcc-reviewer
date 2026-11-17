import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Flow, FNode } from '../engine/flow';

function shapePath(n: FNode) {
  const { x, y, w, h } = n;
  switch (n.shape) {
    case 'io': { const k = 12; return `M${x + k},${y} L${x + w},${y} L${x + w - k},${y + h} L${x},${y + h} Z`; }
    case 'init': { const k = 13; return `M${x + k},${y} L${x + w - k},${y} L${x + w},${y + h / 2} L${x + w - k},${y + h} L${x + k},${y + h} L${x},${y + h / 2} Z`; }
    case 'dec': return `M${x + w / 2},${y} L${x + w},${y + h / 2} L${x + w / 2},${y + h} L${x},${y + h / 2} Z`;
    case 'term': case 'conn': { const r = h / 2; return `M${x + r},${y} L${x + w - r},${y} A${r},${r} 0 0 1 ${x + w - r},${y + h} L${x + r},${y + h} A${r},${r} 0 0 1 ${x + r},${y} Z`; }
    default: return `M${x + 2},${y} L${x + w - 2},${y} Q${x + w},${y} ${x + w},${y + 2} L${x + w},${y + h - 2} Q${x + w},${y + h} ${x + w - 2},${y + h} L${x + 2},${y + h} Q${x},${y + h} ${x},${y + h - 2} L${x},${y + 2} Q${x},${y} ${x + 2},${y} Z`;
  }
}

export const SHAPE_NAMES: Record<string, string> = {
  term: 'Terminal (Start/End)', io: 'Input / Output', proc: 'Process', init: 'Initialization', dec: 'Decision', call: 'Predefined process', conn: 'Connector',
};

export function Flowchart({ flow, active = -1, visited, hiNodes, onNode, playing, maxH, fit = true }: {
  flow: Flow; active?: number; visited?: Set<number>; hiNodes?: Set<number>; onNode?: (i: number) => void; playing?: boolean; maxH?: string; fit?: boolean;
}) {
  const pad = 14;
  const W = flow.maxX - flow.minX + pad * 2, H = flow.h + pad * 2;
  const box = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(320);
  useLayoutEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(() => setCw(box.current!.clientWidth));
    ro.observe(box.current); setCw(box.current.clientWidth);
    return () => ro.disconnect();
  }, []);
  const [zoomed, setZoomed] = useState(false);
  const fitScale = Math.min(1.15, (cw - 4) / W);
  const scale = zoomed || !fit ? 1.1 : Math.max(0.8, fitScale);
  useEffect(() => {
    if (active < 0 || !box.current) return;
    const n = flow.nodes[active]; if (!n) return;
    const el = box.current;
    const cy = (n.y + n.h / 2 + pad) * scale, cx = (n.x - flow.minX + n.w / 2 + pad) * scale;
    el.scrollTo({ top: cy - el.clientHeight / 2, left: cx - el.clientWidth / 2, behavior: 'smooth' });
  }, [active, flow, scale]);
  return (
    <div ref={box} className={`flow ${playing ? 'playing' : ''}`} style={maxH ? { maxHeight: maxH } : undefined}>
      {fit && fitScale < 1 && <button className="zoom-btn" onClick={() => setZoomed(z => !z)} aria-label={zoomed ? 'Fit flowchart' : 'Zoom flowchart'}>{zoomed ? '⤡' : '⤢'}</button>}
      <svg width={W * scale} height={H * scale} viewBox={`${flow.minX - pad} ${-pad} ${W} ${H}`} role="img" aria-label="Flowchart">
        <defs>
          <marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--edge)" />
          </marker>
        </defs>
        {flow.edges.map((e, i) => (
          <polyline key={i} className="fedge" points={e.pts.map(p => p.join(',')).join(' ')} markerEnd={e.arrow ? 'url(#fa)' : undefined} />
        ))}
        {flow.dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.6} className="fdot" />)}
        {flow.labels.map((l, i) => <text key={i} x={l.x} y={l.y} className={`flabel ${l.t === 'Yes' ? 'y' : 'n'}`} textAnchor={l.anchor ?? 'start'}>{l.t}</text>)}
        {flow.nodes.map(n => {
          const on = n.i === active;
          const cls = `fnode s-${n.shape} ${on ? 'on' : ''} ${visited?.has(n.i) ? 'seen' : ''} ${hiNodes?.has(n.i) ? 'hi' : ''} ${onNode ? 'tap' : ''}`;
          const lh = 14; const y0 = n.y + n.h / 2 - ((n.lines.length - 1) * lh) / 2;
          return (
            <g key={n.i} className={cls} onClick={onNode ? () => onNode(n.i) : undefined}>
              {on && <path d={shapePath(n)} className="fglow" />}
              <path d={shapePath(n)} className="fshape" />
              {n.shape === 'call' && <><line x1={n.x + 8} y1={n.y} x2={n.x + 8} y2={n.y + n.h} className="fshape-l" /><line x1={n.x + n.w - 8} y1={n.y} x2={n.x + n.w - 8} y2={n.y + n.h} className="fshape-l" /></>}
              <text className="ftext" textAnchor="middle">
                {n.lines.map((l, j) => <tspan key={j} x={n.x + n.w / 2} y={y0 + j * lh + 4}>{l}</tspan>)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
