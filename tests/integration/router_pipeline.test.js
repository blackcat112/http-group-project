/**
 * tests/integration/router_pipeline.test.js
 *
 * Tests de integración del pipeline completo:
 *   parseRequest → handleRequest → response string
 *
 * Sin levantar socket TCP real. Verificamos que el parser y el router
 * cooperan correctamente de extremo a extremo.
 *
 * Usamos jest.resetModules() + require dinámico en beforeEach para
 * garantizar estado limpio del router (dogs[], routes{}, apiKey) en
 * cada test.
 */

describe('Integration – Parser → Router pipeline', () => {
  let parseRequest;
  let handleRequest;
  let setApiKey;

  beforeEach(() => {
    jest.resetModules();
    ({ parseRequest } = require('../../server/http_parser'));
    ({ handleRequest, setApiKey } = require('../../server/router'));
  });

  // Helpers de conveniencia para construir raw HTTP strings
  function makeRaw(method, path, headers = {}, body = '') {
    const headerLines = Object.entries(headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\r\n');
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const contentLength = bodyStr ? Buffer.byteLength(bodyStr) : 0;

    let raw = `${method} ${path} HTTP/1.1\r\n`;
    if (headerLines) raw += headerLines + '\r\n';
    if (contentLength > 0) raw += `Content-Length: ${contentLength}\r\n`;
    raw += `\r\n${bodyStr}`;
    return raw;
  }

  // ── Rutas básicas ─────────────────────────────────────────────────────
  it('GET / → 200 JSON con mensaje de bienvenida', async () => {
    const req = parseRequest(makeRaw('GET', '/'));
    const res = await handleRequest(req);
    expect(res).toMatch(/HTTP\/1\.1 200 OK/);
    expect(res).toContain('Hola Mundo');
  });

  it('GET /status → 200 texto plano', async () => {
    const req = parseRequest(makeRaw('GET', '/status'));
    const res = await handleRequest(req);
    expect(res).toMatch(/200 OK/);
    expect(res).toContain('Servidor operativo');
  });

  it('GET /nonexistent → 404', async () => {
    const req = parseRequest(makeRaw('GET', '/nonexistent'));
    const res = await handleRequest(req);
    expect(res).toMatch(/HTTP\/1\.1 404/);
  });

  // ── CRUD perros ───────────────────────────────────────────────────────
  it('GET /dogs → 200 array de perros', async () => {
    const req = parseRequest(makeRaw('GET', '/dogs'));
    const res = await handleRequest(req);
    expect(res).toMatch(/200 OK/);
    expect(res).toContain('[');
    expect(res).toContain('Hercules');
  });

  it('GET /dogs/1 → 200 con el perro correcto', async () => {
    const req = parseRequest(makeRaw('GET', '/dogs/1'));
    const res = await handleRequest(req);
    expect(res).toMatch(/200 OK/);
    expect(res).toContain('Hercules');
  });

  it('GET /dogs/999 → 404 perro no encontrado', async () => {
    const req = parseRequest(makeRaw('GET', '/dogs/999'));
    const res = await handleRequest(req);
    expect(res).toMatch(/404/);
  });

  it('POST /dogs con JSON válido → 201 Created con el perro nuevo', async () => {
    const body = JSON.stringify({ name: 'Rocky', breed: 'Boxer', age: 4 });
    const raw = makeRaw('POST', '/dogs', { 'Content-Type': 'application/json' }, body);
    const req = parseRequest(raw);
    const res = await handleRequest(req);
    expect(res).toMatch(/201 Created/);
    expect(res).toContain('Rocky');
  });

  it('POST /dogs con JSON malformado → 400 Bad Request', async () => {
    const raw = 'POST /dogs HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{malo json}';
    const req = parseRequest(raw);
    const res = await handleRequest(req);
    expect(res).toMatch(/400/);
  });

  it('PUT /dogs/1 actualiza el perro y devuelve 200', async () => {
    const body = JSON.stringify({ name: 'Hercules Updated', age: 5 });
    const raw = makeRaw('PUT', '/dogs/1', { 'Content-Type': 'application/json' }, body);
    const req = parseRequest(raw);
    const res = await handleRequest(req);
    expect(res).toMatch(/200 OK/);
    expect(res).toContain('Hercules Updated');
  });

  it('PUT /dogs/999 → 404', async () => {
    const body = JSON.stringify({ name: 'Ghost' });
    const raw = makeRaw('PUT', '/dogs/999', { 'Content-Type': 'application/json' }, body);
    const req = parseRequest(raw);
    const res = await handleRequest(req);
    expect(res).toMatch(/404/);
  });

  it('DELETE /dogs/2 → 204 No Content', async () => {
    const req = parseRequest(makeRaw('DELETE', '/dogs/2'));
    const res = await handleRequest(req);
    expect(res).toMatch(/204 No Content/);
  });

  it('DELETE /dogs/999 → 404', async () => {
    const req = parseRequest(makeRaw('DELETE', '/dogs/999'));
    const res = await handleRequest(req);
    expect(res).toMatch(/404/);
  });

  // ── Middleware API Key ────────────────────────────────────────────────
  it('petición sin API key → 401 cuando el servidor tiene key configurada', async () => {
    setApiKey('clave-secreta');
    const req = parseRequest(makeRaw('GET', '/'));
    const res = await handleRequest(req);
    expect(res).toMatch(/HTTP\/1\.1 401/);
  });

  it('petición con API key incorrecta → 401', async () => {
    setApiKey('clave-secreta');
    const raw = makeRaw('GET', '/', { 'x-api-key': 'equivocada' });
    const req = parseRequest(raw);
    const res = await handleRequest(req);
    expect(res).toMatch(/401/);
  });

  it('petición con API key correcta → 200', async () => {
    setApiKey('clave-secreta');
    const raw = makeRaw('GET', '/', { 'x-api-key': 'clave-secreta' });
    const req = parseRequest(raw);
    const res = await handleRequest(req);
    expect(res).toMatch(/200/);
  });

  // ── Query string y cookies llegan al handler ──────────────────────────
  it('GET /test-cookie sin cookie previa → mensaje de bienvenida', async () => {
    const req = parseRequest(makeRaw('GET', '/test-cookie'));
    const res = await handleRequest(req);
    expect(res).toMatch(/200 OK/);
    expect(res).toContain('primera vez');
  });

  it('GET /test-cookie con cookie visited → mensaje de retorno', async () => {
    const raw = makeRaw('GET', '/test-cookie', { Cookie: 'visited=true' });
    const req = parseRequest(raw);
    const res = await handleRequest(req);
    expect(res).toContain('verte de nuevo');
  });
});
