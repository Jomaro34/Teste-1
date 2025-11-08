// app.js (versão corrigida)
// Requisitos: pdf.js e PDFLib (CDN incluidas no index.html)

// Elementos UI
const fileInput = document.getElementById('fileInput');
const pdfCanvas = document.getElementById('pdfCanvas');
const textLayer = document.getElementById('textLayer');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const saveBtn = document.getElementById('savePdf');

let pdfDoc = null;         // PDF.js document
let pdfData = null;        // ArrayBuffer original
let currentPage = 1;
let renderScale = 1.5;     // ajustar qualidade de renderização
let pageCanvasSizes = {};  // armazena canvas width/height por página (pixels)
let edits = {};            // edits[pageNumber] = [{index, text, canvasX,canvasY,canvasW,canvasH, orig}, ...]

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
  edits = {};
  pageCanvasSizes = {};
  await renderPage(currentPage);
}

async function renderPage(pageNum) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: renderScale });

  const canvas = pdfCanvas;
  const context = canvas.getContext('2d');

  // definir tamanho do canvas em pixels (device pixels)
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  // tamanho CSS igual a pixels (mantém relação 1:1)
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';

  // renderizar página no canvas
  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };
  await page.render(renderContext).promise;

  // guardar tamanhos do canvas para esta página
  const canvasClientRect = canvas.getBoundingClientRect();
  pageCanvasSizes[pageNum] = {
    canvasWidth: canvas.width,            // pixels internos
    canvasHeight: canvas.height,
    cssWidth: canvasClientRect.width,     // CSS pixels usados para cálculo
    cssHeight: canvasClientRect.height
  };

  // preparar textLayer
  textLayer.style.width = canvas.style.width;
  textLayer.style.height = canvas.style.height;
  textLayer.style.left = canvas.offsetLeft + 'px';
  textLayer.style.top = canvas.offsetTop + 'px';
  textLayer.innerHTML = '';

  // obter texto da página
  const textContent = await page.getTextContent({ normalizeWhitespace: true });

  let itemIndex = 0;
  for (const item of textContent.items) {
    // transform: [a,b,c,d,e,f] ; e = x, f = y (em user units)
    const tx = item.transform[4];
    const ty = item.transform[5];
    const fontHeight = Math.abs(item.transform[0]) * renderScale || 12;

    // calcular posição aproximada em pixels do canvas
    // y em item.transform é baseline (origem bottom), portanto converter:
    const x = tx * renderScale;
    const y = viewport.height - (ty * renderScale) - fontHeight;

    const span = document.createElement('div');
    span.className = 'textItem';
    span.textContent = item.str;
    span.dataset.page = pageNum;
    span.dataset.index = itemIndex;
    span.dataset.orig = item.str || '';

    span.style.left = `${x}px`;
    span.style.top = `${y}px`;
    span.style.fontSize = `${Math.max(8, fontHeight)}px`;
    span.style.lineHeight = `${Math.max(8, fontHeight)}px`;

    const w = (item.width || (item.str.length * fontHeight * 0.6)) * renderScale;
    span.style.width = `${Math.max(4, w)}px`;
    span.style.height = `${Math.max(4, fontHeight)}px`;
    span.style.overflow = 'visible';
    span.style.whiteSpace = 'pre';

    span.addEventListener('click', (ev) => {
      ev.stopPropagation();
      makeEditable(span);
    });

    textLayer.appendChild(span);
    itemIndex++;
  }

  pageInfo.textContent = `Página ${currentPage} / ${pdfDoc.numPages}`;

  // reaplicar edições já feitas nesta página (posicionar texto editado)
  if (edits[pageNum]) {
    for (const ch of edits[pageNum]) {
      // criar/atualizar um bloque similar para feedback visual
      const overlay = document.createElement('div');
      overlay.className = 'textItem';
      overlay.textContent = ch.text;
      overlay.style.left = `${ch.canvasX}px`;
      overlay.style.top = `${ch.canvasY}px`;
      overlay.style.fontSize = `${Math.max(8, ch.canvasH * 0.8)}px`;
      overlay.style.width = `${ch.canvasW}px`;
      overlay.style.height = `${ch.canvasH}px`;
      overlay.dataset.page = pageNum;
      overlay.dataset.index = ch.index;
      overlay.dataset.orig = ch.orig || '';
      overlay.addEventListener('click', (ev) => { ev.stopPropagation(); makeEditable(overlay); });
      textLayer.appendChild(overlay);
    }
  }
}

