import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AVATAR_CODE_LENGTH, AVATAR_CODE_PREFIX, DEFAULT_AVATAR_CONFIG, corDoAvatar, decodeAvatar, encodeAvatar, isAvatarCode,
  newAvatarCode, randomAvatarConfig,
} from '../dist/index.js';

const BASE = AVATAR_CODE_PREFIX.length + 13 + 2; // 22: formato antigo (sem os 4 caracteres de acessórios)

test('o avatar padrão vira um código de 26 caracteres e volta igual', () => {
  const code = encodeAvatar(DEFAULT_AVATAR_CONFIG);
  assert.equal(code.length, AVATAR_CODE_LENGTH);
  assert.equal(AVATAR_CODE_LENGTH, 26);
  assert.ok(code.startsWith(AVATAR_CODE_PREFIX));
  assert.equal(encodeAvatar(decodeAvatar(code)), code);
});

test('ida e volta de 3000 personagens sorteados', () => {
  for (let i = 0; i < 3000; i += 1) {
    const code = encodeAvatar(randomAvatarConfig());
    const back = decodeAvatar(code);
    assert.ok(back, `não decodificou ${code}`);
    assert.equal(encodeAvatar(back), code);
    assert.ok(isAvatarCode(code));
  }
});

test('cor de fundo personalizada vai no fim do código (32 caracteres) e volta igual', () => {
  const code = encodeAvatar({ ...DEFAULT_AVATAR_CONFIG, bg: '#12ab9c' });
  assert.equal(code.length, AVATAR_CODE_LENGTH + 6);
  assert.ok(code.endsWith('12ab9c'));
  assert.equal(decodeAvatar(code).bg, '#12ab9c');
  assert.equal(corDoAvatar(code), '#12AB9C');
  assert.equal(encodeAvatar(decodeAvatar(code)), code);
});

test('códigos antigos (22 e 28 caracteres, sem acessórios) continuam valendo', () => {
  const novo = encodeAvatar(DEFAULT_AVATAR_CONFIG);
  const antigo = novo.slice(0, BASE);
  assert.equal(antigo.length, 22);
  const lido = decodeAvatar(antigo);
  assert.ok(lido);
  assert.equal(lido.glassesStyle, 'none');
  assert.equal(lido.neck, 'none');
  assert.equal(lido.earringStyle, 'none');

  const antigoComCor = decodeAvatar(`${antigo}ff8800`);
  assert.equal(antigoComCor.bg, '#ff8800');
});

test('o óculos e o brinco do formato antigo viram óculos redondo e brinco de bolinha', () => {
  const base = encodeAvatar({ ...DEFAULT_AVATAR_CONFIG, blush: false }).slice(0, BASE);
  // no código antigo, o bit 0 era "óculos" e o bit 4 era "brinco" (o campo de 2 caracteres fica no fim)
  const comBits = (mask) => `${base.slice(0, BASE - 2)}${mask.toString(36).padStart(2, '0')}`;
  assert.equal(decodeAvatar(comBits(0b1)).glassesStyle, 'round');
  assert.equal(decodeAvatar(comBits(0b10000)).earringStyle, 'ball');
  assert.equal(decodeAvatar(comBits(0)).glassesStyle, 'none');
});

test('códigos inválidos viram null, nunca um personagem torto', () => {
  const ok = encodeAvatar(DEFAULT_AVATAR_CONFIG);
  const flags = AVATAR_CODE_PREFIX.length + 13; // onde começam os 2 caracteres de detalhes
  const ruins = [
    null, undefined, 42, '', 'adventurer-1787066874693', ok.slice(0, -1), `${ok}0`, ok.slice(0, BASE - 1), `${ok}ff880`,
    ok.replace('pulyn1-', 'pulyn2-'),
    // posição fora da lista (a primeira peça só tem 6 formatos de rosto)
    `${AVATAR_CODE_PREFIX}z${ok.slice(AVATAR_CODE_PREFIX.length + 1)}`,
    // detalhes com bit que não existe
    `${ok.slice(0, flags)}zz${ok.slice(flags + 2)}`,
    // acessório fora da lista (óculos só tem 6 opções)
    `${ok.slice(0, BASE)}z${ok.slice(BASE + 1)}`,
    // cor própria que não é hexadecimal
    `${ok}zzzzzz`,
    // caractere que não é base 36
    `${ok.slice(0, 12)}_${ok.slice(13)}`,
  ];
  for (const valor of ruins) assert.equal(decodeAvatar(valor), null, `aceitou ${String(valor)}`);
});

test('newAvatarCode sempre devolve um código válido', () => {
  for (let i = 0; i < 200; i += 1) assert.ok(decodeAvatar(newAvatarCode()));
});
