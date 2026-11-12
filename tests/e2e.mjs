/*
 * End-to-end test for the Add text / Edit text editors.
 *
 * Requires the app to be served over HTTP (./run_web.py) and a headless
 * Chrome with the DevTools protocol enabled. `tests/run_e2e.sh` starts both.
 *
 * The test uses a generated, synthetic PDF (tests/make_fixture.mjs); it never
 * touches real documents.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createFixture, FIXTURE_PATH } from "./make_fixture.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACTS = join(ROOT, "tests", ".artifacts");
const APP_URL = process.env.APP_URL || "http://127.0.0.1:8765/";
const CDP_URL = process.env.CDP_URL || "http://127.0.0.1:9333";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const failures = [];
const consoleErrors = [];

function check(condition, message) {
  if (condition) {
    console.log(`  ok   ${message}`);
  } else {
    failures.push(message);
    console.error(`  FAIL ${message}`);
  }
}

function near(actual, expected, tolerance, label) {
  check(
    Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected.toFixed(2)} +/- ${tolerance}, got ${actual}`
  );
}

function pdfText(path) {
  try {
    return execFileSync("pdftotext", [path, "-"], { encoding: "utf8" });
  } catch {
    return null;
  }
}

async function main() {
  await createFixture();
  mkdirSync(ARTIFACTS, { recursive: true });

  const targets = await (await fetch(`${CDP_URL}/json/list`)).json();
  const target = targets.find((entry) => entry.type === "page");
  if (!target) throw new Error("No Chrome page target found");

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
      return;
    }
    if (message.method === "Runtime.consoleAPICalled") {
      const type = message.params.type;
      if (type === "error" || type === "assert") {
        consoleErrors.push(
          message.params.args.map((arg) => arg.value ?? arg.description ?? arg.type).join(" ")
        );
      }
    }
    if (message.method === "Runtime.exceptionThrown") {
      consoleErrors.push(
        "EXCEPTION: " +
          (message.params.exceptionDetails.exception?.description ||
            message.params.exceptionDetails.text)
      );
    }
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
      consoleErrors.push("LOG: " + message.params.entry.text);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  function send(method, params = {}) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        "Page evaluation failed: " +
          (result.exceptionDetails.exception?.description ||
            JSON.stringify(result.exceptionDetails))
      );
    }
    return result.result.value;
  }

  async function waitFor(expression, label, timeout = 20000, interval = 120) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const value = await evaluate(expression);
      if (value) return value;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error(`Timed out waiting for ${label}`);
  }

  async function screenshot(name) {
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(ARTIFACTS, name), Buffer.from(data, "base64"));
  }

  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1400,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: APP_URL });
  await waitFor("document.readyState === 'complete'", "page load");
  await waitFor("!!document.querySelector('[data-tool=\"addtext\"]')", "app boot");

  // Record the edits the page sends to its worker.
  await evaluate(`(() => {
    window.__textEdits = [];
    const original = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (message, transfer) {
      if (message && message.op === "text" && Array.isArray(message.edits)) {
        window.__textEdits.push(message.edits.map((edit) => ({ ...edit })));
      }
      return original.call(this, message, transfer);
    };
  })()`);

  // Load the synthetic fixture through the real file input.
  await evaluate(`(async () => {
    const response = await fetch("/tests/fixtures/sample.pdf");
    const blob = await response.blob();
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([blob], "sample.pdf", { type: "application/pdf" }));
    const input = document.getElementById("file-input");
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  })()`);

  // ---- Add text: place, verify geometry, drag, zoom ----
  console.log("Add text editor");
  await evaluate(`document.querySelector('[data-tool="addtext"]').click()`);
  await waitFor("document.querySelectorAll('#page-gallery .page-tile').length === 3", "gallery tiles");
  await evaluate(`document.querySelector('#page-gallery .page-tile[data-page="1"]').click()`);
  await waitFor(
    "document.getElementById('addtext-overlay').dataset.renderedPage === '1'",
    "add-text editor"
  );

  const geometry = await evaluate(`(() => {
    const overlay = document.getElementById("addtext-overlay");
    const rect = overlay.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  })()`);
  near(
    geometry.height / geometry.width,
    PAGE_HEIGHT / PAGE_WIDTH,
    0.02,
    "preview keeps the page aspect ratio (overlay is not stretched)"
  );
  check(geometry.width > 500, `preview is large enough to click (width ${geometry.width})`);

  const placement = await evaluate(`(() => {
    const overlay = document.getElementById("addtext-overlay");
    const rect = overlay.getBoundingClientRect();
    const options = {
      bubbles: true, cancelable: true,
      clientX: rect.left + rect.width * 0.35,
      clientY: rect.top + rect.height * 0.30,
      pointerId: 11, pointerType: "mouse", button: 0, buttons: 1, isPrimary: true,
    };
    overlay.dispatchEvent(new PointerEvent("pointerdown", options));
    overlay.dispatchEvent(new PointerEvent("pointerup", { ...options, buttons: 0 }));
    const textarea = document.getElementById("addtext-value");
    textarea.focus();
    textarea.value = "HELLO PDF";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    return {
      applyEnabled: !document.getElementById("addtext-apply").disabled,
      rows: document.querySelectorAll("#addtext-list .addtext-entry").length,
    };
  })()`);
  check(placement.applyEnabled, "Apply is enabled after placing text");
  check(placement.rows === 1, "one text box is listed after placing text");
  await screenshot("addtext-placed.png");

  // Drag the box from 30% to 65% of the page height.
  await evaluate(`(() => {
    const overlay = document.getElementById("addtext-overlay");
    const rect = overlay.getBoundingClientRect();
    const startX = rect.left + rect.width * 0.35;
    const startY = rect.top + rect.height * 0.30;
    const endX = startX;
    const endY = rect.top + rect.height * 0.65;
    const base = {
      bubbles: true, cancelable: true, pointerId: 12, pointerType: "mouse",
      button: 0, buttons: 1, isPrimary: true,
    };
    overlay.dispatchEvent(new PointerEvent("pointerdown", { ...base, clientX: startX, clientY: startY }));
    overlay.dispatchEvent(new PointerEvent("pointermove", { ...base, clientX: endX, clientY: endY }));
    overlay.dispatchEvent(new PointerEvent("pointerup", { ...base, buttons: 0, clientX: endX, clientY: endY }));
  })()`);
  await screenshot("addtext-dragged.png");

  // Zoom: the canvas must grow and the panel must become scrollable.
  const zoom = await evaluate(`(async () => {
    const before = document.getElementById("addtext-base").getBoundingClientRect().width;
    document.getElementById("addtext-zoom-in").click();
    await new Promise((resolve) => setTimeout(resolve, 900));
    const scroller = document.querySelector("#addtext-panel .text-preview-scroll");
    return {
      before,
      after: document.getElementById("addtext-base").getBoundingClientRect().width,
      label: document.getElementById("addtext-zoom-label").textContent,
      scrollWidth: scroller.scrollWidth,
      clientWidth: scroller.clientWidth,
    };
  })()`);
  check(zoom.label === "125%", `zoom label reads 125% (got ${zoom.label})`);
  check(
    Math.abs(zoom.after - zoom.before * 1.25) < 2,
    `zoom enlarges the page (${zoom.before} -> ${zoom.after})`
  );
  check(
    zoom.scrollWidth > zoom.clientWidth,
    "zoomed preview scrolls horizontally"
  );

  // ---- Second page at 125% zoom ----
  console.log("Second page at 125% zoom");
  await evaluate(`document.getElementById("addtext-next").click()`);
  await waitFor(
    "document.getElementById('addtext-page').textContent.includes('Page 2') && document.getElementById('addtext-overlay').dataset.renderedPage === '2'",
    "page 2 rendered"
  );

  const secondPlacement = await evaluate(`(() => {
    const overlay = document.getElementById("addtext-overlay");
    const rect = overlay.getBoundingClientRect();
    const options = {
      bubbles: true, cancelable: true,
      clientX: rect.left + rect.width * 0.5,
      clientY: rect.top + rect.height * 0.5,
      pointerId: 13, pointerType: "mouse", button: 0, buttons: 1, isPrimary: true,
    };
    overlay.dispatchEvent(new PointerEvent("pointerdown", options));
    overlay.dispatchEvent(new PointerEvent("pointerup", { ...options, buttons: 0 }));
    const textarea = document.getElementById("addtext-value");
    textarea.focus();
    textarea.value = "SECOND PAGE\\n\\nNOTE";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    const font = document.getElementById("addtext-font");
    font.value = "Times";
    font.dispatchEvent(new Event("change", { bubbles: true }));
    const size = document.getElementById("addtext-size");
    size.value = "24";
    size.dispatchEvent(new Event("input", { bubbles: true }));
    const color = document.getElementById("addtext-color");
    color.value = "#cc0000";
    color.dispatchEvent(new Event("input", { bubbles: true }));
    const bold = document.getElementById("addtext-bold");
    bold.checked = true;
    bold.dispatchEvent(new Event("change", { bubbles: true }));

    return {
      applyLabel: document.getElementById("addtext-apply").textContent,
      rows: document.querySelectorAll("#addtext-list .addtext-entry").length,
    };
  })()`);
  check(secondPlacement.rows === 2, "two text boxes are listed after adding to page 2");
  check(secondPlacement.applyLabel === "Apply text (2)", "Apply shows the pending text count");

  // Add a temporary box, then delete it.
  const deleteResult = await evaluate(`(() => {
    const overlay = document.getElementById("addtext-overlay");
    const rect = overlay.getBoundingClientRect();
    const options = {
      bubbles: true, cancelable: true,
      clientX: rect.left + rect.width * 0.1,
      clientY: rect.top + rect.height * 0.1,
      pointerId: 14, pointerType: "mouse", button: 0, buttons: 1, isPrimary: true,
    };
    overlay.dispatchEvent(new PointerEvent("pointerdown", options));
    overlay.dispatchEvent(new PointerEvent("pointerup", { ...options, buttons: 0 }));
    const textarea = document.getElementById("addtext-value");
    textarea.value = "TEMP";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    const afterAdd = document.getElementById("addtext-apply").textContent;
    document.getElementById("addtext-delete").click();
    return {
      afterAdd,
      afterDelete: document.getElementById("addtext-apply").textContent,
      rows: document.querySelectorAll("#addtext-list .addtext-entry").length,
    };
  })()`);
  check(deleteResult.afterAdd === "Apply text (3)", "adding a box updates the count");
  check(deleteResult.afterDelete === "Apply text (2)", "deleting the selected box updates the count");
  check(deleteResult.rows === 2, "deleted box is gone from the list");

  // A Cancel during the async file read must invalidate that job.
  console.log("Cancel race");
  const cancelProbe = await evaluate(`(async () => {
    const original = File.prototype.arrayBuffer;
    let delay = 700;
    File.prototype.arrayBuffer = function () {
      if (!delay) return original.call(this);
      return new Promise((resolve, reject) => {
        setTimeout(() => original.call(this).then(resolve, reject), delay);
      });
    };
    document.getElementById("addtext-apply").click();
    await new Promise((resolve) => setTimeout(resolve, 150));
    const button = document.getElementById("cancel-btn");
    const rect = button.getBoundingClientRect();
    const visible = !button.hidden && rect.width > 0 && rect.height > 0;
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    delay = 0;
    File.prototype.arrayBuffer = original;
    return { visible, width: rect.width, height: rect.height };
  })()`);
  check(cancelProbe.visible, "Cancel is visible while an Add text job runs");
  await new Promise((resolve) => setTimeout(resolve, 900));
  check(
    (await evaluate("window.__textEdits.length")) === 0,
    "a cancelled job never posts to a worker"
  );

  // ---- Apply, then validate the coordinates the page sent to the worker ----
  console.log("Applying text");
  await evaluate(`document.getElementById("addtext-apply").click()`);
  await waitFor("!document.getElementById('result-panel').hidden", "result panel", 40000);
  check(
    (await evaluate(`document.getElementById("result-title").textContent`)) === "Text added",
    "result panel says Text added"
  );

  const output = await evaluate(`(async () => {
    const href = document.getElementById("download-link").href;
    const buffer = await (await fetch(href)).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(index, index + 0x8000));
    }
    return { base64: btoa(binary), filename: document.getElementById("download-link").download };
  })()`);
  const outputPath = join(ARTIFACTS, "out.pdf");
  writeFileSync(outputPath, Buffer.from(output.base64, "base64"));
  check(output.filename === "sample_text-added.pdf", "download name uses the _text-added suffix");

  const edits = await evaluate("window.__textEdits");
  check(Array.isArray(edits) && edits.length === 1 && edits[0].length === 2, "two edits were sent to the worker");
  if (edits?.length) {
    const [first, second] = edits[0];
    check(first.page === 1 && first.text === "HELLO PDF", "page 1 edit has the expected text");
    near(first.x, PAGE_WIDTH * 0.35, 2.5, "page 1 edit x maps to 35% of the page width");
    near(first.y, PAGE_HEIGHT * 0.35, 2.5, "page 1 edit y follows the drag to 65% from the top");

    check(second.page === 2 && second.text === "SECOND PAGE\n\nNOTE", "page 2 edit has multi-line text");
    check(second.font === "Times" && second.bold === true, "page 2 edit keeps Times + bold");
    check(second.size === 24 && second.color === "#cc0000", "page 2 edit keeps 24pt + red");
    near(second.x, PAGE_WIDTH * 0.5, 2.5, "page 2 edit x maps to the page centre");
    near(second.y, PAGE_HEIGHT * 0.5, 2.5, "page 2 edit y maps to the page centre while zoomed");
  }

  const text = pdfText(outputPath);
  if (text === null) {
    console.log("  skip pdftotext not installed, skipping PDF text checks");
  } else {
    check(text.includes("HELLO PDF"), "output PDF contains HELLO PDF");
    check(text.includes("SECOND PAGE") && text.includes("NOTE"), "output PDF contains the multi-line page 2 text");
    const editedTitle = text.includes("Quarterly report");
    check(editedTitle, "output PDF keeps the original page content");

    let bbox = null;
    try {
      bbox = execFileSync("pdftotext", ["-f", "2", "-l", "2", "-bbox", outputPath, "-"], {
        encoding: "utf8",
      });
    } catch {
      bbox = null;
    }
    if (bbox === null) {
      console.log("  skip pdftotext -bbox unavailable, skipping blank-line spacing check");
    } else {
      const wordY = (xml, word) => {
        const match = xml.match(new RegExp(`<word[^>]*yMin="([\\d.]+)"[^>]*>${word}</word>`));
        return match ? Number(match[1]) : NaN;
      };
      const secondY = wordY(bbox, "SECOND");
      const noteY = wordY(bbox, "NOTE");
      check(Number.isFinite(secondY) && Number.isFinite(noteY), "blank-line words appear in the PDF");
      if (Number.isFinite(secondY) && Number.isFinite(noteY)) {
        near(noteY - secondY, 2 * 24 * 1.2, 6, "blank line keeps its vertical space in the PDF");
      }
    }
  }

  // ---- Regression: the Edit text tool still replaces existing text ----
  console.log("Edit text regression");
  await evaluate(`document.querySelector('[data-tool="text"]').click()`);
  await waitFor("document.querySelectorAll('#page-gallery .page-tile').length === 3", "text gallery tiles");
  await evaluate(`document.querySelector('#page-gallery .page-tile[data-page="1"]').click()`);
  await waitFor(
    "!document.getElementById('text-editor-panel').hidden && document.getElementById('text-existing-list').children.length > 0",
    "text editor with existing text"
  );
  await evaluate(`document.querySelector('#text-existing-list .text-existing-item').click()`);
  await evaluate(`(() => {
    const value = document.getElementById("text-value");
    value.value = "REPLACEDWORD";
    value.dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("text-place-btn").click();
    document.getElementById("text-apply-btn").click();
  })()`);
  await waitFor("!document.getElementById('result-panel').hidden", "edit-text result", 40000);
  check(
    (await evaluate(`document.getElementById("result-title").textContent`)) === "Text edits applied",
    "Edit text result panel appears"
  );

  const editedOutput = await evaluate(`(async () => {
    const href = document.getElementById("download-link").href;
    const buffer = await (await fetch(href)).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(index, index + 0x8000));
    }
    return btoa(binary);
  })()`);
  const editedPath = join(ARTIFACTS, "edited.pdf");
  writeFileSync(editedPath, Buffer.from(editedOutput, "base64"));
  const editedText = pdfText(editedPath);
  if (editedText !== null) {
    check(editedText.includes("REPLACEDWORD"), "Edit text output contains the replacement text");
  }

  // ---- Zoom cross-check on the Edit text editor ----
  console.log("Edit text zoom");
  await evaluate(`document.getElementById("text-editor-panel").scrollIntoView({ block: "start" })`);
  const textZoom = await evaluate(`(async () => {
    const scroller = document.querySelector("#text-editor-panel .text-preview-scroll");
    const before = document.getElementById("text-preview-canvas").getBoundingClientRect().width;
    document.getElementById("text-zoom-in").click();
    await new Promise((resolve) => setTimeout(resolve, 900));
    return {
      before,
      after: document.getElementById("text-preview-canvas").getBoundingClientRect().width,
      label: document.getElementById("text-zoom-label").textContent,
      scrollWidth: scroller.scrollWidth,
      clientWidth: scroller.clientWidth,
    };
  })()`);
  check(textZoom.label === "125%", `Edit text zoom label reads 125% (got ${textZoom.label})`);
  check(
    Math.abs(textZoom.after - textZoom.before * 1.25) < 2,
    `Edit text zoom enlarges the page (${textZoom.before} -> ${textZoom.after})`
  );
  check(textZoom.scrollWidth > textZoom.clientWidth, "Edit text zoomed preview scrolls");
  await screenshot("edittext-zoom.png");

  const maxZoom = await evaluate(`(async () => {
    for (let step = 0; step < 5; step += 1) {
      document.getElementById("text-zoom-in").click();
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
    const scroller = document.querySelector("#text-editor-panel .text-preview-scroll");
    const zoomBar = document.querySelector("#text-editor-panel .zoom-bar").getBoundingClientRect();
    const result = {
      label: document.getElementById("text-zoom-label").textContent,
      scrollerHeight: scroller.getBoundingClientRect().height,
      clientHeight: scroller.clientHeight,
      scrollHeight: scroller.scrollHeight,
      windowHeight: window.innerHeight,
      zoomBarBottom: zoomBar.bottom,
    };
    document.getElementById("text-zoom-fit").click();
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { ...result, fitted: document.getElementById("text-zoom-label").textContent };
  })()`);
  check(maxZoom.label === "400%", `zoom can reach 400% (got ${maxZoom.label})`);
  check(
    maxZoom.scrollerHeight <= maxZoom.windowHeight * 0.8,
    `the preview is height-capped at 400% (${Math.round(maxZoom.scrollerHeight)}px)`
  );
  check(maxZoom.zoomBarBottom <= maxZoom.windowHeight, "the zoom bar stays on screen at 400%");
  check(maxZoom.scrollHeight > maxZoom.clientHeight, "a 400% page scrolls inside the preview");
  check(maxZoom.fitted === "100%", "Fit returns to 100%");

  check(consoleErrors.length === 0, `no browser console errors (${JSON.stringify(consoleErrors)})`);

  ws.close();

  console.log();
  if (failures.length) {
    console.error(`${failures.length} check(s) failed`);
    process.exitCode = 1;
  } else {
    console.log("All checks passed");
  }
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
