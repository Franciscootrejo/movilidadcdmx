let logoImg, qrImg;
let boardDOM, editorDOM;

function setup() {
    boardDOM = document.querySelector('.cartel-board');
    editorDOM = document.querySelector('.cartel-editor');
    
    if (!boardDOM || !editorDOM) return;

    // Cargar imágenes dinámicamente infiriendo la ruta ya resuelta por el navegador.
    // Esto evita bloqueos en preload ("Loading...") por errores de rutas relativas.
    let logoDOM = document.querySelector('.brand-logo img');
    const onImgError = (e) => console.warn('P5.js: Imagen no encontrada, se omitirá.', e);
    if (logoDOM && logoDOM.src) {
        loadImage(logoDOM.src, img => logoImg = img, onImgError);
        let qrUrl = logoDOM.src.replace('logo.png', 'svg/qr.svg');
        loadImage(qrUrl, img => qrImg = img, onImgError);
    } else {
        loadImage('./ims/logo.png', img => logoImg = img, onImgError);
        loadImage('./ims/svg/qr.svg', img => qrImg = img, onImgError);
    }

    // Crea un canvas interactivo superpuesto y responsivo a las dimensiones de tu board HTML
    let rect = boardDOM.getBoundingClientRect();
    let cnv = createCanvas(rect.width, rect.height);
    cnv.parent(boardDOM);
    cnv.style('position', 'absolute');
    cnv.style('top', '0');
    cnv.style('left', '0');
    cnv.style('z-index', '1');
    cnv.style('pointer-events', 'none'); // Deja pasar los clicks al editor de texto nativo
    
    // Forzar soporte de ligaduras en el canvas DOM interactivo
    cnv.elt.style.fontVariantLigatures = "common-ligatures discretionary-ligatures contextual";
    cnv.elt.style.fontFeatureSettings = "'liga' 1, 'clig' 1, 'dlig' 1, 'calt' 1";
    
    // Hacemos el texto HTML transparente para que se vea el render de p5.js,
    // pero mantenemos el cursor visible para no perder la edición nativa.
    editorDOM.style.color = 'transparent';
    editorDOM.style.textShadow = 'none';
    editorDOM.style.caretColor = '#14000f'; 
    editorDOM.style.zIndex = '2';
    
    // Se amarra el método de descarga al botón existente "cartel-download".
    let downloadBtn = document.querySelector('#cartel-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadPoster);
    }

}

function draw() {
    if (!boardDOM || !editorDOM) return;
    
    // Mantener el botón de descarga habilitado/deshabilitado en base al botón de publicar
    let publishBtn = document.querySelector('#cartel-publish');
    let downloadBtn = document.querySelector('#cartel-download');
    if (publishBtn && downloadBtn) {
        downloadBtn.disabled = publishBtn.disabled;
    }
    
    let rect = boardDOM.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    // Redimensionar responsivamente si la ventana cambia
    if (width !== rect.width || height !== rect.height) {
        resizeCanvas(rect.width, rect.height);
    }
    
    clear();
    
    let rawText = editorDOM.innerText;
    const hasUserText = Boolean(rawText && rawText.trim().length > 0);
    const isPlaceholder = !hasUserText;

    if (!hasUserText) {
        rawText = editorDOM.getAttribute('data-placeholder') || 'Escribe aquí';
    } else {
        rawText = rawText.toUpperCase();
    }
    
    let bgColor = boardDOM.style.getPropertyValue('--board-color') || '#d8ff00';
    let boardScale = parseFloat(boardDOM.style.getPropertyValue('--board-scale') || '1.15');
    let boardWeight = parseFloat(boardDOM.style.getPropertyValue('--board-weight') || '100');
    let activeModeBtn = document.querySelector('.cartel-mode-button.is-active');
    let mode = activeModeBtn ? activeModeBtn.dataset.cartelMode : 'font';
    
    let modeScaleDOM = document.querySelector('#cartel-mode-scale');
    let layersOffset = parseFloat(modeScaleDOM ? modeScaleDOM.value : '0');
    
    // Render visual sobre pantalla
    drawPoster(this, width, height, rawText, bgColor, boardScale, boardWeight, mode, layersOffset, false, isPlaceholder);
}

