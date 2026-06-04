/*
María Labarthe
main.js
*/

// ELEMENTOS GENERALES DE NAVEGACION
const menu = document.querySelector('.menu');
const buttons = document.querySelectorAll('[data-section]');
const sections = document.querySelectorAll('.docs-section');

// ELEMENTOS DE LA HERRAMIENTA "CREA TU CARTEL"
const cartelBoard = document.querySelector('#cartel .cartel-board');
const cartelEditor = document.querySelector('#cartel .cartel-editor');
const cartelScale = document.querySelector('#cartel-size');
const cartelModeButtons = document.querySelectorAll('[data-cartel-mode]');
const cartelModeScale = document.querySelector('#cartel-mode-scale');
const cartelModeLabel = document.querySelector('.cartel-scale-label');
const cartelOverlayText = document.querySelector('#cartel .cartel-overlay-text');
const cartelColorButtons = document.querySelectorAll('[data-cartel-color]');
const cartelPublishButton = document.querySelector('#cartel-publish');

let cartelMode = 'font';
const cartelModeValues = {
  font: Number(cartelModeScale?.value || 100),
  layers: 0,
};

// ELEMENTOS DE LA SECCION "PROTESTA"
const protestaGallery = document.querySelector('#protesta-gallery');
const protestaResetButton = document.querySelector('#protesta-reset');
// CAMBIAR: si quieres que el navegador olvide carteles anteriores, cambia este nombre.
const protestaStorageKey = 'puestoAlPaso.protestaPosters';

// ELEMENTOS DEL CARRUSEL DE "ACERCA"
const aboutCarouselTrack = document.querySelector('#about-carousel-track');
const aboutExplorationBlock = document.querySelector('#exploracion-campo');

// CAMBIAR FOTOS DEL CARRUSEL:
// Ahora espera 18 imagenes llamadas 01.jpg, 02.jpg ... 18.jpg dentro de ims/fotos_web/.
// Si agregas/quitas fotos, cambia el numero 18.
// Si usas otros nombres, reemplaza esta linea por un arreglo manual, por ejemplo:
// const aboutPhotoFiles = ['foto-a.jpg', 'foto-b.jpg', 'foto-c.jpg'];
const aboutPhotoFiles = Array.from({ length: 18 }, (_, index) => `${String(index + 1).padStart(2, '0')}.jpg`);

// CAMBIAR SUBTITULOS DEL CARRUSEL:
// Cada texto corresponde a la foto con el mismo numero: 01.jpg usa el primer texto, 02.jpg el segundo, etc.
const aboutPhotoCaptions = [
  'Muchos puestos se establecen junto a estaciones de metro<br>y zonas de alto flujo peatonal.',
  'El consumo de alimentos ocurre dentro del trayecto, no fuera de él.',
  'El costo y la ubicación hacen del puesto una opción viable diariamente.',
  'La oferta se adapta a la rapidez del consumo cotidiano.',
  'Comer en un establecimiento “formal” no es viable cotidianamente.',
  'El consumo en tránsito responde a jornadas largas y tiempos limitados.',
  'Comer al paso reduce tiempo, costo y desplazamientos adicionales.',
  'Los puestos también funcionan como espacios de encuentro y descanso.',
  'Las condiciones y formas de organización cambian según la zona.',
  'La políticas de reordenamiento transforman o retiran estos espacios.',
  'Los puestos persisten porque las necesidades que los producen continúan.',
  'Los espacios con mayor flujo son también los más regulados.',
  'Detenerse demasiado implica interrumpir el flujo de la ciudad.',
  'Muchos consumidores regresan al mismo puesto de forma recurrente.',
  'El consumo en tránsito forma parte de la vida cotidiana en la ciudad.',
  'Retirar los puestos no elimina la necesidad de comer al paso.',
  'Ante la llegada del Mundial, algunos vendedores reportan aumentos en cuotas y mayores restricciones para permanecer.',
  'La movilidad cotidiana sostiene la permanencia de estos espacios.',
];

// Estado interno de capas/carteles y posicion actual del carrusel.
let protestaZIndex = 10;
let aboutCarouselIndex = 0;

