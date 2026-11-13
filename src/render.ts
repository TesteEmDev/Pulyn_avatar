// GERADOR DE AVATARES — desenha o personagem como SVG a partir de uma configuração.
// Não depende de React nem do DOM.
// Todos os valores usados no desenho vêm de listas fechadas (ver parts.ts), então o SVG gerado é seguro.
//
// Estilo cartoon: cada peça ganha um contorno no tom escuro da própria cor (em vez de preto),
// a sombra é chapada (cel shading) e os olhos são grandes, com brilho.
import type { AvatarConfig } from './config';

interface FaceShape { earX: number; chin: number; fit: [number, number]; draw: (attrs: string) => string }

function mix(a: string, b: string, k: number){ const pa=parseInt(a.slice(1),16), pb=parseInt(b.slice(1),16);
  const c=(sh: number)=>{ const x=(pa>>sh)&255, y=(pb>>sh)&255; return Math.round(x+(y-x)*k); };
  return '#'+[16,8,0].map(sh=>c(sh).toString(16).padStart(2,'0')).join(''); }
const hex6 = (c: string) => c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;

// INK é só um marcador: clean() troca pelo contorno certo de cada peça (ver edge).
const INK = '#0f0f10';
const K = `stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
const LINE = '#3b2230';   // traço dos detalhes do rosto (boca, pálpebras)
const PUPIL = '#1c1220';
const DEEP = '#2a1430';   // sombras puxam para o roxo: ficam mais vivas do que escurecer com preto
const WINE = '#8b2f4a';
const GOLD = '#ffd54f';
const edge = (c: string) => mix(hex6(c), DEEP, .5);
const dark = (c: string, k = .2) => mix(c, DEEP, k);
const light = (c: string, k = .3) => mix(c, '#ffffff', k);
const skinShade = (c: string) => mix(c, '#5a1a26', .24);

function faceShape(s: AvatarConfig): FaceShape{
  // chin = ponto mais baixo do queixo; fit = [largura, altura] do cabelo/acessórios em relação ao rosto redondo
  switch(s.face){
    case 'oval':   return {earX:97, chin:328, fit:[.89,1.06], draw:a=>`<ellipse cx="200" cy="200" rx="105" ry="128" ${a}/>`};
    case 'square': return {earX:92, chin:320, fit:[.95,1.02], draw:a=>`<rect x="90" y="80" width="220" height="240" rx="72" ${a}/>`};
    case 'heart':  return {earX:86, chin:330, fit:[.95,1], draw:a=>`<path d="M 85 190 C 85 110 135 80 200 80 C 265 80 315 110 315 190 C 315 262 262 326 200 330 C 138 326 85 262 85 190 Z" ${a}/>`};
    case 'wide':   return {earX:74, chin:312, fit:[1.09,.95], draw:a=>`<ellipse cx="200" cy="202" rx="130" ry="112" ${a}/>`};
    case 'pear':   return {earX:84, chin:326, fit:[.81,1], draw:a=>`<path d="M 112 175 C 112 108 152 82 200 82 C 248 82 288 108 288 175 C 318 215 306 318 200 326 C 94 318 82 215 112 175 Z" ${a}/>`};
    default:       return {earX:80, chin:318, fit:[1,1], draw:a=>`<ellipse cx="200" cy="200" rx="122" ry="118" ${a}/>`};
  }
}
function starPoints(cx: number, cy: number, R: number, r: number){
  const pts: string[] = [];
  for (let i = 0; i < 10; i += 1){ const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R; pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`); }
  return pts.join(' ');
}
// Brinco no lóbulo da orelha (cx = centro da orelha)
function earringShape(s: AvatarConfig, cx: number){
  switch(s.earringStyle){
    case 'ball': return `<circle cx="${cx}" cy="243" r="7.5" fill="${GOLD}" ${K} stroke-width="3"/><circle cx="${cx-2}" cy="241" r="2.2" fill="#fff" fill-opacity=".8"/>`;
    case 'hoop': return `<circle cx="${cx}" cy="255" r="12" fill="none" stroke="${edge(GOLD)}" stroke-width="9"/><circle cx="${cx}" cy="255" r="12" fill="none" stroke="${GOLD}" stroke-width="5"/>`;
    case 'star': return `<polygon points="${starPoints(cx, 250, 11, 5)}" fill="${GOLD}" ${K} stroke-width="3"/>`;
    case 'pearl': return `<circle cx="${cx}" cy="246" r="7.5" fill="#fff" ${K} stroke-width="3"/><circle cx="${cx-2}" cy="243.5" r="2" fill="#dfe6ee"/>`;
    default: return '';
  }
}
function ears(s: AvatarConfig, x: number){
  const f = `fill="${s.skin}" ${K}`;
  const inner = (cx: number, d: number)=>`<ellipse cx="${cx+d*3}" cy="216" rx="9" ry="12" fill="${skinShade(s.skin)}"/>`;
  let out = `<circle cx="${x}" cy="215" r="22" ${f}/><circle cx="${400-x}" cy="215" r="22" ${f}/>`;
  out += inner(x,-1) + inner(400-x,1);
  out += earringShape(s, x) + earringShape(s, 400 - x);
  return out;
}
// ── Cabelos ──────────────────────────────────────────────────────────────────────────────────────
// Quase todo penteado usa o mesmo contorno por fora (CAP) e muda a franja, que é a linha do cabelo na testa.
const CAP = 'M 76 196 C 62 92 136 48 200 48 C 266 48 340 92 324 196';
const FRINGE = {
  // mechas caindo para o lado
  tufts: 'C 314 164 294 142 272 136 C 262 151 243 159 222 158 C 228 150 231 142 231 134 C 214 153 186 163 162 160 C 168 152 171 144 171 138 C 158 147 142 147 130 136 C 108 141 88 162 76 196 Z',
  // franja reta
  blunt: 'C 320 172 310 156 298 146 C 284 152 268 154 252 152 L 248 143 L 242 153 C 214 157 186 157 158 153 L 152 143 L 148 152 C 132 154 116 152 102 146 C 90 156 80 172 76 196 Z',
  // repartido no meio
  curtain: 'C 318 170 306 150 288 140 C 258 132 224 110 204 80 C 182 110 142 132 112 140 C 94 150 82 170 76 196 Z',
  // puxado para trás, com a testa à mostra
  back: 'C 320 160 302 126 264 113 C 224 102 176 102 136 113 C 98 126 80 160 76 196 Z',
  // jogado de lado
  side: 'C 316 168 306 150 290 140 C 240 116 170 124 114 160 C 98 170 86 182 76 196 Z',
  // ondas
  waves: 'C 316 172 302 152 286 148 C 272 162 254 152 238 146 C 222 160 206 150 192 146 C 176 158 158 152 142 148 C 122 154 96 170 76 196 Z',
  // pontas
  zigzag: 'C 314 168 296 150 274 142 L 254 164 L 238 142 L 216 168 L 198 142 L 178 166 L 162 142 L 144 160 L 128 142 C 106 150 88 168 76 196 Z',
  // mechas bagunçadas
  messy: 'C 314 166 296 150 274 142 C 266 156 252 162 238 160 C 242 152 242 146 240 140 C 226 158 204 166 186 162 C 190 154 190 148 188 142 C 172 152 150 152 130 140 C 108 148 88 166 76 196 Z',
  // repicado
  pixie: 'C 318 172 304 158 286 152 C 262 136 232 162 214 124 C 196 152 170 166 150 146 C 128 152 98 168 76 196 Z',
} as const;
type Fringe = keyof typeof FRINGE;
const cap = (fringe: Fringe) => `${CAP} ${FRINGE[fringe]}`;
// Mechas (linhas finas) de cada franja
const STRANDS: Record<Fringe, string[]> = {
  tufts: ['M 146 66 Q 124 100 132 134', 'M 206 56 Q 196 104 200 150', 'M 260 66 Q 276 100 268 134'],
  blunt: ['M 130 78 Q 114 112 116 146', 'M 176 58 Q 166 104 168 152', 'M 226 58 Q 234 104 232 152', 'M 272 78 Q 286 112 284 146'],
  curtain: ['M 204 80 Q 204 64 202 50', 'M 178 74 Q 146 112 106 134', 'M 230 74 Q 260 112 296 134', 'M 148 68 Q 116 98 90 136', 'M 256 68 Q 286 98 312 136'],
  back: ['M 142 110 Q 150 80 174 56', 'M 200 102 Q 200 76 200 50', 'M 258 110 Q 250 80 226 56', 'M 102 140 Q 106 100 134 70', 'M 298 140 Q 294 100 266 70'],
  side: ['M 288 136 Q 250 96 190 62', 'M 232 120 Q 196 96 148 80', 'M 168 128 Q 140 112 108 110'],
  waves: ['M 146 66 Q 124 100 140 144', 'M 206 56 Q 196 104 192 144', 'M 260 66 Q 276 100 284 144'],
  zigzag: ['M 146 70 L 144 156', 'M 198 60 L 198 138', 'M 252 70 L 254 160'],
  messy: ['M 146 70 Q 124 100 132 136', 'M 200 60 Q 190 104 188 140', 'M 258 70 Q 256 104 240 138'],
  pixie: ['M 150 68 Q 134 104 150 142', 'M 210 58 Q 206 96 214 122', 'M 262 68 Q 276 104 284 148'],
};
// Decisão do main ("Avatar: sem brilho no cabelo; só o Careca mantém o brilho na cabeça"). Troque para true para religar o brilho.
const HAIR_SHINE = false;
const SHINE: Array<[string, number]> = [['M 108 126 Q 132 84 188 70', 13], ['M 214 66 Q 232 66 246 71', 9]];
const CURL_MARKS = ['M 118 112 q 12 -14 24 0', 'M 176 72 q 12 -14 24 0', 'M 246 84 q 12 -14 24 0', 'M 150 142 q 10 -12 22 0', 'M 224 132 q 10 -12 22 0', 'M 282 134 q 10 -12 20 0'];
// Cachos: círculos que se fundem (o contorno só aparece por fora)
function cluster(list: Array<[number, number, number]>, fill: string){
  const stroked = list.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="10"/>`).join('');
  const fills = list.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
  return stroked + fills;
}
const mirror = (list: Array<[number, number, number]>): Array<[number, number, number]> => list.map(([x,y,r])=>[400-x,y,r]);
// Traço grosso com contorno (tiara, arco do fone, topetinho)
function band(d: string, color: string, width: number){
  return `<path d="${d}" fill="none" stroke="${edge(color)}" stroke-width="${width+10}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}
const TIE = '#e63946';
const PUFF: Array<[number, number, number]> = [[100,90,42],[66,84,20],[74,56,22],[102,44,22],[130,56,20]];
const AFRO: Array<[number, number, number]> = [[200,122,98],[104,152,42],[94,106,44],[124,68,44],[178,46,46],[232,48,46],[284,70,44],[308,110,44],[298,154,42]];
// Parte de trás do cabelo (fica atrás da cabeça): um tom mais escuro, para dar profundidade.
function hairBack(s: AvatarConfig){
  const back = dark(s.hair, .28);
  const f = `fill="${back}" ${K}`;
  const texture = (d: string)=>`<path d="${d}" fill="none" stroke="${DEEP}" stroke-opacity=".28" stroke-width="4" stroke-linecap="round"/>`;
  const depth = (d: string)=>`<path d="${d}" fill="${DEEP}" opacity=".22"/>`; // cabelo atrás do pescoço
  switch(s.hairStyle){
    case 'long': return `<path d="M 72 200 C 54 82 138 44 200 44 C 262 44 346 82 328 200 C 330 260 342 340 356 440 L 44 440 C 58 340 70 260 72 200 Z" ${f}/>` + depth('M 116 250 L 284 250 L 296 440 L 104 440 Z') + texture('M 86 236 Q 78 290 66 340 M 314 236 Q 322 290 334 340 M 104 262 Q 98 300 92 340 M 296 262 Q 302 300 308 340');
    case 'bob':  return `<path d="M 72 200 C 54 82 138 44 200 44 C 262 44 346 82 328 200 C 336 236 334 266 318 286 C 304 300 282 296 272 280 L 128 280 C 118 296 96 300 82 286 C 66 266 64 236 72 200 Z" ${f}/>` + depth('M 124 250 L 276 250 L 272 280 L 128 280 Z') + texture('M 88 226 Q 80 256 94 282 M 312 226 Q 320 256 306 282');
    case 'bun':  return `<circle cx="200" cy="50" r="44" ${f}/>` + texture('M 172 52 Q 180 22 210 22 Q 236 28 232 54 Q 226 70 206 66');
    case 'bunbow': return `<circle cx="200" cy="50" r="42" ${f}/>` + texture('M 174 52 Q 182 24 210 24 Q 234 30 230 54');
    case 'twin': return `<circle cx="92" cy="74" r="40" ${f}/><circle cx="308" cy="74" r="40" ${f}/>` + texture('M 68 78 Q 72 48 98 46 Q 120 52 116 76 M 332 78 Q 328 48 302 46 Q 280 52 284 76');
    case 'puffs': return cluster(PUFF, back) + cluster(mirror(PUFF), back) + texture('M 78 82 q 12 -14 24 0 M 104 104 q 10 -12 22 0 M 92 58 q 10 -12 20 0 M 298 82 q 12 -14 24 0 M 274 104 q 10 -12 22 0 M 288 58 q 10 -12 20 0');
    case 'afro': return cluster(AFRO, s.hair);
    case 'low': return `<path d="M 88 168 C 48 176 26 246 50 318 C 60 300 72 290 80 274 C 92 246 98 212 100 186 Z" ${f}/><path d="M 312 168 C 352 176 374 246 350 318 C 340 300 328 290 320 274 C 308 246 302 212 300 186 Z" ${f}/>` + texture('M 74 198 Q 52 244 58 296 M 326 198 Q 348 244 342 296');
    case 'pony': return `<path d="M 292 112 C 356 96 392 176 362 262 C 356 282 344 296 330 302 C 340 270 330 238 318 208 C 310 190 302 176 296 164 Z" ${f}/>` + texture('M 320 128 Q 366 172 348 262');
    case 'braids': return [78,322].map(x=>[236,262,288,314].map(y=>`<ellipse cx="${x}" cy="${y}" rx="17" ry="15" ${f}/>`).join('') + `<circle cx="${x}" cy="338" r="9" fill="${TIE}" ${K} stroke-width="4"/>`).join('');
    case 'wavy': return `<path d="M 72 200 C 52 80 140 44 200 44 C 260 44 348 80 328 200 C 350 235 324 262 340 300 C 318 322 300 296 286 312 C 270 330 240 300 200 312 C 160 300 130 330 114 312 C 100 296 82 322 60 300 C 76 262 50 235 72 200 Z" ${f}/>` + depth('M 124 250 L 276 250 L 280 312 L 120 312 Z') + texture('M 84 230 Q 68 262 84 296 M 316 230 Q 332 262 316 296');
    case 'ponytop': return `<path d="M 196 62 C 250 16 338 46 352 124 C 358 170 338 214 346 258 C 318 242 306 200 308 160 C 308 100 262 78 204 92 Z" ${f}/>` + texture('M 228 60 Q 300 52 328 130 Q 336 180 330 222');
    case 'curlybob': return cluster([[74,196,36],[66,240,34],[84,282,32],[326,196,36],[334,240,34],[316,282,32],[200,68,64]], back);
    default: return '';
  }
}
const CURLS: Array<[number, number, number]> = [[102,136,42],[148,96,44],[205,82,46],[260,96,44],[300,136,42],[88,188,36],[312,188,36],[174,124,38],[232,124,38]];
// Parte da frente do cabelo. base = o que recebe sombra e brilho; under/over = o que fica por baixo/por cima, sem brilho.
interface HairFront { base: string; under?: string; over?: string; strands: string[]; shine?: Array<[string, number]>; plain?: boolean }
function hairFrontParts(s: AvatarConfig): HairFront | null{
  const f = `fill="${s.hair}" ${K}`;
  const tie = (x: number, y: number, r = 9)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${TIE}" ${K} stroke-width="4"/>`;
  const capped = (fringe: Fringe, extra = ''): HairFront => ({ base: `<path d="${cap(fringe)}" ${f}/>` + extra, strands: STRANDS[fringe] });
  switch(s.hairStyle){
    case 'bald': return null;
    case 'spiky': return {
      base: `<path d="M 76 196 C 68 172 64 146 70 122 L 50 96 L 90 98 L 82 56 L 126 76 L 140 30 L 178 58 L 204 18 L 232 58 L 270 30 L 278 76 L 322 56 L 312 98 L 352 96 L 330 122 C 336 146 334 172 324 196 ${FRINGE.zigzag}" ${f}/>`,
      strands: ['M 126 112 L 106 86', 'M 166 94 L 150 58', 'M 204 88 L 204 48', 'M 242 94 L 258 58', 'M 278 112 L 298 86'] };
    case 'curly': case 'curlybob': return { base: cluster(CURLS, s.hair), strands: CURL_MARKS };
    case 'mohawk': return {
      base: `<path d="M 170 150 C 156 112 158 74 172 58 L 180 28 L 196 46 L 208 18 L 220 46 L 234 30 L 232 62 C 244 80 242 116 230 150 C 216 136 184 136 170 150 Z" ${f}/>`,
      strands: ['M 188 132 Q 182 92 190 58', 'M 214 132 Q 220 92 212 54'], shine: [['M 176 120 Q 170 90 178 66', 7]] };
    case 'messy': return {
      base: `<path d="M 76 196 C 54 150 66 100 108 94 C 98 58 150 38 175 58 C 190 28 240 28 255 60 C 294 48 336 92 307 126 C 334 140 336 172 324 196 ${FRINGE.messy}" ${f}/>`,
      strands: STRANDS.messy };
    case 'afro': return {
      base: `<path d="${cap('back')}" fill="${s.hair}"/>`, // sem contorno em cima: funde com o volume de trás
      over: `<path d="M 324 196 ${FRINGE.back.replace(' Z', '')}" fill="none" stroke="${edge(s.hair)}" stroke-width="5" stroke-linecap="round"/>`,
      strands: ['M 104 86 q 12 -14 24 0', 'M 176 52 q 12 -14 24 0', 'M 262 70 q 12 -14 24 0', 'M 80 136 q 12 -14 24 0', 'M 296 132 q 12 -14 24 0', 'M 150 84 q 10 -12 22 0', 'M 222 80 q 10 -12 22 0'],
      shine: [['M 98 102 Q 116 64 164 46', 13]], plain: true };
    case 'bob': return capped('blunt');
    case 'long': case 'braids': case 'twin': return capped('curtain');
    case 'bun': case 'puffs': return capped('back');
    case 'ponytop': return capped('back', tie(204, 58));
    case 'low': return capped('tufts', tie(86,190) + tie(314,190));
    case 'bunbow': return capped('tufts', `<path d="M 200 92 C 188 74 162 66 159 82 C 156 98 162 112 175 111 C 186 110 194 102 200 92 Z" fill="${TIE}" ${K} stroke-width="4"/><path d="M 200 92 C 212 74 238 66 241 82 C 244 98 238 112 225 111 C 214 110 206 102 200 92 Z" fill="${TIE}" ${K} stroke-width="4"/>` + tie(200,92,10));
    case 'wavy': return capped('waves');
    case 'tuft': return capped('tufts', band('M 200 56 C 196 24 226 8 240 28 C 252 46 232 56 220 46', s.hair, 14));
    case 'pixie': return capped('pixie');
    case 'pony': return capped('tufts', tie(302,126,10));
    case 'side': return capped('side');
    default: return capped('tufts');
  }
}
const hairFrontBase = (s: AvatarConfig) => hairFrontParts(s)?.base ?? '';
// Cabelo da frente com volume: escurece para baixo, mechas e uma faixa de brilho no tom claro do próprio cabelo.
function hairFront(s: AvatarConfig){
  const p = hairFrontParts(s);
  if (s.hairStyle === 'bald') return '<path d="M 136 114 Q 156 94 192 88" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="11" stroke-linecap="round"/><circle cx="122" cy="132" r="5" fill="#fff" fill-opacity=".5"/>';
  if (!p) return '';
  const strands = p.strands.map(d=>`<path d="${d}" fill="none" stroke="${DEEP}" stroke-opacity="${p.plain ? .26 : .18}" stroke-width="${p.plain ? 4 : 5}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const shine = !HAIR_SHINE ? '' : (p.shine ?? SHINE).map(([d,w])=>`<path d="${d}" fill="none" stroke="${light(s.hair,.42)}" stroke-opacity=".8" stroke-width="${w}" stroke-linecap="round"/>`).join('');
  const detail = p.plain ? strands + shine
    : `<clipPath id="gh">${p.base}</clipPath><g clip-path="url(#gh)"><rect x="40" y="10" width="320" height="190" fill="url(#gl)"/><rect x="0" y="200" width="400" height="200" fill="${DEEP}" opacity=".3"/>${strands}${shine}</g>`;
  return (p.under ?? '') + p.base + (p.over ?? '') + detail;
}
// ── Acessórios ───────────────────────────────────────────────────────────────────────────────────
const starPts = (cx: number, cy: number, R: number) => Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * .45 : R;
  return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
}).join(' ');
function acc(s: AvatarConfig){
  const c = s.accColor, f = `fill="${c}" ${K}`;
  const gold = `fill="${GOLD}" ${K}`;
  const shade = `fill="${dark(c,.22)}" ${K}`;
  // brilho (traço branco) e costura/dobra (traço no tom escuro da peça)
  const hl = (d: string, w = 8, o = .32)=>`<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
  const seam = (d: string, w = 3.5)=>`<path d="${d}" fill="none" stroke="${edge(c)}" stroke-opacity=".45" stroke-width="${w}" stroke-linecap="round"/>`;
  switch(s.acc){
    case 'bow':
      return `<path d="M 285 102 C 268 74 232 60 228 84 C 224 108 232 130 250 130 C 266 130 278 116 285 102 Z" ${f}/><path d="M 285 102 C 302 74 338 60 342 84 C 346 108 338 130 320 130 C 304 130 292 116 285 102 Z" ${f}/>`
        + seam('M 272 102 Q 256 98 244 110 M 298 102 Q 314 98 326 110') + hl('M 238 86 Q 246 74 258 78 M 312 78 Q 324 74 332 86', 5, .45)
        + `<rect x="272" y="87" width="26" height="30" rx="10" ${shade}/>`;
    case 'party': {
      const cone = 'M 144 98 C 164 68 184 36 196 16 Q 205 4 214 16 C 228 36 246 66 264 94 Q 204 116 144 98 Z';
      const stripe = c === '#ffffff' ? GOLD : '#ffffff';
      return `<path d="${cone}" ${f}/><clipPath id="gp"><path d="${cone}"/></clipPath><g clip-path="url(#gp)"><path d="M 140 56 L 270 108 M 160 26 L 280 74 M 186 -2 L 290 40" fill="none" stroke="${stripe}" stroke-opacity=".85" stroke-width="10"/></g><path d="${cone}" fill="none" stroke="${edge(c)}" stroke-width="5" stroke-linejoin="round"/>`
        + cluster([[152,99,9],[170,104,9],[188,107,9],[206,108,9],[224,106,9],[242,102,9],[258,97,9]], '#ffffff')
        + `<circle cx="205" cy="10" r="13" ${gold} stroke-width="4"/><circle cx="201" cy="6" r="3.5" fill="#fff" fill-opacity=".7"/>`;
    }
    case 'crown':
      return `<path d="M 130 98 C 128 78 128 60 132 46 Q 138 36 146 46 C 152 54 158 62 166 70 C 176 56 186 42 194 32 Q 200 24 206 32 C 214 42 224 56 234 70 C 242 62 248 54 254 46 Q 262 36 268 46 C 272 60 272 78 270 98 Q 200 110 130 98 Z" ${gold}/>`
        + `<path d="M 131 82 Q 200 94 269 82 L 270 98 Q 200 110 130 98 Z" fill="#f2a900" ${K} stroke-width="4"/>` + hl('M 141 58 Q 140 68 142 76', 4, .65)
        + `<circle cx="138" cy="40" r="8" ${gold} stroke-width="4"/><circle cx="200" cy="24" r="9" ${gold} stroke-width="4"/><circle cx="262" cy="40" r="8" ${gold} stroke-width="4"/>`
        + `<ellipse cx="200" cy="93" rx="10" ry="7.5" fill="${c}" ${K} stroke-width="3"/><circle cx="197" cy="91" r="2.4" fill="#fff" fill-opacity=".7"/><circle cx="163" cy="90" r="5.5" fill="${c}" ${K} stroke-width="3"/><circle cx="237" cy="90" r="5.5" fill="${c}" ${K} stroke-width="3"/>`;
    case 'cat':
      return band('M 98 152 Q 200 84 302 152', c, 8)
        + `<path d="M 102 122 C 88 84 84 52 98 42 C 114 34 150 58 172 80 Z" ${f}/><path d="M 298 122 C 312 84 316 52 302 42 C 286 34 250 58 228 80 Z" ${f}/>`
        + `<path d="M 112 100 C 104 80 102 62 110 58 C 118 56 134 68 144 78 Z" fill="#ffc1d6"/><path d="M 288 100 C 296 80 298 62 290 58 C 282 56 266 68 256 78 Z" fill="#ffc1d6"/>`
        + `<path d="M 118 92 L 112 74 M 128 88 L 124 72 M 282 92 L 288 74 M 272 88 L 276 72" fill="none" stroke="#f48fb1" stroke-width="3" stroke-linecap="round"/>`;
    case 'headband':
      return band('M 86 168 Q 200 92 314 168', c, 14) + hl('M 112 138 Q 150 108 196 104', 4, .4)
        + `<polygon points="${starPts(258, 134, 17)}" ${gold} stroke-width="3.5"/>`;
    case 'bucket':
      return `<path d="M 98 135 C 94 50 306 50 302 135 Z" ${f}/>` + hl('M 118 104 Q 138 74 178 66', 8, .3)
        + `<path d="M 99 120 Q 200 102 301 120" fill="none" stroke="${dark(c,.3)}" stroke-width="10"/><path d="M 56 138 Q 200 108 344 138 Q 330 158 200 154 Q 70 158 56 138 Z" ${f}/>`
        + `<path d="M 78 141 Q 200 122 322 141" fill="none" stroke="${edge(c)}" stroke-opacity=".45" stroke-width="3" stroke-dasharray="8 7" stroke-linecap="round"/>`;
    case 'pirate':
      return `<path d="M 312 118 C 330 100 354 92 360 104 C 364 114 352 124 336 126 Z" ${f}/><path d="M 314 124 C 334 124 356 138 352 152 C 348 160 332 152 322 142 Z" ${f}/>`
        + `<path d="M 84 152 C 80 70 140 48 200 48 C 262 48 322 70 316 152 Q 200 128 84 152 Z" ${f}/><circle cx="316" cy="122" r="9" ${f}/>`
        + seam('M 90 140 Q 200 116 310 140') + hl('M 104 110 Q 124 74 172 62', 8, .25)
        + `<circle cx="130" cy="95" r="5" fill="#fff"/><circle cx="175" cy="75" r="5" fill="#fff"/><circle cx="230" cy="75" r="5" fill="#fff"/><circle cx="272" cy="97" r="5" fill="#fff"/>`
        + `<path d="M 238 180 L 92 156 M 292 196 L 318 190" stroke="${PUPIL}" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="264" cy="204" rx="31" ry="28" fill="${PUPIL}"/><path d="M 244 194 Q 250 184 262 182" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="4" stroke-linecap="round"/>`;
    case 'helmet':
      return `<circle cx="200" cy="205" r="138" fill="rgba(200,230,255,.18)" stroke="#e8eef5" stroke-width="16"/><circle cx="200" cy="205" r="147" fill="none" stroke="#8fa3b8" stroke-width="3"/><circle cx="200" cy="205" r="130" fill="none" stroke="#8fa3b8" stroke-opacity=".5" stroke-width="2"/>`
        + hl('M 108 140 Q 136 92 196 80', 9, .7) + hl('M 94 178 Q 96 168 100 160', 7, .6);
    case 'nose': return `<circle cx="200" cy="240" r="16" fill="#e63946" ${K} stroke-width="4"/><ellipse cx="194" cy="234" rx="5.5" ry="4" fill="#fff" fill-opacity=".65"/>`;
    case 'beret':
      return `<path d="M 100 130 C 90 70 170 40 230 52 C 290 62 316 100 304 132 C 250 118 160 120 100 130 Z" ${f}/>` + hl('M 126 96 Q 150 66 196 62', 9, .3)
        + `<path d="M 104 127 C 160 116 250 115 301 129" fill="none" stroke="${dark(c,.32)}" stroke-width="7" stroke-linecap="round"/>`
        + `<path d="M 186 50 Q 192 34 206 44" fill="none" stroke="${edge(c)}" stroke-width="9" stroke-linecap="round"/>`;
    case 'flowers': {
      const leaf = (x: number, y: number, a: number)=>`<ellipse cx="${x}" cy="${y}" rx="11" ry="6" transform="rotate(${a} ${x} ${y})" fill="#4caf50" ${K} stroke-width="3"/>`;
      const flower = (x: number, y: number, col: string)=>[0,1,2,3,4].map(i=>`<circle cx="${(x+Math.cos(i*1.2566-1.57)*12).toFixed(1)}" cy="${(y+Math.sin(i*1.2566-1.57)*12).toFixed(1)}" r="10" fill="${col}" ${K} stroke-width="3"/>`).join('') + `<circle cx="${x}" cy="${y}" r="7.5" ${gold} stroke-width="3"/>`;
      return band('M 92 136 Q 200 40 308 136', '#3f9b4b', 5) + leaf(128,108,-40) + leaf(176,88,-15) + leaf(224,88,15) + leaf(272,108,40)
        + flower(104,122,c) + flower(152,96,'#ffffff') + flower(200,86,c) + flower(248,96,'#ffffff') + flower(296,122,c);
    }
    case 'chefhat': return `<path d="M 100 128 C 72 100 78 60 126 62 C 126 26 200 14 224 42 C 262 24 330 44 312 82 C 342 98 322 128 300 128 Z" fill="#ffffff" ${K}/><path d="M 150 70 Q 156 96 150 118 M 220 54 Q 218 90 226 118" fill="none" stroke="${DEEP}" stroke-opacity=".14" stroke-width="5" stroke-linecap="round"/><rect x="92" y="112" width="216" height="28" rx="9" ${f}/>` + hl('M 106 121 L 150 121', 4, .35);
    case 'wizard':
      return `<path d="M 120 128 C 150 92 170 56 184 28 Q 196 4 228 14 Q 212 22 216 36 C 228 62 252 96 282 128 Q 200 144 120 128 Z" ${f}/>` + hl('M 150 104 Q 172 70 190 36', 7, .28)
        + `<path d="M 141 100 Q 200 114 260 98 L 270 112 Q 200 128 130 114 Z" ${shade} stroke-width="4"/><rect x="188" y="99" width="24" height="22" rx="4" ${gold} stroke-width="3.5"/>`
        + `<path d="M 66 132 Q 200 104 334 132 Q 322 158 200 154 Q 78 158 66 132 Z" ${f}/>` + seam('M 92 140 Q 200 122 308 140')
        + `<polygon points="${starPts(206, 66, 15)}" ${gold} stroke-width="3"/><circle cx="178" cy="84" r="3.5" fill="${GOLD}"/><circle cx="234" cy="88" r="3" fill="${GOLD}"/><circle cx="200" cy="38" r="2.5" fill="${GOLD}"/>`;
    case 'phones':
      return band('M 92 190 C 90 62 310 62 308 190', c, 12) + `<path d="M 152 84 Q 200 66 248 84" fill="none" stroke="${dark(c,.32)}" stroke-width="13" stroke-linecap="round"/>`
        + `<rect x="62" y="170" width="38" height="66" rx="17" ${f}/><rect x="300" y="170" width="38" height="66" rx="17" ${f}/>`
        + `<ellipse cx="81" cy="203" rx="8" ry="19" fill="${dark(c,.3)}"/><ellipse cx="319" cy="203" rx="8" ry="19" fill="${dark(c,.3)}"/>` + hl('M 70 186 Q 72 179 78 177 M 308 186 Q 310 179 316 177', 4, .45);
    case 'cap':
      return `<path d="M 84 150 C 80 70 140 46 200 46 C 262 46 322 70 316 150 Z" ${f}/>` + seam('M 200 48 Q 192 100 196 148 M 140 62 Q 122 104 128 150 M 262 62 Q 280 104 274 150')
        + hl('M 104 112 Q 124 74 174 60', 9, .3)
        + `<path d="M 96 142 Q 38 140 20 174 Q 30 186 96 178 Q 140 172 178 150 Z" ${shade}/>` + hl('M 44 166 Q 72 150 110 150', 5, .25) + `<circle cx="200" cy="47" r="8" ${f}/>`;
    default: return '';
  }
}
function maskLayer(s: AvatarConfig){
  if (s.acc !== 'mask') return '';
  return `<path d="M 92 196 Q 94 174 124 177 Q 168 180 200 192 Q 232 180 276 177 Q 306 174 308 196 Q 312 234 266 240 Q 230 240 200 222 Q 170 240 134 240 Q 88 234 92 196 Z" fill="${s.accColor}" ${K}/><path d="M 106 190 Q 130 182 160 186" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>`;
}

const lid = (d: string, w = 5.5)=>`<path d="${d}" fill="none" stroke="${LINE}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
// Olho com íris colorida: a íris fica um pouco escondida pela pálpebra e tem dois pontos de brilho.
function irisEye(s: AvatarConfig, cx: number, y: number, big: boolean){
  const d = cx < 200 ? -1 : 1;
  const rx = big ? 23 : 20, ry = big ? 27 : 23, ir = big ? 20 : 17, pr = big ? 10 : 8.5;
  const id = `ge${cx}`;
  return `<clipPath id="${id}"><ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="${ry}"/></clipPath>`
    + `<ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${LINE}" stroke-opacity=".35" stroke-width="2.5"/>`
    + `<g clip-path="url(#${id})"><circle cx="${cx}" cy="${y+3}" r="${ir}" fill="url(#gi)"/><circle cx="${cx}" cy="${y+3}" r="${ir}" fill="none" stroke="${dark(s.eyeColor,.6)}" stroke-width="2.5"/><circle cx="${cx}" cy="${y+3}" r="${pr}" fill="${PUPIL}"/><ellipse cx="${cx}" cy="${y-ry}" rx="${rx+4}" ry="${ry*.5}" fill="${DEEP}" opacity=".14"/></g>`
    + `<circle cx="${cx+ir*.4}" cy="${y+3-ir*.42}" r="${ir*.34}" fill="#fff"/><circle cx="${cx-ir*.42}" cy="${y+3+ir*.45}" r="${ir*.17}" fill="#fff" fill-opacity=".85"/>`
    + lid(`M ${cx-rx} ${y-2} A ${rx} ${ry} 0 0 1 ${cx+rx} ${y-2}`)
    + (s.lashes ? lid(`M ${cx+d*(rx-1)} ${y-8} L ${cx+d*(rx+9)} ${y-16} M ${cx+d*rx} ${y-2} L ${cx+d*(rx+11)} ${y-5}`, 4) : '');
}
// Óculos por cima dos olhos (a cor da armação vem de gearColor)
function glassesLayer(s: AvatarConfig, L: number, R: number, y: number){
  if (s.glassesStyle === 'none') return '';
  const c = s.gearColor, line = edge(c);
  const rim = (draw: (a: string) => string, glass: string) =>
    draw(`fill="none" stroke="${line}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"`)
    + draw(`${glass} stroke="${c}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`);
  const bridge = (d: string) => `<path d="${d}" fill="none" stroke="${line}" stroke-width="9" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
  const glint = (cx: number) => `<path d="M ${cx-22} ${y-10} Q ${cx-15} ${y-22} ${cx} ${y-25}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3.5" stroke-linecap="round"/>`;
  const clear = 'fill="rgba(255,255,255,.12)"';
  switch(s.glassesStyle){
    case 'round':
      return rim(a => `<circle cx="${L}" cy="${y}" r="34" ${a}/><circle cx="${R}" cy="${y}" r="34" ${a}/>`, clear) + bridge(`M ${L+34} ${y-2} Q 200 ${y-12} ${R-34} ${y-2}`) + glint(L) + glint(R);
    case 'square':
      return rim(a => `<rect x="${L-37}" y="${y-28}" width="74" height="56" rx="13" ${a}/><rect x="${R-37}" y="${y-28}" width="74" height="56" rx="13" ${a}/>`, clear) + bridge(`M ${L+37} ${y-9} Q 200 ${y-17} ${R-37} ${y-9}`) + glint(L) + glint(R);
    case 'sun': {
      const lens = (cx: number, a: string) => `<path d="M ${cx-40} ${y-26} L ${cx+40} ${y-26} Q ${cx+45} ${y-26} ${cx+43} ${y-14} L ${cx+32} ${y+22} Q ${cx+27} ${y+31} ${cx+16} ${y+31} L ${cx-16} ${y+31} Q ${cx-27} ${y+31} ${cx-32} ${y+22} L ${cx-43} ${y-14} Q ${cx-45} ${y-26} ${cx-40} ${y-26} Z" ${a}/>`;
      const shine = (cx: number) => `<path d="M ${cx-26} ${y-15} L ${cx-8} ${y-15} L ${cx-22} ${y+7} Z" fill="#fff" fill-opacity=".28"/>`;
      return rim(a => lens(L, a) + lens(R, a), 'fill="#15181e" fill-opacity=".92"') + shine(L) + shine(R) + bridge(`M ${L+42} ${y-18} Q 200 ${y-27} ${R-42} ${y-18}`);
    }
    case 'heart': {
      const heart = (cx: number, a: string) => `<path d="M ${cx} ${y+27} C ${cx-54} ${y-6} ${cx-32} ${y-44} ${cx} ${y-15} C ${cx+32} ${y-44} ${cx+54} ${y-6} ${cx} ${y+27} Z" ${a}/>`;
      return rim(a => heart(L, a) + heart(R, a), 'fill="rgba(255,105,140,.45)"') + bridge(`M ${L+30} ${y-8} Q 200 ${y-16} ${R-30} ${y-8}`);
    }
    case 'star': {
      const star = (cx: number, a: string) => `<polygon points="${starPoints(cx, y+1, 40, 18)}" ${a}/>`;
      return rim(a => star(L, a) + star(R, a), 'fill="rgba(255,213,79,.5)"') + bridge(`M ${L+30} ${y-4} Q 200 ${y-12} ${R-30} ${y-4}`);
    }
    default: return '';
  }
}
function eyes(s: AvatarConfig){
  const L=150, R=250, y=205, out: string[]=[];
  const BC = mix(s.hair,'#2a1a12',.55);
  const brow = (d: string, w = 9)=>`<path d="${d}" fill="none" stroke="${BC}" stroke-width="${w}" stroke-linecap="round"/>`;
  const arc = (cx: number)=>lid(`M ${cx-22} 210 Q ${cx} 182 ${cx+22} 210`, 7);
  const sparkle = (cx: number, r: number, dx = 4, dy = -4)=>`<circle cx="${cx+dx}" cy="${y+dy}" r="${r}" fill="#fff"/>`;
  switch(s.eyes){
    case 'wink':
      out.push(irisEye(s, L, y, false), arc(R));
      out.push(brow(`M ${L-22} 170 Q ${L} 160 ${L+22} 170`,6), brow(`M ${R-24} 164 Q ${R} 152 ${R+24} 164`,6)); break;
    case 'big':
      for (const cx of [L,R]) out.push(irisEye(s, cx, y, true));
      out.push(brow(`M ${L-24} 164 Q ${L} 152 ${L+24} 164`,6), brow(`M ${R-24} 164 Q ${R} 152 ${R+24} 164`,6)); break;
    case 'dots':
      for (const cx of [L,R]) out.push(`<ellipse cx="${cx}" cy="${y}" rx="9.5" ry="12.5" fill="${PUPIL}"/>` + sparkle(cx, 3.4, 3, -5));
      out.push(brow(`M ${L-16} 180 Q ${L} 172 ${L+16} 180`,4.5), brow(`M ${R-16} 180 Q ${R} 172 ${R+16} 180`,4.5)); break;
    case 'iris':
      for (const cx of [L,R]) out.push(irisEye(s, cx, y, false));
      out.push(brow(`M ${L-22} 170 Q ${L} 160 ${L+22} 170`,6), brow(`M ${R-22} 170 Q ${R} 160 ${R+22} 170`,6)); break;
    case 'normal':
      for (const cx of [L,R]) out.push(`<ellipse cx="${cx}" cy="${y}" rx="20" ry="22" fill="#fff" stroke="${LINE}" stroke-opacity=".35" stroke-width="2.5"/><circle cx="${cx}" cy="${y+3}" r="12" fill="${PUPIL}"/>` + sparkle(cx, 4.5, 4, -2) + lid(`M ${cx-20} ${y-2} A 20 22 0 0 1 ${cx+20} ${y-2}`));
      out.push(brow(`M ${L-24} 170 Q ${L} 158 ${L+24} 170`,7), brow(`M ${R-24} 170 Q ${R} 158 ${R+24} 170`,7)); break;
    case 'happy':
      for (const cx of [L,R]) out.push(arc(cx));
      out.push(brow(`M ${L-24} 168 Q ${L} 156 ${L+24} 168`,6), brow(`M ${R-24} 168 Q ${R} 156 ${R+24} 168`,6)); break;
    case 'sleepy':
      for (const cx of [L,R]) out.push(`<path d="M ${cx-22} 205 A 22 18 0 0 0 ${cx+22} 205 Z" fill="#fff"/><path d="M ${cx-12} 205 A 12 12 0 0 0 ${cx+12} 205 Z" fill="${PUPIL}"/>` + lid(`M ${cx-24} 205 L ${cx+24} 205`, 6.5) + `<path d="M ${cx-16} ${y+13} Q ${cx} ${y+21} ${cx+16} ${y+13}" fill="none" stroke="${LINE}" stroke-opacity=".3" stroke-width="2.5" stroke-linecap="round"/>`);
      out.push(brow(`M ${L-24} 184 Q ${L} 180 ${L+24} 184`,6), brow(`M ${R-24} 184 Q ${R} 180 ${R+24} 184`,6)); break;
    case 'cute':
      for (const cx of [L,R]) out.push(`<ellipse cx="${cx}" cy="${y}" rx="17" ry="24" fill="${PUPIL}"/><circle cx="${cx+5}" cy="${y-9}" r="6.5" fill="#fff"/><circle cx="${cx-5}" cy="${y+10}" r="3.2" fill="#fff" fill-opacity=".9"/>`);
      out.push(brow(`M ${L-22} 168 Q ${L} 160 ${L+22} 168`,6), brow(`M ${R-22} 168 Q ${R} 160 ${R+22} 168`,6)); break;
    default: // angry: a pálpebra corta o olho na diagonal
      for (const cx of [L,R]) { const d = cx===L ? 1 : -1; // lado de dentro
        const id = `ga${cx}`, x0 = cx-d*26, x1 = cx+d*26;
        out.push(`<clipPath id="${id}"><polygon points="${x0},${y-22} ${x1},${y-3} ${x1},${y+40} ${x0},${y+40}"/></clipPath>`
          + `<g clip-path="url(#${id})"><ellipse cx="${cx}" cy="${y}" rx="20" ry="21" fill="#fff"/><circle cx="${cx+d*3}" cy="${y+3}" r="10.5" fill="${PUPIL}"/><circle cx="${cx+d*3+4}" cy="${y}" r="3.4" fill="#fff"/></g>`
          + lid(`M ${cx-d*20} ${y-15} L ${cx+d*20} ${y-1}`, 6)
          + `<path d="M ${cx-14} ${y+17} Q ${cx} ${y+24} ${cx+14} ${y+17}" fill="none" stroke="${LINE}" stroke-opacity=".3" stroke-width="2.5" stroke-linecap="round"/>`
          + brow(`M ${cx-d*26} ${y-36} L ${cx+d*22} ${y-18}`, 10)); }
  }
  out.push(glassesLayer(s, L, R, y));
  return out.join('');
}
function mouth(s: AvatarConfig){
  const dimples = (y: number)=>`<path d="M 160 ${y} q -5 7 2 13 M 240 ${y} q 5 7 -2 13" fill="none" ${K} stroke-width="3.5" opacity=".5"/>`;
  switch(s.mouth){
    case 'smirk': return `<path d="M 168 266 Q 205 280 238 252" fill="none" ${K} stroke-width="6"/><path d="M 240 246 q 5 6 0 13" fill="none" ${K} stroke-width="3.5" opacity=".5"/>`;
    case 'cat': return `<path d="M 168 262 Q 184 282 200 264 Q 216 282 232 262" fill="none" ${K} stroke-width="5.5"/>`;
    case 'sad': return `<path d="M 172 278 Q 200 252 228 278" fill="none" ${K} stroke-width="6"/>`;
    case 'tiny': return `<path d="M 184 263 Q 200 277 216 263" fill="none" ${K} stroke-width="5.5"/>`;
    case 'smile':  return `<path d="M 165 258 Q 200 294 235 258" fill="none" ${K} stroke-width="6"/>` + dimples(252);
    case 'grin':   return `<path d="M 160 255 Q 200 305 240 255 Z" fill="${WINE}" ${K} stroke-width="4"/><clipPath id="gm"><path d="M 160 255 Q 200 305 240 255 Z"/></clipPath><ellipse clip-path="url(#gm)" cx="200" cy="292" rx="20" ry="11" fill="#ff8fa3"/><path d="M 168 257 Q 200 268 232 257 L 229 267 Q 200 278 171 267 Z" fill="#fff"/>`;
    case 'tongue': return `<path d="M 165 258 Q 200 300 235 258 Z" fill="${WINE}" ${K} stroke-width="4"/><path d="M 185 281 Q 200 306 215 281 Q 200 273 185 281 Z" fill="#ff8fa3" ${K} stroke-width="3"/>`;
    case 'flat':   return `<path d="M 175 272 L 225 272" fill="none" ${K} stroke-width="6"/>`;
    case 'o':      return `<ellipse cx="200" cy="274" rx="13" ry="16" fill="${WINE}" ${K} stroke-width="4"/><ellipse cx="200" cy="284" rx="8" ry="5" fill="#ff8fa3"/>`;
    default:       return `<path d="M 170 258 Q 200 264 230 258 Q 226 297 200 298 Q 174 297 170 258 Z" fill="${WINE}" ${K} stroke-width="4"/><clipPath id="gm"><path d="M 170 258 Q 200 264 230 258 Q 226 297 200 298 Q 174 297 170 258 Z"/></clipPath><g clip-path="url(#gm)"><ellipse cx="200" cy="294" rx="18" ry="10" fill="#ff8fa3"/><path d="M 172 256 Q 200 262 228 256 L 227 266 Q 200 272 173 266 Z" fill="#fff"/></g>`;
  }
}
function nose(s: AvatarConfig){
  const c = mix(s.skin,'#5a1a26',.42);
  if (s.nose === 'dot') return `<path d="M 191 235 Q 200 245 209 235" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
  if (s.nose === 'button') return `<ellipse cx="200" cy="238" rx="11" ry="8.5" fill="${mix(s.skin,'#5a1a26',.2)}" stroke="${c}" stroke-width="3"/><ellipse cx="196" cy="235" rx="4" ry="2.5" fill="#fff" opacity=".55"/>`;
  return '';
}
function extras(s: AvatarConfig){
  let o = '';
  if (s.blush) o += `<ellipse cx="122" cy="246" rx="28" ry="18" fill="url(#gb)"/><ellipse cx="278" cy="246" rx="28" ry="18" fill="url(#gb)"/>`;
  if (s.mole) o += `<circle cx="262" cy="262" r="4.5" fill="${mix(s.skin,'#2a1008',.75)}" opacity=".9"/>`;
  if (s.bandaid) o += `<g transform="rotate(-28 132 254)"><rect x="104" y="244" width="56" height="20" rx="10" fill="#f6c9a0" stroke="#c9946a" stroke-width="2.5"/><rect x="124" y="244" width="16" height="20" fill="#ecb27f"/><circle cx="114" cy="254" r="1.8" fill="#c9946a"/><circle cx="150" cy="254" r="1.8" fill="#c9946a"/></g>`;
  if (s.freckles) o += [[165,236],[180,242],[155,246],[235,236],[220,242],[245,246]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" fill="${mix(s.skin,'#5a1a26',.5)}" opacity=".75"/>`).join('');
  return o;
}
// Colar, cachecol ou lenço: desenhado por cima da roupa (só aparece com roupa)
function neckLayer(s: AvatarConfig){
  const gold = '#ffd54f', c = s.gearColor;
  const q = (u: number, a: number, b: number, d: number) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * d;
  switch(s.neck){
    case 'chain':
      return `<path d="M 152 326 Q 200 392 248 326" fill="none" stroke="${gold}" stroke-width="7" stroke-dasharray="9 5" stroke-linecap="round"/><circle cx="200" cy="359" r="9" fill="${gold}" ${K} stroke-width="3"/><circle cx="197" cy="356" r="2.5" fill="#fff" fill-opacity=".7"/>`;
    case 'pearls': {
      let o = '';
      for (let i = 0; i <= 8; i += 1){ const u = i / 8; o += `<circle cx="${q(u,152,200,248).toFixed(1)}" cy="${q(u,326,386,326).toFixed(1)}" r="7.5" fill="#fff" stroke="#c9d1dc" stroke-width="2"/>`; }
      return o;
    }
    case 'medal':
      return `<path d="M 158 324 L 200 374 L 242 324" fill="none" stroke="#cfd8dc" stroke-width="5" stroke-linejoin="round"/><circle cx="200" cy="384" r="15" fill="${gold}" ${K} stroke-width="3.5"/><polygon points="${starPoints(200, 384, 9, 4)}" fill="#fff" fill-opacity=".85"/>`;
    case 'scarf':
      return `<path d="M 138 318 Q 200 356 262 318 L 270 348 Q 200 386 130 348 Z" fill="${c}" ${K}/><path d="M 148 330 Q 200 366 252 330" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="5"/><path d="M 228 356 L 256 414 L 222 420 L 206 366 Z" fill="${mix(c,'#000000',.15)}" ${K}/>`;
    case 'bandana':
      return `<path d="M 144 320 Q 200 350 256 320 L 200 396 Z" fill="${c}" ${K}/><circle cx="188" cy="352" r="3.5" fill="#fff" fill-opacity=".85"/><circle cx="212" cy="352" r="3.5" fill="#fff" fill-opacity=".85"/><circle cx="200" cy="370" r="3.5" fill="#fff" fill-opacity=".85"/>`;
    default: return '';
  }
}
const BASE = 'M 50 420 C 50 360 110 322 200 322 C 290 322 350 360 350 420 Z';
function clothes(s: AvatarConfig){
  const c = s.clothColor, f = `fill="${c}" ${K}`;
  const skin = skinShade(s.skin);
  // decote com a gola no tom escuro da roupa
  const neck = `<path d="M 163 322 Q 200 362 237 322 Z" fill="${skin}" stroke="${dark(c,.3)}" stroke-width="7" stroke-linejoin="round"/>`;
  const star = (x: number, y: number, k: number)=>`<polygon transform="translate(${x} ${y}) scale(${k})" points="0,-23 7,-7 24,-6 11,5 15,22 0,13 -15,22 -11,5 -24,-6 -7,-7" ${`fill="${GOLD}" ${K}`} stroke-width="${4/k}"/>`;
  switch(s.cloth){
    case 'tshirt':  return `<path d="${BASE}" ${f}/>${neck}`;
    case 'stripes': {
      let lines = ''; for (let y=336;y<410;y+=22) lines += `<rect x="40" y="${y}" width="320" height="10" fill="#fff" opacity=".85"/>`;
      return `<path d="${BASE}" ${f}/><g clip-path="url(#cp)">${lines}</g><path d="${BASE}" fill="none" stroke="${edge(c)}" stroke-width="5" stroke-linejoin="round"/>${neck}`;
    }
    case 'hoodie':
      return `<path d="M 100 360 C 90 290 150 292 200 292 C 250 292 310 290 300 360 Z" fill="${dark(c,.14)}" ${K}/><path d="${BASE}" ${f}/><path d="M 163 322 Q 200 350 237 322" fill="${skin}" stroke="${dark(c,.3)}" stroke-width="7" stroke-linejoin="round"/><path d="M 182 348 L 180 392 M 218 348 L 220 392" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="180" cy="394" r="4" fill="#fff"/><circle cx="220" cy="394" r="4" fill="#fff"/>`;
    case 'suit':
      return `<path d="${BASE}" ${f}/><path d="M 160 322 L 200 395 L 240 322 Z" fill="#fff" ${K} stroke-width="4"/><path d="M 192 345 L 208 345 L 213 392 L 200 402 L 187 392 Z" fill="${TIE}" ${K} stroke-width="3"/><path d="M 160 322 L 200 405 M 240 322 L 200 405" fill="none" stroke="${edge(c)}" stroke-width="4" stroke-linecap="round"/>`;
    case 'overall':
      return `<path d="${BASE}" fill="#fff" ${K}/>${`<path d="M 163 322 Q 200 362 237 322 Z" fill="${skin}" stroke="#d5dbe6" stroke-width="7" stroke-linejoin="round"/>`}<path d="M 140 360 L 140 330 M 260 360 L 260 330" fill="none" stroke="${edge(c)}" stroke-width="24" stroke-linecap="round"/><path d="M 140 360 L 140 330 M 260 360 L 260 330" fill="none" stroke="${c}" stroke-width="15" stroke-linecap="round"/><rect x="132" y="358" width="136" height="64" rx="8" ${f}/><circle cx="140" cy="366" r="6" fill="${GOLD}" ${K} stroke-width="3"/><circle cx="260" cy="366" r="6" fill="${GOLD}" ${K} stroke-width="3"/>`;
    case 'polo': { const lt = light(c,.3); return `<path d="${BASE}" ${f}/><path d="M 170 322 Q 186 350 200 356 Q 214 350 230 322 Z" fill="${skin}"/><path d="M 154 326 Q 172 348 196 360 Q 184 372 168 368 Q 148 356 146 338 Q 148 330 154 326 Z" fill="${lt}" ${K} stroke-width="4"/><path d="M 246 326 Q 228 348 204 360 Q 216 372 232 368 Q 252 356 254 338 Q 252 330 246 326 Z" fill="${lt}" ${K} stroke-width="4"/><circle cx="200" cy="378" r="4" fill="#fff"/><circle cx="200" cy="396" r="4" fill="#fff"/>`; }
    case 'bowtie': return `<path d="${BASE}" fill="#fff" ${K}/><path d="M 168 322 Q 184 346 200 352 Q 216 346 232 322 Z" fill="${skin}"/><path d="M 154 326 Q 172 346 198 356 Q 186 370 170 368 Q 148 356 146 338 Q 148 330 154 326 Z" fill="#fff" ${K} stroke-width="4"/><path d="M 246 326 Q 228 346 202 356 Q 214 370 230 368 Q 252 356 254 338 Q 252 330 246 326 Z" fill="#fff" ${K} stroke-width="4"/><path d="M 200 360 C 190 346 172 340 169 352 C 166 364 170 378 182 377 C 191 376 196 368 200 360 Z M 200 360 C 210 346 228 340 231 352 C 234 364 230 378 218 377 C 209 376 204 368 200 360 Z" ${f} stroke-width="4"/><circle cx="200" cy="360" r="8" ${f} stroke-width="4"/>`;
    case 'astro': return `<path d="${BASE}" fill="#f1f4f8" ${K}/><path d="M 140 330 Q 200 372 260 330" fill="none" stroke="#9fb0c3" stroke-width="14" stroke-linecap="round"/><circle cx="150" cy="380" r="12" fill="${TIE}" ${K} stroke-width="4"/><rect x="236" y="368" width="40" height="22" rx="5" fill="#2f6fed" ${K} stroke-width="4"/>`;
    case 'jacket':
      return `<path d="${BASE}" ${f}/><path d="M 168 322 Q 200 360 232 322 L 244 420 L 156 420 Z" fill="#fff" ${K} stroke-width="4"/><path d="M 163 322 Q 200 362 237 322 Z" fill="${skin}" stroke="#d5dbe6" stroke-width="7" stroke-linejoin="round"/><path d="M 166 326 L 154 420 M 234 326 L 246 420" fill="none" stroke="${edge(c)}" stroke-width="5" stroke-linecap="round"/>`;
    case 'turtle':
      return `<path d="${BASE}" ${f}/><path d="M 156 300 Q 200 324 244 300 L 244 346 Q 200 372 156 346 Z" fill="${light(c,.18)}" ${K} stroke-width="4"/><path d="M 164 318 Q 200 342 236 318 M 162 332 Q 200 358 238 332" fill="none" stroke="${dark(c,.3)}" stroke-width="3" opacity=".55"/>`;
    case 'tank':
      return `<path d="${BASE}" fill="${mix(s.skin,'#5a1a26',.08)}" ${K}/><path d="M 100 420 C 100 380 140 356 200 356 C 260 356 300 380 300 420 Z" ${f}/>` + band('M 152 360 L 150 330', c, 14) + band('M 248 360 L 250 330', c, 14) + `<path d="M 100 420 C 100 380 140 356 200 356 C 260 356 300 380 300 420 Z" fill="${c}"/>`;
    case 'chef':
      return `<path d="${BASE}" fill="#fff" ${K}/><circle cx="186" cy="372" r="5" fill="#9aa7b5"/><circle cx="214" cy="372" r="5" fill="#9aa7b5"/><circle cx="186" cy="398" r="5" fill="#9aa7b5"/><circle cx="214" cy="398" r="5" fill="#9aa7b5"/><path d="M 163 322 Q 200 362 237 322 Z" fill="${skin}"/><path d="M 166 326 Q 200 350 234 326 L 220 350 Q 200 366 180 350 Z" ${f} stroke-width="4"/>`;
    case 'pajama':
      return `<path d="${BASE}" ${f}/>${neck}<path d="M 132 372 a 13 13 0 1 0 12 20 a 10 10 0 1 1 -12 -20 Z" fill="${GOLD}"/><polygon points="262,366 266,376 277,377 269,384 271,395 262,389 253,395 255,384 247,377 258,376" fill="${GOLD}"/><circle cx="222" cy="404" r="4" fill="${GOLD}"/>`;
    case 'hero':
      return `<path d="M 30 420 L 70 335 C 130 316 270 316 330 335 L 370 420 Z" fill="${s.accColor}" ${K}/><path d="${BASE}" ${f}/>${neck}<polygon points="206,350 184,384 200,384 192,410 222,370 205,370" fill="${GOLD}" ${K} stroke-width="3.5"/>`;
    case 'star':
      return `<path d="${BASE}" ${f}/>${neck}${star(200, 384, 1)}`;
    case 'dress':
      return `<path d="${BASE}" ${f}/>${neck}<path d="M 146 334 Q 200 392 254 334 Q 200 358 146 334 Z" fill="#fff" ${K} stroke-width="4"/><circle cx="200" cy="385" r="6" fill="${GOLD}" ${K} stroke-width="3"/>`;
    default: return '';
  }
}

function defs(s: AvatarConfig){
  const sk = s.skin, ek = s.eyeColor;
  return `<defs>
<radialGradient id="gs" cx=".4" cy=".34" r=".8"><stop offset="0" stop-color="${light(sk,.16)}"/><stop offset=".75" stop-color="${sk}"/></radialGradient>
<linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dark(ek,.5)}"/><stop offset=".55" stop-color="${ek}"/><stop offset="1" stop-color="${light(ek,.4)}"/></linearGradient>
<radialGradient id="gb"><stop offset="0" stop-color="#ff5c7a" stop-opacity=".75"/><stop offset="1" stop-color="#ff5c7a" stop-opacity="0"/></radialGradient>
<linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset=".25" stop-color="${DEEP}" stop-opacity="0"/><stop offset="1" stop-color="${DEEP}" stop-opacity=".3"/></linearGradient>
<linearGradient id="gk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${DEEP}" stop-opacity=".24"/><stop offset=".3" stop-color="${DEEP}" stop-opacity="0"/><stop offset=".7" stop-color="${DEEP}" stop-opacity="0"/><stop offset="1" stop-color="${DEEP}" stop-opacity=".24"/></linearGradient>
<radialGradient id="gg" cx=".3" cy=".22" r="1"><stop offset="0" stop-color="${light(s.bg,.45)}"/><stop offset=".55" stop-color="${s.bg}"/><stop offset="1" stop-color="${dark(s.bg,.16)}"/></radialGradient>
<clipPath id="cp"><path d="${BASE}"/></clipPath>
</defs>`;
}
// Fundo: um halo claro atrás da cabeça e algumas estrelinhas.
function backdrop(s: AvatarConfig){
  const c = s.bg === '#ffffff' ? '#dfe7f3' : '#ffffff';
  const spark = (x: number, y: number, r: number)=>`<path d="M ${x} ${y-r} Q ${x} ${y} ${x+r} ${y} Q ${x} ${y} ${x} ${y+r} Q ${x} ${y} ${x-r} ${y} Q ${x} ${y} ${x} ${y-r} Z" fill="${c}" opacity=".7"/>`;
  return `<circle cx="200" cy="228" r="152" fill="${c}" opacity=".2"/><circle cx="200" cy="228" r="186" fill="none" stroke="${c}" stroke-opacity=".13" stroke-width="14"/>`
    + spark(52, 62, 15) + spark(350, 112, 11) + spark(338, 40, 7) + `<circle cx="34" cy="150" r="5" fill="${c}" opacity=".5"/><circle cx="372" cy="216" r="4" fill="${c}" opacity=".5"/>`;
}
// Deixa os ids únicos (vários avatares na mesma página), resolve o contorno de cada peça e tira atributos repetidos.
function clean(svg: string, s: AvatarConfig, u: number){
  svg = svg.replace(/\sid="([a-z]+\d*)"/g, ` id="$1_${u}"`).replace(/url\(#([a-z]+\d*)\)/g, `url(#$1_${u})`);
  return svg.replace(/<[a-zA-Z][^>]*>/g, tag=>{
    const name = tag.match(/^<([\w-]+)/)?.[1] ?? '';
    const end = tag.endsWith('/>') ? '/>' : '>';
    const attrs = new Map<string, string>();
    for (const m of tag.matchAll(/\s([\w:-]+)="([^"]*)"/g)) attrs.set(m[1], m[2]);
    if (attrs.get('stroke') === INK) {
      const fill = attrs.get('fill') ?? 'none';
      attrs.set('stroke', fill.startsWith('#') ? edge(fill) : fill.startsWith('url(#gs') ? edge(s.skin) : LINE);
    }
    return `<${name}` + [...attrs].map(([k,v])=>` ${k}="${v}"`).join('') + end;
  });
}
let UID = 0;
export function renderAvatarSvg(s: AvatarConfig, only?: Set<string>){
  const on = (k: string) => !only || only.has(k);
  const withC = s.cloth !== 'none';
  const fs = faceShape(s);
  // a cabeça é posicionada pelo queixo, então todo rosto deixa o mesmo pedaço de pescoço acima da gola
  const k = s.chibi ? 1.06 : 1, off = s.chibi ? 10 : 0;
  const shift = withC ? Math.round(312 - 240 - off - (fs.chin - 240) * k) : 0;
  const HT = `translate(0 ${shift})` + (s.chibi ? ' translate(0 10) translate(200 240) scale(1.06) translate(-200 -240)' : '');
  // cabelo e acessórios acompanham a largura/altura de cada formato de rosto
  const FT = `translate(200 200) scale(${fs.fit[0]} ${fs.fit[1]}) translate(-200 -200)`;
  const neck = `<rect x="168" y="${fs.chin-70}" width="64" height="130" fill="${skinShade(s.skin)}" ${K}/><ellipse cx="200" cy="${fs.chin+6}" rx="29" ry="12" fill="${DEEP}" opacity=".2"/>`;
  const clothShade = `<g clip-path="url(#cp)"><rect x="40" y="318" width="320" height="110" fill="url(#gk)"/><ellipse cx="200" cy="336" rx="56" ry="15" fill="${DEEP}" opacity=".12"/><path d="M 100 350 Q 116 384 110 422 M 300 350 Q 284 384 290 422" fill="none" stroke="${DEEP}" stroke-opacity=".2" stroke-width="4" stroke-linecap="round"/></g>`;
  const HATS: Record<string, number> = { cap:52, bucket:140, pirate:52, helmet:0, beret:100, chefhat:112, wizard:100 };
  const hat = s.acc in HATS;
  const hs = (hat && ['spiky','messy','mohawk','tuft','ponytop','pixie'].includes(s.hairStyle)) ? 'short' : s.hairStyle;
  const s2 = { ...s, hairStyle: hs };
  const hideBack = (hat && s.acc !== 'helmet' && hs === 'afro') || ((hat || s.acc === 'cat') && ['bun','bunbow','twin','puffs'].includes(hs)) || (['crown','party','flowers'].includes(s.acc) && ['bun','bunbow'].includes(hs));
  let back = hideBack ? '' : hairBack(s2), front = hairFront(s2), hatDef = '';
  if (hat) {
    // o cabelo some por baixo do chapéu: o corte é curvo para não deixar cantos retos nas laterais
    const area = s.acc === 'helmet' ? '<circle cx="200" cy="205" r="128"/>' : `<path d="M 0 400 L 0 ${HATS[s.acc]+70} Q 200 ${HATS[s.acc]-70} 400 ${HATS[s.acc]+70} L 400 400 Z"/>`;
    hatDef = `<clipPath id="gq">${area}</clipPath>`;
    back = `<g clip-path="url(#gq)">${back}</g>`;
    front = `<g clip-path="url(#gq)">${front}</g>`;
  }
  const fit = (x: string) => `<g transform="${FT}">${x}</g>`;
  // Rosto: base no tom de sombra, a parte iluminada deslocada por cima (sobra uma meia-lua de sombra no queixo)
  // e a sombra que a franja faz na testa.
  const fb = hairFrontBase(s2);
  const fringeShadow = fb ? `<clipPath id="gf" transform="translate(0 14) ${FT}">${fb}</clipPath><rect clip-path="url(#gf)" x="0" y="0" width="400" height="400" fill="${DEEP}" opacity=".15"/>` : '';
  const face = ears(s, fs.earX)
    + fs.draw(`fill="${skinShade(s.skin)}"`)
    + `<clipPath id="fc">${fs.draw('')}</clipPath><g clip-path="url(#fc)"><g transform="translate(-4 -9)">${fs.draw('fill="url(#gs)"')}</g>${fringeShadow}</g>`
    + fs.draw(`fill="none" stroke="${edge(s.skin)}" stroke-width="5"`)
    + fit(extras(s));
  const inner = `<g transform="${HT}">${on('hairBack') ? fit(back) : ''}${withC && on('clothes') ? neck : ''}</g>
${withC && on('clothes') ? `<g transform="translate(0 8)">${clothes(s)}${clothShade}${neckLayer(s)}</g>` : ''}
<g transform="${HT}">${on('face') ? face : ''}${on('nose') ? nose(s) : ''}${on('acc') ? fit(maskLayer(s)) : ''}${on('mouth') ? `<g transform="translate(200 272) scale(1.18) translate(-200 -272)">${mouth(s)}</g>` : ''}${on('eyes') ? `<g transform="translate(200 212) scale(1.28) translate(-200 -212)">${eyes(s)}</g>` : ''}${fit(hatDef + (on('hairFront') ? front : '') + (on('acc') ? acc(s) : ''))}</g>`;
  const bg = (shape: string) => on('bg') ? shape + backdrop(s) : '';
  let content: string;
  if (s.shape === 'pop') {
    content = `<clipPath id="cc"><circle cx="200" cy="232" r="166"/><rect x="0" y="0" width="400" height="232"/></clipPath><clipPath id="cb"><circle cx="200" cy="232" r="166"/></clipPath><g clip-path="url(#cb)">${bg('<circle cx="200" cy="232" r="166" fill="url(#gg)"/>')}</g><g clip-path="url(#cc)"><g transform="translate(200 250) scale(.88) translate(-200 -250)">${inner}</g></g>`;
  } else if (s.shape === 'circle') {
    content = `<clipPath id="cc"><circle cx="200" cy="200" r="200"/></clipPath><g clip-path="url(#cc)">${bg('<circle cx="200" cy="200" r="200" fill="url(#gg)"/>')}<g transform="translate(200 250) scale(1.04) translate(-200 -250)">${inner}</g></g>`;
  } else {
    content = `${bg('<rect width="400" height="400" fill="url(#gg)"/>')}<g transform="translate(200 262) scale(.94) translate(-200 -262)">${inner}</g>`;
  }
  return clean(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">${defs(s)}${content}</svg>`, s, ++UID);
}
