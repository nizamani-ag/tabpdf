import { PDFDocument, StandardFonts, degrees, rgb } from "./vendor/pdf-lib/pdf-lib.esm.min.js";

function send(message, transfer = []) {
  self.postMessage(message, transfer);
}

function status(text) {
  send({ type: "status", text });
}

function progress(current, total, unit) {
  send({ type: "progress", current, total, unit });
}

function parsePageSpec(spec, pageCount) {
  const original = String(spec ?? "").trim();
  const text = original.toLowerCase();
  if (!text) {
    throw new Error("Enter page numbers, e.g. 1-3, 5, last.");
  }

  const pages = [];
  const seen = new Set();
  const add = (page) => {
    if (!Number.isInteger(page)) {
      throw new Error(`Invalid page number "${page}".`);
    }
    if (page < 1 || page > pageCount) {
      throw new Error(
        `Page ${page} is out of range (this PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}).`
      );
    }
    if (!seen.has(page)) {
      seen.add(page);
      pages.push(page);
    }
  };

  for (const rawToken of text.split(",")) {
    const token = rawToken.trim().replace(/\s+/g, "");
    if (!token) continue;

    if (token === "all") {
      for (let page = 1; page <= pageCount; page += 1) add(page);
      continue;
    }
    if (token === "odd") {
      for (let page = 1; page <= pageCount; page += 2) add(page);
      continue;
    }
    if (token === "even") {
      for (let page = 2; page <= pageCount; page += 2) add(page);
      continue;
    }

    const lastMatch = token.match(/^last(?:-(\d+))?$/);
    if (lastMatch) {
      add(pageCount - (lastMatch[1] ? Number(lastMatch[1]) : 0));
      continue;
    }

    const rangeMatch = token.match(/^(\d*)-(\d*)$/);
    if (rangeMatch && (rangeMatch[1] || rangeMatch[2])) {
      const start = rangeMatch[1] ? Number(rangeMatch[1]) : 1;
      const end = rangeMatch[2] ? Number(rangeMatch[2]) : pageCount;
      const step = start <= end ? 1 : -1;
      for (let page = start; step > 0 ? page <= end : page >= end; page += step) {
        add(page);
      }
      continue;
    }

    if (/^\d+$/.test(token)) {
      add(Number(token));
      continue;
    }

    throw new Error(
      `Could not understand "${rawToken.trim()}". Use numbers and ranges, e.g. 1-3, 5, last.`
    );
  }

  if (!pages.length) {
    throw new Error("No valid pages were selected.");
  }
  return pages;
}

function validatePageList(rawPages, pageCount) {
  const pages = [];
  const seen = new Set();
  for (const rawPage of rawPages) {
    const page = Number(rawPage);
    if (!Number.isInteger(page)) {
      throw new Error(`Invalid page number "${rawPage}".`);
    }
    if (page < 1 || page > pageCount) {
      throw new Error(
        `Page ${page} is out of range (this PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}).`
      );
    }
    if (!seen.has(page)) {
      seen.add(page);
      pages.push(page);
    }
  }
  if (!pages.length) {
    throw new Error("No pages were selected.");
  }
  return pages;
}

function resolvePages(data, pageCount) {
  if (Array.isArray(data.pages)) {
    return validatePageList(data.pages, pageCount);
  }
  return parsePageSpec(data.pagesSpec, pageCount);
}

async function loadDocument(buffer) {
  return PDFDocument.load(new Uint8Array(buffer), {
    ignoreEncryption: true,
    updateMetadata: false,
    throwOnInvalidObject: false,
  });
}

function copyMetadata(source, target) {
  const pairs = [
    ["getTitle", "setTitle"],
    ["getAuthor", "setAuthor"],
    ["getSubject", "setSubject"],
    ["getKeywords", "setKeywords"],
    ["getCreator", "setCreator"],
    ["getProducer", "setProducer"],
    ["getCreationDate", "setCreationDate"],
    ["getModificationDate", "setModificationDate"],
  ];
  for (const [getter, setter] of pairs) {
    try {
      const value = source[getter]();
      if (value !== undefined && value !== null) target[setter](value);
    } catch {
      // Metadata is best-effort; ignore malformed fields.
    }
  }
}