// Pone el cursor al final cuando se abre la seccion Cartel.
function placeCaretAtEnd(element) {
  if (!element) {
    return;
  }

  const selection = window.getSelection();
  const range = document.createRange();

  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

// Activa una seccion desde el menu y desactiva las demas.
function activateSection(targetId) {
  sections.forEach((section) => {
    section.classList.toggle('is-active', section.id === targetId);
  });

  buttons.forEach((item) => {
    item.classList.toggle('is-active', item.dataset.section === targetId);
  });

  if (menu) {
    menu.removeAttribute('open');
  }
}

// Marca visualmente el boton del menu que corresponde a la seccion activa.
function syncActiveMenuButton() {
  const activeSection = document.querySelector('.docs-section.is-active');
  const activeId = activeSection ? activeSection.id : 'acerca';

  buttons.forEach((item) => {
    item.classList.toggle('is-active', item.dataset.section === activeId);
  });
}

// Permite abrir docs/index.html#cartel o #protesta directo desde la portada.
function getInitialSectionId() {
  const hashId = window.location.hash.replace('#', '');
  const hashSection = hashId ? document.getElementById(hashId) : null;

  return hashSection && hashSection.classList.contains('docs-section') ? hashId : 'acerca';
}

// Limita un numero entre minimo y maximo. Se usa al arrastrar carteles.
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getHighlightColorForBoardColor(color) {
  const normalized = String(color).trim().toLowerCase();

  switch (normalized) {
    case '#39ff14':
      return '#000000';
    case '#ff2bd6':
      return 'rgb(255, 251, 0)';
    case '#d8ff00':
      return '#ff2bd6';
    default:
      return '#2a2a2a';
  }
}

function setCartelBoardHighlightColor(color) {
  if (!cartelBoard) {
    return;
  }

  const highlightColor = getHighlightColorForBoardColor(color);
  cartelBoard.style.setProperty('--overlay-color', highlightColor);
}

function updateCartelModeControl() {
  if (!cartelModeScale || !cartelModeLabel || !cartelOverlayText) {
    return;
  }

  const isFontMode = cartelMode === 'font';
  cartelModeLabel.textContent = isFontMode ? 'Condensado' : 'Capas';

  if (isFontMode) {
    cartelModeScale.min = '100';
    cartelModeScale.max = '500';
    cartelModeScale.step = '1';
    cartelModeScale.value = String(cartelModeValues.font);
    cartelOverlayText.style.display = 'none';
    if (cartelBoard) {
      cartelBoard.style.setProperty('--layers-offset', '0px');
    }
  } else {
    cartelModeScale.min = '-2';
    cartelModeScale.max = '3';
    cartelModeScale.step = '0.1';
    cartelModeScale.value = String(cartelModeValues.layers);
    cartelOverlayText.style.display = 'grid';
  }
}

// Hace que el cartel seleccionado quede por encima de los demas.
function bringPosterToFront(poster) {
  protestaZIndex += 1;
  poster.style.zIndex = String(protestaZIndex);
}

// El boton "Publica y protesta" solo se activa si hay texto y color seleccionado.
function canPublishPoster() {
  const hasText = cartelEditor && cartelEditor.textContent.trim().length > 0;
  const hasColor = Array.from(cartelColorButtons).some((item) => item.classList.contains('is-active'));

  return hasText && hasColor;
}

function syncCartelOverlayText() {
  if (!cartelEditor || !cartelOverlayText) {
    return;
  }

  cartelOverlayText.textContent = cartelEditor.textContent;
}

// Actualiza el estado enabled/disabled del boton de publicar.
function updatePublishState() {
  if (!cartelPublishButton) {
    return;
  }

  cartelPublishButton.disabled = !canPublishPoster();
}

// Escala valores tipo "10px 20px" cuando se clona el cartel para la protesta.
function scaleBoxValue(value, scale) {
  return value
    .split(' ')
    .map((item) => `${parseFloat(item) * scale}px`)
    .join(' ');
}

// Conserva proporciones del cartel editable cuando se publica como cartel arrastrable.
function preservePosterLayout(poster) {
  if (!cartelBoard || !poster) {
    return;
  }

  const sourceRect = cartelBoard.getBoundingClientRect();
  const sourceBoardStyle = window.getComputedStyle(cartelBoard);
  const sourceEditor = cartelBoard.querySelector('.cartel-editor');
  const sourceOverlay = cartelBoard.querySelector('.cartel-overlay-text');
  const posterEditor = poster.querySelector('.cartel-editor');
  const posterOverlay = poster.querySelector('.cartel-overlay-text');
  const posterScale = window.matchMedia('(max-width: 700px)').matches ? 0.52 : 0.42;

  poster.style.width = `${sourceRect.width * posterScale}px`;
  poster.style.height = `${sourceRect.height * posterScale}px`;
  poster.style.aspectRatio = `${sourceRect.width} / ${sourceRect.height}`;
  poster.style.padding = scaleBoxValue(sourceBoardStyle.padding, posterScale);

  if (!sourceEditor || !posterEditor) {
    return;
  }

  const sourceEditorStyle = window.getComputedStyle(sourceEditor);
  const sourceLineHeight = parseFloat(sourceEditorStyle.lineHeight);
  const sourceLetterSpacing = parseFloat(sourceEditorStyle.letterSpacing);

  posterEditor.style.fontSize = `${parseFloat(sourceEditorStyle.fontSize) * posterScale}px`;
  posterEditor.style.padding = scaleBoxValue(sourceEditorStyle.padding, posterScale);
  posterEditor.style.lineHeight = Number.isNaN(sourceLineHeight)
    ? sourceEditorStyle.lineHeight
    : `${sourceLineHeight * posterScale}px`;

  if (!Number.isNaN(sourceLetterSpacing)) {
    posterEditor.style.letterSpacing = `${sourceLetterSpacing * posterScale}px`;
  }

  if (sourceOverlay && posterOverlay) {
    const sourceOverlayStyle = window.getComputedStyle(sourceOverlay);
    const sourceOverlayLineHeight = parseFloat(sourceOverlayStyle.lineHeight);
    const sourceOverlayLetterSpacing = parseFloat(sourceOverlayStyle.letterSpacing);

    posterOverlay.style.fontSize = `${parseFloat(sourceOverlayStyle.fontSize) * posterScale}px`;
    posterOverlay.style.padding = scaleBoxValue(sourceOverlayStyle.padding, posterScale);
    posterOverlay.style.lineHeight = Number.isNaN(sourceOverlayLineHeight)
      ? sourceOverlayStyle.lineHeight
      : `${sourceOverlayLineHeight * posterScale}px`;

    if (!Number.isNaN(sourceOverlayLetterSpacing)) {
      posterOverlay.style.letterSpacing = `${sourceOverlayLetterSpacing * posterScale}px`;
    }
  }
}

// Muestra el mensaje cuando no hay carteles publicados.
function addEmptyState() {
  if (!protestaGallery || protestaGallery.querySelector('.protesta-empty')) {
    return;
  }

  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'protesta-empty';
  emptyMessage.textContent = 'Todavía no has publicado un cartel.';
  protestaGallery.appendChild(emptyMessage);
}

// Convierte un cartel del DOM en datos guardables.
function posterToData(poster) {
  const editor = poster.querySelector('.cartel-editor');
  const overlay = poster.querySelector('.cartel-overlay-text');

  return {
    text: editor ? editor.textContent : '',
    boardColor: poster.style.getPropertyValue('--board-color'),
    boardScale: poster.style.getPropertyValue('--board-scale'),
    boardWidth: poster.style.getPropertyValue('--board-width'),
    overlayText: overlay ? overlay.textContent : '',
    overlayOffset: poster.style.getPropertyValue('--layers-offset'),
    cartelMode: poster.dataset.cartelMode || 'font',
    left: poster.style.left,
    top: poster.style.top,
    zIndex: poster.style.zIndex,
    width: poster.style.width,
    height: poster.style.height,
    aspectRatio: poster.style.aspectRatio,
    padding: poster.style.padding,
    editorFontSize: editor ? editor.style.fontSize : '',
    editorPadding: editor ? editor.style.padding : '',
    editorLineHeight: editor ? editor.style.lineHeight : '',
    editorLetterSpacing: editor ? editor.style.letterSpacing : '',
  };
}

// Guarda los carteles publicados en el navegador.
function saveProtestaPosters() {
  if (!protestaGallery) {
    return;
  }

  const posters = Array.from(protestaGallery.querySelectorAll('.protesta-post')).map(posterToData);
  window.localStorage.setItem(protestaStorageKey, JSON.stringify(posters));
}

// Reconstruye un cartel a partir de datos guardados.
function createPosterFromData(data) {
  const poster = document.createElement('div');
  const wrapper = document.createElement('div');
  const editor = document.createElement('div');
  const overlay = document.createElement('div');
  const posterMode = data.cartelMode || 'font';

  poster.className = 'cartel-board protesta-post';
  poster.dataset.cartelMode = posterMode;
  poster.style.setProperty('--board-color', data.boardColor || '#d8ff00');
  poster.style.setProperty('--overlay-color', getHighlightColorForBoardColor(data.boardColor || '#d8ff00'));
  poster.style.setProperty('--board-scale', data.boardScale || '1.15');
  poster.style.setProperty('--board-width', data.boardWidth || '100');
  poster.style.setProperty('--layers-offset', data.overlayOffset || '0px');
  poster.style.left = data.left || '0px';
  poster.style.top = data.top || '0px';
  poster.style.zIndex = data.zIndex || String(protestaZIndex);
  poster.style.width = data.width || '';
  poster.style.height = data.height || '';
  poster.style.aspectRatio = data.aspectRatio || '';
  poster.style.padding = data.padding || '';

  wrapper.className = 'cartel-texts';

  editor.className = 'cartel-editor';
  editor.textContent = data.text || '';
  editor.style.fontSize = data.editorFontSize || '';
  editor.style.padding = data.editorPadding || '';
  editor.style.lineHeight = data.editorLineHeight || '';
  editor.style.letterSpacing = data.editorLetterSpacing || '';

  overlay.className = 'cartel-overlay-text';
  overlay.textContent = data.overlayText || data.text || '';
  overlay.style.display = posterMode === 'font' ? 'none' : 'grid';

  wrapper.appendChild(editor);
  wrapper.appendChild(overlay);
  poster.appendChild(wrapper);
  makePosterDraggable(poster);

  return poster;
}

// Carga los carteles guardados cuando regresas o recargas la pagina.
function restoreProtestaPosters() {
  if (!protestaGallery) {
    return;
  }

  let savedPosters = [];

  try {
    savedPosters = JSON.parse(window.localStorage.getItem(protestaStorageKey) || '[]');
  } catch (error) {
    window.localStorage.removeItem(protestaStorageKey);
  }

  if (!savedPosters.length) {
    return;
  }

  const emptyState = protestaGallery.querySelector('.protesta-empty');
  if (emptyState) {
    emptyState.remove();
  }

  savedPosters.forEach((data) => {
    const poster = createPosterFromData(data);
    protestaGallery.appendChild(poster);
    protestaZIndex = Math.max(protestaZIndex, parseInt(poster.style.zIndex, 10) || protestaZIndex);
  });
}

// Coloca un cartel recien publicado al centro de la galeria.
function positionPoster(poster) {
  if (!protestaGallery || !poster) {
    return;
  }

  const galleryRect = protestaGallery.getBoundingClientRect();
  const posterRect = poster.getBoundingClientRect();
  const maxX = Math.max(0, galleryRect.width - posterRect.width);
  const maxY = Math.max(0, galleryRect.height - posterRect.height);
  const x = maxX / 2;
  const y = maxY / 2;

  poster.style.left = `${x}px`;
  poster.style.top = `${y}px`;
}

// Permite arrastrar los carteles publicados dentro de la galeria.
function makePosterDraggable(poster) {
  if (!protestaGallery || !poster) {
    return;
  }

  let dragState = null;

  poster.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    bringPosterToFront(poster);

    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: parseFloat(poster.style.left || '0'),
      originTop: parseFloat(poster.style.top || '0'),
    };

    poster.setPointerCapture(event.pointerId);
  });

  poster.addEventListener('pointermove', (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const maxX = Math.max(0, protestaGallery.clientWidth - poster.offsetWidth);
    const maxY = Math.max(0, protestaGallery.clientHeight - poster.offsetHeight);

    const nextLeft = clamp(dragState.originLeft + deltaX, 0, maxX);
    const nextTop = clamp(dragState.originTop + deltaY, 0, maxY);

    poster.style.left = `${nextLeft}px`;
    poster.style.top = `${nextTop}px`;
  });

  poster.addEventListener('pointerup', (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    poster.releasePointerCapture(event.pointerId);
    dragState = null;
    saveProtestaPosters();
  });

  poster.addEventListener('pointercancel', () => {
    dragState = null;
  });
}

