import { getMetadata } from '../../scripts/aem.js';

/**
 *
 * @param {HTMLElement} $block The main element
 */
export default function decorate($block) {
  const title = getMetadata('og:title');
  const $ul = document.createElement('ul');
  $block.append($ul);
  // parent crumb comes from the page path, e.g. /us/en/magazine/x -> "Magazine"
  const segments = window.location.pathname.replace(/\.html$/, '').split('/').filter(Boolean);
  const parent = segments[segments.length - 2];
  const trail = [];
  if (parent) {
    trail.push({
      text: parent.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      link: `/${segments.slice(0, -1).join('/')}`,
    });
  }
  trail.push({ text: title });
  while (trail.length) {
    const step = trail.shift();
    const $li = document.createElement('li');
    $ul.append($li);
    let $wrap = $li;
    if (step.link) {
      $wrap = document.createElement('a');
      $wrap.href = step.link;
      $li.append($wrap);
    }
    const $span = document.createElement('span');
    $wrap.append($span);
    $span.textContent = step.text;
  }
}
