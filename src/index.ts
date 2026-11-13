export * from './config';
export * from './parts';
export * from './code';
export { renderAvatarSvg } from './render';

/**
 * Versão do visual dos avatares. Sobe um número sempre que o desenho muda (estilo, penteados, acessórios...).
 * Quem guarda a imagem em cache (o backend) coloca esse número na URL, para que a mudança apareça no mesmo dia
 * em vez de ficar presa no cache. Mudar só a ordem/lista de peças NÃO é uma mudança de visual: isso mexe no
 * código salvo e tem regras próprias (ver parts.ts).
 */
export const AVATAR_STYLE_VERSION = 3;
