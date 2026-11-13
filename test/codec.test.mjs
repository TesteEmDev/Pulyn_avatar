import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AVATAR_CODE_LENGTH, AVATAR_CODE_PREFIX, DEFAULT_AVATAR_CONFIG, decodeAvatar, encodeAvatar, isAvatarCode, newAvatarCode,
  randomAvatarConfig,
} from '../dist/index.js';

test('o avatar padrão vira um código de 22 caracteres e volta igual', () => {
  const code = encodeAvatar(DEFAULT_AVATAR_CONFIG);
  assert.equal(code.length, AVATAR_CODE_LENGTH);
  assert.equal(AVATAR_CODE_LENGTH, 22);
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

test('códigos inválidos viram null, nunca um personagem torto', () => {
  const ok = encodeAvatar(DEFAULT_AVATAR_CONFIG);
  const ruins = [
    null, undefined, 42, '', 'adventurer-1787066874693', ok.slice(0, -1), `${ok}0`, ok.replace('pulyn1-', 'pulyn2-'),
    // posição fora da lista (a primeira peça só tem 6 formatos de rosto)
    `${AVATAR_CODE_PREFIX}z${ok.slice(AVATAR_CODE_PREFIX.length + 1)}`,
    // flags com bit que não existe
    `${ok.slice(0, -2)}zz`,
    // caractere que não é base 36
    `${ok.slice(0, -3)}_${ok.slice(-2)}`,
  ];
  for (const valor of ruins) assert.equal(decodeAvatar(valor), null, `aceitou ${String(valor)}`);
});

test('newAvatarCode sempre devolve um código válido', () => {
  for (let i = 0; i < 200; i += 1) assert.ok(decodeAvatar(newAvatarCode()));
});
