# HTTP/1.1 Client — Pareja B

HTTP/1.1 client implementation from scratch using raw TCP sockets in Node.js.  
No high-level HTTP libraries used — only the built-in `net` module.

---

## Files

| File | Purpose |
|---|---|
| `http-client.js` | Core client library — TCP socket, request builder, response parser |
| `cli.js` | Interactive CLI that uses the library |
| `package.json` | Module metadata |

---

## How to run

```bash
cd client
node cli.js
```

---

## Usage example

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

Main function. Opens a TCP socket, sends the HTTP/1.1 message and returns a promise that resolves with the parsed response.

```js
const { request } = require('./http-client');

const res = await request({
  method: 'POST',
  url: 'http://localhost:3000/dogs',
  headers: { 'X-Custom': 'value' },
  body: { name: 'Rex', breed: 'Husky', age: 2 },
});

console.log(res.statusCode); // 201
console.log(res.body);       // '{"id":3,"name":"Rex",...}'
```

### Response object

```js
{
  statusCode: 200,
  statusText: 'OK',
  headers: { 'content-type': 'application/json', ... },
  body: '{"id":1,...}'
}
```

---

## Technical details

- **Protocol**: HTTP/1.1 — request line, headers and body separated by `\r\n`
- **Automatic headers**: `Host`, `Content-Type: application/json`, `Connection: close`, `Content-Length` (when body present)
- **Chunk accumulation**: data events are accumulated until `Content-Length` bytes are received
- **Timeout**: 10 seconds per request
- **No dependencies**: only Node.js built-in modules (`net`, `readline`)
