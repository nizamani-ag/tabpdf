#!/usr/bin/env python3
"""Start the local TabPDF web app and open it in a browser.

The app itself is a static HTML/JS page.  This launcher exists because
browsers only allow WASM and module workers to load over HTTP(S), not from
a plain file:// path.
"""

from __future__ import annotations

import argparse
import http.server
import socket
import sys
import threading
import webbrowser
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".wasm": "application/wasm",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".webmanifest": "application/manifest+json",
    }

    def end_headers(self) -> None:  # noqa: D102
        if self.path.endswith(".wasm"):
            self.send_header("Cache-Control", "public, max-age=604800")
        else:
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:  # noqa: D102
        print(f"[web] {fmt % args}")


def make_server(host: str, preferred_port: int) -> tuple[http.server.ThreadingHTTPServer, int]:
    handler = partial(Handler, directory=str(ROOT))

    if preferred_port == 0:
        server = http.server.ThreadingHTTPServer((host, 0), handler)
        return server, server.server_address[1]

    last_error: OSError | None = None
    for port in range(preferred_port, preferred_port + 25):
        try:
            server = http.server.ThreadingHTTPServer((host, port), handler)
            return server, port
        except OSError as exc:
            last_error = exc

    raise SystemExit(
        f"Could not bind a port in {preferred_port}-{preferred_port + 24}: {last_error}"
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--port", type=int, default=8765,
        help="preferred port (default: 8765; tries the next 24 ports if busy)",
    )
    parser.add_argument(
        "--host", default="127.0.0.1",
        help="interface to bind (default: 127.0.0.1, local-only)",
    )
    parser.add_argument(
        "--no-browser", action="store_true",
        help="do not open a browser automatically",
    )
    args = parser.parse_args(argv)

    if args.host not in ("127.0.0.1", "localhost", "::1"):
        print(
            "WARNING: binding to a non-local address exposes this app on your "
            "network. Use 127.0.0.1 unless you know what you are doing.",
            file=sys.stderr,
        )

    server, port = make_server(args.host, args.port)
    host_display = args.host
    if ":" in host_display and not host_display.startswith("["):
        host_display = f"[{host_display}]"
    url = f"http://{host_display}:{port}/"

    print()
    print("  TabPDF is ready")
    print(f"  {url}")
    print()
    print("  Everything is processed locally in your browser tab.")
    print("  Press Ctrl+C to stop the server.")
    print()

    if not args.no_browser:
        threading.Timer(0.35, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
