import { createOptimizedPicture } from '../../scripts/aem.js';

// No authorable options yet; declared so future options branch on one list.
const OPTION_CLASSES = [];

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture')) return;
    const li = document.createElement('li');
    li.className = 'cards-article-card';
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((cell) => {
      const picture = cell.querySelector('picture');
      // A linked image may be authored as picture + bare link: all text lives inside anchors.
      const linkText = [...cell.querySelectorAll('a')].map((a) => a.textContent).join('').trim();
      const isImageCell = picture && !cell.querySelector('h1, h2, h3, h4, h5, h6')
        && cell.textContent.trim() === linkText;
      if (isImageCell) {
        cell.className = 'cards-article-image';
        const link = cell.querySelector('a');
        if (link && !link.contains(picture)) {
          link.textContent = '';
          link.append(picture);
          cell.replaceChildren(link);
        }
      } else if (cell.textContent.trim()) {
        cell.className = 'cards-article-body';
        // First element is the title (heading, strong or link paragraph); the rest is description.
        const title = cell.querySelector('h1, h2, h3, h4, h5, h6') || cell.firstElementChild;
        if (title) {
          // Imported titles are <p><strong><a>; scripts.js decorateButtons() turns them into
          // primary buttons (p.button-wrapper > a.button.primary) before this block runs. A card
          // title is a heading-style link, not a CTA, so undo the buttonization.
          if (title.classList.contains('button-wrapper')) title.classList.remove('button-wrapper');
          title.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary', 'accent'));
          title.classList.add('cards-article-title');
        }
        [...cell.children].filter((el) => el !== title && el.tagName === 'P')
          .forEach((p) => p.classList.add('cards-article-description'));
      } else {
        cell.remove();
      }
    });

    // Put the image first even if the author ordered cells differently.
    const image = li.querySelector('.cards-article-image');
    if (image && li.firstElementChild !== image) li.prepend(image);

    // Imported images are unlinked; link them to the card's title URL (as on the source site).
    // Hidden from AT/tab order so the card exposes a single link.
    const titleLink = li.querySelector('.cards-article-title a[href]');
    const pic = image && image.querySelector('picture');
    if (pic && titleLink && !pic.closest('a')) {
      const imageLink = document.createElement('a');
      imageLink.setAttribute('href', titleLink.getAttribute('href'));
      imageLink.tabIndex = -1;
      imageLink.setAttribute('aria-hidden', 'true');
      pic.replaceWith(imageLink);
      imageLink.append(pic);
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);
}
