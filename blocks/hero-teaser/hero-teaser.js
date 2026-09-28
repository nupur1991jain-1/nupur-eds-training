import { createOptimizedPicture } from '../../scripts/aem.js';

// No authorable options yet; declared so future options branch on one list.
const OPTION_CLASSES = [];

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  // Authored as row 1 = [image], row 2 = [heading, text, CTA], but tolerate a single
  // row with two cells or the image and text sharing one cell.
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const picture = block.querySelector('picture');

  const media = document.createElement('div');
  media.className = 'hero-teaser-image';
  if (picture) {
    const img = picture.querySelector('img');
    const optimized = img
      ? createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }])
      : picture;
    const wrapper = picture.parentElement;
    media.append(optimized);
    picture.remove();
    if (wrapper && wrapper.tagName === 'P' && !wrapper.textContent.trim() && !wrapper.children.length) wrapper.remove();
  }

  const content = document.createElement('div');
  content.className = 'hero-teaser-content';
  cells.forEach((cell) => {
    if (cell.textContent.trim() || cell.children.length) content.append(...cell.childNodes);
  });

  block.replaceChildren();
  if (picture) block.append(media);
  if (content.textContent.trim()) block.append(content);
  if (!picture) block.classList.add('hero-teaser-no-image');
}
