// app.js
// Requisitos: pdf.js (via CDN) e PDFLib (via CDN)
// Funcionalidade: carregar PDF, renderizar página, sobrepor textos como divs editáveis e guardar alterações num novo PDF.

const fileInput = document.getElementById('fileInput');
const pdfCanvas = document.getElementById('pdfCanvas');
const textLayer = document.getElementById('textLayer');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const saveBtn = document.getElementById('savePdf');

let pdfDoc = null;         // PDF.js document (ArrayBuffer)
let pdfData = null;        // ArrayBuffer original
let currentPage = 1;
let renderScale = 1.5;     // ajustar qualidade de renderização
let renderViewport = null;
let renderedCanvasWidth = 0, renderedCanvasHeight = 0;
let edits = {};            // edits[pageNumber] = [{id, text, x,y,w,h,origText}, ...]

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const arrayBuffer = await file.arrayBuffer();
  pdfData = arrayBuffer;
  await loadPdf(arrayBuffer);
});

prevBtn.addEventListener('click', () => {
  if (currentPage <= 1) return;
  currentPage--;
  renderPage(currentPage);
});

nextBtn.addEventListener('click', () => {
  if (!pdfDoc || currentPage >= pdfDoc.numPages) return;
  currentPage++;
  renderPage(currentPage);
});

saveBtn.addEventListener('click', saveEditedPdf);

async function loadPdf(arrayBuffer) {
  pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  currentPage = 1;
  pageInfo.textContent = `Página ${currentPage} / ${pdfDoc.numPages}`;
  prevBtn.disabled = false;
  nextBtn.disabled = false;
  saveBtn.disabled = false;
  edits = {}; // reset
  await renderPage(currentPage);
}

async function renderPage(pageNum) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: renderScale });
  renderViewport = viewport;

  const canvas = pdfCanvas;
  const context = canvas.getContext('2d');

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  renderedCanvasWidth = canvas.width;
  renderedCanvasHeight = canvas.height;

  // Ajustar tamanho visual (CSS) para manter 1:1 pixel ratio
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';

  // Renderizar no canvas
  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };
  await page.render(renderContext).promise;

  // Posição e tamanho do textLayer
  textLayer.style.width = canvas.style.width;
  textLayer.style.height = canvas.style.height;
  textLayer.style.left = canvas.offsetLeft + 'px';
  textLayer.style.top = canvas.offsetTop + 'px';
  textLayer.innerHTML = ''; // limpar antes de criar text divs

  // Obter conteúdo de texto e criar divs posicionadas
  const textContent = await page.getTextContent({ normalizeWhitespace: true });

  // Criar text layer via PDF.js util (opcional), mas vamos criar divs manualmente para controlar
  // convertRects: cada item tem transform onde [4]=x, [5]=y em usuário espaço.
  // Usaremos viewport.transform para converter para pixels.
  const viewportTransform = viewport.transform; // matriz 6 elementos
  let itemIndex = 0;

  for (const item of textContent.items) {
    // 'transform' é uma matriz [a,b,c,d,e,f], e fontSize está em item.transform[0] etc.
    const tx = item.transform[4];
    const ty = item.transform[5];
    // medir largura aproximada: item.width (em PDF units) multiplicar pelo scale
    // Use viewport.convertToViewportRectangle para obter retângulo em pixels
    const rect = pdfjsLib.Util.transform(viewport.transform, [0,0,1,1, tx, ty]); // não ideal, portanto usar getTextContent fallback

    // Nós vamos renderizar uma div simples posicionada usando getTextContent's styles:
    const span = document.createElement('div');
    span.className = 'textItem';
    // Texto bruto
    span.textContent = item.str;

    // A PDF.js fornece transform e width; convertemos para px mais diretamente:
    // Estimativa: item.width * viewport.scale
    const fontHeight = item.transform[0] * renderScale; // estimativa de altura
    const x = tx * renderScale;
    // ty é baseline y; converter para top: viewport.height - ty*scale - fontHeight
    const y = viewport.height - (ty * renderScale) - fontHeight;

    span.style.left = `${x}px`;
    span.style.top = `${y}px`;
    span.style.fontSize = `${Math.max(8, fontHeight)}px`;
    span.style.lineHeight = `${Math.max(8, fontHeight)}px`;
    span.style.transformOrigin = 'left top';
    span.style.pointerEvents = 'auto';
    span.dataset.page = pageNum;
    span.dataset.index = itemIndex;
    span.dataset.orig = item.str || '';
    // largura aproximada — item.width * scale
    const w = (item.width || (item.str.length * fontHeight * 0.6)) * renderScale;
    span.style.width = `${Math.max(4, w)}px`;
    span.style.height = `${Math.max(4, fontHeight)}px`;
    span.style.overflow = 'visible';
    span.style.whiteSpace = 'pre';

    // Make selectable/editable on click
    span.addEventListener('click', (ev) => {
      ev.stopPropagation();
      makeEditable(span);
    });

    textLayer.appendChild(span);
    itemIndex++;
  }

  pageInfo.textContent = `Página ${currentPage} / ${pdfDoc.numPages}`;
}

