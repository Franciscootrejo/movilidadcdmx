/*
María Labarthe
protesta.js
*/

const menu = document.querySelector('.menu');
const buttons = document.querySelectorAll('[data-section]');
const sections = document.querySelectorAll('.docs-section');

const cartelBoard = document.querySelector('#cartel .cartel-board');
const cartelEditor = document.querySelector('#cartel .cartel-editor');
const cartelScale = document.querySelector('#cartel-size');
const cartelModeButtons = document.querySelectorAll('[data-cartel-mode]');
const cartelModeScale = document.querySelector('#cartel-mode-scale');
const cartelModeLabel = document.querySelector('.cartel-scale-label');
const cartelOverlayText = document.querySelector('#cartel .cartel-overlay-text');
const cartelColorButtons = document.querySelectorAll('[data-cartel-color]');
const cartelPublishButton = document.querySelector('#cartel-publish');

const protestaGallery = document.querySelector('#protesta-gallery');
const protestaResetButton = document.querySelector('#protesta-reset');
const protestaStorageKey = 'puestoAlPaso.protestaPosters';

let protestaZIndex = 10;
let cartelMode = 'font';

const cartelModeValues = {
	font: Number(cartelModeScale?.value || 100),
	layers: 0,
};

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

function activateSection(targetId) {
	const targetSection = targetId ? document.getElementById(targetId) : null;
	const fallbackSection = document.getElementById('cartel');
	const nextSection = targetSection && targetSection.classList.contains('docs-section')
		? targetSection
		: fallbackSection;

	if (!nextSection) {
		return;
	}

	sections.forEach((section) => {
		section.classList.toggle('is-active', section === nextSection);
	});

	buttons.forEach((item) => {
		item.classList.toggle('is-active', item.dataset.section === nextSection.id);
	});

	if (menu) {
		menu.removeAttribute('open');
	}
}

function getInitialSectionId() {
	const hashId = window.location.hash.replace('#', '');
	const hashSection = hashId ? document.getElementById(hashId) : null;

	if (hashSection && hashSection.classList.contains('docs-section')) {
		return hashId;
	}

	return 'cartel';
}

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

	cartelBoard.style.setProperty('--overlay-color', getHighlightColorForBoardColor(color));
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
		return;
	}

	cartelModeScale.min = '-2';
	cartelModeScale.max = '3';
	cartelModeScale.step = '0.1';
	cartelModeScale.value = String(cartelModeValues.layers);
	cartelOverlayText.style.display = 'grid';
}

function bringPosterToFront(poster) {
	protestaZIndex += 1;
	poster.style.zIndex = String(protestaZIndex);
}

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

function updatePublishState() {
	if (!cartelPublishButton) {
		return;
	}

	cartelPublishButton.disabled = !canPublishPoster();
}

function scaleBoxValue(value, scale) {
	return value
		.split(' ')
		.map((item) => `${parseFloat(item) * scale}px`)
		.join(' ');
}

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

	if (!sourceOverlay || !posterOverlay) {
		return;
	}

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

function addEmptyState() {
	if (!protestaGallery || protestaGallery.querySelector('.protesta-empty')) {
		return;
	}

	const emptyMessage = document.createElement('p');
	emptyMessage.className = 'protesta-empty';
	emptyMessage.textContent = 'Todavía no has publicado un cartel.';
	protestaGallery.appendChild(emptyMessage);
}

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

function saveProtestaPosters() {
	if (!protestaGallery) {
		return;
	}

	const posters = Array.from(protestaGallery.querySelectorAll('.protesta-post')).map(posterToData);
	window.localStorage.setItem(protestaStorageKey, JSON.stringify(posters));
}

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

function positionPoster(poster) {
	if (!protestaGallery || !poster) {
		return;
	}

	const galleryRect = protestaGallery.getBoundingClientRect();
	const posterRect = poster.getBoundingClientRect();
	const maxX = Math.max(0, galleryRect.width - posterRect.width);
	const maxY = Math.max(0, galleryRect.height - posterRect.height);

	poster.style.left = `${maxX / 2}px`;
	poster.style.top = `${maxY / 2}px`;
}

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

		poster.style.left = `${clamp(dragState.originLeft + deltaX, 0, maxX)}px`;
		poster.style.top = `${clamp(dragState.originTop + deltaY, 0, maxY)}px`;
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

if (cartelEditor) {
	cartelEditor.addEventListener('input', () => {
		syncCartelOverlayText();
		updatePublishState();
	});
}

if (cartelScale && cartelBoard) {
	cartelScale.addEventListener('input', () => {
		cartelBoard.style.setProperty('--board-scale', cartelScale.value);
	});
}

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
			if (cartelOverlayText) {
				cartelOverlayText.style.display = 'none';
			}
			return;
		}

		cartelBoard.style.setProperty('--layers-offset', `${value}px`);
		if (cartelOverlayText) {
			cartelOverlayText.style.display = 'grid';
		}
	});
}

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
		window.history.replaceState(null, '', '#protesta');

		window.requestAnimationFrame(() => {
			positionPoster(poster);
			saveProtestaPosters();
		});
	});
}

updateCartelModeControl();
updatePublishState();
syncCartelOverlayText();
activateSection(getInitialSectionId());
restoreProtestaPosters();

if (protestaResetButton && protestaGallery) {
	protestaResetButton.addEventListener('click', () => {
		protestaGallery.querySelectorAll('.protesta-post').forEach((poster) => {
			poster.remove();
		});

		window.localStorage.removeItem(protestaStorageKey);
		addEmptyState();
	});
}
