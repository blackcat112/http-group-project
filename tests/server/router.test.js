/**
 * router.test.js
 *
 * El router.js mantiene estado global (dogs[], routes{}, globalApiKey).
 * Usamos jest.resetModules() + require dinámico en beforeEach para
 * garantizar un módulo limpio en cada test.
 */

describe('router.js', () => {
  let router;

  beforeEach(() => {
    jest.resetModules();
    router = require('../../server/router');
  });

  // ── 404 para rutas desconocidas ───────────────────────────────────────
  describe('handleRequest – 404', () => {
    it('should return 404 for an unknown GET route', async () => {
      const req = { method: 'GET', path: '/no-existe', headers: {}, cookies: {}, query: {}, bodyError: null };
      const response = await router.handleRequest(req);
      expect(response).toMatch(/HTTP\/1\.1 404/);
    });

    it('should return 404 for an unknown POST route', async () => {
      const req = { method: 'POST', path: '/no-existe', headers: {}, cookies: {}, query: {}, bodyError: null, body: {} };
      const response = await router.handleRequest(req);
      expect(response).toMatch(/HTTP\/1\.1 404/);
    });
  });

  // ── 400 por error de parseo del body ─────────────────────────────────
  describe('handleRequest – 400 body error', () => {
    it('should return 400 if bodyError is set', async () => {
      const req = { method: 'POST', path: '/dogs', headers: {}, cookies: {}, query: {}, bodyError: 'JSON malformado' };
      const response = await router.handleRequest(req);
      expect(response).toMatch(/HTTP\/1\.1 400/);
    });
  });

  // ── Middleware API Key ────────────────────────────────────────────────
  describe('handleRequest – API key middleware', () => {
    it('should return 401 when API key is set and header is missing', async () => {
      router.setApiKey('super-secret');
      const req = { method: 'GET', path: '/', headers: {}, cookies: {}, query: {}, bodyError: null };
      const response = await router.handleRequest(req);
      expect(response).toMatch(/HTTP\/1\.1 401/);
    });

    it('should return 401 when API key does not match', async () => {
      router.setApiKey('super-secret');
      const req = { method: 'GET', path: '/', headers: { 'x-api-key': 'wrong' }, cookies: {}, query: {}, bodyError: null };
      const response = await router.handleRequest(req);
      expect(response).toMatch(/HTTP\/1\.1 401/);
    });

    it('should pass through when API key matches', async () => {
      router.setApiKey('super-secret');
      const req = { method: 'GET', path: '/', headers: { 'x-api-key': 'super-secret' }, cookies: {}, query: {}, bodyError: null };
      const response = await router.handleRequest(req);
      expect(response).toMatch(/HTTP\/1\.1 200/);
    });
  });

  // ── Rutas built-in ───────────────────────────────────────────────────
  describe('handleRequest – built-in routes', () => {
    it('GET / should return 200 with hola mundo message', async () => {
      const req = { method: 'GET', path: '/', headers: {}, cookies: {}, query: {}, bodyError: null };
      const response = await router.handleRequest(req);
      expect(response).toMatch(/200 OK/);
      expect(response).toContain('Hola Mundo');
    });

    it('GET /status should return 200 plain text', async () => {
      const req = { method: 'GET', path: '/status', headers: {}, cookies: {}, query: {}, bodyError: null };
      const response = await router.handleRequest(req);
      expect(response).toMatch(/200 OK/);
      expect(response).toContain('Servidor operativo');
    });

    it('GET /dogs should return 200 JSON array', async () => {
      const req = { method: 'GET', path: '/dogs', headers: {}, cookies: {}, query: {}, bodyError: null };
      const response = await router.handleRequest(req);
      expect(response).toMatch(/200 OK/);
      expect(response).toContain('[');
    });

    it('GET /dogs/:id should return 200 for existing dog', async () => {
      const req = { method: 'GET', path: '/dogs/1', headers: {}, cookies: {}, query: {}, bodyError: null, params: {} };
      const response = await router.handleRequest(req);
      expect(response).toMatch(/200 OK/);
      expect(response).toContain('Hercules');
    });

    it('GET /dogs/:id should return 404 for non-existent dog', async () => {
      const req = { method: 'GET', path: '/dogs/999', headers: {}, cookies: {}, query: {}, bodyError: null, params: {} };
      const response = await router.handleRequest(req);
      expect(response).toMatch(/404/);
    });

    it('POST /dogs should create a dog and return 201', async () => {
      const req = {
        method: 'POST', path: '/dogs',
        headers: { 'content-type': 'application/json' },
        cookies: {}, query: {}, bodyError: null,
        body: { name: 'Max', breed: 'Beagle', age: 2 }
      };
      const response = await router.handleRequest(req);
      expect(response).toMatch(/201 Created/);
      expect(response).toContain('Max');
    });

    it('POST /dogs should return 400 when body is not an object', async () => {
      const req = { method: 'POST', path: '/dogs', headers: {}, cookies: {}, query: {}, bodyError: null, body: 'texto' };
      const response = await router.handleRequest(req);
      expect(response).toMatch(/400/);
    });
  });

  // ── registerRoute custom ──────────────────────────────────────────────
  describe('registerRoute', () => {
    it('should call the registered handler for a matching route', async () => {
      const handler = jest.fn().mockReturnValue('HTTP/1.1 200 OK\r\n\r\ntest');
      router.registerRoute('GET', '/custom', handler);
      const req = { method: 'GET', path: '/custom', headers: {}, cookies: {}, query: {}, bodyError: null };
      await router.handleRequest(req);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ path: '/custom' }));
    });

    it('should extract dynamic params and pass them to the handler', async () => {
      let capturedParams = null;
      router.registerRoute('GET', '/items/:id', (req) => {
        capturedParams = req.params;
        return 'HTTP/1.1 200 OK\r\n\r\nOK';
      });
      const req = { method: 'GET', path: '/items/42', headers: {}, cookies: {}, query: {}, bodyError: null };
      await router.handleRequest(req);
      expect(capturedParams).toEqual({ id: '42' });
    });

    it('should support multiple dynamic params', async () => {
      let capturedParams = null;
      router.registerRoute('GET', '/a/:x/b/:y', (req) => {
        capturedParams = req.params;
        return 'HTTP/1.1 200 OK\r\n\r\nOK';
      });
      const req = { method: 'GET', path: '/a/1/b/2', headers: {}, cookies: {}, query: {}, bodyError: null };
      await router.handleRequest(req);
      expect(capturedParams).toEqual({ x: '1', y: '2' });
    });
  });
});