function drawPoster(pg, w, h, textStr, bgColor, boardScale, boardWeight, mode, layersOffset, isExport, isPlaceholder = false) {
    if (isExport) {
        pg.background(bgColor);
    } else {
        pg.clear();
    }
    
    // Obtenemos las computaciones reales de CSS y las ajustamos en un factor de escala si es para descarga
    let computedStyle = window.getComputedStyle(editorDOM);
    let fontSizePx = parseFloat(computedStyle.fontSize) || (w * 0.08 * boardScale);
    let lineHeightPx = parseFloat(computedStyle.lineHeight) || (fontSizePx * 0.92);
    let letterSpacingPx = computedStyle.letterSpacing !== 'normal' ? parseFloat(computedStyle.letterSpacing) : (fontSizePx * 0.01);
    
    let scaleFactor = isExport ? (w / width) : 1;
    let finalFontSize = fontSizePx * scaleFactor;
    let finalLineHeight = lineHeightPx * scaleFactor;
    let finalLetterSpacing = letterSpacingPx * scaleFactor;
    
    // Clonamos atributos del DOM: Ligaduras, features y letter-spacing para igualar el CSS
    let canvasElt = pg.drawingContext ? pg.drawingContext.canvas : null;
    if (canvasElt) {
        canvasElt.style.fontVariantLigatures = "common-ligatures discretionary-ligatures contextual";
        canvasElt.style.fontFeatureSettings = "'liga' 1, 'clig' 1, 'dlig' 1, 'calt' 1";
        canvasElt.style.fontVariationSettings = `"wght" ${boardWeight}`;
    }
    if ('letterSpacing' in pg.drawingContext) {
        pg.drawingContext.letterSpacing = `${finalLetterSpacing}px`;
    }
    
    // Estilos principales de tipografía (usa la fuente declarada en CSS respetando su peso variable)
    pg.textFont('"Cartulina", sans-serif');
    pg.textSize(finalFontSize);
    pg._textStyle = boardWeight; // Bypass para inyectar el peso variable directamente en el motor de p5
    pg.textAlign(CENTER, CENTER);
    pg.textLeading(finalLineHeight);
    pg.textStyle(isPlaceholder ? ITALIC : NORMAL);
    
    let shadowColor = getHighlightColorForBoardColor(bgColor);
    
    let padX = (parseFloat(computedStyle.paddingLeft) || 0) * scaleFactor;
    let padY = (parseFloat(computedStyle.paddingTop) || 0) * scaleFactor;
    let boxW = w - padX * 2;
    let boxH = h - padY * 2;
    
    pg.push();
    if (mode === 'layers' && !isPlaceholder) {
        let offsetPx = layersOffset * scaleFactor;
        const fillColor = '#2a2a2a';
        
        pg.fill(shadowColor);
        pg.text(textStr, padX + offsetPx * 2, padY + offsetPx * 2, boxW, boxH);
        
        pg.fill(bgColor);
        pg.text(textStr, padX + offsetPx, padY + offsetPx, boxW, boxH);
        
        pg.fill(fillColor);
        pg.text(textStr, padX, padY, boxW, boxH);
        
    } else {
        pg.fill(isPlaceholder ? 'rgba(42, 42, 42, 0.34)' : '#2a2a2a');
        pg.text(textStr, padX, padY, boxW, boxH);
    }
    pg.pop();
    
    // Elementos del footer que solo aparecen en la imagen PNG descargada
    if (isExport) {
        let padding = w * 0.04;
        
        // QR y Texto 'Visita y protesta' (Esquina inferior izquierda)
        if (qrImg) {
            let qrSize = w * 0.12; 
            pg.image(qrImg, padding, h - qrSize - padding, qrSize, qrSize);
            
            pg.drawingContext.font = `500 ${w * 0.025}px Satoshi, sans-serif`;
            pg.textFont('"Satoshi", sans-serif');
            pg.textSize(w * 0.025);
            pg._textStyle = '500';
            pg.fill('#2a2a2a');
            pg.textAlign(CENTER, BOTTOM);
            pg.text("Visita y protesta", padding + qrSize/2, h - qrSize - padding - (w * 0.015));
        }
        
        // Logo (Esquina inferior derecha)
        if (logoImg) {
            let logoWidth = w * 0.18;
            let logoAspect = logoImg.width / logoImg.height;
            let logoHeight = logoWidth / logoAspect;
            pg.image(logoImg, w - logoWidth - padding, h - logoHeight - padding, logoWidth, logoHeight);
        }
    }
}

function downloadPoster() {
    if (!boardDOM || !editorDOM) return;
    
    let rawText = editorDOM.innerText;
    const hasUserText = Boolean(rawText && rawText.trim().length > 0);
    const isPlaceholder = !hasUserText;

    if (!hasUserText) {
        rawText = editorDOM.getAttribute('data-placeholder') || 'Escribe aquí';
    } else {
        rawText = rawText.toUpperCase();
    }
    
    let bgColor = boardDOM.style.getPropertyValue('--board-color') || '#d8ff00';
    let boardScale = parseFloat(boardDOM.style.getPropertyValue('--board-scale') || '1.15');
    let boardWeight = parseFloat(boardDOM.style.getPropertyValue('--board-weight') || '100');
    let activeModeBtn = document.querySelector('.cartel-mode-button.is-active');
    let mode = activeModeBtn ? activeModeBtn.dataset.cartelMode : 'font';
    
    let modeScaleDOM = document.querySelector('#cartel-mode-scale');
    let layersOffset = parseFloat(modeScaleDOM ? modeScaleDOM.value : '0');
    
    let rect = boardDOM.getBoundingClientRect();
    let aspect = rect.width / rect.height;
    
    // Resolución PNG exportada (1080px de ancho estricto)
    let w = 1080;
    let h = 1080 / aspect;
    
    let pg = createGraphics(w, h);
    drawPoster(pg, w, h, rawText, bgColor, boardScale, boardWeight, mode, layersOffset, true, isPlaceholder);
    
    save(pg, 'cartel-protesta.png');
}

function getHighlightColorForBoardColor(color) {
    const normalized = String(color).trim().toLowerCase();
    switch (normalized) {
        case '#39ff14': return '#000000';
        case '#ff2bd6': return 'rgb(255, 251, 0)';
        case '#d8ff00': return '#ff2bd6';
        default: return '#2a2a2a';
    }
}