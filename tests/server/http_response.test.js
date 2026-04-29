const { buildResponse } = require('../../server/http_response');

describe('http_response.js', () => {
  describe('buildResponse', () => {
    it('should build a standard 200 OK response', () => {
      const response = buildResponse({});
      // default is 200 OK
      expect(response).toMatch(/^HTTP\/1\.1 200 OK\r\n/);
    });

    it('should set custom status code and text', () => {
      const response = buildResponse({ statusCode: 404, statusText: 'Not Found' });
      expect(response).toMatch(/^HTTP\/1\.1 404 Not Found\r\n/);
    });

    it('should automatically set Content-Length if body is provided', () => {
      const response = buildResponse({ body: 'Hello World' });
      expect(response).toContain('Content-Length: 11\r\n');
      expect(response.endsWith('\r\nHello World')).toBe(true);
    });

    it('should not override Content-Length if it is already provided', () => {
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
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'Test'
        }
      });
      expect(response).toContain('Content-Type: application/json\r\n');
      expect(response).toContain('X-Custom-Header: Test\r\n');
    });
  });
});
