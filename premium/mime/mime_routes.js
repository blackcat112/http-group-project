const path = require("path");
const MimeHandler = require("./MimeHandler");
const { buildMimeResponse } = require("./MimeResponse");

function registerMimeRoutes(registerRouteFunc) {
  registerRouteFunc("GET", "/premium/assets/:filename", (req) => {
    const filePath = path.join(__dirname, "assets", req.params.filename);
    const fileBuffer = MimeHandler.getFileContent(filePath);

    if (!fileBuffer) {
      return `HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n\r\nArchivo no encontrado en módulo Premium.`;
    }

    const contentType = MimeHandler.getContentType(filePath);

    return buildMimeResponse({
      statusCode: 200,
      statusText: "OK",
      headers: { "Content-Type": contentType },
      body: fileBuffer,
    });
  });
}

module.exports = { registerMimeRoutes };
