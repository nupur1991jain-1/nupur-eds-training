import { createOptimizedPicture } from '../../scripts/aem.js';

const DEFAULT_BACKGROUND_COLOR = 'blue';

export default function decorate(block) {
  const [imageRow, titleRow, colorRow, variantRow] = block.children;
  const imageCell = imageRow?.firstElementChild;
  const titleCell = titleRow?.firstElementChild;
  const colorCell = colorRow?.firstElementChild;
  const variantCell = variantRow?.firstElementChild;
  const backgroundColor = colorCell?.textContent.trim().toLowerCase() || DEFAULT_BACKGROUND_COLOR;
  const picture = imageCell?.querySelector('picture');
  const image = picture?.querySelector('img');
  const variant = variantCell?.textContent.trim().toLowerCase() || '';

  block.style.setProperty('--banner-background-color', backgroundColor);
  block.textContent = '';

  if (image) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'banner-image';
    imageWrapper.append(createOptimizedPicture(image.src, image.alt, false, [{ width: '1200' }]));
    block.append(imageWrapper);
  }

  if (titleCell) {
    const titleWrapper = document.createElement('div');
    titleWrapper.className = 'banner-content';
    while (titleCell.firstElementChild) titleWrapper.append(titleCell.firstElementChild);
    block.append(titleWrapper);
  }

  if (variant) {
    block.setAttribute('data-variant', variant);
  }
}