// Construye automaticamente las <figure> e <img> del carrusel.
function buildAboutCarousel() {
  if (!aboutCarouselTrack || !aboutPhotoFiles.length) {
    return;
  }

  const fragment = document.createDocumentFragment();

  aboutPhotoFiles.forEach((fileName, index) => {
    const slide = document.createElement('figure');
    const image = document.createElement('img');
    const caption = document.createElement('figcaption');

    slide.className = 'about-slide';
    slide.dataset.index = String(index);
    slide.tabIndex = -1;

    // CAMBIAR RUTA: si mueves las fotos, actualiza "../ims/fotos_web/".
    image.src = `../ims/fotos_web/${fileName}`;
    image.alt = `Exploración de campo ${index + 1}`;
    image.loading = index === 0 ? 'eager' : 'lazy';
    image.decoding = 'async';

    caption.className = 'about-slide-caption';
    caption.innerHTML = aboutPhotoCaptions[index] || '';

    slide.appendChild(image);
    slide.appendChild(caption);
    fragment.appendChild(slide);
  });

  aboutCarouselTrack.innerHTML = '';
  aboutCarouselTrack.appendChild(fragment);
  updateAboutCarousel();
  setupAboutCarouselClicks();
}

// Hace que el carrusel vuelva al inicio/final al avanzar o retroceder.
function getWrappedAboutIndex(index) {
  return (index + aboutPhotoFiles.length) % aboutPhotoFiles.length;
}

