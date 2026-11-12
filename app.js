const $ = (selector) => document.querySelector(selector);

const PRESETS = {
  light:    { label: "Light",    dpi: 300, quality: 85, monoDpi: 300, pdfSettings: "/prepress" },
  balanced: { label: "Balanced", dpi: 150, quality: 75, monoDpi: 300, pdfSettings: "/ebook" },
  strong:   { label: "Strong",   dpi: 120, quality: 60, monoDpi: 300, pdfSettings: "/screen" },
  extreme:  { label: "Extreme",  dpi: 72,  quality: 40, monoDpi: 300, pdfSettings: "/screen" },
};

const TOOLS = {
  compress: {
    label: "Compress",
    action: "Compress PDF",
    resultTitle: "Compression complete",
    downloadSuffix: "_compressed",
    optionsId: "options-compress",
    dropzoneTitle: "Drop a PDF here",
    dropzoneSubtitle: "or click to browse · PDF files only",
    hint: "Keep a copy of the original. Ghostscript rewrites the document, so interactive forms, JavaScript, or tagged accessibility data may change.",
  },
  delete: {
    label: "Delete pages",
    action: "Delete selected pages",
    resultTitle: "Pages deleted",
    downloadSuffix: "_pages-deleted",
    optionsId: "options-delete",
    pageTool: true,
    dropzoneTitle: "Drop a PDF to edit",
    dropzoneSubtitle: "Click the pages you want to remove",
    hint: "Click page thumbnails to select them, then delete. Bookmarks, links, or form fields may not survive.",
  },
  extract: {
    label: "Extract pages",
    action: "Extract selected pages",
    resultTitle: "Pages extracted",
    downloadSuffix: "_extracted",
    optionsId: "options-extract",
    pageTool: true,
    dropzoneTitle: "Drop a PDF to extract from",
    dropzoneSubtitle: "Click pages in the order you want them",
    hint: "Click pages in the order you want the extracted PDF. The badge shows output order. Bookmarks, links, and forms are not copied.",
  },
  rotate: {
    label: "Rotate pages",
    action: "Rotate selected pages",
    resultTitle: "Pages rotated",
    downloadSuffix: "_rotated",
    optionsId: "options-rotate",
    pageTool: true,
    dropzoneTitle: "Drop a PDF to rotate",
    dropzoneSubtitle: "Click pages, then choose a rotation",
    hint: "Click page thumbnails to select them, choose rotation, then apply. Rotation is applied on top of the current rotation.",
  },
  move: {
    label: "Move pages",
    action: "Save new page order",
    resultTitle: "Page order updated",
    downloadSuffix: "_reordered",
    optionsId: "options-move",
    pageTool: true,
    moveTool: true,
    dropzoneTitle: "Drop a PDF to reorder",
    dropzoneSubtitle: "Drag pages in the gallery to move them",
    hint: "Drag pages to their new position, or click several and drag them together. The downloaded PDF follows the new order.",
  },
  replace: {
    label: "Replace page",
    action: "Replace selected pages",
    resultTitle: "Pages replaced",
    downloadSuffix: "_replaced",
    optionsId: "options-replace",
    pageTool: true,
    replaceTool: true,
    dropzoneTitle: "Drop a PDF to edit",
    dropzoneSubtitle: "Click the pages you want to replace",
    hint: "Selected pages are removed and the chosen replacement pages take their place at the first selected position.",
  },
  addtext: {
    label: "Add text",
    action: "Apply text",
    resultTitle: "Text added",
    downloadSuffix: "_text-added",
    optionsId: null,
    pageTool: true,
    addTextTool: true,
    dropzoneTitle: "Drop a PDF to write on",
    dropzoneSubtitle: "Click a page, then click it to place text",
    hint: "Click a page thumbnail, then click the page to place text. Add several boxes, drag them into place, then apply.",
  },
  text: {
    label: "Edit text",
    action: "Apply text edits",
    resultTitle: "Text edits applied",
    downloadSuffix: "_text",
    optionsId: null,
    pageTool: true,
    textTool: true,
    dropzoneTitle: "Drop a PDF to edit text",
    dropzoneSubtitle: "Click a page, then replace existing text",
    hint: "Click a page thumbnail, then click a text block to cover and replace it. For new text anywhere, use the Add text tab.",
  },
  merge: {
    label: "Merge PDFs",
    action: "Merge PDFs",
    resultTitle: "PDFs merged",
    downloadSuffix: "_merged",
    optionsId: null,
    dropzoneTitle: "Drop PDFs here",
    dropzoneSubtitle: "Add at least two PDF files",
    hint: "Files are combined in the order shown. Bookmarks, links, and forms are not merged.",
  },
};

const els = {
  tabs: $("#tool-tabs"),
  fileWarning: $("#file-warning"),
  themeToggle: $("#theme-toggle"),

  filePanel: $("#file-panel"),
  dropzone: $("#dropzone"),
  dropzoneTitle: $("#dropzone-title"),
  dropzoneSubtitle: $("#dropzone-subtitle"),
  fileInput: $("#file-input"),
  fileInfo: $("#file-info"),
  fileName: $("#file-name"),
  fileSize: $("#file-size"),
  clearFile: $("#clear-file"),

  mergePanel: $("#merge-panel"),
  mergeDropzone: $("#merge-dropzone"),
  mergeInput: $("#merge-input"),
  mergeList: $("#merge-list"),
  mergeEmpty: $("#merge-empty"),

  toolOptionsPanel: $("#tool-options-panel"),
  actionsPanel: $("#actions-panel"),

  galleryPanel: $("#gallery-panel"),
  galleryTitle: $("#gallery-title"),
  galleryHint: $("#gallery-hint"),
  galleryStatus: $("#gallery-status"),
  pageGallery: $("#page-gallery"),
  galleryAll: $("#gallery-all"),
  galleryOdd: $("#gallery-odd"),
  galleryEven: $("#gallery-even"),
  galleryInvert: $("#gallery-invert"),
  galleryClear: $("#gallery-clear"),
  galleryCount: $("#gallery-count"),
  galleryToolbar: $("#gallery-toolbar"),
  galleryMoveLeft: $("#gallery-move-left"),
  galleryMoveRight: $("#gallery-move-right"),
  galleryResetOrder: $("#gallery-reset-order"),

  replacePick: $("#replace-pick"),
  replaceClear: $("#replace-clear"),
  replaceFileName: $("#replace-file-name"),
  replaceInput: $("#replace-input"),
  replaceGalleryPanel: $("#replace-gallery-panel"),
  replaceGalleryTitle: $("#replace-gallery-title"),
  replaceGalleryHint: $("#replace-gallery-hint"),
  replaceGalleryStatus: $("#replace-gallery-status"),
  replaceGallery: $("#replace-gallery"),
  replaceGalleryAll: $("#replace-gallery-all"),
  replaceGalleryClear: $("#replace-gallery-clear"),
  replaceGalleryCount: $("#replace-gallery-count"),

  textEditorPanel: $("#text-editor-panel"),
  textEditorTitle: $("#text-editor-title"),
  textEditorPage: $("#text-editor-page"),
  textEditorGrid: $("#text-editor-grid"),
  textPreview: $("#text-preview"),
  textPreviewCanvas: $("#text-preview-canvas"),
  textCursor: $("#text-cursor"),
  textValue: $("#text-value"),
  textFont: $("#text-font"),
  textFontHelp: $("#text-font-help"),
  textSize: $("#text-size"),
  textColor: $("#text-color"),
  textBold: $("#text-bold"),
  textItalic: $("#text-italic"),
  textCover: $("#text-cover"),
  textPlaceBtn: $("#text-place-btn"),
  textClearActive: $("#text-clear-active"),
  textExistingList: $("#text-existing-list"),
  textEditsList: $("#text-edits-list"),
  textApplyBtn: $("#text-apply-btn"),
  textClearEdits: $("#text-clear-edits"),
  textZoomOut: $("#text-zoom-out"),
  textZoomIn: $("#text-zoom-in"),
  textZoomFit: $("#text-zoom-fit"),
  textZoomLabel: $("#text-zoom-label"),

  addTextPanel: $("#addtext-panel"),
  addTextGrid: $("#addtext-grid"),
  addTextPreview: $("#addtext-preview"),
  addTextBase: $("#addtext-base"),
  addTextOverlay: $("#addtext-overlay"),
  addTextPage: $("#addtext-page"),
  addTextPrev: $("#addtext-prev"),
  addTextNext: $("#addtext-next"),
  addTextValue: $("#addtext-value"),
  addTextFont: $("#addtext-font"),
  addTextSize: $("#addtext-size"),
  addTextColor: $("#addtext-color"),
  addTextBold: $("#addtext-bold"),
  addTextItalic: $("#addtext-italic"),
  addTextDelete: $("#addtext-delete"),
  addTextClearPage: $("#addtext-clear-page"),
  addTextList: $("#addtext-list"),
  addTextApply: $("#addtext-apply"),
  addTextZoomOut: $("#addtext-zoom-out"),
  addTextZoomIn: $("#addtext-zoom-in"),
  addTextZoomFit: $("#addtext-zoom-fit"),
  addTextZoomLabel: $("#addtext-zoom-label"),

  presets: $("#presets"),
  presetLabel: $("#current-preset-label"),
  dpi: $("#dpi"),
  dpiOut: $("#dpi-out"),
  quality: $("#quality"),
  qualityOut: $("#quality-out"),
  monoDpi: $("#mono-dpi"),
  monoDpiOut: $("#mono-dpi-out"),

  actionBtn: $("#action-btn"),
  actionHint: $("#action-hint"),
  cancelBtn: $("#cancel-btn"),

  progressPanel: $("#progress-panel"),
  progressBar: $("#progress-bar"),
  progressText: $("#progress-text"),
  status: $("#status"),

  errorPanel: $("#error-panel"),
  errorMessage: $("#error-message"),

  resultPanel: $("#result-panel"),
  resultTitle: $("#result-title"),
  beforeSize: $("#before-size"),
  afterSize: $("#after-size"),
  savedPercent: $("#saved-percent"),
  savedLabel: $("#saved-label"),
  downloadLink: $("#download-link"),
  againBtn: $("#again-btn"),
};

const state = {
  tool: "compress",
  file: null,
  mergeFiles: [],
  busy: false,
  worker: null,
  jobToken: 0,
  originalSize: 0,
  resultUrl: null,
  resultName: "output.pdf",
  preset: "balanced",
  custom: false,
  pdfDoc: null,
  pdfLoadingTask: null,
  pdfLoadToken: 0,
  galleryFile: null,
  galleryObserver: null,
  renderedPages: new Set(),
  selectedPages: [],
  gallerySelectionTool: null,
  pageOrder: [],
  moveDrag: null,
  replaceFile: null,
  replaceDoc: null,
  replaceLoadingTask: null,
  replaceLoadToken: 0,
  replaceObserver: null,
  replaceSelectedPages: [],
  textPage: null,
  textViewport: null,
  textItems: [],
  textStyles: {},
  textActive: null,
  textEdits: {},
  textToken: 0,
  textZoom: 1,
  textRenderTask: null,
  textRenderLock: null,
  addTextPage: null,
  addTextViewport: null,
  addTextItems: {},
  addTextSelected: null,
  addTextPending: null,
  addTextDrag: null,
  addTextToken: 0,
  addTextZoom: 1,
  addTextRenderTask: null,
  addTextRenderLock: null,
};

const ZOOM_STEPS = [1, 1.25, 1.5, 2, 2.5, 3, 4];

