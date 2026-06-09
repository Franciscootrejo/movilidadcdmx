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

const cartelColorButtons = document.querySelectorAll('[data-cartel-color]');
const cartelPublishButton = document.querySelector('#cartel-publish');

const protestaGallery = document.querySelector('#protesta-gallery');
const protestaResetButton = document.querySelector('#protesta-reset');
const protestaStorageKey = 'puestoAlPaso.protestaPosters';
const API_URL_POSTS = 'https://centro.juanfuent.es/api/posts';

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

	if (cartelMode === 'layers') {
		updateCartelLayersShadow();
	}
}

function updateCartelLayersShadow() {
	if (!cartelBoard) {
		return;
	}

	const boardColor = cartelBoard.style.getPropertyValue('--board-color') || '#d8ff00';
	const shadowColor = cartelBoard.style.getPropertyValue('--overlay-color') || getHighlightColorForBoardColor(boardColor);
	const shadow = buildLayersShadow(cartelModeValues.layers, boardColor, shadowColor);

	cartelBoard.style.setProperty('--layers-shadow', shadow);
}

function updateCartelModeControl() {
	if (!cartelModeScale || !cartelModeLabel) {
		return;
	}

	const isFontMode = cartelMode === 'font';
	cartelModeLabel.textContent = isFontMode ? 'Condensado' : 'Capas';

	if (isFontMode) {
		cartelModeScale.min = '100';
		cartelModeScale.max = '500';
		cartelModeScale.step = '1';
		cartelModeScale.value = String(cartelModeValues.font);
		if (cartelBoard) {
			cartelBoard.style.setProperty('--layers-shadow', 'none');
		}
		return;
	}

	cartelModeScale.min = '-3';
	cartelModeScale.max = '3';
	cartelModeScale.step = '1';
	cartelModeScale.value = String(cartelModeValues.layers);
	if (cartelBoard) {
		updateCartelLayersShadow();
	}
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

function buildLayersShadow(offset, boardColor, shadowColor) {
	if (!offset || offset === 0) {
		return 'none';
	}
	return `${offset}px 0 0 ${boardColor}, ${offset * 2}px 0 0 ${shadowColor}`;
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

	const stage = document.querySelector('.cartel-stage');
	if (!stage) return;

	const originalVisibility = poster.style.visibility;
	const originalPosition = poster.style.position;
	
	poster.style.visibility = 'hidden';
	poster.style.position = 'absolute';
	stage.appendChild(poster);

	const sourceRect = cartelBoard.getBoundingClientRect();
	const posterScale = window.matchMedia('(max-width: 700px)').matches ? 0.52 : 0.42;
	
	const targetSize = Math.max(290, sourceRect.width * posterScale);

	const sourceBoardStyle = window.getComputedStyle(poster);
	const posterPadding = scaleBoxValue(sourceBoardStyle.padding, posterScale);

	const posterEditor = poster.querySelector('.cartel-editor');
	
	let editorFontSize, editorPadding, editorLineHeight, editorLetterSpacing;
	if (posterEditor) {
		const editorStyle = window.getComputedStyle(posterEditor);
		editorFontSize = parseFloat(editorStyle.fontSize);
		editorPadding = editorStyle.padding;
		editorLineHeight = parseFloat(editorStyle.lineHeight);
		editorLetterSpacing = parseFloat(editorStyle.letterSpacing);
	}

	stage.removeChild(poster);
	poster.style.visibility = originalVisibility || '';
	poster.style.position = originalPosition || '';

	poster.style.width = `${targetSize}px`;
	poster.style.height = `${targetSize}px`;
	poster.style.aspectRatio = `1 / 1`;
	poster.style.padding = posterPadding;

	if (posterEditor) {
		posterEditor.style.fontSize = `${editorFontSize * posterScale}px`;
		posterEditor.style.padding = scaleBoxValue(editorPadding, posterScale);
		posterEditor.style.lineHeight = Number.isNaN(editorLineHeight)
			? ''
			: `${editorLineHeight * posterScale}px`;

		if (!Number.isNaN(editorLetterSpacing)) {
			posterEditor.style.letterSpacing = `${editorLetterSpacing * posterScale}px`;
		}
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

	return {
		text: editor ? editor.textContent : '',
		boardColor: poster.style.getPropertyValue('--board-color'),
		boardScale: poster.style.getPropertyValue('--board-scale'),
		boardWeight: poster.style.getPropertyValue('--board-weight'),
		layersShadow: poster.style.getPropertyValue('--layers-shadow'),
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

async function saveProtestaPosters() {
	if (!protestaGallery) {
		return;
	}

	const posters = Array.from(protestaGallery.querySelectorAll('.protesta-post'));
	
	for (const poster of posters) {
		const data = posterToData(poster);
		const postId = poster.dataset.postId;
		
		const apiPayload = {
			content: data.text,
			bg: data.boardColor,
			color: getHighlightColorForBoardColor(data.boardColor),
			shadow: data.cartelMode === 'font' ? 'none' : (data.layersShadow || 'none'),
			size: parseFloat(data.boardScale) || 1.15,
			wght: parseInt(data.boardWeight, 10) || 100,
			status: 'published',
			left: data.left,
			top: data.top
		};

		try {
			const method = postId ? 'PUT' : 'POST';
			const url = postId ? `${API_URL_POSTS}/${postId}` : API_URL_POSTS;
			
			const res = await fetch(url, {
				method: method,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					'X-Requested-With': 'XMLHttpRequest'
				},
				body: JSON.stringify({ post: apiPayload })
			});
			
			if (res.ok && !postId) {
				const savedPost = await res.json();
				if (savedPost && savedPost.id) {
					poster.dataset.postId = savedPost.id;
				}
			}
		} catch (error) {
			console.error('Error al guardar el cartel en la API.', error);
		}
	}
}

function createPosterFromData(data) {
	const poster = document.createElement('div');
	const wrapper = document.createElement('div');
	const editor = document.createElement('div');
	const posterMode = data.cartelMode || 'font';

	poster.className = 'cartel-board protesta-post';
	poster.dataset.cartelMode = posterMode;
	poster.style.setProperty('--board-color', data.boardColor || '#d8ff00');
	poster.style.setProperty('--overlay-color', getHighlightColorForBoardColor(data.boardColor || '#d8ff00'));
	poster.style.setProperty('--board-scale', data.boardScale || '1.15');
	poster.style.setProperty('--board-weight', data.boardWeight || '100');
	poster.style.setProperty('--layers-shadow', data.layersShadow || 'none');
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

	wrapper.appendChild(editor);
	poster.appendChild(wrapper);
	makePosterDraggable(poster);

	return poster;
}

async function restoreProtestaPosters() {
	if (!protestaGallery) {
		return;
	}

	let savedPosters = [];

	try {
		const res = await fetch(`${API_URL_POSTS}?t=${Date.now()}`, {
			headers: {
				'Accept': 'application/json',
				'X-Requested-With': 'XMLHttpRequest'
			}
		});
		if (!res.ok) throw new Error(`Status: ${res.status}`);
		savedPosters = await res.json();
	} catch (error) {
		console.error('Ocurrió un error al cargar los carteles desde la API.', error);
	}

	if (!savedPosters.length) {
		return;
	}

	const emptyState = protestaGallery.querySelector('.protesta-empty');
	if (emptyState) {
		emptyState.remove();
	}

	savedPosters.forEach((apiObj) => {
		let shadowValue = apiObj.shadow;
		const isLayers = shadowValue && shadowValue !== 'none' && shadowValue !== '0px';

		if (isLayers) {
			if (shadowValue.startsWith('#')) {
				shadowValue = buildLayersShadow(2, apiObj.bg, shadowValue);
			} else if (shadowValue.split(' ').length === 1) {
				const offsetVal = parseFloat(shadowValue) || 2;
				shadowValue = buildLayersShadow(offsetVal, apiObj.bg, getHighlightColorForBoardColor(apiObj.bg));
			}
		} else {
			shadowValue = 'none';
		}

		const data = {
			id: apiObj.id,
			text: apiObj.content,
			boardColor: apiObj.bg,
			boardScale: apiObj.size || '1.15',
			boardWeight: apiObj.wght,
			layersShadow: shadowValue,
			cartelMode: isLayers ? 'layers' : 'font',
			left: apiObj.left || `${Math.floor(Math.random() * 200 + 50)}px`,
			top: apiObj.top || `${Math.floor(Math.random() * 200 + 50)}px`,
		};

		const poster = createPosterFromData(data);
		if (data.id) {
			poster.dataset.postId = data.id;
		}

		preservePosterLayout(poster);
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
			cartelBoard.style.setProperty('--board-weight', value);
			cartelBoard.style.setProperty('--layers-shadow', 'none');
			return;
		}

		updateCartelLayersShadow();
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
activateSection(getInitialSectionId());
restoreProtestaPosters();

if (protestaResetButton && protestaGallery) {
	protestaResetButton.addEventListener('click', async () => {
		const posters = protestaGallery.querySelectorAll('.protesta-post');
		
		for (const poster of posters) {
			const postId = poster.dataset.postId;
			if (postId) {
				try {
					await fetch(`${API_URL_POSTS}/${postId}`, {
						method: 'DELETE',
						headers: {
							'Accept': 'application/json',
							'X-Requested-With': 'XMLHttpRequest'
						}
					});
				} catch (error) {
					console.error('Error al borrar cartel de la API', error);
				}
			}
			poster.remove();
		}

		window.localStorage.removeItem(protestaStorageKey);
		addEmptyState();
	});
}
