"use strict";

const net = require("net");
const tls = require("tls");

// ─── URL PARSER ───────────────────────────────────────────────────────────────

/**
 * Parses a URL string and extracts the host, port, path, and protocol (http/https)
 *
 * parseUrl('http://localhost:3000/cats/1')
 * -> { host: 'localhost', port: 3000, path: '/cats/1' }
 * Soporta http:// con host, puerto opcional y path
 *
 * @param {string} url
 * @returns {{ host: string, port: number, path: string }}
 */
function parseUrl(url) {
  const isHttps = url.startsWith("https://");
  const match = url.match(/^https?:\/\/([^/:]+)(?::(\d+))?(\/.*)?$/);
  if (!match) throw new Error(`Invalid URL: ${url}`);
  return {
    host: match[1],
    port: match[2] ? parseInt(match[2], 10) : isHttps ? 443 : 80,
    path: match[3] || "/",
    isHttps,
  };
}

// ─── MESSAGE BUILDER ──────────────────────────────────────────────────────────

/**
 * Builds the full HTTP/1.1 request string ready to be sent over a TCP socket
 * Automatically adds Host and Content-Length headers if body is present
 *
 * @param {string} method
 * @param {string} path
 * @param {string} host
 * @param {Object} headers
 * @param {string|null} body
 * @returns {string}
 */
function buildRequest(method, path, host, headers = {}, body = null) {
  const bodyStr = body ? JSON.stringify(body) : "";

  const allHeaders = {
    Host: host,
    "Content-Type": "application/json",
    ...headers,
  };

  if (bodyStr.length > 0) {
    allHeaders["Content-Length"] = Buffer.byteLength(bodyStr, "utf8");
  }

  let message = `${method} ${path} HTTP/1.1\r\n`;

  for (const [key, value] of Object.entries(allHeaders)) {
    message += `${key}: ${value}\r\n`;
  }

  message += "\r\n";

  if (bodyStr.length > 0) {
    message += bodyStr;
  }

  return message;
}

// ─── CHUNKED DECODER ──────────────────────────────────────────────────────────

/**
 * Decodes a chunked-transfer-encoded body into a plain string.
 * Format per chunk: "<hex-size>\r\n<data>\r\n" — terminated by "0\r\n\r\n"
 *
 * decodeChunked('1a\r\nThis is the first chunk\r\n0\r\n\r\n')
 *  -> 'This is the first chunk'
 *
 * @param {string} raw  — raw body after the header/body separator
 * @returns {string}    — decoded body
 */
function decodeChunked(raw) {
  let result = "";
  let i = 0;

  while (i < raw.length) {
    const crlfPos = raw.indexOf("\r\n", i); // end of the size line
    if (crlfPos === -1) break;

    const sizeLine = raw.substring(i, crlfPos).trim(); // e.g. "1a" or "1a;ext"
    const chunkSize = parseInt(sizeLine, 16); // parse hex → decimal

    if (isNaN(chunkSize) || chunkSize === 0) break; // 0 chunk = end of body

    const chunkStart = crlfPos + 2; // skip \r\n after size
    result += raw.substring(chunkStart, chunkStart + chunkSize);
    i = chunkStart + chunkSize + 2; // skip chunk data + trailing \r\n
  }

  return result;
}

// ─── RESPONSE PARSER ──────────────────────────────────────────────────────────

function parseResponse(rawResponse) {
  const headerEnd = rawResponse.indexOf("\r\n\r\n");

  const rawHeaders = rawResponse.substring(0, headerEnd);
  let body = rawResponse.substring(headerEnd + 4);

  const lines = rawHeaders.split("\r\n");

  const statusLine = lines[0];
  const statusParts = statusLine.split(" ");
  const statusCode = parseInt(statusParts[1], 10);
  const statusText = statusParts.slice(2).join(" ");

  const headers = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const separatorIdx = line.indexOf(":");
    if (separatorIdx !== -1) {
      const key = line.substring(0, separatorIdx).trim().toLowerCase();
      const value = line.substring(separatorIdx + 1).trim();
      headers[key] = value;
    }
  }

  // decode chunked body if server used Transfer-Encoding: chunked
  if (headers["transfer-encoding"] === "chunked") {
    body = decodeChunked(body);
  }

  return { statusCode, statusText, headers, body };
}

// ─── MAIN REQUEST FUNCTION ────────────────────────────────────────────────────

function request({ method, url, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const { host, port, path, isHttps } = parseUrl(url); // add isHttps in the destructuring assignment
    const message = buildRequest(method, path, host, headers, body);

    const socket = isHttps
      ? tls.connect({ port, host, servername: host }, () =>
          socket.write(message),
        )
      : net.createConnection({ port, host }, () => socket.write(message));

    let responseChunks = [];

    socket.on("data", (chunk) => {
      responseChunks.push(chunk);
      const rawBuffer = Buffer.concat(responseChunks);

      const headerEnd = rawBuffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;

      const rawHeaders = rawBuffer.subarray(0, headerEnd).toString("utf8");
      const clMatch = rawHeaders.match(/content-length:\s*(\d+)/i);
      const isChunked = /transfer-encoding:\s*chunked/i.test(rawHeaders);

      if (clMatch) {
        const contentLength = parseInt(clMatch[1], 10);
        const bodyReceived = rawBuffer.length - (headerEnd + 4);

        if (bodyReceived >= contentLength) {
          // Usamos 'binary' para no corromper imágenes/MIME
          resolve(parseResponse(rawBuffer.toString("binary")));
        }
      } else if (isChunked) {
        // En chunked esperamos al terminador 0\r\n\r\n
        if (rawBuffer.includes("0\r\n\r\n")) {
          resolve(parseResponse(rawBuffer.toString("binary")));
        }
      }
    });

    socket.on("end", () => {
      // for example, if "Connection: close", the server closes the connection after sending the response
      const rawBuffer = Buffer.concat(responseChunks);
      if (rawBuffer.length > 0) {
        resolve(parseResponse(rawBuffer.toString("binary")));
      }
    });

    socket.on("error", (err) => {
      reject(new Error(`Socket error: ${err.message}`));
    });

    socket.setTimeout(10000);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Request timed out after 10s"));
    });
  });
}

module.exports = { request, parseUrl, buildRequest, parseResponse };
