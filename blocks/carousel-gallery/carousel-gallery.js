import { createOptimizedPicture } from '../../scripts/aem.js';

let carouselId = 0;

function updateActiveSlide(block, slideIndex) {
  block.dataset.activeSlide = slideIndex;

  block.querySelectorAll('.carousel-gallery-slide').forEach((slide, idx) => {
    slide.setAttribute('aria-hidden', idx !== slideIndex);
  });

  block.querySelectorAll('.carousel-gallery-indicator button').forEach((button, idx) => {
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
  const slides = block.querySelectorAll('.carousel-gallery-slide');
  if (!slides.length) return;
  let index = slideIndex;
  if (index < 0) index = slides.length - 1;
  if (index >= slides.length) index = 0;
  block.querySelector('.carousel-gallery-slides').scrollTo({
    top: 0,
    left: slides[index].offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  block.querySelectorAll('.carousel-gallery-indicator button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const indicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(indicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.carousel-gallery-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || 0, 10) - 1);
  });
  block.querySelector('.carousel-gallery-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || 0, 10) + 1);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateActiveSlide(block, parseInt(entry.target.dataset.slideIndex, 10));
      }
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-gallery-slide').forEach((slide) => observer.observe(slide));
}

function createSlide(picture, slideIndex, id) {
  const slide = document.createElement('li');
  slide.className = 'carousel-gallery-slide';
  slide.dataset.slideIndex = slideIndex;
  slide.id = `carousel-gallery-${id}-slide-${slideIndex}`;
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');

  const img = picture.querySelector('img');
  const optimized = img
    ? createOptimizedPicture(img.src, img.alt, slideIndex === 0, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }])
    : picture;
  const imageWrap = document.createElement('div');
  imageWrap.className = 'carousel-gallery-slide-image';
  imageWrap.append(optimized);
  slide.append(imageWrap);
  return slide;
}

export default function decorate(block) {
  carouselId += 1;
  // Image-only slides: one picture per row. Tolerate authors putting several pictures in a row
  // or adding stray text cells - every picture becomes a slide, text is ignored.
  const pictures = [...block.querySelectorAll(':scope > div picture')];
  const isSingleSlide = pictures.length < 2;

  block.id = `carousel-gallery-${carouselId}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const container = document.createElement('div');
  container.className = 'carousel-gallery-slides-container';
  const slides = document.createElement('ul');
  slides.className = 'carousel-gallery-slides';

  let indicators;
  let controls;
  if (!isSingleSlide) {
    controls = document.createElement('div');
    controls.className = 'carousel-gallery-controls';

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Carousel Slide Controls');
    indicators = document.createElement('ol');
    indicators.className = 'carousel-gallery-indicators';
    nav.append(indicators);

    const buttons = document.createElement('div');
    buttons.className = 'carousel-gallery-navigation';
    buttons.innerHTML = `
      <button type="button" class="carousel-gallery-prev" aria-label="Previous Slide"></button>
      <button type="button" class="carousel-gallery-next" aria-label="Next Slide"></button>
    `;
    controls.append(nav, buttons);
  }

  pictures.forEach((picture, idx) => {
    slides.append(createSlide(picture, idx, carouselId));
    if (indicators) {
      const indicator = document.createElement('li');
      indicator.className = 'carousel-gallery-indicator';
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="Show Slide ${idx + 1} of ${pictures.length}"></button>`;
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
