#!/usr/bin/env python3
"""pdfcompress - a small command-line PDF compressor.

Lossy mode uses Ghostscript to downsample/re-encode images.  "lossless"
mode uses mutool (or qpdf, if available) to rebuild/optimize the PDF
without changing image/text quality.

Examples:
    ./pdfcompress.py input.pdf
    ./pdfcompress.py input.pdf -o smaller.pdf --preset strong
    ./pdfcompress.py *.pdf -o compressed/ --preset balanced
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Sequence


@dataclass(frozen=True)
class Preset:
    dpi: Optional[int]
    jpeg_quality: Optional[int]
    pdfsettings: Optional[str]


PRESETS = {
    # Structural only: no image resampling, image bits are preserved.
    "lossless": Preset(dpi=None, jpeg_quality=None, pdfsettings=None),
    # Good for documents that may still need to be printed.
    "light": Preset(dpi=300, jpeg_quality=85, pdfsettings="/prepress"),
    # Good general-purpose default: screen viewing, email, web.
    "balanced": Preset(dpi=150, jpeg_quality=75, pdfsettings="/ebook"),
    # Noticeably smaller; text in scanned pages may become soft.
    "strong": Preset(dpi=120, jpeg_quality=60, pdfsettings="/screen"),
    # Smallest; use only when image quality does not matter.
    "extreme": Preset(dpi=72, jpeg_quality=40, pdfsettings="/screen"),
}


class ToolError(RuntimeError):
    pass


def find_executable(*names: str) -> Optional[str]:
    for name in names:
        path = shutil.which(name)
        if path:
            return path
    return None


def find_ghostscript() -> Optional[str]:
    return find_executable("gs", "gswin64c", "gswin32c")


def find_mutool() -> Optional[str]:
    return find_executable("mutool")


def find_qpdf() -> Optional[str]:
    return find_executable("qpdf")


def human_size(num_bytes: int) -> str:
    size = float(num_bytes)
    for unit in ("B", "KiB", "MiB", "GiB"):
        if size < 1024 or unit == "GiB":
            return f"{size:.1f} {unit}" if unit != "B" else f"{int(size)} B"
        size /= 1024
    return f"{size:.1f} GiB"


def default_file_mode() -> int:
    """Return the mode a normal file would get with the current umask."""
    mask = os.umask(0)
    os.umask(mask)
    return 0o666 & ~mask


def check_pdf(src: Path) -> None:
    if not src.is_file():
        raise ToolError(f"input file not found: {src}")
    if src.suffix.lower() != ".pdf":
        raise ToolError(f"not a .pdf file: {src}")


def output_for(src: Path, output: Optional[Path], suffix: str) -> Path:
    """Determine the output path for one input file."""
    if output is None:
        return src.with_name(f"{src.stem}{suffix}.pdf")

    # If the caller passed an existing directory, or -o ends with a
    # path separator, treat it as the destination directory.
    if output.is_dir() or str(output).endswith(("/", os.sep)):
        return output / f"{src.stem}{suffix}.pdf"
    return output


def ghostscript_command(
    gs: str,
    src: Path,
    dst: Path,
    *,
    dpi: int,
    jpeg_quality: int,
    pdfsettings: str,
    mono_dpi: int,
) -> list[str]:
    return [
        gs,
        "-q",
        "-dNOPAUSE",
        "-dBATCH",
        "-dSAFER",
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.5",
        "-dDetectDuplicateImages=true",
        # Font handling.
        "-dCompressFonts=true",
        "-dSubsetFonts=true",
        "-dEmbedAllFonts=true",
        # Keep pages upright and annotations intact where possible.
        "-dAutoRotatePages=/None",
        "-dPreserveAnnots=true",
        # General preset, then explicit overrides below.
        f"-dPDFSETTINGS={pdfsettings}",
        # Colour images -> downsample + JPEG.
        "-dDownsampleColorImages=true",
        f"-dColorImageResolution={dpi}",
        "-dColorImageDownsampleThreshold=1.0",
        "-dColorImageDownsampleType=/Bicubic",
        "-dAutoFilterColorImages=false",
        "-dColorImageFilter=/DCTEncode",
        # Grayscale images -> downsample + JPEG.
        "-dDownsampleGrayImages=true",
        f"-dGrayImageResolution={dpi}",
        "-dGrayImageDownsampleThreshold=1.0",
        "-dGrayImageDownsampleType=/Bicubic",
        "-dAutoFilterGrayImages=false",
        "-dGrayImageFilter=/DCTEncode",
        # 1-bit images (often scanned text) are kept at a higher DPI.
        "-dDownsampleMonoImages=true",
        f"-dMonoImageResolution={mono_dpi}",
        "-dMonoImageDownsampleThreshold=1.0",
        "-dMonoImageDownsampleType=/Subsample",
        # JPEG quality for DCT-encoded images.
        f"-dJPEGQ={jpeg_quality}",
        f"-sOutputFile={dst}",
        str(src),
    ]


def run_command(cmd: Sequence[str], *, verbose: bool) -> None:
    if verbose:
        print("  $ " + " ".join(str(part) for part in cmd))
    try:
        proc = subprocess.run(
            [str(part) for part in cmd],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
    except OSError as exc:
        raise ToolError(f"could not run {cmd[0]}: {exc}") from exc

    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout or "").strip()
        if len(detail) > 1500:
            detail = detail[:1500] + "\n[output truncated]"
        raise ToolError(
            f"{Path(str(cmd[0])).name} failed with exit code {proc.returncode}"
            + (f":\n{detail}" if detail else "")
        )


def lossless_command(src: Path, dst: Path, *, engine: str) -> tuple[list[str], str]:
    """Return (command, label) for a lossless optimisation engine."""
    if engine in ("auto", "mutool"):
        mutool = find_mutool()
        if mutool:
            return (
                [
                    mutool,
                    "clean",
                    "-gggg",  # garbage collect, compact, merge duplicates
                    "-z",     # deflate uncompressed streams
                    "-Z",     # use object streams where possible
                    "-f",     # compress font streams
                    "-e", "100",
                    str(src),
                    str(dst),
                ],
                "mutool clean",
            )
        if engine == "mutool":
            raise ToolError("mutool was requested but was not found on PATH")

    if engine in ("auto", "qpdf"):
        qpdf = find_qpdf()
        if qpdf:
            return (
                [
                    qpdf,
                    "--object-streams=generate",
                    "--compress-streams=y",
                    "--recompress-flate",
                    "--compression-level=9",
                    str(src),
                    str(dst),
                ],
                "qpdf",
            )
        if engine == "qpdf":
            raise ToolError("qpdf was requested but was not found on PATH")

    if engine == "ghostscript":
        raise ToolError(
            "Ghostscript cannot be used for --preset lossless; "
            "use mutool/qpdf or choose a lossy preset."
        )
    raise ToolError(
        "lossless mode needs mutool or qpdf. Install one of them, "
        "or use a lossy preset (e.g. --preset balanced)."
    )


def compress_lossless(
    src: Path,
    dst: Path,
    *,
    engine: str,
    verbose: bool,
) -> str:
    """Rebuild a PDF without resampling images. Returns engine used."""
    cmd, label = lossless_command(src, dst, engine=engine)
    run_command(cmd, verbose=verbose)
    return label


def ghostscript_command_for(
    src: Path,
    dst: Path,
    *,
    preset_name: str,
    dpi: int,
    jpeg_quality: int,
    mono_dpi: int,
    engine: str,
) -> tuple[list[str], str]:
    if engine not in ("auto", "ghostscript"):
        raise ToolError(f"engine {engine!r} cannot be used for a lossy preset")
    gs = find_ghostscript()
    if not gs:
        raise ToolError(
            "Ghostscript was not found on PATH. Install it first:\n"
            "  Debian/Ubuntu: sudo apt install ghostscript\n"
            "  macOS:         brew install ghostscript\n"
            "  Windows:       https://www.ghostscript.com/releases/gsdnld.html"
        )
    cmd = ghostscript_command(
        gs,
        src,
        dst,
        dpi=dpi,
        jpeg_quality=jpeg_quality,
        pdfsettings=PRESETS[preset_name].pdfsettings or "/default",
        mono_dpi=mono_dpi,
    )
    return cmd, f"Ghostscript ({preset_name})"


def compress_with_ghostscript(
    src: Path,
    dst: Path,
    *,
    preset_name: str,
    dpi: int,
    jpeg_quality: int,
    mono_dpi: int,
    engine: str,
    verbose: bool,
) -> str:
    cmd, label = ghostscript_command_for(
        src,
        dst,
        preset_name=preset_name,
        dpi=dpi,
        jpeg_quality=jpeg_quality,
        mono_dpi=mono_dpi,
        engine=engine,
    )
    run_command(cmd, verbose=verbose)
    return label


def compress_one(
    src: Path,
    dst: Path,
    *,
    preset_name: str,
    engine: str,
    dpi_override: Optional[int],
    quality_override: Optional[int],
    mono_dpi: int,
    force: bool,
    dry_run: bool,
    verbose: bool,
) -> bool:
    check_pdf(src)
    src = src.resolve()
    dst = dst.resolve()

    if src == dst:
        raise ToolError("input and output are the same file")
    if dst.exists() and not force:
        raise ToolError(f"output already exists (use --force): {dst}")

    preset = PRESETS[preset_name]
    if preset.dpi is None:
        dpi = None
        jpeg_quality = None
    else:
        dpi = dpi_override or preset.dpi
        jpeg_quality = quality_override or preset.jpeg_quality or 75

    # Build (but do not run) the command for --dry-run.
    if dry_run:
        if preset.dpi is None:
            cmd, _ = lossless_command(src, dst, engine=engine)
        else:
            cmd, _ = ghostscript_command_for(
                src,
                dst,
                preset_name=preset_name,
                dpi=dpi,
                jpeg_quality=jpeg_quality,
                mono_dpi=mono_dpi,
                engine=engine,
            )
        print("  $ " + " ".join(str(part) for part in cmd))
        print(f"  (dry run; would write {dst})")
        return True

    dst.parent.mkdir(parents=True, exist_ok=True)

    # Write to a temporary file first so a failed/killed conversion never
    # leaves a corrupt destination behind.
    fd, tmp_name = tempfile.mkstemp(
        prefix=f".{dst.stem}.", suffix=".pdf", dir=str(dst.parent)
    )
    os.close(fd)
    tmp = Path(tmp_name)

    start = time.monotonic()
    try:
        if preset.dpi is None:
            engine_used = compress_lossless(
                src, tmp, engine=engine, verbose=verbose
            )
        else:
            engine_used = compress_with_ghostscript(
                src, tmp,
                preset_name=preset_name,
                dpi=dpi,
                jpeg_quality=jpeg_quality,
                mono_dpi=mono_dpi,
                engine=engine,
                verbose=verbose,
            )

        if not tmp.is_file() or tmp.stat().st_size == 0:
            raise ToolError(f"{engine_used} did not produce a valid output file")

        original_size = src.stat().st_size
        new_size = tmp.stat().st_size
        elapsed = time.monotonic() - start
        try:
            os.chmod(tmp, default_file_mode())
        except OSError:
            pass
        os.replace(tmp, dst)
    except BaseException:
        try:
            tmp.unlink(missing_ok=True)
        except OSError:
            pass
        raise

    saved = original_size - new_size
    percent = (saved / original_size * 100) if original_size else 0.0
    ratio = (new_size / original_size) if original_size else 0.0
    note = "" if saved > 0 else "  [WARNING: not smaller than original]"
    print(
        f"{src.name}: {human_size(original_size)} -> {human_size(new_size)} "
        f"({ratio:.2f}x, {percent:.1f}% saved, {elapsed:.1f}s, {engine_used})"
        f"{note}"
    )
    return saved > 0


def validate_choice(
    parser: argparse.ArgumentParser,
    name: str,
    value: int,
    low: int,
    high: int,
) -> None:
    if value < low or value > high:
        parser.error(f"{name} must be between {low} and {high}")


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        prog="pdfcompress",
        description=(
            "Compress PDF files. Lossy presets use Ghostscript; "
            "--preset lossless uses mutool or qpdf."
        ),
    )
    parser.add_argument(
        "inputs", nargs="+", type=Path, metavar="PDF",
        help="input PDF file(s)",
    )
    parser.add_argument(
        "-o", "--output", type=Path,
        help=(
            "output file; when multiple inputs are given this must be a "
            "directory. By default input_compressed.pdf is created next to "
            "each input."
        ),
    )
    parser.add_argument(
        "--preset", choices=sorted(PRESETS), default="balanced",
        help="compression profile (default: balanced)",
    )
    parser.add_argument(
        "--engine", choices=("auto", "ghostscript", "mutool", "qpdf"),
        default="auto",
        help=(
            "backend to use. auto picks Ghostscript for lossy presets and "
            "mutool/qpdf for lossless."
        ),
    )
    parser.add_argument(
        "--dpi", type=int,
        help="override image DPI for lossy presets (e.g. 150)",
    )
    parser.add_argument(
        "--jpeg-quality", type=int, metavar="1-100",
        help="override JPEG quality for lossy presets (e.g. 75)",
    )
    parser.add_argument(
        "--mono-dpi", type=int, default=300, metavar="N",
        help="DPI for 1-bit/monochrome images (default: 300)",
    )
    parser.add_argument(
        "--suffix", default="_compressed",
        help="output suffix added when -o is not given (default: _compressed)",
    )
    parser.add_argument(
        "-f", "--force", action="store_true",
        help="overwrite the output if it already exists",
    )
    parser.add_argument(
        "-n", "--dry-run", action="store_true",
        help="print the command that would be run, but do not write anything",
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true",
        help="print the underlying command and any tool output on error",
    )
    args = parser.parse_args(argv)

    if args.dpi is not None:
        validate_choice(parser, "--dpi", args.dpi, 10, 2400)
    if args.jpeg_quality is not None:
        validate_choice(parser, "--jpeg-quality", args.jpeg_quality, 1, 100)
    if args.mono_dpi is not None:
        validate_choice(parser, "--mono-dpi", args.mono_dpi, 10, 2400)

    if args.preset == "lossless" and (
        args.dpi is not None or args.jpeg_quality is not None
    ):
        parser.error("--dpi and --jpeg-quality only apply to lossy presets")

    inputs = [p.expanduser() for p in args.inputs]
    output = args.output.expanduser() if args.output is not None else None
    if output is not None and len(inputs) > 1:
        if output.exists() and not output.is_dir():
            parser.error(
                "-o/--output must be a directory when multiple inputs are given"
            )
        if not args.dry_run:
            try:
                output.mkdir(parents=True, exist_ok=True)
            except OSError as exc:
                parser.error(f"could not create output directory {output}: {exc}")

    failures: list[str] = []
    multi = len(inputs) > 1
    for src in inputs:
        try:
            if multi and output is not None:
                dst = output / f"{src.stem}{args.suffix}.pdf"
            else:
                dst = output_for(src, output, args.suffix)
            compress_one(
                src,
                dst,
                preset_name=args.preset,
                engine=args.engine,
                dpi_override=args.dpi,
                quality_override=args.jpeg_quality,
                mono_dpi=args.mono_dpi,
                force=args.force,
                dry_run=args.dry_run,
                verbose=args.verbose,
            )
        except ToolError as exc:
            failures.append(f"{src}: {exc}")
            print(f"error: {src}: {exc}", file=sys.stderr)

    return 1 if failures else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\ninterrupted", file=sys.stderr)
        raise SystemExit(130)
