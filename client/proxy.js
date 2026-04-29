'use strict';

const http  = require('http');
const { request } = require('./http-client');

const PROXY_PORT = 4000;

// ─── LEER BODY DE UNA PETICIÓN HTTP ENTRANTE ─────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data',  (chunk) => { raw += chunk.toString(); });
    req.on('end',   ()      => { resolve(raw); });
    req.on('error', (err)   => { reject(err); });
  });
}

// ─── SERVIDOR PUENTE ──────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {

  // CORS — permite que gui.html llame a este servidor local
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight OPTIONS que manda el navegador antes de cada POST
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Solo aceptamos POST /send
  if (req.method !== 'POST' || req.url !== '/send') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Only POST /send is supported' }));
    return;
  }

  // Leer y parsear el JSON que manda la GUI
  let payload;
  try {
    const raw = await readBody(req);
    payload = JSON.parse(raw);  // { method, url, headers, body }
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
    return;
  }

  // Usar http-client.js exactamente igual que el CLI
  try {
    const result = await request({
      method:  payload.method  || 'GET',
      url:     payload.url,
      headers: payload.headers || {},
      body:    payload.body    || null,
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));  // devuelve { statusCode, statusText, headers, body }

  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PROXY_PORT, () => {
  console.log(`[proxy] Bridge running on http://localhost:${PROXY_PORT}`);
  console.log(`[proxy] Waiting for requests from gui.html...`);
});