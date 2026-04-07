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

// ─── MAIN REQUEST FUNCTION ────────────────────────────────────────────────────

function request({ method, url, headers = {}, body = null }) {

  return Promise.reject(new Error('Not implemented yet'));
}

module.exports = { request, parseUrl, buildRequest };
