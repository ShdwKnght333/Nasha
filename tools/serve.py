"""Threaded static server for local preview.

The stdlib single-threaded handler stalls when a browser opens several
parallel connections, which made headless screenshot runs time out.
"""

import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PORT = int(os.environ.get("PORT", "8765"))

if __name__ == "__main__":
    handler = partial(SimpleHTTPRequestHandler, directory=ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    server.daemon_threads = True
    print(f"Serving {ROOT} on http://127.0.0.1:{PORT}/")
    server.serve_forever()
