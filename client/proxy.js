'use strict';

const http  = require('http');
const { request } = require('./http-client');

const PROXY_PORT = 4000;

// ─── READ ─────────────────────────────────

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

  // CORS — gui.html can call the local server 
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight OPTIONS 
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Only accept POST /send
  if (req.method !== 'POST' || req.url !== '/send') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Only POST /send is supported' }));
    return;
  }

  // read the JSON payload from the request body, which should contain { method, url, headers, body }
  let payload;
  try {
    const raw = await readBody(req);
    payload = JSON.parse(raw);  // { method, url, headers, body }
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
    return;
  }

  // use the http-client's request function to perform the actual HTTP request 
  try {
    const result = await request({
      method:  payload.method  || 'GET',
      url:     payload.url,
      headers: payload.headers || {},
      body:    payload.body    || null,
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));  // return the full response (statusCode, statusText, headers, body) back to gui.html

  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PROXY_PORT, () => {
  console.log(`[proxy] Bridge running on http://localhost:${PROXY_PORT}`);
  console.log(`[proxy] Waiting for requests from gui.html...`);
});