#!/usr/bin/env python3
import http.server
import socketserver
import os
from urllib.parse import unquote

PORT = 5000
HOST = "0.0.0.0"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        path = unquote(self.path)
        
        if path == '/':
            self.send_response(302)
            self.send_header('Location', '/funil-2/upsell1/')
            self.end_headers()
            return
        
        if path == '/login':
            self.send_response(302)
            self.send_header('Location', '/login/')
            self.end_headers()
            return
        
        if path == '/funil-2':
            self.send_response(302)
            self.send_header('Location', '/funil-2/upsell1/')
            self.end_headers()
            return
        
        return super().do_GET()

os.chdir(os.path.dirname(os.path.abspath(__file__)))

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

with ReusableTCPServer((HOST, PORT), MyHTTPRequestHandler) as httpd:
    print(f"Server running at http://{HOST}:{PORT}/")
    print(f"Serving files from: {os.getcwd()}")
    httpd.serve_forever()
