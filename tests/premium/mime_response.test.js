const { buildMimeResponse } = require('../../premium/mime/mime_response');

describe('buildMimeResponse', () => {
  it('should build a basic 200 OK response with no body', () => {
    const result = buildMimeResponse({});
    expect(Buffer.isBuffer(result)).toBe(true);
    
    const resultString = result.toString('utf8');
    expect(resultString).toContain('HTTP/1.1 200 OK');
    expect(resultString).toContain('Content-Length: 0');
    expect(resultString.endsWith('\r\n')).toBe(true);
  });

  it('should properly handle Buffer bodies', () => {
    const body = Buffer.from('Hello Buffer', 'utf8');
    const result = buildMimeResponse({ body });
    
    const resultString = result.toString('utf8');
    expect(resultString).toContain(`Content-Length: ${body.length}`);
    expect(resultString.endsWith('Hello Buffer')).toBe(true);
  });

  it('should include custom headers', () => {
    const result = buildMimeResponse({
      headers: {
        'Content-Type': 'text/plain',
        'X-Test': '123'
      }
    });
    
    const resultString = result.toString('utf8');
    expect(resultString).toContain('Content-Type: text/plain');
    expect(resultString).toContain('X-Test: 123');
  });
});
