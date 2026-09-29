import { loadCSS } from '../../scripts/aem.js';
import { optimizedPicture } from '../../scripts/utils.js';

/*
 * Variants, authored as "Cards (Article)" etc. (block classes "cards article"). Each variant's
 * code and styles live in ./<variant>.js and ./<variant>.css, loaded only when a page uses that
 * variant. Without a variant class the block is the standard boilerplate cards.
 */
export const VARIANTS = ['article', 'contributor', 'filter', 'members', 'upnext'];

export default async function decorate(block) {
  const variant = VARIANTS.find((v) => block.classList.contains(v));
  if (variant) {
    const [{ default: decorateVariant }] = await Promise.all([
      import(`./${variant}.js`),
      loadCSS(`${window.hlx.codeBasePath}/blocks/cards/${variant}.css`),
    ]);
    await decorateVariant(block);
    return;
  }

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(optimizedPicture(img, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