// Actualiza que foto esta activa, anterior y siguiente.
function updateAboutCarousel() {
  if (!aboutCarouselTrack || !aboutPhotoFiles.length) {
    return;
  }

  const previousIndex = getWrappedAboutIndex(aboutCarouselIndex - 1);
  const nextIndex = getWrappedAboutIndex(aboutCarouselIndex + 1);

  aboutCarouselTrack.querySelectorAll('.about-slide').forEach((slide) => {
    const slideIndex = Number(slide.dataset.index);
    const isActive = slideIndex === aboutCarouselIndex;
    const isPrevious = slideIndex === previousIndex;
    const isNext = slideIndex === nextIndex;

    slide.classList.toggle('is-active', isActive);
    slide.classList.toggle('is-prev', isPrevious);
    slide.classList.toggle('is-next', isNext);
    slide.tabIndex = isPrevious || isNext ? 0 : -1;
  });
}

// Cambia a una foto especifica del carrusel.
function showAboutSlide(index) {
  aboutCarouselIndex = getWrappedAboutIndex(index);
  updateAboutCarousel();
}

// Permite navegar el carrusel haciendo click o usando teclado.
function setupAboutCarouselClicks() {
  if (!aboutCarouselTrack) {
    return;
  }

  aboutCarouselTrack.querySelectorAll('.about-slide').forEach((slide) => {
    slide.addEventListener('click', () => {
      const slideIndex = Number(slide.dataset.index);

      if (slide.classList.contains('is-next')) {
        showAboutSlide(aboutCarouselIndex + 1);
      } else if (slide.classList.contains('is-prev')) {
        showAboutSlide(aboutCarouselIndex - 1);
      } else if (!Number.isNaN(slideIndex)) {
        showAboutSlide(slideIndex);
      }
    });

    slide.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      slide.click();
    });
  });
}