async function saveDocument(doc) {
  return doc.save({ useObjectStreams: true, addDefaultPage: false });
}

async function deletePages(data) {
  const doc = await loadDocument(data.buffer);
  const pageCount = doc.getPageCount();
  const pages = resolvePages(data, pageCount);

  if (pages.length >= pageCount) {
    throw new Error("You cannot delete every page of the PDF.");
  }

  status(`Deleting ${pages.length} page${pages.length === 1 ? "" : "s"}…`);
  const remove = new Set(pages.map((page) => page - 1));
  for (let index = pageCount - 1; index >= 0; index -= 1) {
    if (remove.has(index)) doc.removePage(index);
  }

  status("Saving edited PDF…");
  return saveDocument(doc);
}

async function extractPages(data) {
  const source = await loadDocument(data.buffer);
  const pageCount = source.getPageCount();
  const pages = resolvePages(data, pageCount);

  status(`Extracting ${pages.length} page${pages.length === 1 ? "" : "s"}…`);
  const output = await PDFDocument.create();
  copyMetadata(source, output);

  const copied = await output.copyPages(source, pages.map((page) => page - 1));
  copied.forEach((page) => output.addPage(page));
  progress(pages.length, pages.length, "pages");

  status("Saving new PDF…");
  return saveDocument(output);
}

function validatePageOrder(rawOrder, pageCount) {
  if (!Array.isArray(rawOrder) || rawOrder.length !== pageCount) {
    throw new Error("The new page order does not match this PDF.");
  }
  const seen = new Set();
  for (const rawPage of rawOrder) {
    const page = Number(rawPage);
    if (!Number.isInteger(page) || page < 1 || page > pageCount || seen.has(page)) {
      throw new Error("The new page order is not valid.");
    }
    seen.add(page);
  }
  return rawOrder.map(Number);
}

async function movePages(data) {
  const doc = await loadDocument(data.buffer);
  const pageCount = doc.getPageCount();
  const order = validatePageOrder(data.order, pageCount);

  if (order.every((page, index) => page === index + 1)) {
    throw new Error("The page order has not changed yet.");
  }

  status(`Reordering ${pageCount} pages…`);
  const output = await PDFDocument.create();
  copyMetadata(doc, output);

  const copied = await output.copyPages(doc, order.map((page) => page - 1));
  copied.forEach((page) => output.addPage(page));
  progress(order.length, order.length, "pages");

  status("Saving reordered PDF…");
  return saveDocument(output);
}

async function replacePages(data) {
  const doc = await loadDocument(data.buffer);
  const pageCount = doc.getPageCount();
  const pages = resolvePages(data, pageCount);

  const replacement = await loadDocument(data.replacementBuffer);
  const replacementCount = replacement.getPageCount();
  const replacementPages = validatePageList(data.replacementPages, replacementCount);

  const replaceSet = new Set(pages);
  const insertPosition = Math.min(...pages);
  const keptPages = [];
  for (let page = 1; page <= pageCount; page += 1) {
    if (!replaceSet.has(page)) keptPages.push(page);
  }
  const split = keptPages.filter((page) => page < insertPosition).length;

  status(
    `Replacing ${pages.length} page${pages.length === 1 ? "" : "s"} with ` +
      `${replacementPages.length} page${replacementPages.length === 1 ? "" : "s"}…`
  );
  const output = await PDFDocument.create();
  copyMetadata(doc, output);

  const keptCopied = await output.copyPages(doc, keptPages.map((page) => page - 1));
  const replacementCopied = await output.copyPages(
    replacement,
    replacementPages.map((page) => page - 1)
  );

  const finalPages = [
    ...keptCopied.slice(0, split),
    ...replacementCopied,
    ...keptCopied.slice(split),
  ];
  finalPages.forEach((page) => output.addPage(page));
  progress(finalPages.length, finalPages.length, "pages");

  status("Saving updated PDF…");
  return saveDocument(output);
}

