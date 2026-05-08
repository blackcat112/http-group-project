# HTTP/1.1 Client — Pareja B

HTTP/1.1 client implementation from scratch using raw TCP sockets in Node.js.  
No high-level HTTP libraries used — only the built-in `net` and `tls` modules.

---

## Files

| File | Purpose |
|---|---|
| `http-client.js` | Core client library — TCP/TLS socket, request builder, response parser |
| `cli.js` | Interactive CLI that uses the library |
| `proxy.js` | Local bridge server — exposes the client library to the browser GUI |
| `gui.html` | Browser-based graphical interface (optional feature 🎨) |
| `package.json` | Module metadata |

---

## How to run

### CLI (command line)

```bash
cd client
node cli.js
```

### GUI (browser interface)

```bash
# 1. Start the proxy bridge (keep it running)
node client/proxy.js

# 2. Open the GUI in your browser
open client/gui.html
# or just double-click gui.html
```

> The GUI requires the proxy to be running on `localhost:4000`.  
> The server does **not** need to be running to use the GUI with external URLs.

---

## Usage example — CLI

```
╔══════════════════════════════════════╗
║       HTTP/1.1 Client — USJ          ║
║  Write "exit" in the URL to quit     ║
╚══════════════════════════════════════╝

URL    : http://localhost:3000/dogs
Method (GET/POST/PUT/DELETE/HEAD) [GET]: GET
Extra headers (key:value,key:value) [none]:
JSON body (leave empty if none):

→ Sending GET http://localhost:3000/dogs ...

──────────────── RESPONSE ─────────────────
Status : 200 OK
Headers:
  content-type: application/json
  content-length: 97
Body:
[
  { "id": 1, "name": "Hercules", "breed": "Mastin", "age": 4 },
  { "id": 2, "name": "Rex", "breed": "Husky", "age": 2 }
]
───────────────────────────────────────────
```

---

## Library API (`http-client.js`)

### `request({ method, url, headers, body })`

Main function. Opens a raw TCP or TLS socket depending on the URL scheme,
sends the HTTP/1.1 message and returns a promise that resolves with the parsed response.

```js
const { request } = require(\'./http-client\');

const res = await request({
  method: \'POST\',
  url: \'http://localhost:3000/dogs\',
  headers: { \'X-Custom\': \'value\' },
  body: { name: \'Rex\', breed: \'Husky\', age: 2 },
});

console.log(res.statusCode); // 201
console.log(res.body);       // \'{"id":3,"name":"Rex",...}\'
```

Works with HTTPS too — no code change needed:

```js
const res = await request({
  method: \'GET\',
  url: \'https://example.com\',
});

console.log(res.statusCode); // 200
```

### Response object

```js
{
  statusCode: 200,
  statusText: \'OK\',
  headers: { \'content-type\': \'application/json\', ... },
  body: \'{"id":1,...}\'
}
```

---

## Technical details

- **Protocol**: HTTP/1.1 — request line, headers and body separated by `\\r\\n`
- **HTTP and HTTPS**: `http://` uses `net.createConnection` (port 80 default); `https://` uses `tls.connect` with SNI (port 443 default) — both from Node\'s standard library
- **Automatic headers**: `Host`, `Content-Type: application/json`, `Connection: close`, `Content-Length` (when body present)
- **Chunk accumulation**: data events are accumulated until `Content-Length` bytes are received
- **Chunked Transfer-Encoding**: `decodeChunked()` strips hex size prefixes and reconstructs the full body for servers that use `Transfer-Encoding: chunked`
- **Timeout**: 10 seconds per request
- **API key**: pass `x-api-key` in headers or set it once in the GUI — injected automatically on every request
- **No external dependencies**: only Node.js built-in modules (`net`, `tls`, `readline`, `http`)

---

## Proxy bridge (`proxy.js`)

Browsers cannot open raw TCP sockets directly. `proxy.js` solves this by running
a minimal HTTP server on `localhost:4000` that receives requests from the GUI and
delegates them to `http-client.js`.

```
gui.html  →  POST localhost:4000/send  →  proxy.js  →  http-client.js  →  TCP/TLS socket
```

The proxy is only needed for the GUI. The CLI calls `http-client.js` directly.