// transform a div into editable input (contentEditable)
function makeEditable(div) {
  if (div.classList.contains('editing')) return;
  div.classList.add('editing');
  div.contentEditable = 'true';
  div.focus();

  // create a simple caret at end
  document.execCommand('selectAll', false, null);
  document.getSelection().collapseToEnd();

  function finishEdit() {
    div.classList.remove('editing');
    div.contentEditable = 'false';
    // store edit
    const page = parseInt(div.dataset.page, 10);
    if (!edits[page]) edits[page] = [];
    const rect = div.getBoundingClientRect();
    const canvasRect = pdfCanvas.getBoundingClientRect();
    const localX = rect.left - canvasRect.left;
    const localY = rect.top - canvasRect.top;
    const localW = rect.width;
    const localH = rect.height;
    // update or push by index
    const idx = div.dataset.index;
    const orig = div.dataset.orig || '';
    const text = div.textContent || '';
    // Attempt to replace existing edit for same index
    const slotIndex = edits[page].findIndex(e => e.index == idx);
    const entry = {
      index: idx,
      text,
      orig,
      x: localX,
      y: localY,
      w: localW,
      h: localH
    };
    if (slotIndex >= 0) edits[page][slotIndex] = entry;
    else edits[page].push(entry);
    // remove selection
    window.getSelection().removeAllRanges();
    document.removeEventListener('click', onDocClick);
  }

  function onDocClick(ev) {
    if (ev.target === div) return;
    finishEdit();
  }

  // finish on blur or clicking elsewhere or pressing Enter (without creating newline)
  div.addEventListener('blur', finishEdit, { once: true });
  div.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEdit();
      div.removeEventListener('keydown', onKey);
    } else if (e.key === 'Escape') {
      // revert
      div.textContent = div.dataset.orig || '';
      finishEdit();
      div.removeEventListener('keydown', onKey);
    }
  });

  // click outside to finish
  setTimeout(() => document.addEventListener('click', onDocClick), 0);
}

// Save edited PDF using PDF-lib: desenha retângulos brancos e texto novo por cima
async function saveEditedPdf() {
  if (!pdfData) return;
  const uint8 = new Uint8Array(pdfData);
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const pdfDocLib = await PDFDocument.load(uint8);
  const helvetica = await pdfDocLib.embedFont(StandardFonts.Helvetica);

  // Para cada página com edições
  for (const [pageStr, changes] of Object.entries(edits)) {
    const pageNum = parseInt(pageStr, 10);
    if (!changes || changes.length === 0) continue;
    const pageIndex = pageNum - 1;
    const page = pdfDocLib.getPage(pageIndex);
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    // Factor to convert canvas pixels (renderedCanvasWidth/Height) => PDF points
    // Use the rendered canvas size for the specific page: note que renderScale é o mesmo para todas páginas aqui
    const canvasW = renderedCanvasWidth;
    const canvasH = renderedCanvasHeight;
    const ratioX = pageWidth / canvasW;
    const ratioY = pageHeight / canvasH;

    // For each change, draw a white rectangle to cover and then draw text
    for (const ch of changes) {
      const xPdf = ch.x * ratioX;
      // y in PDF-lib coordinates (bottom-left origin). ch.y is top position in CSS, so convert:
      const yPdf = pageHeight - (ch.y + ch.h) * ratioY;
      const wPdf = ch.w * ratioX;
      const hPdf = ch.h * ratioY;

      // Draw white rectangle to "erase" original text
      page.drawRectangle({
        x: xPdf,
        y: yPdf,
        width: wPdf,
        height: hPdf,
        color: rgb(1,1,1)
      });

      // Determine font size to fit in the rectangle (simple heuristic)
      const fontSize = Math.max(8, hPdf * 0.7);

      // Draw the new text
      page.drawText(ch.text, {
        x: xPdf + 2 * ratioX,
        y: yPdf + (hPdf - fontSize) / 2,
        size: fontSize,
        font: helvetica,
        color: rgb(0, 0, 0),
        maxWidth: wPdf - 4 * ratioX,
      });
    }
  }

  const modifiedBytes = await pdfDocLib.save();
  const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  // trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = 'edited.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  alert('PDF guardado como "edited.pdf" (transferência iniciada).');
}