async function rotatePages(data) {
  const doc = await loadDocument(data.buffer);
  const pageCount = doc.getPageCount();
  const pages = resolvePages(data, pageCount);
  const angle = ((Number(data.angle) % 360) + 360) % 360;

  if (![90, 180, 270].includes(angle)) {
    throw new Error("Rotation angle must be 90, 180, or 270 degrees.");
  }

  status(`Rotating ${pages.length} page${pages.length === 1 ? "" : "s"}…`);
  pages.forEach((pageNumber, index) => {
    const page = doc.getPage(pageNumber - 1);
    const current = page.getRotation().angle || 0;
    page.setRotation(degrees((current + angle) % 360));
    progress(index + 1, pages.length, "pages");
  });

  status("Saving rotated PDF…");
  return saveDocument(doc);
}

async function mergePdfs(data) {
  const buffers = Array.isArray(data.buffers) ? data.buffers : [];
  if (buffers.length < 2) {
    throw new Error("Add at least two PDF files to merge.");
  }

  const output = await PDFDocument.create();
  let firstDocument = null;

  for (let index = 0; index < buffers.length; index += 1) {
    status(`Merging file ${index + 1} of ${buffers.length}…`);
    const document = await loadDocument(buffers[index]);
    if (!firstDocument) {
      firstDocument = document;
      copyMetadata(document, output);
    }
    const indices = document.getPageIndices();
    const copied = await output.copyPages(document, indices);
    copied.forEach((page) => output.addPage(page));
    progress(index + 1, buffers.length, "files");
  }

  status("Saving merged PDF…");
  return saveDocument(output);
}

function parseColor(value) {
  const match = String(value || "#000000").trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) return rgb(0, 0, 0);
  const number = parseInt(match[1], 16);
  return rgb(
    ((number >> 16) & 255) / 255,
    ((number >> 8) & 255) / 255,
    (number & 255) / 255
  );
}

function standardFontKey(edit) {
  const family =
    edit.font === "Times" ? "TimesRoman" : edit.font === "Courier" ? "Courier" : "Helvetica";
  const bold = Boolean(edit.bold);
  const italic = Boolean(edit.italic);

  if (family === "TimesRoman") {
    if (bold && italic) return "TimesRomanBoldItalic";
    if (bold) return "TimesRomanBold";
    if (italic) return "TimesRomanItalic";
    return "TimesRoman";
  }
  if (family === "Courier") {
    if (bold && italic) return "CourierBoldOblique";
    if (bold) return "CourierBold";
    if (italic) return "CourierOblique";
    return "Courier";
  }
  if (bold && italic) return "HelveticaBoldOblique";
  if (bold) return "HelveticaBold";
  if (italic) return "HelveticaOblique";
  return "Helvetica";
}

function wrapTextForPdf(font, size, text, maxWidth) {
  const rawLines = String(text ?? "").split(/\r?\n/);
  if (!Number.isFinite(maxWidth) || maxWidth < 8) return rawLines;
  const measure = (line) => font.widthOfTextAtSize(line, size);

  const breakWord = (word) => {
    const chunks = [];
    let chunk = "";
    for (const character of word) {
      const candidate = chunk + character;
      if (chunk && measure(candidate) > maxWidth) {
        chunks.push(chunk);
        chunk = character;
      } else {
        chunk = candidate;
      }
    }
    if (chunk) chunks.push(chunk);
    return chunks.length ? chunks : [word];
  };

  const wrapped = [];
  for (const paragraph of rawLines) {
    if (!paragraph) {
      wrapped.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) {
        wrapped.push(line);
        line = "";
      }
      if (measure(word) <= maxWidth) {
        line = word;
        continue;
      }
      const chunks = breakWord(word);
      wrapped.push(...chunks.slice(0, -1));
      line = chunks[chunks.length - 1] || "";
    }
    if (line) wrapped.push(line);
  }
  return wrapped.length ? wrapped : [""];
}

