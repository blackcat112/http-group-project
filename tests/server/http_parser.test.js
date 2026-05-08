const { parseRequest } = require('../../server/http_parser');

describe('http_parser.js', () => {
  describe('parseRequest', () => {

    // ── Básicos ──────────────────────────────────────────────────────────
    it('should parse a basic GET request', () => {
      const rawData = 'GET / HTTP/1.1\r\nHost: localhost\r\n\r\n';
      const result = parseRequest(rawData);
      expect(result.method).toBe('GET');
      expect(result.path).toBe('/');
      expect(result.version).toBe('HTTP/1.1');
      expect(result.headers).toEqual({ host: 'localhost' });
      expect(result.body).toBe('');
    });

    it('should parse a POST request with raw body', () => {
      const rawData = 'POST /api/data HTTP/1.1\r\nHost: example.com\r\nContent-Length: 15\r\n\r\n{"test":"data"}';
      const result = parseRequest(rawData);
      expect(result.method).toBe('POST');
      expect(result.path).toBe('/api/data');
      expect(result.version).toBe('HTTP/1.1');
      expect(result.headers).toEqual({ host: 'example.com', 'content-length': '15' });
      expect(result.body).toBe('{"test":"data"}');
    });

    it('should handle missing body correctly (no \\r\\n\\r\\n)', () => {
      const rawData = 'GET /about HTTP/1.0\r\nHost: test.com';
      const result = parseRequest(rawData);
      expect(result.method).toBe('GET');
      expect(result.path).toBe('/about');
      expect(result.version).toBe('HTTP/1.0');
      expect(result.headers).toEqual({ host: 'test.com' });
      expect(result.body).toBe('');
    });

    it('should parse multiple headers and lowercase their keys', () => {
      const rawData = 'PUT /update HTTP/1.1\r\nHOST: my-server\r\nContent-Type: application/json\r\nAccept: */*\r\n\r\n';
      const result = parseRequest(rawData);
      expect(result.headers).toEqual({
        host: 'my-server',
        'content-type': 'application/json',
        accept: '*/*'
      });
    });

    it('should fallback to defaults if first line is malformed', () => {
      const rawData = '\r\n\r\n';
      const result = parseRequest(rawData);
      expect(result.method).toBe('GET');
      expect(result.path).toBe('/');
      expect(result.version).toBe('HTTP/1.1');
    });

    // ── Query string ─────────────────────────────────────────────────────
    it('should parse query string parameters', () => {
      const rawData = 'GET /search?q=hello&page=2 HTTP/1.1\r\nHost: localhost\r\n\r\n';
      const result = parseRequest(rawData);
      expect(result.path).toBe('/search');
      expect(result.query).toEqual({ q: 'hello', page: '2' });
    });

    it('should return an empty query object when no query string', () => {
      const rawData = 'GET /path HTTP/1.1\r\nHost: localhost\r\n\r\n';
      const result = parseRequest(rawData);
      expect(result.query).toEqual({});
    });

    it('should decode URI components in query string values', () => {
      const rawData = 'GET /search?q=hello%20world HTTP/1.1\r\nHost: localhost\r\n\r\n';
      const result = parseRequest(rawData);
      expect(result.query).toEqual({ q: 'hello world' });
    });

    // ── Cookies ──────────────────────────────────────────────────────────
    it('should parse cookies from the Cookie header', () => {
      const rawData = 'GET / HTTP/1.1\r\nCookie: session=abc; user=john\r\n\r\n';
      const result = parseRequest(rawData);
      expect(result.cookies).toEqual({ session: 'abc', user: 'john' });
    });

    it('should return an empty cookies object when no Cookie header is present', () => {
      const rawData = 'GET / HTTP/1.1\r\nHost: localhost\r\n\r\n';
      const result = parseRequest(rawData);
      expect(result.cookies).toEqual({});
    });

    it('should handle cookies with = signs in the value', () => {
      const rawData = 'GET / HTTP/1.1\r\nCookie: token=abc=def\r\n\r\n';
      const result = parseRequest(rawData);
      expect(result.cookies).toEqual({ token: 'abc=def' });
    });

    // ── JSON body auto-parse ─────────────────────────────────────────────
    it('should auto-parse JSON body when Content-Type is application/json', () => {
      const body = JSON.stringify({ name: 'Rex', breed: 'Husky' });
      const rawData = `POST /dogs HTTP/1.1\r\nContent-Type: application/json\r\nContent-Length: ${body.length}\r\n\r\n${body}`;
      const result = parseRequest(rawData);
      expect(result.body).toEqual({ name: 'Rex', breed: 'Husky' });
      expect(result.bodyError).toBeNull();
    });

    it('should set bodyError for malformed JSON body', () => {
      const rawData = 'POST /dogs HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{invalid json}';
      const result = parseRequest(rawData);
      expect(result.bodyError).toBeTruthy();
    });

    // ── URL-encoded body ──────────────────────────────────────────────────
    it('should parse application/x-www-form-urlencoded body', () => {
      const rawData = 'POST /form HTTP/1.1\r\nContent-Type: application/x-www-form-urlencoded\r\n\r\nusername=alice&password=pass123';
      const result = parseRequest(rawData);
      expect(result.body).toEqual({ username: 'alice', password: 'pass123' });
    });

    it('should decode URI components in URL-encoded body values', () => {
      const rawData = 'POST /form HTTP/1.1\r\nContent-Type: application/x-www-form-urlencoded\r\n\r\nname=hello%20world';
      const result = parseRequest(rawData);
      expect(result.body).toEqual({ name: 'hello world' });
    });

    // ── URI decoding in path ──────────────────────────────────────────────
    it('should decode URI-encoded path segments', () => {
      const rawData = 'GET /my%20path HTTP/1.1\r\nHost: localhost\r\n\r\n';
      const result = parseRequest(rawData);
      expect(result.path).toBe('/my path');
    });

    // ── rawBody ───────────────────────────────────────────────────────────
    it('should expose rawBody alongside parsed body', () => {
      const body = '{"key":"value"}';
      const rawData = `POST /data HTTP/1.1\r\nContent-Type: application/json\r\n\r\n${body}`;
      const result = parseRequest(rawData);
      expect(result.rawBody).toBe(body);
      expect(typeof result.rawBody).toBe('string');
    });
  });
});
