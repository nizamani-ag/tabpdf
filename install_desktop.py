#!/usr/bin/env python3
"""Install the TabPDF app icon and desktop launchers.

Creates:
  ~/.local/share/applications/tabpdf.desktop
  ~/Desktop/TabPDF.desktop   (when the Desktop folder exists)

Also installs the PNG/SVG icon into the local hicolor icon theme.
Run this from a normally writable desktop session.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ICONS_DIR = ROOT / "icons"
ICON_SVG = ROOT / "icon.svg"
LAUNCHER = ROOT / "launch_tabpdf.py"
PYTHON = Path(sys.executable).resolve()
SIZES = (16, 32, 48, 64, 128, 256, 512)


def desktop_dir() -> Path:
    try:
        result = subprocess.run(
            ["xdg-user-dir", "DESKTOP"],
            check=True,
            capture_output=True,
            text=True,
        )
        path = Path(result.stdout.strip())
        if path:
            return path
    except Exception:
        pass
    return Path.home() / "Desktop"


def data_home() -> Path:
    return Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share"))


def desktop_entry(icon_path: Path) -> str:
    return "\n".join(
        [
            "[Desktop Entry]",
            "Version=1.0",
            "Type=Application",
            "Name=TabPDF",
            "GenericName=PDF editor",
            "Comment=Compress, rearrange pages, write on PDFs, and merge — locally",
            f"Exec={PYTHON} {LAUNCHER}",
            f"Path={ROOT}",
            f"Icon={icon_path}",
            "Terminal=false",
            "Categories=Office;",
            "Keywords=PDF;compress;merge;rotate;delete;extract;text;annotate;offline;",
            "StartupNotify=true",
            "",
        ]
    )


def copy_icons(dry_run: bool) -> None:
    icon_root = data_home() / "icons" / "hicolor"
    for size in SIZES:
        target = icon_root / f"{size}x{size}" / "apps" / "tabpdf.png"
        source = ICONS_DIR / f"tabpdf-{size}.png"
        if dry_run:
            print(f"[dry-run] install {source} -> {target}")
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
    target = icon_root / "scalable" / "apps" / "tabpdf.svg"
    if dry_run:
        print(f"[dry-run] install {ICON_SVG} -> {target}")
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ICON_SVG, target)


def update_caches(dry_run: bool) -> None:
    commands = []
    if shutil.which("gtk-update-icon-cache"):
        commands.append(
            ["gtk-update-icon-cache", "-f", "-t", str(data_home() / "icons" / "hicolor")]
        )
    if shutil.which("update-desktop-database"):
        commands.append(
            ["update-desktop-database", str(data_home() / "applications")]
        )
    if dry_run:
        for command in commands:
            print("[dry-run]", " ".join(command))
        return
    for command in commands:
        try:
            subprocess.run(command, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass


def install_launchers(dry_run: bool) -> None:
    icon = ICONS_DIR / "tabpdf-256.png"
    text = desktop_entry(icon)
    applications = data_home() / "applications" / "tabpdf.desktop"
    desktop = desktop_dir() / "TabPDF.desktop"

    for target in (applications, desktop):
        if dry_run:
            print(f"[dry-run] write {target}")
            continue
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8")
            target.chmod(0o755)
        except OSError as exc:
            print(f"warning: could not write {target}: {exc}", file=sys.stderr)
            continue

        if target == desktop and shutil.which("gio"):
            try:
                subprocess.run(
                    ["gio", "set", str(target), "metadata::trusted", "true"],
                    check=False,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            except Exception:
                pass


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="show what would be installed")
    args = parser.parse_args(argv)

    if not ICONS_DIR.is_dir():
        print(f"missing icon directory: {ICONS_DIR}", file=sys.stderr)
        return 1
    if not LAUNCHER.is_file():
        print(f"missing launcher: {LAUNCHER}", file=sys.stderr)
        return 1

    try:
        copy_icons(args.dry_run)
        install_launchers(args.dry_run)
        update_caches(args.dry_run)
    except OSError as exc:
        print(
            f"Could not install desktop files: {exc}\n"
            "The home directory may be read-only in this session. "
            "Run ./install_desktop.py from a normally writable desktop session.",
            file=sys.stderr,
        )
        return 1

    if not args.dry_run:
        print("Installed TabPDF application icon and desktop launcher.")
        print(f"Launcher: {data_home() / 'applications' / 'tabpdf.desktop'}")
        print(f"Desktop:  {desktop_dir() / 'TabPDF.desktop'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