function stepZoom(current, delta) {
  let index = ZOOM_STEPS.indexOf(current);
  if (index < 0) {
    index = ZOOM_STEPS.findIndex((step) => step >= current);
    if (index < 0) index = ZOOM_STEPS.length - 1;
  }
  index = Math.max(0, Math.min(ZOOM_STEPS.length - 1, index + delta));
  return ZOOM_STEPS[index];
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KiB", "MiB", "GiB"];
  let value = bytes;
  let unit = "B";
  for (const next of units) {
    if (value < 1024) break;
    value /= 1024;
    unit = next;
  }
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${unit}`;
}

function isPdfFile(file) {
  return Boolean(file) && (file.type === "application/pdf" || /\.pdf$/i.test(file.name || ""));
}

/* ---------------------------------------------------------------- compression settings */

function getSettings() {
  if (!state.custom && PRESETS[state.preset]) {
    return { ...PRESETS[state.preset], label: PRESETS[state.preset].label };
  }
  const base = PRESETS[state.preset] || PRESETS.balanced;
  return {
    label: "Custom",
    dpi: Number(els.dpi.value),
    quality: Number(els.quality.value),
    monoDpi: Number(els.monoDpi.value),
    pdfSettings: base.pdfSettings,
  };
}

function renderPresetState() {
  const settings = getSettings();
  els.presetLabel.textContent = settings.label;
  els.dpiOut.value = settings.dpi;
  els.qualityOut.value = settings.quality;
  els.monoDpiOut.value = settings.monoDpi;
  for (const button of els.presets.querySelectorAll(".preset")) {
    button.classList.toggle("active", !state.custom && button.dataset.preset === state.preset);
  }
}

function applyPreset(name) {
  if (!PRESETS[name]) return;
  state.preset = name;
  state.custom = false;
  const preset = PRESETS[name];
  els.dpi.value = preset.dpi;
  els.quality.value = preset.quality;
  els.monoDpi.value = preset.monoDpi;
  renderPresetState();
}

function markCustom() {
  state.custom = true;
  renderPresetState();
}

function buildGhostscriptArgs(settings) {
  return [
    "-sDEVICE=pdfwrite",
    "-dNOPAUSE",
    "-dBATCH",
    "-dSAFER",
    "-dCompatibilityLevel=1.5",
    "-dDetectDuplicateImages=true",
    "-dCompressFonts=true",
    "-dSubsetFonts=true",
    "-dEmbedAllFonts=true",
    "-dAutoRotatePages=/None",
    "-dPreserveAnnots=true",
    `-dPDFSETTINGS=${settings.pdfSettings}`,
    "-dDownsampleColorImages=true",
    `-dColorImageResolution=${settings.dpi}`,
    "-dColorImageDownsampleThreshold=1.0",
    "-dColorImageDownsampleType=/Bicubic",
    "-dAutoFilterColorImages=false",
    "-dColorImageFilter=/DCTEncode",
    "-dDownsampleGrayImages=true",
    `-dGrayImageResolution=${settings.dpi}`,
    "-dGrayImageDownsampleThreshold=1.0",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dAutoFilterGrayImages=false",
    "-dGrayImageFilter=/DCTEncode",
    "-dDownsampleMonoImages=true",
    `-dMonoImageResolution=${settings.monoDpi}`,
    "-dMonoImageDownsampleThreshold=1.0",
    "-dMonoImageDownsampleType=/Subsample",
    `-dJPEGQ=${settings.quality}`,
    "-sOutputFile=output.pdf",
    "input.pdf",
  ];
}

/* ---------------------------------------------------------------- UI state helpers */

function updateActionState() {
  let ready;
  if (state.tool === "merge") {
    ready = state.mergeFiles.length >= 2;
  } else if (state.tool === "move") {
    ready = Boolean(state.file) && pageOrderChanged();
  } else if (state.tool === "replace") {
    ready =
      Boolean(state.file) &&
      state.selectedPages.length > 0 &&
      Boolean(state.replaceFile) &&
      state.replaceSelectedPages.length > 0;
  } else if (TOOLS[state.tool]?.pageTool) {
    ready = Boolean(state.file) && state.selectedPages.length > 0;
  } else {
    ready = Boolean(state.file);
  }
  els.actionBtn.disabled = state.busy || !ready;
}

function setBusy(busy) {
  state.busy = busy;
  for (const tab of els.tabs.querySelectorAll(".tab")) {
    tab.disabled = busy;
  }
  els.fileInput.disabled = busy;
  els.mergeInput.disabled = busy;
  els.clearFile.disabled = busy;
  for (const button of [
    els.galleryAll,
    els.galleryOdd,
    els.galleryEven,
    els.galleryInvert,
    els.galleryClear,
    els.galleryMoveLeft,
    els.galleryMoveRight,
    els.galleryResetOrder,
    els.replaceGalleryAll,
    els.replaceGalleryClear,
  ]) {
    button.disabled = busy;
  }
  els.replacePick.disabled = busy;
  els.replaceClear.disabled = busy;
  els.pageGallery.classList.toggle("is-busy", busy);
  els.replaceGallery.classList.toggle("is-busy", busy);
  els.textEditorGrid.classList.toggle("is-busy", busy);
  els.addTextGrid.classList.toggle("is-busy", busy);
  els.cancelBtn.hidden = !busy;
  updateTextActions();
  updateAddTextActions();
  updateAddTextUI();
  updateTextZoomLabel();
  updateAddTextZoomLabel();
  updateActionState();
}

function switchTool(tool) {
  if (!TOOLS[tool] || state.busy) return;
  state.tool = tool;
  const config = TOOLS[tool];
  document.body.dataset.tool = tool;

  for (const tab of els.tabs.querySelectorAll(".tab")) {
    const active = tab.dataset.tool === tool;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  }

  els.filePanel.hidden = tool === "merge";
  els.mergePanel.hidden = tool !== "merge";
  els.toolOptionsPanel.hidden = tool === "merge" || tool === "text" || tool === "addtext";
  els.actionsPanel.hidden = tool === "text" || tool === "addtext";
  for (const [key, item] of Object.entries(TOOLS)) {
    const panel = item.optionsId ? document.getElementById(item.optionsId) : null;
    if (panel) panel.hidden = key !== tool;
  }

  els.actionBtn.textContent = config.action;
  els.actionHint.textContent = config.hint;
  els.dropzoneTitle.textContent = config.dropzoneTitle;
  els.dropzoneSubtitle.textContent = config.dropzoneSubtitle;
  document.title = `${config.label} — TabPDF`;

  if (config.pageTool) {
    if (state.gallerySelectionTool !== tool) {
      state.selectedPages = [];
      state.gallerySelectionTool = tool;
    }
    if (tool !== "move") resetPageOrder();
    updateGalleryForTool();
  } else {
    hideGallery();
  }
  if (tool !== "text") {
    closeTextEditor();
  }
  if (tool !== "addtext") {
    closeAddTextEditor();
  }

  hideError();
  resetResult();
  els.progressPanel.hidden = true;
  updateGallerySelectionUI();
  updateActionState();
}

/* ---------------------------------------------------------------- file selection */

function setFile(file) {
  if (state.busy || !file) return;
  if (!isPdfFile(file)) {
    showError("Please choose a PDF file.");
    return;
  }
  stopWorker();
  revokeResultUrl();
  resetGallery();
  state.file = file;
  els.fileName.textContent = file.name;
  els.fileSize.textContent = formatBytes(file.size);
  els.fileInfo.hidden = false;
  els.dropzone.hidden = true;
  hideError();
  resetResult();
  els.progressPanel.hidden = true;
  if (TOOLS[state.tool]?.pageTool) {
    state.gallerySelectionTool = state.tool;
    updateGalleryForTool();
  }
  updateActionState();
}

function clearFile() {
  if (state.busy) return;
  stopWorker();
  revokeResultUrl();
  resetGallery();
  state.file = null;
  els.fileInput.value = "";
  els.fileInfo.hidden = true;
  els.dropzone.hidden = false;
  els.progressPanel.hidden = true;
  hideError();
  resetResult();
  updateActionState();
}

/* ---------------------------------------------------------------- page gallery */

let pdfjsPromise = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("./vendor/pdfjs/pdf.min.mjs").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "./vendor/pdfjs/pdf.worker.min.mjs",
        import.meta.url
      ).href;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

function updateGallerySelectionUI() {
  const count = state.selectedPages.length;
  const singlePageTool = state.tool === "text" || state.tool === "addtext";
  els.galleryToolbar.hidden = singlePageTool;
  els.galleryCount.textContent = singlePageTool
    ? count
      ? `Page ${state.selectedPages[0]}`
      : "No page selected"
    : `${count} selected`;
  els.galleryAll.hidden = state.tool === "delete";
  const moveTool = state.tool === "move";
  els.galleryMoveLeft.hidden = !moveTool;
  els.galleryMoveRight.hidden = !moveTool;
  els.galleryResetOrder.hidden = !moveTool;

  for (const tile of els.pageGallery.querySelectorAll(".page-tile")) {
    const page = Number(tile.dataset.page);
    const index = state.selectedPages.indexOf(page);
    const selected = index >= 0;

    tile.classList.toggle("selected", selected);
    tile.setAttribute("aria-selected", selected ? "true" : "false");

    const badge = tile.querySelector(".page-select-badge");
    if (!badge) continue;
    badge.hidden = !selected;
    if (selected) {
      if (state.tool === "extract") badge.textContent = String(index + 1);
      else if (state.tool === "delete") badge.textContent = "×";
      else if (state.tool === "replace") badge.textContent = "↻";
      else if (state.tool === "text") badge.textContent = "✎";
      else if (state.tool === "addtext") badge.textContent = "T";
      else badge.textContent = "✓";
    }
  }
  updateActionState();
}

function clearGallerySelection() {
  state.selectedPages = [];
  updateGallerySelectionUI();
}

function setGallerySelection(pages) {
  const max = state.pdfDoc?.numPages || 0;
  const seen = new Set();
  const selected = [];
  for (const raw of pages) {
    const page = Number(raw);
    if (!Number.isInteger(page) || page < 1) continue;
    if (max && page > max) continue;
    if (seen.has(page)) continue;
    seen.add(page);
    selected.push(page);
  }
  state.selectedPages = selected;
  updateGallerySelectionUI();
}

function toggleGalleryPage(page) {
  if (state.tool === "text") {
    state.selectedPages = [page];
    updateGallerySelectionUI();
    openTextEditor(page);
    return;
  }
  if (state.tool === "addtext") {
    state.selectedPages = [page];
    updateGallerySelectionUI();
    openAddTextEditor(page);
    return;
  }

  const index = state.selectedPages.indexOf(page);
  if (index >= 0) state.selectedPages.splice(index, 1);
  else state.selectedPages.push(page);
  updateGallerySelectionUI();
}

function hideGallery() {
  els.galleryPanel.hidden = true;
  els.replaceGalleryPanel.hidden = true;
  if (state.galleryObserver) {
    state.galleryObserver.disconnect();
    state.galleryObserver = null;
  }
}

function destroyPdfDocument() {
  const task = state.pdfLoadingTask;
  state.pdfLoadingTask = null;
  state.pdfDoc = null;
  if (task && typeof task.destroy === "function") {
    try {
      Promise.resolve(task.destroy()).catch(() => {});
    } catch {
      // Ignore cleanup errors.
    }
  }
}

function resetGallery() {
  state.pdfLoadToken += 1;
  state.textToken += 1;
  closeTextEditor();
  state.textPage = null;
  state.textViewport = null;
  state.textItems = [];
  state.textActive = null;
  state.textEdits = {};
  state.addTextToken += 1;
  closeAddTextEditor();
  state.addTextPage = null;
  state.addTextViewport = null;
  state.addTextItems = {};
  state.addTextSelected = null;
  state.addTextPending = null;
  state.addTextDrag = null;
  hideGallery();
  destroyPdfDocument();
  state.galleryFile = null;
  state.renderedPages.clear();
  state.selectedPages = [];
  state.gallerySelectionTool = null;
  state.pageOrder = [];
  state.moveDrag = null;
  els.pageGallery.replaceChildren();
  els.galleryStatus.hidden = true;
  updateGallerySelectionUI();
}

function buildPageTiles(pageCount) {
  const fragment = document.createDocumentFragment();
  for (let page = 1; page <= pageCount; page += 1) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "page-tile";
    tile.dataset.page = String(page);
    tile.setAttribute("role", "option");
    tile.setAttribute("aria-selected", "false");
    tile.title = `Page ${page}`;

    const thumb = document.createElement("div");
    thumb.className = "page-thumb";
    const placeholder = document.createElement("span");
    placeholder.className = "page-placeholder";
    placeholder.textContent = String(page);
    thumb.append(placeholder);

    const pageBadge = document.createElement("span");
    pageBadge.className = "page-badge";
    pageBadge.textContent = String(page);

    const selectBadge = document.createElement("span");
    selectBadge.className = "page-select-badge";
    selectBadge.hidden = true;

    tile.append(thumb, pageBadge, selectBadge);
    fragment.append(tile);
  }
  return fragment;
}

function buildGalleryTiles(pageCount) {
  els.pageGallery.replaceChildren(buildPageTiles(pageCount));
  const moveMode = state.tool === "move";
  els.pageGallery.classList.toggle("is-move-mode", moveMode);
  for (const tile of els.pageGallery.querySelectorAll(".page-tile")) {
    tile.draggable = moveMode;
  }
}

function markTileError(tile) {
  tile.classList.add("gallery-error-tile");
  const placeholder = tile.querySelector(".page-placeholder");
  if (placeholder) placeholder.textContent = "!";
}

async function paintTileThumbnail(tile, doc, pageNumber) {
  const page = await doc.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const targetWidth = 150;
  const scale = targetWidth / baseViewport.width;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const viewport = page.getViewport({ scale: scale * dpr });

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(viewport.width));
  canvas.height = Math.max(1, Math.ceil(viewport.height));
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: context, viewport }).promise;

  tile.querySelector(".page-placeholder")?.remove();
  tile.querySelector(".page-thumb")?.append(canvas);
}

async function renderGalleryThumbnail(tile) {
  if (tile.dataset.rendered) return;
  tile.dataset.rendered = "1";

  const token = state.pdfLoadToken;
  try {
    if (token !== state.pdfLoadToken || !state.pdfDoc) return;
    await paintTileThumbnail(tile, state.pdfDoc, Number(tile.dataset.page));
    if (token !== state.pdfLoadToken) return;
  } catch {
    markTileError(tile);
  }
}

function observeGalleryTiles() {
  if (!state.pdfDoc) return;
  if (state.galleryObserver) state.galleryObserver.disconnect();

  state.galleryObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        state.galleryObserver.unobserve(entry.target);
        renderGalleryThumbnail(entry.target);
      }
    },
    { root: els.pageGallery, rootMargin: "260px 0px" }
  );

  const unrendered = els.pageGallery.querySelectorAll(".page-tile:not([data-rendered])");
  for (const tile of unrendered) state.galleryObserver.observe(tile);
  if (!unrendered.length) state.galleryObserver.disconnect();
}

async function loadPageGallery(file) {
  const token = ++state.pdfLoadToken;
  hideGallery();
  destroyPdfDocument();
  state.renderedPages.clear();
  state.galleryFile = file;
  state.selectedPages = [];
  els.pageGallery.replaceChildren();
  els.galleryPanel.hidden = false;
  els.galleryStatus.hidden = false;
  els.galleryStatus.textContent = "Preparing page gallery…";
  updateGallerySelectionUI();

  try {
    const pdfjs = await getPdfjs();
    const data = await file.arrayBuffer();
    if (token !== state.pdfLoadToken || state.file !== file) return;

    const loadingTask = pdfjs.getDocument({
      data,
      wasmUrl: new URL("./vendor/pdfjs/wasm/", import.meta.url).href,
      standardFontDataUrl: new URL("./vendor/pdfjs/standard_fonts/", import.meta.url).href,
      cMapUrl: new URL("./vendor/pdfjs/cmaps/", import.meta.url).href,
      iccUrl: new URL("./vendor/pdfjs/iccs/", import.meta.url).href,
    });
    state.pdfLoadingTask = loadingTask;
    const document = await loadingTask.promise;

    if (token !== state.pdfLoadToken || state.file !== file) {
      if (state.pdfLoadingTask === loadingTask) state.pdfLoadingTask = null;
      try {
        Promise.resolve(loadingTask.destroy()).catch(() => {});
      } catch {
        // Ignore cleanup errors.
      }
      return;
    }

    state.pdfDoc = document;
    buildGalleryTiles(document.numPages);
    state.pageOrder = Array.from({ length: document.numPages }, (_, index) => index + 1);
    els.galleryStatus.textContent =
      `${document.numPages} page${document.numPages === 1 ? "" : "s"} · click pages to select`;
    observeGalleryTiles();
    updateGallerySelectionUI();
  } catch (error) {
    if (token !== state.pdfLoadToken) return;
    els.galleryStatus.textContent = `Could not render page previews: ${error?.message || error}`;
  }
}

async function updateGalleryForTool() {
  const config = TOOLS[state.tool];
  if (!config?.pageTool || !state.file) {
    hideGallery();
    return;
  }

  els.galleryPanel.dataset.tool = state.tool;
  els.replaceGalleryPanel.hidden = state.tool !== "replace" || !state.replaceDoc;
  if (state.tool === "text") {
    els.galleryTitle.textContent = "Select a page to edit text";
    els.galleryHint.textContent =
      "Click a page thumbnail to open the text editor for that page.";
  } else if (state.tool === "addtext") {
    els.galleryTitle.textContent = "Select a page to add text";
    els.galleryHint.textContent =
      "Click a page thumbnail to open it, then click the page to place text.";
  } else if (state.tool === "delete") {
    els.galleryTitle.textContent = "Select pages to delete";
    els.galleryHint.textContent =
      "Click a page to mark it for deletion. Click it again to unselect.";
  } else if (state.tool === "extract") {
    els.galleryTitle.textContent = "Select pages to extract";
    els.galleryHint.textContent =
      "Click pages in the order you want the new PDF. The badge shows the output order.";
  } else if (state.tool === "move") {
    els.galleryTitle.textContent = "Reorder pages";
    els.galleryHint.textContent =
      "Drag a page to a new position, or click several pages first to drag them as a group. The arrows nudge the selection.";
  } else if (state.tool === "replace") {
    els.galleryTitle.textContent = "Select pages to replace";
    els.galleryHint.textContent =
      "Click each page that should be swapped out, then choose the replacement PDF above.";
  } else {
    els.galleryTitle.textContent = "Select pages to rotate";
    els.galleryHint.textContent =
      "Click pages to select them, then choose a rotation above.";
  }
  els.galleryPanel.hidden = false;

  const moveMode = state.tool === "move";
  els.pageGallery.classList.toggle("is-move-mode", moveMode);
  for (const tile of els.pageGallery.querySelectorAll(".page-tile")) {
    tile.draggable = moveMode;
  }
  updateMovedBadges();

  if (state.galleryFile === state.file && state.pdfDoc) {
    observeGalleryTiles();
    updateGallerySelectionUI();
    return;
  }

  await loadPageGallery(state.file);
}

/* ---------------------------------------------------------------- move pages */

function pageOrderChanged() {
  return state.pageOrder.some((page, index) => page !== index + 1);
}

function updateMovedBadges() {
  els.pageGallery.querySelectorAll(".page-tile").forEach((tile, position) => {
    const original = Number(tile.dataset.page);
    const moved = position + 1 !== original;
    tile.classList.toggle("is-moved", moved);
    tile.title = moved ? `Page ${original} → position ${position + 1}` : `Page ${original}`;
  });
}

function renderGalleryOrder() {
  const tiles = new Map();
  for (const tile of els.pageGallery.querySelectorAll(".page-tile")) {
    tiles.set(Number(tile.dataset.page), tile);
  }
  for (const page of state.pageOrder) {
    const tile = tiles.get(page);
    if (tile) els.pageGallery.append(tile);
  }
  updateMovedBadges();
  updateActionState();
}

function resetPageOrder() {
  state.moveDrag = null;
  clearDragStyles();
  if (!state.pdfDoc) {
    state.pageOrder = [];
    return;
  }
  state.pageOrder = Array.from({ length: state.pdfDoc.numPages }, (_, index) => index + 1);
  renderGalleryOrder();
}

function clearDropIndicators() {
  for (const tile of els.pageGallery.querySelectorAll(".page-tile")) {
    tile.classList.remove("drop-before", "drop-after");
  }
}

function clearDragStyles() {
  for (const tile of els.pageGallery.querySelectorAll(".page-tile")) {
    tile.classList.remove("drop-before", "drop-after", "is-dragging");
  }
}

function applyPageMove(move) {
  if (!move || move.invalid || move.ref === undefined || !move.pages?.length) return;
  const order = state.pageOrder;
  if (!order.length) return;

  const moving = new Set(move.pages);
  const remaining = order.filter((page) => !moving.has(page));
  const movedPages = order.filter((page) => moving.has(page));

  let index = remaining.length;
  if (move.ref != null) {
    const refIndex = order.indexOf(move.ref);
    if (refIndex >= 0) {
      index = 0;
      for (let i = 0; i < refIndex; i += 1) {
        if (!moving.has(order[i])) index += 1;
      }
      if (move.after && !moving.has(move.ref)) index += 1;
    }
  }

  state.pageOrder = [
    ...remaining.slice(0, index),
    ...movedPages,
    ...remaining.slice(index),
  ];
  renderGalleryOrder();
}

function nudgeSelection(delta) {
  if (state.busy || state.tool !== "move" || !state.selectedPages.length) return;
  const order = state.pageOrder;
  const positions = state.selectedPages
    .map((page) => order.indexOf(page))
    .filter((position) => position >= 0);
  if (!positions.length) return;

  const first = Math.min(...positions);
  const moving = new Set(state.selectedPages);
  const remaining = order.filter((page) => !moving.has(page));
  const index = Math.max(0, Math.min(remaining.length, first + (delta < 0 ? -1 : 1)));
  const movedPages = order.filter((page) => moving.has(page));

  state.pageOrder = [
    ...remaining.slice(0, index),
    ...movedPages,
    ...remaining.slice(index),
  ];
  renderGalleryOrder();
}

function handleGalleryDragStart(event) {
  if (state.tool !== "move" || state.busy) return;
  const tile = event.target.closest(".page-tile");
  if (!tile || !state.pageOrder.length) return;

  const page = Number(tile.dataset.page);
  const dragging = state.selectedPages.includes(page)
    ? state.pageOrder.filter((candidate) => state.selectedPages.includes(candidate))
    : [page];

  state.moveDrag = { pages: dragging, ref: undefined, after: false, invalid: false };
  for (const candidate of dragging) {
    els.pageGallery
      .querySelector(`.page-tile[data-page="${candidate}"]`)
      ?.classList.add("is-dragging");
  }

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    try {
      event.dataTransfer.setData("text/plain", dragging.join(","));
    } catch {
      // Some browsers restrict setData during synthetic drag events.
    }
  }
}

function handleGalleryDragOver(event) {
  if (state.tool !== "move" || !state.moveDrag) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";

  clearDropIndicators();
  const tile = event.target.closest(".page-tile");
  if (!tile) {
    state.moveDrag.ref = null;
    state.moveDrag.invalid = false;
    return;
  }

  const targetPage = Number(tile.dataset.page);
  if (state.moveDrag.pages.includes(targetPage)) {
    state.moveDrag.ref = undefined;
    state.moveDrag.invalid = true;
    return;
  }

  const rect = tile.getBoundingClientRect();
  const after = event.clientX > rect.left + rect.width / 2;
  tile.classList.add(after ? "drop-after" : "drop-before");
  state.moveDrag.ref = targetPage;
  state.moveDrag.after = after;
  state.moveDrag.invalid = false;
}

function handleGalleryDrop(event) {
  if (state.tool !== "move" || !state.moveDrag) return;
  event.preventDefault();
  const move = state.moveDrag;
  state.moveDrag = null;
  clearDragStyles();
  applyPageMove(move);
}

function handleGalleryDragEnd() {
  state.moveDrag = null;
  clearDragStyles();
}

/* ---------------------------------------------------------------- replace pages */

function destroyReplaceDocument() {
  const task = state.replaceLoadingTask;
  state.replaceLoadingTask = null;
  state.replaceDoc = null;
  if (task && typeof task.destroy === "function") {
    try {
      Promise.resolve(task.destroy()).catch(() => {});
    } catch {
      // Ignore cleanup errors.
    }
  }
}

function resetReplaceGallery() {
  state.replaceLoadToken += 1;
  if (state.replaceObserver) {
    state.replaceObserver.disconnect();
    state.replaceObserver = null;
  }
  destroyReplaceDocument();
  state.replaceFile = null;
  state.replaceSelectedPages = [];
  els.replaceGallery.replaceChildren();
  els.replaceGalleryStatus.hidden = true;
  els.replaceGalleryPanel.hidden = true;
  els.replaceFileName.hidden = true;
  els.replaceFileName.textContent = "";
  els.replaceClear.hidden = true;
  updateReplaceSelectionUI();
}

function setReplaceSelection(pages) {
  const max = state.replaceDoc?.numPages || 0;
  const seen = new Set();
  const selected = [];
  for (const raw of pages) {
    const page = Number(raw);
    if (!Number.isInteger(page) || page < 1) continue;
    if (max && page > max) continue;
    if (seen.has(page)) continue;
    seen.add(page);
    selected.push(page);
  }
  state.replaceSelectedPages = selected;
  updateReplaceSelectionUI();
}

function toggleReplacePage(page) {
  const index = state.replaceSelectedPages.indexOf(page);
  if (index >= 0) state.replaceSelectedPages.splice(index, 1);
  else state.replaceSelectedPages.push(page);
  updateReplaceSelectionUI();
}

function updateReplaceSelectionUI() {
  els.replaceGalleryCount.textContent = `${state.replaceSelectedPages.length} selected`;
  for (const tile of els.replaceGallery.querySelectorAll(".page-tile")) {
    const page = Number(tile.dataset.page);
    const index = state.replaceSelectedPages.indexOf(page);
    const selected = index >= 0;

    tile.classList.toggle("selected", selected);
    tile.setAttribute("aria-selected", selected ? "true" : "false");

    const badge = tile.querySelector(".page-select-badge");
    if (!badge) continue;
    badge.hidden = !selected;
    if (selected) badge.textContent = String(index + 1);
  }
  updateActionState();
}

async function renderReplaceThumbnail(tile) {
  if (tile.dataset.rendered) return;
  tile.dataset.rendered = "1";

  const token = state.replaceLoadToken;
  try {
    if (token !== state.replaceLoadToken || !state.replaceDoc) return;
    await paintTileThumbnail(tile, state.replaceDoc, Number(tile.dataset.page));
    if (token !== state.replaceLoadToken) return;
  } catch {
    markTileError(tile);
  }
}

function observeReplaceTiles() {
  if (!state.replaceDoc) return;
  if (state.replaceObserver) state.replaceObserver.disconnect();

  state.replaceObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        state.replaceObserver.unobserve(entry.target);
        renderReplaceThumbnail(entry.target);
      }
    },
    { root: els.replaceGallery, rootMargin: "260px 0px" }
  );

  const unrendered = els.replaceGallery.querySelectorAll(".page-tile:not([data-rendered])");
  for (const tile of unrendered) state.replaceObserver.observe(tile);
  if (!unrendered.length) state.replaceObserver.disconnect();
}

async function loadReplaceGallery(file) {
  const token = ++state.replaceLoadToken;
  if (state.replaceObserver) {
    state.replaceObserver.disconnect();
    state.replaceObserver = null;
  }
  destroyReplaceDocument();
  state.replaceFile = file;
  state.replaceSelectedPages = [];
  els.replaceGallery.replaceChildren();
  els.replaceGalleryPanel.hidden = false;
  els.replaceFileName.hidden = false;
  els.replaceFileName.textContent = `${file.name} · ${formatBytes(file.size)}`;
  els.replaceClear.hidden = false;
  els.replaceGalleryStatus.hidden = false;
  els.replaceGalleryStatus.textContent = "Preparing replacement pages…";
  updateReplaceSelectionUI();

  try {
    const pdfjs = await getPdfjs();
    const data = await file.arrayBuffer();
    if (token !== state.replaceLoadToken || state.replaceFile !== file) return;

    const loadingTask = pdfjs.getDocument({
      data,
      wasmUrl: new URL("./vendor/pdfjs/wasm/", import.meta.url).href,
      standardFontDataUrl: new URL("./vendor/pdfjs/standard_fonts/", import.meta.url).href,
      cMapUrl: new URL("./vendor/pdfjs/cmaps/", import.meta.url).href,
      iccUrl: new URL("./vendor/pdfjs/iccs/", import.meta.url).href,
    });
    state.replaceLoadingTask = loadingTask;
    const document = await loadingTask.promise;

    if (token !== state.replaceLoadToken || state.replaceFile !== file) {
      if (state.replaceLoadingTask === loadingTask) state.replaceLoadingTask = null;
      try {
        Promise.resolve(loadingTask.destroy()).catch(() => {});
      } catch {
        // Ignore cleanup errors.
      }
      return;
    }

    state.replaceDoc = document;
    els.replaceGallery.replaceChildren(buildPageTiles(document.numPages));
    state.replaceSelectedPages = Array.from(
      { length: document.numPages },
      (_, index) => index + 1
    );
    els.replaceGalleryStatus.textContent =
      `${document.numPages} page${document.numPages === 1 ? "" : "s"} available · all selected by default`;
    observeReplaceTiles();
    updateReplaceSelectionUI();
  } catch (error) {
    if (token !== state.replaceLoadToken) return;
    els.replaceGalleryStatus.textContent =
      `Could not render replacement pages: ${error?.message || error}`;
  }
}

function setReplaceFile(file) {
  if (state.busy || !file) return;
  if (!isPdfFile(file)) {
    showError("Please choose a PDF file as the replacement.");
    return;
  }
  hideError();
  loadReplaceGallery(file);
}

/* ---------------------------------------------------------------- text editor */

function textEditTotal() {
  return Object.values(state.textEdits).reduce((sum, edits) => sum + edits.length, 0);
}

function collectTextEdits() {
  const edits = [];
  for (const [page, pageEdits] of Object.entries(state.textEdits)) {
    for (const edit of pageEdits) edits.push({ ...edit, page: Number(page) });
  }
  return edits;
}

function updateTextActions() {
  const active = state.textActive;
  const hasText = els.textValue.value.trim().length > 0;
  const canPlace =
    Boolean(active) && (active.mode === "replace" || hasText) && !state.busy;

  els.textPlaceBtn.disabled = !canPlace;
  els.textPlaceBtn.textContent = active?.mode === "replace" ? "Replace text" : "Place text";
  els.textClearActive.hidden = !active || state.busy;
  els.textApplyBtn.disabled = state.busy || textEditTotal() === 0;
}

function updateTextZoomLabel() {
  els.textZoomLabel.textContent = `${Math.round(state.textZoom * 100)}%`;
  els.textZoomOut.disabled = state.busy || state.textZoom <= ZOOM_STEPS[0];
  els.textZoomIn.disabled =
    state.busy || state.textZoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1];
}

function setTextZoom(zoom) {
  state.textZoom = zoom;
  updateTextZoomLabel();
  if (state.textPage) {
    renderTextPage(state.textPage).catch((error) => {
      showError(`Could not redraw the page: ${error?.message || error}`);
    });
  }
}

function closeTextEditor() {
  els.textEditorPanel.hidden = true;
  state.textActive = null;
  state.textZoom = 1;
  state.textToken += 1;
  cancelPdfRender("textRenderTask");
  els.textFontHelp.textContent =
    "Tip: click an existing text block below to detect its font family and auto-select the closest match.";
  els.textCursor.hidden = true;
  els.textValue.value = "";
  els.textExistingList.replaceChildren();
  els.textEditsList.replaceChildren();
  updateTextZoomLabel();
  updateTextActions();
}

function fontFamilyInfo(item) {
  const style = state.textStyles?.[item.fontName] || {};
  const raw = String(style.fontFamily || item.fontName || "").toLowerCase();

  if (/(mono|courier|consol|menlo|code)/.test(raw)) {
    return { label: "Monospace", editorFont: "Courier" };
  }
  if (/(serif|times|georgia|garamond|book|roman|minion)/.test(raw)) {
    return { label: "Serif", editorFont: "Times" };
  }
  return { label: "Sans", editorFont: "Helvetica" };
}

function renderTextExistingList() {
  els.textExistingList.replaceChildren();
  if (!state.textItems.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No selectable text was found on this page.";
    els.textExistingList.append(empty);
    return;
  }

  state.textItems.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "text-existing-item";
    button.dataset.index = String(index);
    button.title = item.str;

    const text = document.createElement("span");
    text.className = "preview-text";
    text.textContent = item.str;

    const tag = document.createElement("span");
    tag.className = "font-tag";
    tag.textContent = fontFamilyInfo(item).label;

    button.append(text, tag);
    els.textExistingList.append(button);
  });
}

function renderTextEdits() {
  els.textEditsList.replaceChildren();
  const page = state.textPage;
  const edits = page ? state.textEdits[page] || [] : [];

  if (!edits.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = page
      ? "No pending edits for this page yet."
      : "Select a page to see its edits.";
    els.textEditsList.append(empty);
    updateTextActions();
    return;
  }

  edits.forEach((edit, index) => {
    const row = document.createElement("div");
    row.className = "text-edit-item";

    const text = document.createElement("span");
    text.className = "edit-text";
    const label = edit.text?.trim() ? edit.text : "(erase original text)";
    text.textContent = `${label}`;
    text.title = label;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "mini-btn";
    remove.dataset.index = String(index);
    remove.title = "Remove edit";
    remove.setAttribute("aria-label", "Remove edit");
    remove.textContent = "×";

    row.append(text, remove);
    els.textEditsList.append(row);
  });

  updateTextActions();
}

function activateExistingText(index) {
  const item = state.textItems[index];
  if (!item) return;

  const transform = item.transform || [0, 0, 0, 12, 0, 0];
  const fontSize = Math.hypot(transform[2], transform[3]) || 12;
  const width = Math.max(Number(item.width) || 0, 4);
  const height = Math.max(fontSize * 1.45, 6);

  state.textActive = {
    mode: "replace",
    page: state.textPage,
    x: transform[4],
    y: transform[5],
    coverBox: {
      x: transform[4] - 2,
      y: transform[5] - fontSize * 0.30,
      width: width + 4,
      height,
    },
  };

  const fontInfo = fontFamilyInfo(item);
  els.textFont.value = fontInfo.editorFont;
  els.textFontHelp.textContent =
    `Detected font family: ${fontInfo.label}. Closest built-in match is selected — adjust bold/italic as needed.`;
  els.textValue.value = item.str;
  els.textSize.value = String(Math.max(4, Math.round(fontSize)));
  els.textCover.checked = true;
  els.textCursor.hidden = true;
  for (const row of els.textExistingList.querySelectorAll(".text-existing-item")) {
    row.classList.toggle(
      "active",
      row.dataset.index === String(index)
    );
  }
  updateTextActions();
}

async function cancelPdfRender(taskKey) {
  const task = state[taskKey];
  if (!task) return;
  state[taskKey] = null;
  try {
    task.cancel();
  } catch {
    // The task may already have finished.
  }
  try {
    await task.promise;
  } catch {
    // Cancellation rejects the render promise; that is expected.
  }
}

/* Serialise renders per canvas: PDF.js refuses two renders on one canvas.
   Newest render wins; the previous one is cancelled and awaited first. */
async function acquireRenderLock(lockKey, taskKey) {
  const previous = state[lockKey] || Promise.resolve();
  let release;
  state[lockKey] = new Promise((resolve) => {
    release = resolve;
  });
  await cancelPdfRender(taskKey);
  await previous.catch(() => {});
  return release;
}

async function renderTextPage(pageNumber) {
  const token = ++state.textToken;
  els.textCursor.hidden = true;
  // Drop the old mapping immediately: the canvas is resized for the new zoom
  // before the new viewport is known, and clicks must not use stale scale.
  state.textViewport = null;
  const release = await acquireRenderLock("textRenderLock", "textRenderTask");
  try {
    if (token !== state.textToken) return;

    const page = await state.pdfDoc.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const parentWidth = els.textPreview.parentElement?.clientWidth || 640;
    const targetWidth = Math.max(250, Math.min(680, parentWidth - 4 || 640));
    const fitScale = targetWidth / baseViewport.width;
    const cssScale = fitScale * state.textZoom;
    const viewport = page.getViewport({ scale: cssScale });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const deviceViewport = page.getViewport({ scale: cssScale * dpr });

    if (token !== state.textToken) return;

    const canvas = els.textPreviewCanvas;
    canvas.width = Math.max(1, Math.ceil(deviceViewport.width));
    canvas.height = Math.max(1, Math.ceil(deviceViewport.height));
    canvas.style.width = `${Math.ceil(viewport.width)}px`;
    canvas.style.height = "auto";

    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({ canvasContext: context, viewport: deviceViewport });
    state.textRenderTask = renderTask;
    try {
      await renderTask.promise;
    } catch (error) {
      if (error?.name === "RenderingCancelledException") return;
      throw error;
    } finally {
      if (state.textRenderTask === renderTask) state.textRenderTask = null;
    }
    if (token !== state.textToken) return;

    state.textViewport = viewport;
    const textContent = await page.getTextContent();
    if (token !== state.textToken) return;

    state.textStyles = textContent.styles || {};
    state.textItems = textContent.items.filter(
      (item) => item.str && item.str.trim().length
    );
    renderTextExistingList();
    updateTextZoomLabel();
  } finally {
    release();
  }
}

async function openTextEditor(pageNumber) {
  if (!state.pdfDoc) return;
  state.textPage = pageNumber;
  state.textViewport = null;
  state.textActive = null;
  state.textItems = [];
  state.textStyles = {};
  els.textEditorPanel.hidden = false;
  els.textEditorTitle.textContent = "Edit text";
  els.textEditorPage.textContent = `Page ${pageNumber}`;
  els.textValue.value = "";
  els.textCursor.hidden = true;
  renderTextEdits();
  updateTextActions();
  els.textEditorPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });

  try {
    await renderTextPage(pageNumber);
  } catch (error) {
    showError(`Could not open the text editor: ${error?.message || error}`);
  }
}

function placeText() {
  const active = state.textActive;
  if (!active) return;

  const text = els.textValue.value;
  if (active.mode === "add" && !text.trim()) return;

  const edit = {
    page: active.page,
    x: active.x,
    y: active.y,
    text,
    font: els.textFont.value,
    size: Number(els.textSize.value) || 14,
    color: els.textColor.value,
    bold: els.textBold.checked,
    italic: els.textItalic.checked,
    cover: active.mode === "replace" ? true : els.textCover.checked,
  };
  if (active.mode === "replace") edit.coverBox = active.coverBox;

  const page = active.page;
  if (!state.textEdits[page]) state.textEdits[page] = [];
  state.textEdits[page].push(edit);

  state.textActive = null;
  els.textCursor.hidden = true;
  els.textValue.value = "";
  for (const row of els.textExistingList.querySelectorAll(".text-existing-item")) {
    row.classList.remove("active");
  }
  renderTextEdits();
  updateTextActions();
}

function removeTextEdit(index) {
  const page = state.textPage;
  if (!page || !state.textEdits[page]) return;
  state.textEdits[page].splice(index, 1);
  if (!state.textEdits[page].length) delete state.textEdits[page];
  renderTextEdits();
}

function clearPageTextEdits() {
  if (state.textPage && state.textEdits[state.textPage]) {
    delete state.textEdits[state.textPage];
  }
  renderTextEdits();
}

async function applyTextEdits() {
  const edits = collectTextEdits();
  if (!edits.length) return;
  if (!state.file) return;

  setBusy(true);
  const jobToken = beginJob();
  hideError();
  resetResult();
  revokeResultUrl();
  state.originalSize = state.file.size;
  showProgress(`Reading ${formatBytes(state.file.size)}…`);

  try {
    const buffer = await state.file.arrayBuffer();
    if (!isCurrentJob(jobToken)) return;
    const worker = createWorker(new URL("./pdfedit-worker.js", import.meta.url), jobToken);
    worker.postMessage({ op: "text", buffer, edits }, [buffer]);
  } catch (error) {
    if (!isCurrentJob(jobToken)) return;
    failJob(error?.message || String(error));
  }
}

/* ---------------------------------------------------------------- add text editor */

const ADD_TEXT_FONT_STACKS = {
  Helvetica: 'Helvetica, Arial, "Liberation Sans", sans-serif',
  Times: '"Times New Roman", Times, "Liberation Serif", serif',
  Courier: '"Courier New", Courier, "Liberation Mono", monospace',
};

const addTextMeasureCanvas = document.createElement("canvas");
const addTextMeasureContext = addTextMeasureCanvas.getContext("2d");

function addTextFontCss(item, fontSize) {
  const family = ADD_TEXT_FONT_STACKS[item.font] || ADD_TEXT_FONT_STACKS.Helvetica;
  const style = item.italic ? "italic " : "";
  const weight = item.bold ? "bold " : "";
  return `${style}${weight}${fontSize}px ${family}`;
}

function addTextPageItems(page = state.addTextPage) {
  return (page && state.addTextItems[page]) || [];
}

function addTextSelectedItem() {
  const selected = state.addTextSelected;
  if (!selected) return null;
  return state.addTextItems[selected.page]?.[selected.index] || null;
}

function collectAddTextItems() {
  const edits = [];
  for (const [rawPage, items] of Object.entries(state.addTextItems)) {
    for (const item of items) {
      const text = String(item.text ?? "");
      if (!text.trim()) continue;
      edits.push({
        page: Number(rawPage),
        x: item.x,
        y: item.y,
        text,
        font: item.font,
        size: item.size,
        color: item.color,
        bold: Boolean(item.bold),
        italic: Boolean(item.italic),
      });
    }
  }
  return edits;
}

function addTextDefaults() {
  const rawSize = Number(els.addTextSize.value);
  return {
    font: els.addTextFont.value,
    size: Math.max(4, Math.min(240, Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 16)),
    color: els.addTextColor.value || "#111111",
    bold: els.addTextBold.checked,
    italic: els.addTextItalic.checked,
  };
}

function addTextMetrics(item) {
  const viewport = state.addTextViewport;
  const [screenX, screenY] = viewport.convertToViewportPoint(item.x, item.y);
  const [unitX, unitY] = viewport.convertToViewportPoint(item.x + 1, item.y);
  const angle = Math.atan2(unitY - screenY, unitX - screenX);
  const scale = Math.hypot(unitX - screenX, unitY - screenY) || viewport.scale || 1;
  return { screenX, screenY, angle, scale };
}

function addTextItemBox(item) {
  const metrics = addTextMetrics(item);
  const fontSize = Math.max(item.size * metrics.scale, 1);
  const lines = String(item.text ?? "").split(/\r?\n/);
  addTextMeasureContext.font = addTextFontCss(item, fontSize);
  const widths = lines.length
    ? lines.map((line) => addTextMeasureContext.measureText(line).width)
    : [0];
  const width = Math.max(...widths, fontSize * 0.35);
  const height = Math.max(lines.length, 1) * fontSize * 1.2;
  return { ...metrics, fontSize, width, height };
}

function addTextScreenPointToPdf(clientX, clientY) {
  const viewport = state.addTextViewport;
  const rect = els.addTextOverlay.getBoundingClientRect();
  if (!viewport || rect.width <= 0) return null;
  const displayScale = rect.width / viewport.width;
  const viewX = (clientX - rect.left) / displayScale;
  const viewY = (clientY - rect.top) / displayScale;
  return viewport.convertToPdfPoint(viewX, viewY);
}

function addTextHitTest(clientX, clientY) {
  const viewport = state.addTextViewport;
  const rect = els.addTextOverlay.getBoundingClientRect();
  if (!viewport || rect.width <= 0) return -1;
  const displayScale = rect.width / viewport.width;
  const viewX = (clientX - rect.left) / displayScale;
  const viewY = (clientY - rect.top) / displayScale;

  const items = addTextPageItems();
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const box = addTextItemBox(items[index]);
    const deltaX = viewX - box.screenX;
    const deltaY = viewY - box.screenY;
    const cos = Math.cos(-box.angle);
    const sin = Math.sin(-box.angle);
    const localX = deltaX * cos - deltaY * sin;
    const localY = deltaX * sin + deltaY * cos;
    const padding = 4;
    if (
      localX >= -padding &&
      localX <= box.width + padding &&
      localY <= box.fontSize * 0.35 &&
      localY >= -box.height - padding
    ) {
      return index;
    }
  }
  return -1;
}

function paintAddTextItem(context, item) {
  const text = String(item.text ?? "");
  if (!text.trim()) return;
  const metrics = addTextMetrics(item);
  const fontSize = Math.max(item.size * metrics.scale, 1);
  context.save();
  context.translate(metrics.screenX, metrics.screenY);
  context.rotate(metrics.angle);
  context.font = addTextFontCss(item, fontSize);
  context.fillStyle = item.color;
  context.textBaseline = "alphabetic";
  text.split(/\r?\n/).forEach((line, lineIndex) => {
    if (line) context.fillText(line, 0, lineIndex * fontSize * 1.2);
  });
  context.restore();
}

function paintAddTextSelection(context, item) {
  const box = addTextItemBox(item);
  context.save();
  context.translate(box.screenX, box.screenY);
  context.rotate(box.angle);
  context.strokeStyle = "#2f7dff";
  context.lineWidth = 1.5;
  context.setLineDash([5, 4]);
  context.strokeRect(
    -3,
    -box.fontSize * 0.95,
    box.width + 6,
    box.height + box.fontSize * 0.35
  );
  context.setLineDash([]);
  context.restore();
}

function paintAddTextCaret(context, pending) {
  const viewport = state.addTextViewport;
  if (!viewport) return;
  const [screenX, screenY] = viewport.convertToViewportPoint(pending.x, pending.y);
  const height = Math.max(pending.size * (viewport.scale || 1), 8);
  context.save();
  context.strokeStyle = "#2f7dff";
  context.lineWidth = 1.5;
  context.setLineDash([4, 3]);
  context.beginPath();
  context.moveTo(screenX, screenY);
  context.lineTo(screenX, screenY - height);
  context.stroke();
  context.setLineDash([]);
  context.restore();
}

function drawAddTextPreview() {
  const canvas = els.addTextOverlay;
  const context = canvas.getContext("2d");
  if (!context) return;

  const viewport = state.addTextViewport;
  if (!viewport || !state.addTextPage) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    canvas.width = 1;
    canvas.height = 1;
    return;
  }

  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  const displayScale = rect.width / viewport.width;
  const factor = dpr * displayScale;
  context.setTransform(factor, 0, 0, factor, 0, 0);
  context.clearRect(0, 0, viewport.width, viewport.height);

  addTextPageItems().forEach((item, index) => {
    const selected =
      state.addTextSelected?.page === state.addTextPage &&
      state.addTextSelected?.index === index;
    if (selected) paintAddTextSelection(context, item);
    paintAddTextItem(context, item);
  });

  if (state.addTextPending && state.addTextPending.page === state.addTextPage) {
    paintAddTextCaret(context, state.addTextPending);
  }
}

function updateAddTextActions() {
  const item = addTextSelectedItem();
  const canEdit = !state.busy && Boolean(item || state.addTextPending);
  els.addTextValue.disabled = !canEdit;
  els.addTextDelete.disabled = !item || state.busy;
  els.addTextClearPage.disabled = state.busy || addTextPageItems().length === 0;

  const total = collectAddTextItems().length;
  els.addTextApply.disabled = state.busy || total === 0;
  els.addTextApply.textContent = total ? `Apply text (${total})` : "Apply text";
}

function updateAddTextUI() {
  const total = state.pdfDoc?.numPages || 0;
  const page = state.addTextPage || 1;
  els.addTextPage.textContent = total ? `Page ${page} of ${total}` : `Page ${page}`;
  els.addTextPrev.disabled = state.busy || page <= 1;
  els.addTextNext.disabled = state.busy || !total || page >= total;
}

function updateAddTextZoomLabel() {
  els.addTextZoomLabel.textContent = `${Math.round(state.addTextZoom * 100)}%`;
  els.addTextZoomOut.disabled = state.busy || state.addTextZoom <= ZOOM_STEPS[0];
  els.addTextZoomIn.disabled =
    state.busy || state.addTextZoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1];
}

function setAddTextZoom(zoom) {
  state.addTextZoom = zoom;
  updateAddTextZoomLabel();
  if (state.addTextPage) {
    renderAddTextPage(state.addTextPage).catch((error) => {
      showError(`Could not redraw the page: ${error?.message || error}`);
    });
  }
}

function syncAddTextControls(item) {
  if (item) {
    els.addTextValue.value = item.text;
    els.addTextFont.value = item.font;
    els.addTextSize.value = String(item.size);
    els.addTextColor.value = item.color;
    els.addTextBold.checked = Boolean(item.bold);
    els.addTextItalic.checked = Boolean(item.italic);
  } else {
    els.addTextValue.value = "";
  }
  updateAddTextActions();
}

function renderAddTextList() {
  els.addTextList.replaceChildren();
  const entries = [];
  for (const [rawPage, items] of Object.entries(state.addTextItems)) {
    items.forEach((item, index) =>
      entries.push({ page: Number(rawPage), index, item })
    );
  }
  entries.sort((a, b) => a.page - b.page || a.index - b.index);

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "Nothing added yet. Click the page to place a text box.";
    els.addTextList.append(empty);
    return;
  }

  for (const { page, index, item } of entries) {
    const row = document.createElement("div");
    row.className = "text-edit-item addtext-entry";
    row.dataset.page = String(page);
    row.dataset.index = String(index);
    const selected =
      state.addTextSelected?.page === page &&
      state.addTextSelected?.index === index;
    if (selected) row.classList.add("active");

    const text = document.createElement("span");
    text.className = "edit-text";
    const label = String(item.text ?? "").trim().replace(/\s+/g, " ");
    text.textContent = `Page ${page} · ${label || "(empty)"}`;
    text.title = String(item.text ?? "");

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "mini-btn";
    remove.dataset.delete = "1";
    remove.dataset.page = String(page);
    remove.dataset.index = String(index);
    remove.title = "Delete this text";
    remove.setAttribute("aria-label", "Delete this text");
    remove.textContent = "×";

    row.append(text, remove);
    els.addTextList.append(row);
  }
}

function selectAddTextItem(page, index) {
  const item = state.addTextItems[page]?.[index];
  if (!item) {
    drawAddTextPreview();
    return;
  }
  state.addTextPending = null;
  state.addTextSelected = { page, index };
  syncAddTextControls(item);
  drawAddTextPreview();
  renderAddTextList();
  updateAddTextActions();
  updateAddTextUI();
}

function removeAddTextItem(page, index) {
  const items = state.addTextItems[page];
  if (!items || index < 0 || index >= items.length) return;
  items.splice(index, 1);
  if (!items.length) delete state.addTextItems[page];

  if (state.addTextSelected?.page === page) {
    if (state.addTextSelected.index === index) {
      state.addTextSelected = null;
      syncAddTextControls(null);
    } else if (state.addTextSelected.index > index) {
      state.addTextSelected.index -= 1;
    }
  }
  if (state.addTextPending?.page === page) state.addTextPending = null;

  drawAddTextPreview();
  renderAddTextList();
  updateAddTextActions();
  updateAddTextUI();
}

function handleAddTextInput() {
  const value = els.addTextValue.value;
  const pending = state.addTextPending;

  if (pending) {
    const item = {
      x: pending.x,
      y: pending.y,
      text: value,
      font: pending.font,
      size: pending.size,
      color: pending.color,
      bold: pending.bold,
      italic: pending.italic,
    };
    if (!state.addTextItems[pending.page]) state.addTextItems[pending.page] = [];
    state.addTextItems[pending.page].push(item);
    state.addTextPending = null;
    state.addTextSelected = {
      page: pending.page,
      index: state.addTextItems[pending.page].length - 1,
    };
  } else {
    const selected = addTextSelectedItem();
    if (selected) selected.text = value;
  }

  renderAddTextList();
  drawAddTextPreview();
  updateAddTextActions();
  updateAddTextUI();
}

function applyAddTextStyle() {
  const defaults = addTextDefaults();
  const selected = addTextSelectedItem();
  const pending = state.addTextPending;
  if (selected) Object.assign(selected, defaults);
  if (pending) Object.assign(pending, defaults);
  drawAddTextPreview();
}

async function renderAddTextPage(pageNumber) {
  const token = ++state.addTextToken;
  state.addTextViewport = null;
  delete els.addTextOverlay.dataset.renderedPage;
  const release = await acquireRenderLock("addTextRenderLock", "addTextRenderTask");
  try {
    if (token !== state.addTextToken) return;

    const page = await state.pdfDoc.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const parentWidth = els.addTextPreview.parentElement?.clientWidth || 640;
    const targetWidth = Math.max(250, Math.min(680, parentWidth - 4 || 640));
    const fitScale = targetWidth / baseViewport.width;
    const cssScale = fitScale * state.addTextZoom;
    const viewport = page.getViewport({ scale: cssScale });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const deviceViewport = page.getViewport({ scale: cssScale * dpr });

    if (token !== state.addTextToken) return;

    const canvas = els.addTextBase;
    canvas.width = Math.max(1, Math.ceil(deviceViewport.width));
    canvas.height = Math.max(1, Math.ceil(deviceViewport.height));
    canvas.style.width = `${Math.ceil(viewport.width)}px`;
    canvas.style.height = `${Math.ceil(viewport.height)}px`;

    const overlay = els.addTextOverlay;
    overlay.style.width = `${Math.ceil(viewport.width)}px`;
    overlay.style.height = `${Math.ceil(viewport.height)}px`;

    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({ canvasContext: context, viewport: deviceViewport });
    state.addTextRenderTask = renderTask;
    try {
      await renderTask.promise;
    } catch (error) {
      if (error?.name === "RenderingCancelledException") return;
      throw error;
    } finally {
      if (state.addTextRenderTask === renderTask) state.addTextRenderTask = null;
    }
    if (token !== state.addTextToken) return;

    state.addTextViewport = viewport;
    drawAddTextPreview();
    updateAddTextZoomLabel();
    els.addTextOverlay.dataset.renderedPage = String(pageNumber);
  } finally {
    release();
  }
}

async function openAddTextEditor(pageNumber) {
  if (!state.pdfDoc || state.busy) return;
  const total = state.pdfDoc.numPages;
  const page = Math.min(Math.max(1, Math.round(Number(pageNumber) || 1)), total);

  state.addTextPage = page;
  state.selectedPages = [page];
  state.addTextViewport = null;
  updateGallerySelectionUI();
  state.addTextSelected = null;
  state.addTextPending = null;
  state.addTextDrag = null;
  els.addTextPanel.hidden = false;
  syncAddTextControls(null);
  drawAddTextPreview();
  renderAddTextList();
  updateAddTextUI();
  updateAddTextActions();
  els.addTextPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });

  try {
    await renderAddTextPage(page);
  } catch (error) {
    showError(`Could not open the page for writing: ${error?.message || error}`);
  }
}

function closeAddTextEditor() {
  els.addTextPanel.hidden = true;
  state.addTextToken += 1;
  cancelPdfRender("addTextRenderTask");
  state.addTextSelected = null;
  state.addTextPending = null;
  state.addTextDrag = null;
  state.addTextZoom = 1;
  els.addTextValue.value = "";
  els.addTextValue.disabled = true;
  els.addTextList.replaceChildren();
  if (state.addTextViewport) {
    const context = els.addTextOverlay.getContext("2d");
    if (context) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      els.addTextOverlay.width = 1;
      els.addTextOverlay.height = 1;
    }
  }
  updateAddTextZoomLabel();
  updateAddTextActions();
}

function stepAddTextPage(delta) {
  if (!state.pdfDoc || state.busy) return;
  const total = state.pdfDoc.numPages;
  const next = Math.min(Math.max(1, (state.addTextPage || 1) + delta), total);
  if (next !== state.addTextPage) openAddTextEditor(next);
}

async function focusAddTextItem(page, index) {
  if (state.busy) return;
  if (page !== state.addTextPage) await openAddTextEditor(page);
  selectAddTextItem(page, index);
  els.addTextValue.focus();
}

function handleAddTextPointerDown(event) {
  if (state.busy || !state.addTextViewport || !state.addTextPage) return;
  if (event.button !== undefined && event.button !== 0) return;
  const point = addTextScreenPointToPdf(event.clientX, event.clientY);
  if (!point) return;
  event.preventDefault();

  const hitIndex = addTextHitTest(event.clientX, event.clientY);
  if (hitIndex >= 0) {
    selectAddTextItem(state.addTextPage, hitIndex);
    const item = addTextPageItems()[hitIndex];
    state.addTextDrag = {
      page: state.addTextPage,
      index: hitIndex,
      originX: item.x,
      originY: item.y,
      startX: point[0],
      startY: point[1],
      moved: false,
    };
    els.addTextOverlay.classList.add("is-dragging");
    try {
      els.addTextOverlay.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is an optimisation; ignore when unavailable.
    }
    return;
  }

  const previous = addTextSelectedItem();
  if (previous && !String(previous.text ?? "").trim()) {
    removeAddTextItem(state.addTextSelected.page, state.addTextSelected.index);
  }

  state.addTextSelected = null;
  state.addTextPending = {
    page: state.addTextPage,
    x: point[0],
    y: point[1],
    ...addTextDefaults(),
  };
  syncAddTextControls(null);
  els.addTextValue.focus();
  drawAddTextPreview();
  renderAddTextList();
  updateAddTextActions();
  updateAddTextUI();
}

function handleAddTextPointerMove(event) {
  const drag = state.addTextDrag;
  if (drag && event.buttons === 0) {
    state.addTextDrag = null;
    els.addTextOverlay.classList.remove("is-dragging");
    return;
  }
  if (!drag) {
    if (state.addTextViewport) {
      els.addTextOverlay.classList.toggle(
        "is-over-item",
        addTextHitTest(event.clientX, event.clientY) >= 0
      );
    }
    return;
  }

  const point = addTextScreenPointToPdf(event.clientX, event.clientY);
  if (!point) return;
  const scale = state.addTextViewport?.scale || 1;
  const deltaX = point[0] - drag.startX;
  const deltaY = point[1] - drag.startY;
  if (!drag.moved && Math.hypot(deltaX, deltaY) * scale > 2) drag.moved = true;
  if (!drag.moved) return;

  const item = state.addTextItems[drag.page]?.[drag.index];
  if (!item) return;
  item.x = drag.originX + deltaX;
  item.y = drag.originY + deltaY;
  drawAddTextPreview();
}

function handleAddTextPointerUp(event) {
  els.addTextOverlay.classList.remove("is-dragging");
  if (state.addTextDrag) {
    state.addTextDrag = null;
    updateAddTextActions();
  }
  try {
    els.addTextOverlay.releasePointerCapture(event.pointerId);
  } catch {
    // Ignore when the pointer was not captured.
  }
}

async function applyAddText() {
  const edits = collectAddTextItems();
  if (!edits.length || !state.file) return;

  setBusy(true);
  const jobToken = beginJob();
  hideError();
  resetResult();
  revokeResultUrl();
  state.originalSize = state.file.size;
  showProgress(`Reading ${formatBytes(state.file.size)}…`);

  try {
    const buffer = await state.file.arrayBuffer();
    if (!isCurrentJob(jobToken)) return;
    const worker = createWorker(new URL("./pdfedit-worker.js", import.meta.url), jobToken);
    worker.postMessage({ op: "text", buffer, edits }, [buffer]);
  } catch (error) {
    if (!isCurrentJob(jobToken)) return;
    failJob(error?.message || String(error));
  }
}

/* ---------------------------------------------------------------- merge list */

function addMergeFiles(files) {
  if (state.busy) return;
  const chosen = Array.from(files || []);
  const valid = chosen.filter(isPdfFile);
  if (chosen.length > 0 && valid.length === 0) {
    showError("Please choose PDF files to merge.");
    return;
  }
  state.mergeFiles.push(...valid);
  els.mergeInput.value = "";
  hideError();
  renderMergeList();
  updateActionState();
}

function renderMergeList() {
  els.mergeList.replaceChildren();
  state.mergeFiles.forEach((file, index) => {
    const item = document.createElement("li");
    item.className = "merge-item";

    const number = document.createElement("span");
    number.className = "merge-index";
    number.textContent = String(index + 1);

    const meta = document.createElement("div");
    meta.className = "merge-meta";
    const name = document.createElement("div");
    name.className = "merge-name";
    name.textContent = file.name;
    const size = document.createElement("div");
    size.className = "merge-size muted";
    size.textContent = formatBytes(file.size);
    meta.append(name, size);

    const actions = document.createElement("div");
    actions.className = "merge-actions";
    const definitions = [
      ["up", "↑", "Move up", index === 0],
      ["down", "↓", "Move down", index === state.mergeFiles.length - 1],
      ["remove", "×", "Remove", false],
    ];
    for (const [action, label, title, disabled] of definitions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-btn";
      button.dataset.action = action;
      button.dataset.index = String(index);
      button.title = title;
      button.setAttribute("aria-label", title);
      button.textContent = label;
      button.disabled = disabled;
      actions.append(button);
    }

    item.append(number, meta, actions);
    els.mergeList.append(item);
  });
  els.mergeEmpty.hidden = state.mergeFiles.length > 0;
}

function removeMergeFile(index) {
  if (state.busy) return;
  state.mergeFiles.splice(index, 1);
  renderMergeList();
  updateActionState();
}

function moveMergeFile(index, delta) {
  if (state.busy) return;
  const target = index + delta;
  if (target < 0 || target >= state.mergeFiles.length) return;
  const [file] = state.mergeFiles.splice(index, 1);
  state.mergeFiles.splice(target, 0, file);
  renderMergeList();
}

/* ---------------------------------------------------------------- progress / result */

function showProgress(message) {
  els.status.textContent = message;
  els.progressPanel.hidden = false;
  els.progressBar.classList.add("indeterminate");
  els.progressBar.style.width = "8%";
  els.progressText.textContent = "";
}

function setProgress(current, total, unit) {
  if (!total) {
    els.progressBar.classList.add("indeterminate");
    return;
  }
  const pct = Math.max(0, Math.min(100, (current / total) * 100));
  els.progressBar.classList.remove("indeterminate");
  els.progressBar.style.width = `${pct}%`;
  els.progressText.textContent = `${current} / ${total}${unit ? ` ${unit}` : ""}`;
}

function showError(message) {
  els.errorMessage.textContent = String(message || "Unknown error");
  els.errorPanel.hidden = false;
  els.progressPanel.hidden = true;
}

function hideError() {
  els.errorPanel.hidden = true;
}

function resetResult() {
  els.resultPanel.hidden = true;
  els.beforeSize.textContent = "—";
  els.afterSize.textContent = "—";
  els.savedPercent.textContent = "—";
  els.savedPercent.style.color = "";
}

function revokeResultUrl() {
  if (state.resultUrl) {
    URL.revokeObjectURL(state.resultUrl);
    state.resultUrl = null;
  }
}

/* ---------------------------------------------------------------- workers / jobs */

function stopWorker() {
  if (state.worker) {
    state.worker.terminate();
    state.worker = null;
  }
}

function beginJob() {
  state.jobToken += 1;
  return state.jobToken;
}

function isCurrentJob(jobToken) {
  return jobToken === state.jobToken && state.busy;
}

function createWorker(url, jobToken = state.jobToken) {
  if (state.worker) {
    try {
      state.worker.terminate();
    } catch {
      // Already gone.
    }
    state.worker = null;
  }
  const worker = new Worker(url, { type: "module" });
  state.worker = worker;
  const isCurrent = () => jobToken === state.jobToken && state.worker === worker;
  worker.onmessage = (event) => {
    if (!isCurrent()) return;
    handleWorkerMessage(event.data || {});
  };
  worker.onerror = (event) => {
    if (!isCurrent()) return;
    if (state.busy) {
      failJob(event.message || "The browser worker failed to load.");
    }
  };
  return worker;
}

function handleWorkerMessage(data) {
  if (!state.busy) return;
  if (data.type === "status") {
    els.status.textContent = data.text;
  } else if (data.type === "progress") {
    setProgress(data.current || 0, data.total || 0, data.unit || "");
  } else if (data.type === "done") {
    finishJob(data.output, data.compressedSize);
  } else if (data.type === "error") {
    failJob(data.message || "The operation failed.");
  }
}

function finishJob(output, compressedSize) {
  state.jobToken += 1;
  stopWorker();
  setBusy(false);

  const bytes = new Uint8Array(output);
  const blob = new Blob([bytes], { type: "application/pdf" });
  revokeResultUrl();
  state.resultUrl = URL.createObjectURL(blob);

  if (state.tool === "text") {
    state.textEdits = {};
    state.textActive = null;
    els.textCursor.hidden = true;
    renderTextEdits();
    updateTextActions();
  }

  if (state.tool === "addtext") {
    state.addTextItems = {};
    state.addTextSelected = null;
    state.addTextPending = null;
    state.addTextDrag = null;
    renderAddTextList();
    updateAddTextUI();
    drawAddTextPreview();
    updateAddTextActions();
  }

  const config = TOOLS[state.tool];
  if (state.tool === "merge") {
    state.resultName = "merged.pdf";
  } else {
    const base = (state.file?.name || "document.pdf").replace(/\.pdf$/i, "");
    state.resultName = `${base}${config.downloadSuffix}.pdf`;
  }

  const originalSize = state.originalSize || bytes.length || 1;
  const newSize = bytes.length;
  const saved = originalSize > 0 ? (1 - newSize / originalSize) * 100 : 0;
  const isCompression = state.tool === "compress";

  els.resultTitle.textContent = config.resultTitle;
  els.beforeSize.textContent = formatBytes(originalSize);
  els.afterSize.textContent = formatBytes(newSize);
  els.savedLabel.textContent = isCompression ? "Saved" : "Size change";
  els.savedPercent.parentElement.classList.toggle("highlight", isCompression);

  if (Math.abs(saved) < 0.05) {
    els.savedPercent.textContent = "0.0%";
    els.savedPercent.style.color = "var(--text)";
  } else if (isCompression) {
    els.savedPercent.textContent =
      saved > 0 ? `${saved.toFixed(1)}%` : `+${Math.abs(saved).toFixed(1)}%`;
    els.savedPercent.style.color = saved > 0 ? "var(--good)" : "var(--bad)";
  } else {
    // Editing normally grows the file slightly; show a neutral size change
    // instead of a scary red "saved" figure.
    const grown = -saved;
    els.savedPercent.textContent =
      `${grown > 0 ? "+" : "\u2212"}${Math.abs(grown).toFixed(1)}%`;
    els.savedPercent.style.color = "var(--text)";
  }

  els.downloadLink.href = state.resultUrl;
  els.downloadLink.download = state.resultName;
  els.progressPanel.hidden = true;
  els.resultPanel.hidden = false;
  els.resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function failJob(message) {
  state.jobToken += 1;
  stopWorker();
  setBusy(false);
  showError(message);
}

async function startJob() {
  if (state.busy) return;
  setBusy(true);
  const jobToken = beginJob();
  hideError();
  resetResult();
  revokeResultUrl();
  showProgress("Preparing…");

  try {
    if (state.tool === "merge") {
      if (state.mergeFiles.length < 2) {
        throw new Error("Add at least two PDF files to merge.");
      }
      state.originalSize = state.mergeFiles.reduce((sum, file) => sum + (file.size || 0), 0);
      showProgress("Reading files…");
      const buffers = [];
      for (const file of state.mergeFiles) {
        buffers.push(await file.arrayBuffer());
        if (!isCurrentJob(jobToken)) return;
      }
      const worker = createWorker(new URL("./pdfedit-worker.js", import.meta.url), jobToken);
      worker.postMessage({ op: "merge", buffers }, buffers);
      return;
    }

    if (!state.file) {
      throw new Error("Choose a PDF file first.");
    }

    if (state.tool === "compress") {
      state.originalSize = state.file.size;
      showProgress(`Reading ${formatBytes(state.file.size)}…`);
      const buffer = await state.file.arrayBuffer();
      if (!isCurrentJob(jobToken)) return;
      const worker = createWorker(new URL("./pdfcompress-worker.js", import.meta.url), jobToken);
      worker.postMessage({ buffer, args: buildGhostscriptArgs(getSettings()) }, [buffer]);
      return;
    }

    if (state.tool === "move") {
      if (!pageOrderChanged()) {
        throw new Error("Drag pages into a new order first.");
      }
      state.originalSize = state.file.size;
      showProgress(`Reading ${formatBytes(state.file.size)}…`);
      const buffer = await state.file.arrayBuffer();
      if (!isCurrentJob(jobToken)) return;
      const worker = createWorker(new URL("./pdfedit-worker.js", import.meta.url), jobToken);
      worker.postMessage(
        { op: "move", buffer, order: [...state.pageOrder] },
        [buffer]
      );
      return;
    }

    if (state.tool === "replace") {
      if (!state.replaceFile) {
        throw new Error("Choose the replacement PDF first.");
      }
      if (!state.replaceSelectedPages.length) {
        throw new Error("Select at least one page from the replacement PDF.");
      }
      state.originalSize = state.file.size;
      showProgress("Reading files…");
      const [buffer, replacementBuffer] = await Promise.all([
        state.file.arrayBuffer(),
        state.replaceFile.arrayBuffer(),
      ]);
      if (!isCurrentJob(jobToken)) return;
      const worker = createWorker(new URL("./pdfedit-worker.js", import.meta.url), jobToken);
      worker.postMessage(
        {
          op: "replace",
          buffer,
          pages: [...state.selectedPages],
          replacementBuffer,
          replacementPages: [...state.replaceSelectedPages],
        },
        [buffer, replacementBuffer]
      );
      return;
    }

    if (state.selectedPages.length === 0) {
      throw new Error("Select at least one page in the gallery first.");
    }

    state.originalSize = state.file.size;
    showProgress(`Reading ${formatBytes(state.file.size)}…`);
    const buffer = await state.file.arrayBuffer();
    if (!isCurrentJob(jobToken)) return;
    const message = { op: state.tool, buffer, pages: [...state.selectedPages] };
    if (state.tool === "rotate") {
      message.angle = Number($("#rotate-angle").value);
    }
    const worker = createWorker(new URL("./pdfedit-worker.js", import.meta.url), jobToken);
    worker.postMessage(message, [buffer]);
  } catch (error) {
    if (!isCurrentJob(jobToken)) return;
    failJob(error?.message || String(error));
  }
}

function cancelJob() {
  if (!state.busy) return;
  state.jobToken += 1;
  stopWorker();
  setBusy(false);
  els.progressPanel.hidden = true;
  els.status.textContent = "Cancelled.";
}

function startAnother() {
  if (state.busy) return;
  if (state.tool === "merge") {
    state.mergeFiles = [];
    renderMergeList();
  } else {
    clearFile();
  }
  hideError();
  resetResult();
  els.progressPanel.hidden = true;
  updateActionState();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------------------------------------------------------------- theme */

function applyTheme(theme) {
  const value = theme === "dark" ? "dark" : "bright";
  document.documentElement.dataset.theme = value;
  try {
    localStorage.setItem("tabpdf-theme", value);
  } catch {
    // Theme still works for this page load even if storage is blocked.
  }
  if (els.themeToggle) {
    els.themeToggle.textContent = value === "bright" ? "🌙" : "☀️";
    els.themeToggle.title =
      value === "bright" ? "Switch to dark colours" : "Switch to bright colours";
    els.themeToggle.setAttribute(
      "aria-label",
      value === "bright" ? "Switch to dark colours" : "Switch to bright colours"
    );
  }
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = value === "bright" ? "#2f6bff" : "#5b8cff";
}

/* ---------------------------------------------------------------- event wiring */

function setupDropzone(zone, input, onFiles) {
  zone.addEventListener("click", () => input.click());
  zone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input.click();
    }
  });

  for (const type of ["dragenter", "dragover", "dragleave", "drop"]) {
    zone.addEventListener(type, (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  }
  zone.addEventListener("dragenter", () => zone.classList.add("is-over"));
  zone.addEventListener("dragover", (event) => {
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    zone.classList.add("is-over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));
  zone.addEventListener("drop", (event) => {
    zone.classList.remove("is-over");
    onFiles(Array.from(event.dataTransfer?.files || []));
  });

  input.addEventListener("change", () => {
    onFiles(Array.from(input.files || []));
    input.value = "";
  });
}

function init() {
  for (const tab of els.tabs.querySelectorAll(".tab")) {
    tab.addEventListener("click", () => switchTool(tab.dataset.tool));
  }

  for (const button of els.presets.querySelectorAll(".preset")) {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  }

  for (const slider of [els.dpi, els.quality, els.monoDpi]) {
    slider.addEventListener("input", markCustom);
  }

  els.toolOptionsPanel.addEventListener("click", (event) => {
    const chip = event.target.closest(".chip");
    if (!chip) return;
    const input = document.getElementById(chip.dataset.target);
    if (!input) return;
    input.value = chip.dataset.value ?? "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  });

  setupDropzone(els.dropzone, els.fileInput, (files) => setFile(files[0]));
  setupDropzone(els.mergeDropzone, els.mergeInput, addMergeFiles);

  els.clearFile.addEventListener("click", clearFile);

  els.pageGallery.addEventListener("click", (event) => {
    const tile = event.target.closest(".page-tile");
    if (!tile) return;
    toggleGalleryPage(Number(tile.dataset.page));
  });

  els.galleryClear.addEventListener("click", clearGallerySelection);
  els.galleryAll.addEventListener("click", () => {
    if (!state.pdfDoc) return;
    setGallerySelection(Array.from({ length: state.pdfDoc.numPages }, (_, index) => index + 1));
  });
  els.galleryOdd.addEventListener("click", () => {
    if (!state.pdfDoc) return;
    const pages = [];
    for (let page = 1; page <= state.pdfDoc.numPages; page += 2) pages.push(page);
    setGallerySelection(pages);
  });
  els.galleryEven.addEventListener("click", () => {
    if (!state.pdfDoc) return;
    const pages = [];
    for (let page = 2; page <= state.pdfDoc.numPages; page += 2) pages.push(page);
    setGallerySelection(pages);
  });
  els.galleryInvert.addEventListener("click", () => {
    if (!state.pdfDoc) return;
    const chosen = new Set(state.selectedPages);
    const pages = [];
    for (let page = 1; page <= state.pdfDoc.numPages; page += 1) {
      if (!chosen.has(page)) pages.push(page);
    }
    setGallerySelection(pages);
  });

  els.galleryMoveLeft.addEventListener("click", () => nudgeSelection(-1));
  els.galleryMoveRight.addEventListener("click", () => nudgeSelection(1));
  els.galleryResetOrder.addEventListener("click", () => {
    if (state.busy) return;
    resetPageOrder();
  });

  els.pageGallery.addEventListener("dragstart", handleGalleryDragStart);
  els.pageGallery.addEventListener("dragover", handleGalleryDragOver);
  els.pageGallery.addEventListener("drop", handleGalleryDrop);
  els.pageGallery.addEventListener("dragend", handleGalleryDragEnd);

  els.replacePick.addEventListener("click", () => els.replaceInput.click());
  els.replaceClear.addEventListener("click", () => {
    if (state.busy) return;
    resetReplaceGallery();
  });
  els.replaceInput.addEventListener("change", () => {
    setReplaceFile(els.replaceInput.files?.[0]);
    els.replaceInput.value = "";
  });
  els.replaceGallery.addEventListener("click", (event) => {
    if (state.busy) return;
    const tile = event.target.closest(".page-tile");
    if (!tile) return;
    toggleReplacePage(Number(tile.dataset.page));
  });
  els.replaceGalleryAll.addEventListener("click", () => {
    if (!state.replaceDoc) return;
    setReplaceSelection(
      Array.from({ length: state.replaceDoc.numPages }, (_, index) => index + 1)
    );
  });
  els.replaceGalleryClear.addEventListener("click", () => setReplaceSelection([]));

  els.textValue.addEventListener("input", updateTextActions);
  els.textPlaceBtn.addEventListener("click", placeText);
  els.textApplyBtn.addEventListener("click", applyTextEdits);
  els.textClearEdits.addEventListener("click", clearPageTextEdits);

  els.textClearActive.addEventListener("click", () => {
    state.textActive = null;
    els.textCursor.hidden = true;
    els.textValue.value = "";
    for (const row of els.textExistingList.querySelectorAll(".text-existing-item")) {
      row.classList.remove("active");
    }
    updateTextActions();
  });

  els.textPreviewCanvas.addEventListener("click", (event) => {
    if (!state.textViewport || !state.textPage) return;

    const rect = els.textPreviewCanvas.getBoundingClientRect();
    const cssX = event.clientX - rect.left;
    const cssY = event.clientY - rect.top;
    const [pdfX, pdfY] = state.textViewport.convertToPdfPoint(cssX, cssY);

    state.textActive = {
      mode: "add",
      page: state.textPage,
      x: pdfX,
      y: pdfY,
    };

    const previewRect = els.textPreview.getBoundingClientRect();
    els.textCursor.style.left = `${event.clientX - previewRect.left}px`;
    els.textCursor.style.top = `${event.clientY - previewRect.top}px`;
    els.textCursor.hidden = false;

    for (const row of els.textExistingList.querySelectorAll(".text-existing-item")) {
      row.classList.remove("active");
    }
    updateTextActions();
    els.textValue.focus();
  });

  els.textExistingList.addEventListener("click", (event) => {
    const item = event.target.closest(".text-existing-item");
    if (!item) return;
    activateExistingText(Number(item.dataset.index));
  });

  els.textEditsList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-index]");
    if (!button) return;
    removeTextEdit(Number(button.dataset.index));
  });

  els.textZoomIn.addEventListener("click", () =>
    setTextZoom(stepZoom(state.textZoom, 1))
  );
  els.textZoomOut.addEventListener("click", () =>
    setTextZoom(stepZoom(state.textZoom, -1))
  );
  els.textZoomFit.addEventListener("click", () => setTextZoom(1));

  els.addTextValue.addEventListener("input", handleAddTextInput);
  els.addTextFont.addEventListener("change", applyAddTextStyle);
  els.addTextSize.addEventListener("input", applyAddTextStyle);
  els.addTextColor.addEventListener("input", applyAddTextStyle);
  els.addTextBold.addEventListener("change", applyAddTextStyle);
  els.addTextItalic.addEventListener("change", applyAddTextStyle);
  els.addTextApply.addEventListener("click", applyAddText);
  els.addTextPrev.addEventListener("click", () => stepAddTextPage(-1));
  els.addTextNext.addEventListener("click", () => stepAddTextPage(1));
  els.addTextDelete.addEventListener("click", () => {
    const selected = state.addTextSelected;
    if (selected) removeAddTextItem(selected.page, selected.index);
  });
  els.addTextClearPage.addEventListener("click", () => {
    if (!state.addTextPage || state.busy) return;
    delete state.addTextItems[state.addTextPage];
    state.addTextSelected = null;
    state.addTextPending = null;
    syncAddTextControls(null);
    drawAddTextPreview();
    renderAddTextList();
    updateAddTextActions();
    updateAddTextUI();
  });
  els.addTextZoomIn.addEventListener("click", () =>
    setAddTextZoom(stepZoom(state.addTextZoom, 1))
  );
  els.addTextZoomOut.addEventListener("click", () =>
    setAddTextZoom(stepZoom(state.addTextZoom, -1))
  );
  els.addTextZoomFit.addEventListener("click", () => setAddTextZoom(1));

  els.addTextList.addEventListener("click", (event) => {
    const removeButton = event.target.closest("button[data-delete]");
    if (removeButton) {
      removeAddTextItem(
        Number(removeButton.dataset.page),
        Number(removeButton.dataset.index)
      );
      return;
    }
    const row = event.target.closest(".addtext-entry[data-page]");
    if (!row) return;
    focusAddTextItem(Number(row.dataset.page), Number(row.dataset.index));
  });

  els.addTextOverlay.addEventListener("pointerdown", handleAddTextPointerDown);
  els.addTextOverlay.addEventListener("pointermove", handleAddTextPointerMove);
  els.addTextOverlay.addEventListener("pointerup", handleAddTextPointerUp);
  els.addTextOverlay.addEventListener("pointercancel", handleAddTextPointerUp);
  els.addTextOverlay.addEventListener("lostpointercapture", handleAddTextPointerUp);

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!els.textEditorPanel.hidden && state.textPage) {
        renderTextPage(state.textPage).catch(() => {});
      }
      if (!els.addTextPanel.hidden && state.addTextPage) {
        renderAddTextPage(state.addTextPage).catch(() => {});
      }
    }, 180);
  });

  els.mergeList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const index = Number(button.dataset.index);
    const action = button.dataset.action;
    if (action === "up") moveMergeFile(index, -1);
    else if (action === "down") moveMergeFile(index, 1);
    else if (action === "remove") removeMergeFile(index);
  });

  els.actionBtn.addEventListener("click", startJob);
  els.cancelBtn.addEventListener("click", cancelJob);
  els.againBtn.addEventListener("click", startAnother);

  applyPreset("balanced");
  switchTool("compress");

  applyTheme(document.documentElement.dataset.theme || "bright");
  els.themeToggle.addEventListener("click", () => {
    const next =
      document.documentElement.dataset.theme === "bright" ? "dark" : "bright";
    applyTheme(next);
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(new URL("./sw.js", import.meta.url)).catch(() => {
      // PWA install support is optional; the app works without it.
    });
  }
}

init();
