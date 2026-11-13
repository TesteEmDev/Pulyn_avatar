# @pulyn/avatar

Gerador dos avatares do Pulyn. Desenha o personagem em SVG a partir do código curto salvo no banco (`pulyn1-...`).
É a **única** fonte desse desenho: o site (montador, recepção, ranking) e o backend (imagem para o app) usam este pacote.

Não depende de React nem do navegador; roda no Node e no Vite. Sai em ESM e CJS, com tipos.

## Uso

```ts
import { decodeAvatar, renderAvatarSvg, newAvatarCode, AVATAR_STYLE_VERSION } from '@pulyn/avatar';

const config = decodeAvatar('pulyn1-...');          // null se o código for inválido
const svg = config ? renderAvatarSvg(config) : '';  // string <svg>...</svg>
```

No Node com `require`: `const { renderAvatarSvg } = require('@pulyn/avatar');`

## Regras ao mexer

- **O código salvo depende da posição das peças.** Em `src/parts.ts` nunca reordene nem apague itens das listas; peça nova entra no FIM.
  Os campos de `src/code.ts` seguem a mesma regra (só acrescentar no fim, mudando a versão do prefixo).
- **Mudou o visual? Suba `AVATAR_STYLE_VERSION`** (em `src/index.ts`). O backend coloca esse número na URL da imagem
  para o cache não segurar o desenho antigo.
- Depois de mexer: `npm test` (compila e roda os testes) e confira o resultado nas folhas de amostra.

## Desenvolvimento

```bash
npm install
npm test        # build + testes (codec, 6000 personagens sorteados, toda peça de toda lista, ESM e CJS)
npm run build   # gera dist/
```

Quem instala este pacote por git (`github:TesteEmDev/pulyn-avatar#vX.Y.Z`) recebe o `dist/` gerado automaticamente
pelo script `prepare`; a pasta `dist/` não vai para o git.
