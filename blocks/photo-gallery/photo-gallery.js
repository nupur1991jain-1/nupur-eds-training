function createButton(className, textContent, ariaLabel) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', ariaLabel || textContent || className);
  button.textContent = textContent || '';
  return button;
}

function createModal(images, startIndex) {
  let slideshowInterval = null;

  const modal = document.createElement('div');
  modal.className = 'image-modal-overlay';

  const modalContent = document.createElement('div');
  modalContent.className = 'image-modal-content';

  const modalMain = document.createElement('div');
  modalMain.className = 'modal-main';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

  const modalImage = document.createElement('img');
  modalImage.src = images[startIndex].src;
  modalImage.alt = images[startIndex].alt;
  imageContainer.appendChild(modalImage);

  const prevButton = createButton('nav-button prev', '❮', 'Previous image');
  const nextButton = createButton('nav-button next', '❯', 'Next image');
  const expandButton = createButton('expand-button', '⤢', 'Toggle expand');
  imageContainer.append(prevButton, nextButton, expandButton);

  const thumbnailsContainer = document.createElement('div');
  thumbnailsContainer.className = 'thumbnails-container';

  const thumbPrevButton = createButton('thumb-nav prev', '◀', 'Previous thumbnails');
  const thumbNextButton = createButton('thumb-nav next', '▶', 'Next thumbnails');
  const thumbsWrapper = document.createElement('div');
  thumbsWrapper.className = 'thumbnails-wrapper';

  images.forEach((imgEl, idx) => {
    const thumb = document.createElement('div');
    thumb.className = `thumbnail ${idx === startIndex ? 'active' : ''}`;
    thumb.dataset.index = String(idx);

    const thumbImage = document.createElement('img');
    thumbImage.src = imgEl.src;
    thumbImage.alt = imgEl.alt;
    thumb.appendChild(thumbImage);
    thumbsWrapper.appendChild(thumb);
  });

  thumbnailsContainer.append(thumbPrevButton, thumbsWrapper, thumbNextButton);

  const modalControls = document.createElement('div');
  modalControls.className = 'modal-controls';

  const slideshowControls = document.createElement('div');
  slideshowControls.className = 'slideshow-controls';

  const playButton = createButton('play-button', '▶', 'Start slideshow');
  const slidePrevButton = createButton('slide-nav prev', '◀', 'Previous slide');
  const slideNextButton = createButton('slide-nav next', '▶', 'Next slide');
  slideshowControls.append(playButton, slidePrevButton, slideNextButton);

  const imageCounter = document.createElement('div');
  imageCounter.className = 'image-counter';
  imageCounter.textContent = `${startIndex + 1}/${images.length}`;

  const modalTitle = document.createElement('div');
  modalTitle.className = 'modal-title';
  modalTitle.textContent = images[startIndex].getAttribute('data-display') || '';

  const closeButton = createButton('close-button', '×', 'Close gallery');
  modalControls.append(slideshowControls, imageCounter, modalTitle, closeButton);

  modalMain.append(imageContainer, thumbnailsContainer, modalControls);
  modalContent.appendChild(modalMain);
  modal.appendChild(modalContent);

  const thumbnails = modal.querySelectorAll('.thumbnail');
  let currentIndex = startIndex;

  function updateModalImage() {
    modalImage.src = images[currentIndex].src;
    modalImage.alt = images[currentIndex].alt;
    imageCounter.textContent = `${currentIndex + 1}/${images.length}`;
    modalTitle.textContent = images[currentIndex].getAttribute('data-display') || '';

    thumbnails.forEach((thumb, idx) => {
      const isActive = idx === currentIndex;
      thumb.classList.toggle('active', isActive);

      if (isActive) {
        const thumbWrapper = thumb.parentElement;
        const thumbRect = thumb.getBoundingClientRect();
        const wrapperRect = thumbWrapper.getBoundingClientRect();

        if (thumbRect.left < wrapperRect.left || thumbRect.right > wrapperRect.right) {
          thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    });
  }

  function stopSlideshow() {
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      slideshowInterval = null;
    }
    playButton.textContent = '▶';
    playButton.classList.remove('playing');
  }

  function startSlideshow() {
    playButton.textContent = '❚❚';
    playButton.classList.add('playing');
    slideshowInterval = setInterval(() => {
      nextButton.click();
    }, 3000);
  }

  thumbnails.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      currentIndex = Number.parseInt(thumb.dataset.index, 10);
      updateModalImage();
    });
  });

  function handleNavigation(direction) {
    currentIndex = (currentIndex + direction + images.length) % images.length;
    updateModalImage();
  }

  prevButton.addEventListener('click', (event) => {
    event.stopPropagation();
    handleNavigation(-1);
  });

  nextButton.addEventListener('click', (event) => {
    event.stopPropagation();
    handleNavigation(1);
  });

  thumbPrevButton.addEventListener('click', (event) => {
    event.stopPropagation();
    thumbsWrapper.scrollBy({ left: -200, behavior: 'smooth' });
  });

  thumbNextButton.addEventListener('click', (event) => {
    event.stopPropagation();
    thumbsWrapper.scrollBy({ left: 200, behavior: 'smooth' });
  });

  slidePrevButton.addEventListener('click', (event) => {
    event.stopPropagation();
    handleNavigation(-1);
  });

  slideNextButton.addEventListener('click', (event) => {
    event.stopPropagation();
    handleNavigation(1);
  });

  playButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (slideshowInterval) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  });

  const navigationHandlers = [
    prevButton,
    nextButton,
    slidePrevButton,
    slideNextButton,
    ...thumbnails,
  ];
  navigationHandlers.forEach((element) => {
    element.addEventListener('click', (event) => {
      if (slideshowInterval && event.isTrusted) {
        stopSlideshow();
      }
    });
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });

  closeButton.addEventListener('click', () => {
    modal.remove();
  });

  document.addEventListener('keydown', function handleKeydown(event) {
    if (event.key === 'ArrowLeft') {
      prevButton.click();
    } else if (event.key === 'ArrowRight') {
      nextButton.click();
    } else if (event.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleKeydown);
    }
  });

  imageContainer.addEventListener('click', (event) => {
    if (event.target.closest('.nav-button')) {
      return;
    }

    const rect = imageContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;

    if (isLeftHalf) {
      prevButton.click();
    } else {
      nextButton.click();
    }
  });

  let isExpanded = false;
  expandButton.addEventListener('click', (event) => {
    event.stopPropagation();
    isExpanded = !isExpanded;

    if (isExpanded) {
      expandButton.classList.add('contracted');
      expandButton.textContent = '⤡';
      modalContent.classList.add('expanded');
      modalMain.classList.add('expanded');
    } else {
      expandButton.classList.remove('contracted');
      expandButton.textContent = '⤢';
      modalContent.classList.remove('expanded');
      modalMain.classList.remove('expanded');
    }
  });

  document.body.appendChild(modal);
}

export default function decorate(block) {
  const images = [];

  [...block.children].forEach((row) => {
    const image = row.querySelector('img');
    if (!image) {
      return;
    }

    const caption = row.querySelector('p, figcaption');
    const displayText = caption ? caption.textContent.trim() : '';
    image.setAttribute('data-display', displayText);
    image.setAttribute('alt', displayText || image.getAttribute('alt') || image.src.split('/').pop().split('.')[0]);
    images.push(image);
  });

  const galleryGrid = document.createElement('div');
  galleryGrid.className = 'photo-grid';

  images.forEach((image, index) => {
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';

    const photoImage = image.cloneNode(true);
    const hoverCircle = document.createElement('div');
    hoverCircle.className = 'hover-circle';

    photoItem.append(photoImage, hoverCircle);
    photoItem.addEventListener('click', () => {
      createModal(images, index);
    });
    galleryGrid.appendChild(photoItem);
  });

  block.replaceChildren(galleryGrid);
}