async function applyTextEdits(data) {
  const edits = Array.isArray(data.edits) ? data.edits : [];
  if (!edits.length) {
    throw new Error("No text edits were provided.");
  }

  const doc = await loadDocument(data.buffer);
  const pageCount = doc.getPageCount();
  const fontCache = new Map();

  async function getFont(edit) {
    const key = standardFontKey(edit);
    if (!fontCache.has(key)) {
      fontCache.set(key, await doc.embedFont(StandardFonts[key]));
    }
    return fontCache.get(key);
  }

  for (let index = 0; index < edits.length; index += 1) {
    const edit = edits[index];
    const pageNumber = Number(edit.page);
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pageCount) {
      throw new Error(
        `Text edit page ${edit.page} is out of range (this PDF has ${pageCount} pages).`
      );
    }

    status(`Applying text edit ${index + 1} of ${edits.length}…`);

    const page = doc.getPage(pageNumber - 1);
    const pageSize = page.getSize();
    let x = Math.min(Math.max(Number(edit.x) || 0, 0), pageSize.width);
    let y = Math.min(Math.max(Number(edit.y) || 0, 0), pageSize.height);
    const size = Math.min(Math.max(Number(edit.size) || 14, 4), 240);
    const font = await getFont(edit);
    const color = parseColor(edit.color);
    const text = String(edit.text ?? "");
    const providedLines = Array.isArray(edit.lines)
      ? edit.lines.map((line) => String(line ?? ""))
      : null;
    const textLines =
      providedLines && providedLines.length
        ? providedLines
        : wrapTextForPdf(font, size, text, Number(edit.width));
    const lineCount = Math.max(textLines.length, 1);
    const visibleLines = textLines.filter((line) => line.length > 0);

    // Added text (not a replacement of an existing block) must stay on the page.
    if (!edit.coverBox) {
      const lineHeight = size * 1.2;
      const blockBottom = Math.max(textLines.length - 1, 0) * lineHeight + size * 0.28;
      if (y < blockBottom) y = blockBottom;
      y = Math.min(y, Math.max(0, pageSize.height - size * 0.9));
      if (y < 0) y = 0;
      if (visibleLines.length) {
        const widest = Math.max(
          ...visibleLines.map((line) => font.widthOfTextAtSize(line, size))
        );
        if (x + widest > pageSize.width) x = Math.max(0, pageSize.width - widest);
      }
    }

    if (edit.coverBox) {
      page.drawRectangle({
        x: Number(edit.coverBox.x) || 0,
        y: Number(edit.coverBox.y) || 0,
        width: Math.max(Number(edit.coverBox.width) || 0, 2),
        height: Math.max(Number(edit.coverBox.height) || 0, 2),
        color: rgb(1, 1, 1),
      });
    }

    try {
      if (edit.cover && visibleLines.length) {
        const textWidth = Math.max(
          ...visibleLines.map((line) => font.widthOfTextAtSize(line, size))
        );
        const height = size * (lineCount * 1.2 + 0.15);
        page.drawRectangle({
          x: Math.max(x - 2, 0),
          y: Math.max(y - size * 0.3, 0),
          width: Math.max(textWidth + 4, size * 0.6),
          height,
          color: rgb(1, 1, 1),
        });
      }

      // Keep blank lines as spacing instead of collapsing them.
      textLines.forEach((line, lineIndex) => {
        if (!line) return;
        page.drawText(line, {
          x,
          y: y - lineIndex * size * 1.2,
          size,
          font,
          color,
        });
      });
    } catch (error) {
      const message = String(error?.message || error);
      if (/winansi/i.test(message)) {
        throw new Error(
          "Some characters in your text cannot be drawn with the built-in " +
            "Helvetica, Times, or Courier fonts. Use plain Latin text " +
            "(accented letters are fine) and try again."
        );
      }
      throw error;
    }
  }

  status("Saving edited PDF…");
  return saveDocument(doc);
}

async function run(data) {
  const operation = data?.op;
  if (operation === "delete") return deletePages(data);
  if (operation === "extract") return extractPages(data);
  if (operation === "rotate") return rotatePages(data);
  if (operation === "move") return movePages(data);
  if (operation === "replace") return replacePages(data);
  if (operation === "merge") return mergePdfs(data);
  if (operation === "text") return applyTextEdits(data);
  throw new Error(`Unknown edit operation: ${operation}`);
}

self.onmessage = async (event) => {
  try {
    const bytes = await run(event.data);
    const copy = bytes.slice();
    send(
      { type: "done", output: copy.buffer, compressedSize: copy.byteLength },
      [copy.buffer]
    );
  } catch (error) {
    send({
      type: "error",
      message: error?.message ? String(error.message) : String(error),
    });
  }
};
