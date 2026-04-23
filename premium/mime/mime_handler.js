const fs = require("fs");
const path = require("path");
const mimeTypes = require("./mimetypes.json");

class MimeHandler {
  static getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || "application/octet-stream";
  }

  static getFileBuffer(filePath) {
    try {
      return fs.readFileSync(filePath);
    } catch (error) {
      return null;
    }
  }
}

module.exports = MimeHandler;
