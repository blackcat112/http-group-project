'use strict';

const net = require('net');

// ─── URL PARSER ───────────────────────────────────────────────────────────────

/**
 * Descompone una URL en sus partes necesarias para abrir el socket TCP
 * Soporta http:// con host, puerto opcional y path
 *
 * parseUrl('http://localhost:3000/cats/1')
 *  -> { host: 'localhost', port: 3000, path: '/cats/1' }
 *
 * @param {string} url
 * @returns {{ host: string, port: number, path: string }}
 */
function parseUrl(url) {
  const match = url.match(/^http:\/\/([^/:]+)(?::(\d+))?(\/.*)?$/);

  if (!match) {
    throw new Error(`Invalid URL: ${url}`);
  }

  return {
    host: match[1],
    port: match[2] ? parseInt(match[2], 10) : 80,
    path: match[3] || '/',
  };
}

// ─── MESSAGE BUILDER ──────────────────────────────────────────────────────────

/**
 * Construye el string HTTP/1.1 completo listo para enviar por el socket TCP
 * Añade automaticamente Host y Content-Length si hay body
 *
 * @param {string} method
 * @param {string} path
 * @param {string} host
 * @param {Object} headers
 * @param {string|null} body
 * @returns {string}
 */
function buildRequest(method, path, host, headers = {}, body = null) {
  const bodyStr = body ? JSON.stringify(body) : '';

  const allHeaders = {
    Host: host,
    'Content-Type': 'application/json',
    Connection: 'close',
    ...headers,
  };

  if (bodyStr.length > 0) {
    allHeaders['Content-Length'] = Buffer.byteLength(bodyStr, 'utf8');
  }

  let message = `${method} ${path} HTTP/1.1\r\n`;

  for (const [key, value] of Object.entries(allHeaders)) {
    message += `${key}: ${value}\r\n`;
  }

  message += '\r\n';

  if (bodyStr.length > 0) {
    message += bodyStr;
  }

  return message;
}

// ─── RESPONSE PARSER ──────────────────────────────────────────────────────────

function parseResponse(rawResponse) {
  const headerEnd = rawResponse.indexOf('\r\n\r\n');

  const rawHeaders = rawResponse.substring(0, headerEnd);
  const body       = rawResponse.substring(headerEnd + 4);

  const lines = rawHeaders.split('\r\n');

  const statusLine  = lines[0];
  const statusParts = statusLine.split(' ');
  const statusCode  = parseInt(statusParts[1], 10);
  const statusText  = statusParts.slice(2).join(' ');

  const headers = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const separatorIdx = line.indexOf(':');
    if (separatorIdx !== -1) {
      const key   = line.substring(0, separatorIdx).trim().toLowerCase();
      const value = line.substring(separatorIdx + 1).trim();
      headers[key] = value;
    }
  }

  return { statusCode, statusText, headers, body };
}

// ─── MAIN REQUEST FUNCTION ────────────────────────────────────────────────────

function request({ method, url, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const { host, port, path } = parseUrl(url);
    const message = buildRequest(method, path, host, headers, body);

    const socket = net.createConnection({ port, host }, () => { 
      socket.write(message);
    });

    let rawResponse = '';
 
    socket.on('data', (chunk) => { 
      rawResponse += chunk.toString('utf8'); // Acumula los datos recibidos en un string hasta que se complete la respuesta

      const headerEnd = rawResponse.indexOf('\r\n\r\n');
      if (headerEnd === -1) return;

      const rawHeaders = rawResponse.substring(0, headerEnd);
      const clMatch    = rawHeaders.match(/content-length:\s*(\d+)/i);

      if (clMatch) {
        const contentLength  = parseInt(clMatch[1], 10);
        const bodyReceived   = Buffer.byteLength(
          rawResponse.substring(headerEnd + 4), 'utf8'
        );

        if (bodyReceived >= contentLength) { // si ya recibimos todo el body esperado, podemos cerrar el socket y resolver
          socket.destroy(); // destroy no esperamos al servirdor nos da igual
          resolve(parseResponse(rawResponse));
        }
      } else {
        socket.destroy();
        resolve(parseResponse(rawResponse));
      }
    });

    socket.on('end', () => {
      if (rawResponse.length > 0) {
        resolve(parseResponse(rawResponse));
      }
    });

    socket.on('error', (err) => {
      reject(new Error(`Socket error: ${err.message}`));
    });

    socket.setTimeout(10000);
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Request timed out after 10s'));
    });
  });
}

module.exports = { request, parseUrl, buildRequest, parseResponse };