/*
 * Accordion FAQ Block
 * One row per question: [question text | rich answer].
 * Based on the Block Collection accordion (native <details>/<summary>).
 */

// No authorable options yet; declared so future options branch on one list.
const OPTION_CLASSES = [];

/**
 * scripts.js decorateButtons() runs before block decoration and turns
 * <p><strong><a> / <p><em><a> into buttons. Answers are rich text, so restore
 * those links to plain inline links with their original emphasis.
 * @param {Element} body the answer panel
 */
function unbuttonize(body) {
  body.querySelectorAll('a.button').forEach((a) => {
    let replacement = a;
    if (a.classList.contains('accent')) {
      const strong = document.createElement('strong');
      const em = document.createElement('em');
      strong.append(em);
      replacement = strong;
    } else if (a.classList.contains('primary')) {
      replacement = document.createElement('strong');
    } else if (a.classList.contains('secondary')) {
      replacement = document.createElement('em');
    }
    a.classList.remove('button', 'primary', 'secondary', 'accent');
    if (!a.classList.length) a.removeAttribute('class');
    if (replacement !== a) {
      a.replaceWith(replacement);
      (replacement.querySelector('em') || replacement).append(a);
    }
    const wrapper = replacement.closest('.button-wrapper');
    if (wrapper) {
      wrapper.classList.remove('button-wrapper');
      if (!wrapper.classList.length) wrapper.removeAttribute('class');
    }
  });
}

/**
 * Remove empty headings/paragraphs (e.g. <h3>&nbsp;</h3>) left in the answer.
 * @param {Element} body the answer panel
 */
function cleanEmpty(body) {
  body.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((el) => {
    if (!el.textContent.trim() && !el.querySelector('img, picture, a')) {
      el.remove();
    }
  });
}

export default function decorate(block) {
  const activeOptions = OPTION_CLASSES.filter((c) => block.classList.contains(c));
  block.dataset.options = activeOptions.join(' ');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const label = cells[0];
    if (!label || !label.textContent.trim()) {
      row.remove();
      return;
    }

    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    // Unwrap a single paragraph/heading so the summary holds inline text only.
    const only = label.children.length === 1 ? label.firstElementChild : null;
    if (only && /^(P|H[1-6])$/.test(only.tagName)) {
      summary.append(...only.childNodes);
    } else {
      summary.append(...label.childNodes);
    }

    // Answer: second cell, plus any extra cells authors may have added.
    const body = document.createElement('div');
    body.className = 'accordion-faq-item-body';
    cells.slice(1).forEach((cell) => body.append(...cell.childNodes));
    unbuttonize(body);
    cleanEmpty(body);

    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
