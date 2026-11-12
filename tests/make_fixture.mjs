/*
 * Generates the synthetic PDF used by the end-to-end test.
 * It contains no real data, so the repo can stay free of private documents.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "../vendor/pdf-lib/pdf-lib.esm.min.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const FIXTURE_PATH = join(ROOT, "tests", "fixtures", "sample.pdf");

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const TITLES = ["Quarterly report", "Project notes", "Reference page"];

export async function createFixture() {
  const doc = await PDFDocument.create();
  doc.setTitle("TabPDF test document");
  doc.setAuthor("TabPDF test suite");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  for (let index = 0; index < TITLES.length; index += 1) {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawText(TITLES[index], {
      x: 60,
      y: 780,
      size: 26,
      font: bold,
      color: rgb(0.08, 0.1, 0.2),
    });
    page.drawText(`Synthetic test document - page ${index + 1} of ${TITLES.length}`, {
      x: 60,
      y: 748,
      size: 12,
      font,
      color: rgb(0.35, 0.37, 0.42),
    });
    for (let line = 0; line < 12; line += 1) {
      page.drawText(`Line ${line + 1}: the quick brown fox jumps over the lazy dog.`, {
        x: 60,
        y: 700 - line * 22,
        size: 11,
        font,
        color: rgb(0.12, 0.14, 0.2),
      });
    }
    page.drawText(`Page ${index + 1}`, {
      x: 280,
      y: 40,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.55),
    });
  }

  mkdirSync(dirname(FIXTURE_PATH), { recursive: true });
  writeFileSync(FIXTURE_PATH, await doc.save());
  return FIXTURE_PATH;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = await createFixture();
  console.log(`wrote ${path}`);
}
