const MimeHandler = require('../../premium/mime/mime_handler');
const fs = require('fs');

jest.mock('fs');

describe('MimeHandler', () => {
  describe('getContentType', () => {
    it('should return correct mime type for known extensions', () => {
      expect(MimeHandler.getContentType('index.html')).toBe('text/html');
      expect(MimeHandler.getContentType('style.css')).toBe('text/css');
      expect(MimeHandler.getContentType('image.png')).toBe('image/png');
    });

    it('should return application/octet-stream for unknown extensions', () => {
      expect(MimeHandler.getContentType('file.xyz')).toBe('application/octet-stream');
    });
  });

  describe('getFileContent', () => {
    it('should return file buffer if file exists', () => {
      const mockBuffer = Buffer.from('test data');
      fs.readFileSync.mockReturnValue(mockBuffer);
      
      const result = MimeHandler.getFileContent('valid_path.txt');
      expect(result).toBe(mockBuffer);
    });

    it('should return null if file read throws an error', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });
      
      const result = MimeHandler.getFileContent('invalid_path.txt');
      expect(result).toBeNull();
    });
  });
});
