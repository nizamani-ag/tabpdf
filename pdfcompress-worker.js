import loadGS from "./vendor/ghostpdl/gs.js";

function send(message, transfer = []) {
  self.postMessage(message, transfer);
}

const recentMessages = [];

function noteMessage(line) {
  const trimmed = line.trim();
  if (!trimmed) return;
  recentMessages.push(trimmed);
  if (recentMessages.length > 30) recentMessages.shift();
}

function reportLog(text) {
  const lines = String(text).split(/\r?\n/);
  for (const line of lines) {
    const totalMatch = line.match(/Processing pages \d+ through (\d+)/i);
    if (totalMatch) {
      send({ type: "progress", current: 0, total: Number(totalMatch[1]) });
      continue;
    }
    const pageMatch = line.match(/^Page (\d+)\b/i);
    if (pageMatch) {
      send({ type: "progress", current: Number(pageMatch[1]) });
      continue;
    }
    noteMessage(line);
  }
}

self.onmessage = async (event) => {
  const { buffer, args } = event.data || {};

  try {
    if (!(buffer instanceof ArrayBuffer)) {
      throw new Error("Invalid file data.");
    }
    if (!Array.isArray(args) || args.length === 0) {
      throw new Error("Invalid Ghostscript arguments.");
    }

    send({ type: "status", text: "Loading Ghostscript WASM (first run may take a moment)…" });
    const Module = await loadGS({
      print: reportLog,
      printErr: reportLog,
    });

    send({ type: "status", text: "Preparing PDF in memory…" });
    Module.FS.writeFile("input.pdf", new Uint8Array(buffer));

    send({ type: "status", text: "Compressing…" });
    let exitCode;
    try {
      exitCode = Module.callMain(args);
    } catch (error) {
      // Emscripten sometimes throws an exit status object instead of returning it.
      if (typeof error === "number") exitCode = error;
      else if (error && typeof error.status === "number") exitCode = error.status;
      else throw error;
    }

    let output = null;
    try {
      output = Module.FS.readFile("output.pdf");
    } catch {
      output = null;
    }

    if (exitCode !== 0) {
      const detail = recentMessages.length ? `\n\n${recentMessages.join("\n")}` : "";
      throw new Error(`Ghostscript exited with code ${exitCode}.${detail}`);
    }
    if (!output || output.length === 0) {
      throw new Error("Ghostscript finished but produced no output file.");
    }

    // Copy out of the WASM heap before transferring ownership to the UI thread.
    const copy = output.slice();
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
