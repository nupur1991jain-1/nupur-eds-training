import { createOptimizedPicture } from '../../scripts/aem.js';

// No authorable options yet; declared so future options branch on one list.
const OPTION_CLASSES = [];

let carouselId = 0;

function updateActiveSlide(block, slideIndex) {
  block.dataset.activeSlide = slideIndex;

  block.querySelectorAll('.carousel-hero-slide').forEach((slide, idx) => {
    const active = idx === slideIndex;
    slide.setAttribute('aria-hidden', !active);
    slide.querySelectorAll('a').forEach((link) => {
      if (active) link.removeAttribute('tabindex');
      else link.setAttribute('tabindex', '-1');
    });
  });

  block.querySelectorAll('.carousel-hero-indicator button').forEach((button, idx) => {
    if (idx === slideIndex) {
      button.setAttribute('disabled', true);
      button.setAttribute('aria-current', true);
    } else {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-current');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-hero-slide');
  if (!slides.length) return;
  let index = slideIndex;
  if (index < 0) index = slides.length - 1;
  if (index >= slides.length) index = 0;
  const target = slides[index];
  target.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-hero-slides').scrollTo({
    top: 0,
    left: target.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  block.querySelectorAll('.carousel-hero-indicator button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const indicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(indicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.carousel-hero-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || 0, 10) - 1);
  });
  block.querySelector('.carousel-hero-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || 0, 10) + 1);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateActiveSlide(block, parseInt(entry.target.dataset.slideIndex, 10));
      }
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-hero-slide').forEach((slide) => observer.observe(slide));
}

function createSlide(row, slideIndex, id) {
  const slide = document.createElement('li');
  slide.className = 'carousel-hero-slide';
  slide.dataset.slideIndex = slideIndex;
  slide.id = `carousel-hero-${id}-slide-${slideIndex}`;

  // Cells may arrive in any order or be missing; classify by content, not position.
  const cells = [...row.children];
  let imageCell = cells.find((c) => c.querySelector('picture') && !c.querySelector('h1, h2, h3, h4, h5, h6, p:not(:has(picture))'));
  if (!imageCell) {
    const pic = row.querySelector('picture');
    if (pic) {
      imageCell = document.createElement('div');
      imageCell.append(pic.closest('p') || pic);
    }
  }
  const contentCells = cells.filter((c) => c !== imageCell && c.textContent.trim());

  if (imageCell) {
    imageCell.className = 'carousel-hero-slide-image';
    imageCell.querySelectorAll('picture > img').forEach((img) => {
      img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, slideIndex === 0, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }]));
    });
    slide.append(imageCell);
  }

  if (contentCells.length) {
    const content = document.createElement('div');
    content.className = 'carousel-hero-slide-content';
    contentCells.forEach((c) => content.append(...c.childNodes));
    slide.append(content);
  }

  const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading && heading.id) slide.setAttribute('aria-labelledby', heading.id);

  return slide;
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  carouselId += 1;
  const rows = [...block.querySelectorAll(':scope > div')].filter((r) => r.textContent.trim() || r.querySelector('picture'));
  const isSingleSlide = rows.length < 2;

  block.id = `carousel-hero-${carouselId}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const container = document.createElement('div');
  container.className = 'carousel-hero-slides-container';

  const slides = document.createElement('ul');
  slides.className = 'carousel-hero-slides';

  let indicators;
  let controls;
  if (!isSingleSlide) {
    controls = document.createElement('div');
    controls.className = 'carousel-hero-controls';

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Carousel Slide Controls');
    indicators = document.createElement('ol');
    indicators.className = 'carousel-hero-indicators';
    nav.append(indicators);

    const buttons = document.createElement('div');
    buttons.className = 'carousel-hero-navigation';
    buttons.innerHTML = `
      <button type="button" class="carousel-hero-prev" aria-label="Previous Slide"></button>
      <button type="button" class="carousel-hero-next" aria-label="Next Slide"></button>
    `;
    controls.append(nav, buttons);
  }

  rows.forEach((row, idx) => {
    slides.append(createSlide(row, idx, carouselId));
    if (indicators) {
      const indicator = document.createElement('li');
      indicator.className = 'carousel-hero-indicator';
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="Show Slide ${idx + 1} of ${rows.length}"></button>`;
      indicators.append(indicator);
    }
  });

  container.append(slides);
  block.replaceChildren(container);
  if (controls) block.append(controls);

  if (!isSingleSlide) {
    updateActiveSlide(block, 0);
    bindEvents(block);
  }
}
