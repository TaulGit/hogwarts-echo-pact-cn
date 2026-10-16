#!/usr/bin/env python3
"""Start the local static game; uses only the Python standard library."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

root = Path(__file__).resolve().parent / 'dist'
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
url = 'http://127.0.0.1:%s/' % server.server_address[1]
print('霍格沃茨：回声之约\n' + url + '\n关闭这个终端窗口即可停止服务。', flush=True)
webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
