#!/usr/bin/env python3
"""
Servidor de desenvolvimento SEM CACHE para o jogo Pedro vai ao Mercado.
Uso: python server.py
"""
import http.server
import socketserver

PORT = 8080

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Garante que o browser nunca use cache — essencial para ES6 modules
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Silencia o log de cada request para não poluir o terminal
        pass

print(f'Servidor SEM CACHE rodando em http://localhost:{PORT}')
print('Pressione Ctrl+C para parar.\n')

with socketserver.TCPServer(('', PORT), NoCacheHandler) as httpd:
    httpd.serve_forever()
