import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  ACCESSORIES, CLOTHES, DEFAULT_AVATAR_CONFIG, EARRINGS, EYES, FACES, GLASSES, HAIR_STYLES, MOUTHS, NECKLACES, avatarImageUrl, encodeAvatar,
  randomAvatarConfig, renderAvatarSvg,
} from '../dist/index.js';

const SHAPES = ['square', 'circle', 'pop'];
const normalizar = svg => svg.replace(/_\d+/g, '_N'); // os ids ganham um contador; o desenho em si é igual

function problemas(svg) {
  const achados = [];
  for (const ruim of ['undefined', 'NaN', 'null', '#0f0f10']) if (svg.includes(ruim)) achados.push(`contém ${ruim}`);
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  if (new Set(ids).size !== ids.length) achados.push('ids repetidos');
  for (const u of svg.matchAll(/url\(#([^)]+)\)/g)) if (!ids.includes(u[1])) achados.push(`referência solta ${u[1]}`);
  for (const tag of svg.matchAll(/<[a-zA-Z][^>]*>/g)) {
    const nomes = [...tag[0].matchAll(/\s([\w:-]+)=/g)].map(m => m[1]);
    if (new Set(nomes).size !== nomes.length) achados.push('atributo repetido');
  }
  if (!svg.startsWith('<svg') || !svg.endsWith('</svg>')) achados.push('não é um svg completo');
  return achados;
}

test('6000 personagens sorteados em todos os formatos saem sem defeito', () => {
  for (let i = 0; i < 6000; i += 1) {
    const config = { ...randomAvatarConfig(), shape: SHAPES[i % 3] };
    assert.deepEqual(problemas(renderAvatarSvg(config)), [], encodeAvatar(config));
  }
});

test('toda peça de toda lista desenha, em cima do personagem padrão', () => {
  const listas = {
    face: FACES, hairStyle: HAIR_STYLES, eyes: EYES, mouth: MOUTHS, cloth: CLOTHES, acc: ACCESSORIES,
    glassesStyle: GLASSES, neck: NECKLACES, earringStyle: EARRINGS,
  };
  for (const [campo, lista] of Object.entries(listas)) {
    for (const { value } of lista) {
      for (const shape of SHAPES) {
        const svg = renderAvatarSvg({ ...DEFAULT_AVATAR_CONFIG, [campo]: value, shape });
        assert.deepEqual(problemas(svg), [], `${campo}=${value} ${shape}`);
      }
    }
  }
});

test('pinta, curativo e fundo personalizado desenham sem defeito', () => {
  for (const shape of SHAPES) {
    const svg = renderAvatarSvg({ ...DEFAULT_AVATAR_CONFIG, mole: true, bandaid: true, bg: '#12ab9c', shape });
    assert.deepEqual(problemas(svg), [], shape);
  }
});

test('o mesmo personagem desenha sempre a mesma coisa', () => {
  for (let i = 0; i < 50; i += 1) {
    const config = randomAvatarConfig();
    assert.equal(normalizar(renderAvatarSvg(config)), normalizar(renderAvatarSvg(config)));
  }
});

test('a miniatura em data URL é um svg que dá para decodificar', () => {
  const url = avatarImageUrl(DEFAULT_AVATAR_CONFIG);
  assert.ok(url.startsWith('data:image/svg+xml;charset=utf-8,'));
  assert.ok(decodeURIComponent(url.split(',')[1]).startsWith('<svg'));
});

test('funciona também com require (o backend é CommonJS)', () => {
  const require = createRequire(import.meta.url);
  const cjs = require('../dist/index.cjs');
  assert.equal(typeof cjs.renderAvatarSvg, 'function');
  assert.equal(typeof cjs.decodeAvatar, 'function');
  assert.equal(typeof cjs.AVATAR_STYLE_VERSION, 'number');
  const config = randomAvatarConfig();
  assert.equal(normalizar(cjs.renderAvatarSvg(config)), normalizar(renderAvatarSvg(config)));
});
