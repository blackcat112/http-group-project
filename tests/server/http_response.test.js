const {
  buildResponse,
  buildJSONResponse,
  build404NotFound,
  build400BadRequest,
  build405MethodNotAllowed,
  build500InternalServerError,
} = require('../../server/http_response');

describe('http_response.js', () => {

  // ── buildResponse ─────────────────────────────────────────────────────
  describe('buildResponse', () => {
    it('should build a standard 200 OK response', () => {
      const response = buildResponse({});
      expect(response).toMatch(/^HTTP\/1\.1 200 OK\r\n/);
    });

    it('should set custom status code and text', () => {
      const response = buildResponse({ statusCode: 404, statusText: 'Not Found' });
      expect(response).toMatch(/^HTTP\/1\.1 404 Not Found\r\n/);
    });

    it('should automatically set Content-Length for a string body', () => {
      const response = buildResponse({ body: 'Hello World' });
      expect(response).toContain('Content-Length: 11\r\n');
      expect(response.endsWith('\r\nHello World')).toBe(true);
    });

    it('should not override Content-Length if already provided', () => {
      const response = buildResponse({
        headers: { 'Content-Length': '100' },
        body: 'Hello'
      });
      expect(response).toContain('Content-Length: 100\r\n');
      expect(response).not.toContain('Content-Length: 5\r\n');
      expect(response.endsWith('\r\nHello')).toBe(true);
    });

    it('should include custom headers', () => {
      const response = buildResponse({
        headers: { 'Content-Type': 'application/json', 'X-Custom-Header': 'Test' }
      });
      expect(response).toContain('Content-Type: application/json\r\n');
      expect(response).toContain('X-Custom-Header: Test\r\n');
    });

    it('should automatically add a Date header if not present', () => {
      const response = buildResponse({});
      expect(response).toContain('Date:');
    });

    it('should return a Buffer when body is a Buffer', () => {
      const body = Buffer.from('binary data');
      const response = buildResponse({ body });
      expect(Buffer.isBuffer(response)).toBe(true);
      expect(response.toString()).toContain('HTTP/1.1 200 OK');
    });

    it('should set correct Content-Length for a Buffer body', () => {
      const body = Buffer.from('hello');
      const response = buildResponse({ body });
      expect(Buffer.isBuffer(response)).toBe(true);
      expect(response.toString()).toContain('Content-Length: 5');
    });

    it('should emit multiple header lines for array header values', () => {
      const response = buildResponse({
        headers: { 'Set-Cookie': ['a=1; Path=/', 'b=2; Path=/'] }
      });
      expect(response).toContain('Set-Cookie: a=1; Path=/\r\n');
      expect(response).toContain('Set-Cookie: b=2; Path=/\r\n');
    });
  });

  // ── buildJSONResponse ─────────────────────────────────────────────────
  describe('buildJSONResponse', () => {
    it('should include Content-Type: application/json', () => {
      const response = buildJSONResponse(200, 'OK', { msg: 'hi' });
      expect(response).toContain('Content-Type: application/json');
    });

    it('should serialize data as JSON in the body', () => {
      const data = { foo: 'bar', num: 42 };
      const response = buildJSONResponse(200, 'OK', data);
      expect(response.endsWith(JSON.stringify(data))).toBe(true);
    });

    it('should use the provided status code and text', () => {
      const response = buildJSONResponse(201, 'Created', {});
      expect(response).toMatch(/^HTTP\/1\.1 201 Created\r\n/);
    });
  });

  // ── build404NotFound ──────────────────────────────────────────────────
  describe('build404NotFound', () => {
    it('should build a 404 response with JSON error body', () => {
      const response = build404NotFound();
      expect(response).toMatch(/HTTP\/1\.1 404 Not Found/);
      expect(response).toContain('"error"');
    });

    it('should include custom message in the error body', () => {
      const response = build404NotFound('Perro no encontrado');
      expect(response).toContain('Perro no encontrado');
    });
  });

  // ── build400BadRequest ────────────────────────────────────────────────
  describe('build400BadRequest', () => {
    it('should build a 400 response with JSON error body', () => {
      const response = build400BadRequest();
      expect(response).toMatch(/HTTP\/1\.1 400 Bad Request/);
      expect(response).toContain('"error"');
    });

    it('should include custom message', () => {
      const response = build400BadRequest('Campo requerido');
      expect(response).toContain('Campo requerido');
    });
  });

  // ── build405MethodNotAllowed ──────────────────────────────────────────
  describe('build405MethodNotAllowed', () => {
    it('should build a 405 response', () => {
      const response = build405MethodNotAllowed();
      expect(response).toMatch(/HTTP\/1\.1 405 Method Not Allowed/);
    });

    it('should include JSON error body', () => {
      const response = build405MethodNotAllowed();
      expect(response).toContain('"error"');
    });
  });

  // ── build500InternalServerError ───────────────────────────────────────
  describe('build500InternalServerError', () => {
    it('should build a 500 response', () => {
      const response = build500InternalServerError();
      expect(response).toMatch(/HTTP\/1\.1 500 Internal Server Error/);
    });

    it('should include custom message', () => {
      const response = build500InternalServerError('DB connection failed');
      expect(response).toContain('DB connection failed');
    });
  });
});
