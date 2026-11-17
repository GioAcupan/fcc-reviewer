import { useEffect, useRef, useState } from 'react';
import { Code, buzz } from './ui';

interface Face { id: string; name: string; area: string; c: string; d: string; color: string; trap?: string; back?: boolean }
interface Dim { x1: number; y1: number; x2: number; y2: number; t: string; tx: number; ty: number; dash?: boolean }
interface ShapeDef {
  title: string; given: string; outline: { d: string; dash?: boolean }[]; faces: Face[]; dims: Dim[];
  hidden: { name: string; formula: string; c: string; tri: string; why: string }; code: string;
  vb?: string; // optional tighter viewBox
}

const ELL = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx},${cy} A${rx},${ry} 0 1 0 ${cx + rx},${cy} A${rx},${ry} 0 1 0 ${cx - rx},${cy} Z`;

export const SHAPES: Record<string, ShapeDef> = {
  frustum: {
    title: 'Frustum of a cone', given: 'Given: bottom radius R, top radius r, height h',
    outline: [
      { d: 'M35,175 L78,55 M182,55 L225,175' }, { d: ELL(130, 55, 52, 13) },
      { d: 'M35,175 A95,24 0 0 0 225,175' }, { d: 'M35,175 A95,24 0 0 1 225,175', dash: true },
    ],
    faces: [
      { id: 'top', name: 'Top circle', area: 'πr²', c: 'PI * r * r', d: ELL(130, 55, 52, 13), color: '#6bdfff' },
      { id: 'bot', name: 'Bottom circle', area: 'πR²', c: 'PI * R * R', d: ELL(130, 175, 95, 24), color: '#ffb86b' },
      { id: 'lat', name: 'Curved side (lateral)', area: 'π(R + r)s', c: 'PI * (R + r) * s', d: 'M35,175 L78,55 A52,13 0 0 0 182,55 L225,175 A95,24 0 0 1 35,175 Z', color: '#ff7ab2' },
    ],
    dims: [
      { x1: 130, y1: 175, x2: 225, y2: 175, t: 'R', tx: 178, ty: 170 }, { x1: 130, y1: 55, x2: 182, y2: 55, t: 'r', tx: 156, ty: 50 },
      { x1: 130, y1: 55, x2: 130, y2: 175, t: 'h', tx: 120, ty: 120, dash: true },
    ],
    hidden: { name: 'slant height s', formula: 's = √(h² + (R − r)²)', c: 's = sqrt(h * h + (R - r) * (R - r));', tri: 'M182,55 L182,175 L225,175 Z', why: 'The lateral formula needs the SLANT height s, but you are only given the vertical height h. The yellow right triangle has legs h and (R − r), so Pythagoras gives s.' },
    code: `s = sqrt(h * h + (R - r) * (R - r));\ntop = PI * r * r;\nbottom = PI * R * R;\nlateral = PI * (R + r) * s;\ntotal = top + bottom + lateral;`,
  },
  prism: {
    title: 'Triangular prism (isosceles base)', given: 'Given: base b, triangle height t, prism length L',
    outline: [
      { d: 'M30,190 L150,190 L90,95 Z' }, { d: 'M150,190 L230,135 L170,40 L90,95 M170,40 L110,135', dash: false },
      { d: 'M30,190 L110,135 L230,135', dash: true }, { d: 'M90,95 L170,40' },
    ],
    faces: [
      { id: 'f1', name: 'Front triangle', area: '½·b·t', c: '0.5 * b * t', d: 'M30,190 L150,190 L90,95 Z', color: '#6bdfff' },
      { id: 'f2', name: 'Back triangle', area: '½·b·t', c: '0.5 * b * t', d: 'M110,135 L230,135 L170,40 Z', color: '#79a8ff' },
      { id: 'r1', name: 'Bottom rectangle', area: 'b·L', c: 'b * L', d: 'M30,190 L150,190 L230,135 L110,135 Z', color: '#ffb86b' },
      { id: 'r2', name: 'Right slanted rectangle', area: 'a·L', c: 'a * L', d: 'M150,190 L90,95 L170,40 L230,135 Z', color: '#ff7ab2' },
      { id: 'r3', name: 'Left slanted rectangle', area: 'a·L', c: 'a * L', d: 'M30,190 L90,95 L170,40 L110,135 Z', color: '#c792ea' },
    ],
    dims: [
      { x1: 30, y1: 200, x2: 150, y2: 200, t: 'b', tx: 88, ty: 214 }, { x1: 90, y1: 95, x2: 90, y2: 190, t: 't', tx: 80, ty: 150, dash: true },
      { x1: 150, y1: 190, x2: 230, y2: 135, t: 'L', tx: 198, ty: 176 },
    ],
    hidden: { name: 'slanted side a', formula: 'a = √(t² + (b/2)²)', c: 'a = sqrt(t * t + (b / 2) * (b / 2));', tri: 'M90,95 L90,190 L30,190 Z', why: 'The two slanted rectangles are a × L, but the side a is not given. Half the base (b/2) and the height t form a right triangle with a as the hypotenuse.' },
    code: `a = sqrt(t * t + (b / 2) * (b / 2));\ntriangles = 2 * (0.5 * b * t);\nrects = (a + a + b) * L;\ntotal = triangles + rects;`,
  },
  silo: {
    title: 'Silo: cone on a cylinder', given: 'Given: radius r, cylinder height H, cone height c',
    outline: [
      { d: 'M60,100 L130,20 L200,100' }, { d: 'M60,100 L60,190 M200,100 L200,190' },
      { d: 'M60,190 A70,17 0 0 0 200,190' }, { d: 'M60,190 A70,17 0 0 1 200,190', dash: true },
      { d: 'M60,100 A70,17 0 0 0 200,100' }, { d: 'M60,100 A70,17 0 0 1 200,100', dash: true },
    ],
    faces: [
      { id: 'cone', name: 'Cone surface', area: 'πrℓ', c: 'PI * r * l', d: 'M60,100 L130,20 L200,100 A70,17 0 0 1 60,100 Z', color: '#ff7ab2' },
      { id: 'cyl', name: 'Cylinder side', area: '2πrH', c: '2 * PI * r * H', d: 'M60,100 L60,190 A70,17 0 0 0 200,190 L200,100 A70,17 0 0 1 60,100 Z', color: '#6bdfff' },
      { id: 'bot', name: 'Bottom circle', area: 'πr²', c: 'PI * r * r', d: ELL(130, 190, 70, 17), color: '#ffb86b' },
      { id: 'glue', name: 'Circle where cone meets cylinder', area: '—', c: '', d: ELL(130, 100, 70, 17), color: '#ff6b81', trap: 'Trap! That circle is glued INSIDE the solid — paint can’t touch it. Composite solids only count the OUTSIDE skin.' },
    ],
    dims: [
      { x1: 130, y1: 190, x2: 200, y2: 190, t: 'r', tx: 165, ty: 185 }, { x1: 214, y1: 100, x2: 214, y2: 190, t: 'H', tx: 220, ty: 148 },
      { x1: 130, y1: 20, x2: 130, y2: 100, t: 'c', tx: 120, ty: 64, dash: true },
    ],
    hidden: { name: 'slant ℓ of the cone', formula: 'ℓ = √(r² + c²)', c: 'l = sqrt(r * r + c * c);', tri: 'M130,20 L130,100 L200,100 Z', why: 'The cone formula πrℓ needs the slant ℓ, not the height c. Radius r and height c are the legs of a right triangle — ℓ is its hypotenuse.' },
    code: `l = sqrt(r * r + c * c);\ncone = PI * r * l;\ncyl = 2 * PI * r * H;\nbottom = PI * r * r;\ntotal = cone + cyl + bottom;`,
  },
  trapprism: {
    title: 'Trapezoidal prism (isosceles base)', given: 'Given: top a, bottom b, height h, length L', vb: '14 56 246 170',
    outline: [
      { d: 'M30,190 L170,190 L130,120 L70,120 Z' },
      { d: 'M70,120 L140,70 L200,70 L240,140 L170,190 M130,120 L200,70' },
      { d: 'M30,190 L100,140 L240,140 M100,140 L140,70', dash: true },
    ],
    faces: [
      { id: 'front', name: 'Front trapezoid', area: '½(a + b)h', c: '0.5 * (a + b) * h', d: 'M30,190 L170,190 L130,120 L70,120 Z', color: '#6bdfff' },
      { id: 'back', name: 'Back trapezoid', area: '½(a + b)h', c: '0.5 * (a + b) * h', d: 'M100,140 L240,140 L200,70 L140,70 Z', color: '#79a8ff', back: true },
      { id: 'top', name: 'Top rectangle', area: 'a·L', c: 'a * L', d: 'M70,120 L130,120 L200,70 L140,70 Z', color: '#ffb86b' },
      { id: 'bottom', name: 'Bottom rectangle', area: 'b·L', c: 'b * L', d: 'M30,190 L170,190 L240,140 L100,140 Z', color: '#9ef0a3', back: true },
      { id: 'right', name: 'Right slanted rectangle', area: 's·L', c: 's * L', d: 'M130,120 L170,190 L240,140 L200,70 Z', color: '#ff7ab2' },
      { id: 'left', name: 'Left slanted rectangle', area: 's·L', c: 's * L', d: 'M30,190 L70,120 L140,70 L100,140 Z', color: '#c792ea', back: true },
    ],
    dims: [
      { x1: 30, y1: 203, x2: 170, y2: 203, t: 'b', tx: 96, ty: 218 },
      { x1: 70, y1: 111, x2: 130, y2: 111, t: 'a', tx: 96, ty: 106 },
      { x1: 100, y1: 120, x2: 100, y2: 190, t: 'h', tx: 106, ty: 161, dash: true },
      { x1: 176, y1: 196, x2: 246, y2: 146, t: 'L', tx: 216, ty: 184 },
    ],
    hidden: { name: 'slanted side s', formula: 's = √(h² + ((b − a)/2)²)', c: 's = sqrt(h * h + ((b - a) / 2) * ((b - a) / 2));', tri: 'M130,120 L130,190 L170,190 Z', why: 'The slanted rectangles are s × L, but s is not given. The overhang (b − a)/2 and the height h are the legs of a right triangle with s as the hypotenuse.' },
    code: `s = sqrt(h * h + ((b - a) / 2) * ((b - a) / 2));\ntrapezoids = 2 * (0.5 * (a + b) * h);\nrects = (a + b + 2 * s) * L;\ntotal = trapezoids + rects;`,
  },
};

/** Static clue figure: the solid with only its GIVEN dimensions labeled. No formulas, no hidden-length hints. */
export function ShapeFigure({ shape }: { shape: string }) {
  const S = SHAPES[shape];
  return (
    <figure className="shape-fig">
      <svg viewBox={S.vb ?? '0 0 260 225'} className="sl-svg" role="img" aria-label={`${S.title}. ${S.given}.`}>
        {S.faces.filter(f => !f.back && !f.trap).map(f => <path key={f.id} d={f.d} className="fig-face" style={{ ['--fc' as any]: f.color }} />)}
        {S.outline.map((o, i) => <path key={i} d={o.d} className={`sl-line ${o.dash ? 'dash' : ''}`} />)}
        {S.dims.map((d, i) => (
          <g key={i} className="sl-dim">
            <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} strokeDasharray={d.dash ? '4 3' : undefined} />
            <text x={d.tx} y={d.ty}>{d.t}</text>
          </g>
        ))}
      </svg>
      <figcaption>{S.title} · {S.given} · not to scale</figcaption>
    </figure>
  );
}

export function ShapeLab({ shape, onComplete }: { shape: string; onComplete?: () => void }) {
  const S = SHAPES[shape];
  const [sel, setSel] = useState<string[]>([]);
  const [tri, setTri] = useState(false);
  const [trap, setTrap] = useState<string | null>(null);
  const real = S.faces.filter(f => !f.trap);
  const done = real.every(f => sel.includes(f.id)) && tri;
  const toggle = (f: Face) => {
    if (f.trap) { setTrap(f.trap); buzz([20, 40, 20]); return; }
    setTrap(null); buzz(8);
    setSel(s => (s.includes(f.id) ? s.filter(x => x !== f.id) : [...s, f.id]));
  };
  const fired = useRef(false);
  useEffect(() => { if (done && !fired.current) { fired.current = true; onComplete?.(); } }, [done, onComplete]);
  const terms = real.filter(f => sel.includes(f.id));
  return (
    <div className="shapelab">
      <div className="sl-head"><b>{S.title}</b><span>{S.given}</span></div>
      <svg viewBox={S.vb ?? '0 0 260 225'} className="sl-svg" role="img" aria-label={S.title}>
        {S.faces.map(f => (
          <path key={f.id} d={f.d} className={`sl-face ${sel.includes(f.id) ? 'on' : ''} ${f.trap ? 'trap' : ''}`} style={{ ['--fc' as any]: f.color }} onClick={() => toggle(f)} />
        ))}
        {S.outline.map((o, i) => <path key={i} d={o.d} className={`sl-line ${o.dash ? 'dash' : ''}`} />)}
        {tri && <path d={S.hidden.tri} className="sl-tri" />}
        {S.dims.map((d, i) => (
          <g key={i} className="sl-dim">
            <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} strokeDasharray={d.dash ? '4 3' : undefined} />
            <text x={d.tx} y={d.ty}>{d.t}</text>
          </g>
        ))}
      </svg>
      <div className="sl-chips">
        {S.faces.map(f => (
          <button key={f.id} className={`chip ${sel.includes(f.id) ? 'on' : ''}`} style={{ ['--fc' as any]: f.color }} onClick={() => toggle(f)}>
            <span className="sw" />{f.name}{!f.trap && sel.includes(f.id) && <span className="chip-f">{f.area}</span>}
          </button>
        ))}
      </div>
      {trap && <div className="tip bad">{trap}</div>}
      <div className="sl-formula"><span className="lbl">SA =</span> {terms.length ? terms.map((t, i) => <span key={t.id} className="term" style={{ color: t.color }}>{i > 0 && <span className="plus"> + </span>}{t.area}</span>) : <span className="mut">tap every face that is on the outside…</span>}</div>
      <button className={`chip wide ${tri ? 'on' : ''}`} style={{ ['--fc' as any]: '#ffd166' }} onClick={() => setTri(true)}>
        <span className="sw" />Missing length? Find the {S.hidden.name}
      </button>
      {tri && <div className="tip"><b>{S.hidden.formula}</b><br />{S.hidden.why}</div>}
      {done && <div className="sl-done"><div className="sys ok">✓ Every outside face counted — now it is just C:</div><Code code={S.code} reveal /></div>}
    </div>
  );
}
