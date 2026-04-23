const fs = require("fs");
const path = require("path");
const mimeTypes = require("./mimetypes.json");

class MimeHandler {
  static getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    // application/octet-stream es el estándar para "archivo binario desconocido"
    return mimeTypes[ext] || "application/octet-stream";
  }

  static getFileBuffer(filePath) {
    try {
      // No pasamos 'utf-8' para que devuelva un Buffer binario puro
      return fs.readFileSync(filePath);
    } catch (error) {
      return null;
    }
  }
}

module.exports = MimeHandler;
