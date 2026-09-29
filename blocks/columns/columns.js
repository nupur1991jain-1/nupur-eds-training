import { loadCSS } from '../../scripts/aem.js';

/*
 * Variants, authored as "Columns (Author)" / "Columns (Featured)" (block classes
 * "columns author" etc.). Each variant's code and styles live in ./<variant>.js and
 * ./<variant>.css, loaded only when a page uses that variant.
 */
export const VARIANTS = ['author', 'featured'];

export default async function decorate(block) {
  const variant = VARIANTS.find((v) => block.classList.contains(v));
  if (variant) {
    const [{ default: decorateVariant }] = await Promise.all([
      import(`./${variant}.js`),
      loadCSS(`${window.hlx.codeBasePath}/blocks/columns/${variant}.css`),
    ]);
    await decorateVariant(block);
    return;
  }

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
