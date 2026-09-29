import { loadCSS } from '../../scripts/aem.js';

/*
 * Variants, authored as "Hero (Teaser)" (block classes "hero teaser"). Each variant's code and
 * styles live in ./<variant>.js and ./<variant>.css, loaded only when a page uses that variant.
 * The base hero needs no decoration (styles only).
 */
export const VARIANTS = ['teaser'];

export default async function decorate(block) {
  const variant = VARIANTS.find((v) => block.classList.contains(v));
  if (!variant) return;
  const [{ default: decorateVariant }] = await Promise.all([
    import(`./${variant}.js`),
    loadCSS(`${window.hlx.codeBasePath}/blocks/hero/${variant}.css`),
  ]);
  await decorateVariant(block);
}