// Activa la animacion de entrada del bloque "Exploracion de campo".
function setupAboutExplorationReveal() {
  if (!aboutExplorationBlock) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          aboutExplorationBlock.classList.add('is-visible');
          observer.disconnect();
        }
      });
    },
    {
      root: document.querySelector('#acerca.is-active') || null,
      threshold: 0.2,
    },
  );

  observer.observe(aboutExplorationBlock);
}

// MENU: cambia seccion al hacer click en los botones.
buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const targetId = button.dataset.section;
    activateSection(targetId);
    window.history.replaceState(null, '', `#${targetId}`);

    if (targetId === 'cartel' && cartelEditor) {
      window.setTimeout(() => {
        cartelEditor.focus();
        placeCaretAtEnd(cartelEditor);
      }, 0);
    }
  });
});

// COLORES DEL CARTEL: cada boton cambia la variable --board-color.
if (cartelColorButtons.length && cartelBoard) {
  cartelColorButtons.forEach((colorButton) => {
    colorButton.addEventListener('click', () => {
      const selectedColor = colorButton.dataset.cartelColor;

      cartelBoard.style.setProperty('--board-color', selectedColor);
      setCartelBoardHighlightColor(selectedColor);

      cartelColorButtons.forEach((item) => {
        item.classList.toggle('is-active', item === colorButton);
      });

      updatePublishState();
    });
  });

  const initialColorButton = Array.from(cartelColorButtons).find((item) => item.classList.contains('is-active'));
  if (initialColorButton) {
    cartelBoard.style.setProperty('--board-color', initialColorButton.dataset.cartelColor);
    setCartelBoardHighlightColor(initialColorButton.dataset.cartelColor);
  }
}

