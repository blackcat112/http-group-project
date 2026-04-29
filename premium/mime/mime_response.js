function buildMimeResponse({
  statusCode = 200,
  statusText = "OK",
  headers = {},
  body = Buffer.alloc(0),
}) {
  let headerText = `HTTP/1.1 ${statusCode} ${statusText}\r\n`;

  if (body.length >= 0) {
    headers["Content-Length"] = body.length;
  }

  for (const [key, value] of Object.entries(headers)) {
    headerText += `${key}: ${value}\r\n`;
  }

  headerText += "\r\n";

  const headerBuffer = Buffer.from(headerText, "utf8");

  return Buffer.concat([headerBuffer, body]);
}

module.exports = { buildMimeResponse };