// transforma uma div num campo editável
function makeEditable(div) {
  if (div.classList.contains('editing')) return;
  div.classList.add('editing');
  div.contentEditable = 'true';
  div.focus();

  // posicionar caret no fim
  document.execCommand('selectAll', false, null);
  document.getSelection().collapseToEnd();

  function finishEdit() {
    if (!div) return;
    div.classList.remove('editing');
    div.contentEditable = 'false';

    const page = parseInt(div.dataset.page, 10);
    if (!edits[page]) edits[page] = [];

    const rect = div.getBoundingClientRect();
    const canvasRect = pdfCanvas.getBoundingClientRect();

    // converter CSS pixels -> canvas pixels (device pixels)
    const pageSize = pageCanvasSizes[page];
    const scaleX = pageSize.canvasWidth / pageSize.cssWidth;
    const scaleY = pageSize.canvasHeight / pageSize.cssHeight;

    const cssX = rect.left - canvasRect.left;
    const cssY = rect.top - canvasRect.top;
    const canvasX = cssX * scaleX;
    const canvasY = cssY * scaleY;
    const canvasW = rect.width * scaleX;
    const canvasH = rect.height * scaleY;

    const idx = div.dataset.index;
    const orig = div.dataset.orig || '';
    const text = div.textContent || '';

    const entry = {
      index: idx,
      text,
      orig,
      canvasX,
      canvasY,
      canvasW,
      canvasH
    };

    const slotIndex = edits[page].findIndex(e => e.index == idx);
    if (slotIndex >= 0) edits[page][slotIndex] = entry;
    else edits[page].push(entry);

    // Limpar seleção
    window.getSelection().removeAllRanges();
    document.removeEventListener('click', onDocClick);
  }

  function onDocClick(ev) {
    if (ev.target === div) return;
    finishEdit();
  }

  div.addEventListener('blur', finishEdit, { once: true });
  div.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEdit();
      div.removeEventListener('keydown', onKey);
    } else if (e.key === 'Escape') {
      div.textContent = div.dataset.orig || '';
      finishEdit();
      div.removeEventListener('keydown', onKey);
    }
  });

  setTimeout(() => document.addEventListener('click', onDocClick), 0);
}

// salva o PDF com as edições usando PDF-lib
async function saveEditedPdf() {
  if (!pdfData) return;
  const uint8 = new Uint8Array(pdfData);
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const pdfDocLib = await PDFDocument.load(uint8);
  const helvetica = await pdfDocLib.embedFont(StandardFonts.Helvetica);

  for (const [pageStr, changes] of Object.entries(edits)) {
    const pageNum = parseInt(pageStr, 10);
    if (!changes || changes.length === 0) continue;
    const pageIndex = pageNum - 1;
    const page = pdfDocLib.getPage(pageIndex);
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    // usar canvas size guardado para esta página
    const pageSize = pageCanvasSizes[pageNum];
    if (!pageSize) continue;
    const canvasW = pageSize.canvasWidth;
    const canvasH = pageSize.canvasHeight;

    const ratioX = pageWidth / canvasW;
    const ratioY = pageHeight / canvasH;

    for (const ch of changes) {
      const xPdf = ch.canvasX * ratioX;
      const yPdf = pageHeight - (ch.canvasY + ch.canvasH) * ratioY;
      const wPdf = ch.canvasW * ratioX;
      const hPdf = ch.canvasH * ratioY;

      // cobrir área original com branco
      page.drawRectangle({
        x: xPdf,
        y: yPdf,
        width: wPdf,
        height: hPdf,
        color: rgb(1,1,1)
      });

      // tamanho de fonte heurístico
      let fontSize = Math.max(8, hPdf * 0.65);

      // suportar quebras de linha simples
      const lines = (ch.text || '').split('\n');
      let yText = yPdf + hPdf - fontSize; // começar do topo da caixa
      for (const line of lines) {
        page.drawText(line, {
          x: xPdf + 2 * ratioX,
          y: yText,
          size: fontSize,
          font: helvetica,
          color: rgb(0,0,0),
          maxWidth: wPdf - 4 * ratioX,
        });
        yText -= fontSize * 1.1;
      }
    }
  }

  const modifiedBytes = await pdfDocLib.save();
  const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'edited.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  alert('PDF guardado como "edited.pdf" (transferência iniciada).');
}
