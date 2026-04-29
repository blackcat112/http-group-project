const { parseRequest } = require('../../server/http_parser');

describe('http_parser.js', () => {
  describe('parseRequest', () => {
    it('should parse a basic GET request', () => {
      const rawData = 'GET / HTTP/1.1\r\nHost: localhost\r\n\r\n';
      const result = parseRequest(rawData);
      
      expect(result.method).toBe('GET');
      expect(result.path).toBe('/');
      expect(result.version).toBe('HTTP/1.1');
      expect(result.headers).toEqual({ host: 'localhost' });
      expect(result.body).toBe('');
    });

    it('should parse a POST request with body', () => {
      const rawData = 'POST /api/data HTTP/1.1\r\nHost: example.com\r\nContent-Length: 15\r\n\r\n{"test":"data"}';
      const result = parseRequest(rawData);
      
      expect(result.method).toBe('POST');
      expect(result.path).toBe('/api/data');
      expect(result.version).toBe('HTTP/1.1');
      expect(result.headers).toEqual({
        host: 'example.com',
        'content-length': '15'
      });
      expect(result.body).toBe('{"test":"data"}');
    });

    it('should handle missing body correctly', () => {
      // no \r\n\r\n
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
  });
});
