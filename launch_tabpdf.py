#!/usr/bin/env python3
"""Launch the local TabPDF app in the default browser.

If the local server is not already running, this starts `run_web.py`
in the background, waits until it is reachable, then opens the browser.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
DEFAULT_PORT = 8765
PORT_RANGE = range(DEFAULT_PORT, DEFAULT_PORT + 25)
def _server_log_path() -> Path | None:
    candidates = [
        Path.home() / ".cache" / "tabpdf",
        Path(tempfile.gettempdir()) / "tabpdf",
    ]
    for directory in candidates:
        try:
            directory.mkdir(parents=True, exist_ok=True)
            return directory / "server.log"
        except OSError:
            continue
    return None


def is_toolkit_running(port: int) -> bool:
    try:
        with urllib.request.urlopen(f"http://{HOST}:{port}/", timeout=0.45) as response:
            if response.status != 200:
                return False
            head = response.read(4096)
            return b"TabPDF" in head
    except Exception:
        return False


def find_running_toolkit() -> str | None:
    for port in PORT_RANGE:
        if is_toolkit_running(port):
            return f"http://{HOST}:{port}/"
    return None


def start_server() -> subprocess.Popen:
    log_path = _server_log_path()
    log = log_path.open("a", encoding="utf-8") if log_path else subprocess.DEVNULL
    try:
        process = subprocess.Popen(
            [sys.executable, str(ROOT / "run_web.py"), "--no-browser"],
            cwd=str(ROOT),
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=log,
            start_new_session=True,
            close_fds=True,
        )
    finally:
        if log_path:
            log.close()
    return process


def wait_for_toolkit(timeout: float = 15.0) -> str | None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        url = find_running_toolkit()
        if url:
            return url
        time.sleep(0.15)
    return None


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--print-url",
        action="store_true",
        help="print the toolkit URL instead of opening a browser",
    )
    args = parser.parse_args(argv)

    url = find_running_toolkit()
    if url is None:
        start_server()
        url = wait_for_toolkit()

    if url is None:
        log_path = _server_log_path()
        detail = f" See {log_path} for details." if log_path else ""
        print(f"Could not start TabPDF.{detail}", file=sys.stderr)
        return 1

    if args.print_url:
        print(url)
    else:
        webbrowser.open(url)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