// Si el usuario escribe o borra texto, se revisa si ya puede publicar.
if (cartelEditor) {
  cartelEditor.addEventListener('input', () => {
    syncCartelOverlayText();
    updatePublishState();
  });
}

// Slider de tamano del texto del cartel.
if (cartelScale && cartelBoard) {
  cartelScale.addEventListener('input', () => {
    cartelBoard.style.setProperty('--board-scale', cartelScale.value);
  });
}

// Botones de modo: Condensado o Capas.
if (cartelModeButtons.length) {
  cartelModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedMode = button.dataset.cartelMode;

      if (!selectedMode || selectedMode === cartelMode) {
        return;
      }

      cartelMode = selectedMode;
      cartelModeButtons.forEach((item) => {
        item.classList.toggle('is-active', item === button);
      });
      updateCartelModeControl();
    });
  });
}

if (cartelModeScale && cartelBoard) {
  cartelModeScale.addEventListener('input', () => {
    const value = cartelModeScale.value;
    cartelModeValues[cartelMode] = Number(value);

    if (cartelMode === 'font') {
      cartelBoard.style.setProperty('--board-width', value);
      cartelOverlayText.style.display = 'none';
    } else {
      cartelBoard.style.setProperty('--layers-offset', `${value}px`);
      cartelOverlayText.style.display = 'grid';
    }
  });
}

updateCartelModeControl();

// Publica el cartel: clona la cartulina editable y la manda a Protesta.
if (cartelPublishButton && cartelBoard && protestaGallery) {
  cartelPublishButton.addEventListener('click', () => {
    if (!canPublishPoster()) {
      updatePublishState();
      return;
    }

    const poster = cartelBoard.cloneNode(true);
    poster.classList.add('protesta-post');
    poster.removeAttribute('aria-label');
    poster.dataset.cartelMode = cartelMode;

    const posterOverlay = poster.querySelector('.cartel-overlay-text');
    if (posterOverlay) {
      posterOverlay.style.display = cartelMode === 'font' ? 'none' : 'grid';
    }

    const clonedEditor = poster.querySelector('.cartel-editor');
    if (clonedEditor) {
      clonedEditor.removeAttribute('contenteditable');
      clonedEditor.removeAttribute('spellcheck');
    }
    preservePosterLayout(poster);

    const emptyState = protestaGallery.querySelector('.protesta-empty');
    if (emptyState) {
      emptyState.remove();
    }

    protestaGallery.appendChild(poster);
    bringPosterToFront(poster);
    makePosterDraggable(poster);
    activateSection('protesta');

    window.requestAnimationFrame(() => {
      positionPoster(poster);
      saveProtestaPosters();
    });
  });
}

// INICIALIZACION: se ejecuta al cargar la pagina.
updatePublishState();
activateSection(getInitialSectionId());
syncActiveMenuButton();
restoreProtestaPosters();
buildAboutCarousel();
setupAboutExplorationReveal();

// Boton Reiniciar: borra carteles publicados y limpia localStorage.
if (protestaResetButton && protestaGallery) {
  protestaResetButton.addEventListener('click', () => {
    protestaGallery.querySelectorAll('.protesta-post').forEach((poster) => {
      poster.remove();
    });

    window.localStorage.removeItem(protestaStorageKey);
    addEmptyState();
  });
}
