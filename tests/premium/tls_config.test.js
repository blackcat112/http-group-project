/**
 * tls_config.test.js
 *
 * Usamos los certificados de desarrollo incluidos en el repo
 * (premium/tls/certs/dev-key.pem y dev-cert.pem) para los happy paths,
 * y rutas ficticias para los casos de error.
 */
const path = require('path');
const { loadTlsCredentials } = require('../../premium/tls/tls_config');

const CERTS_DIR = path.join(__dirname, '../../premium/tls/certs');
const DEV_KEY  = path.join(CERTS_DIR, 'dev-key.pem');
const DEV_CERT = path.join(CERTS_DIR, 'dev-cert.pem');

describe('tls_config.js – loadTlsCredentials', () => {

  // ── Happy path ────────────────────────────────────────────────────────
  it('should load credentials with absolute paths and return tlsOptions', () => {
    const result = loadTlsCredentials({ keyPath: DEV_KEY, certPath: DEV_CERT });

    expect(result).toHaveProperty('tlsOptions');
    expect(result).toHaveProperty('keyPath', DEV_KEY);
    expect(result).toHaveProperty('certPath', DEV_CERT);
    expect(result.caPath).toBeNull();
  });

  it('should return key and cert as Buffers in tlsOptions', () => {
    const { tlsOptions } = loadTlsCredentials({ keyPath: DEV_KEY, certPath: DEV_CERT });

    expect(Buffer.isBuffer(tlsOptions.key)).toBe(true);
    expect(Buffer.isBuffer(tlsOptions.cert)).toBe(true);
  });

  it('should apply minVersion to tlsOptions', () => {
    const { tlsOptions } = loadTlsCredentials({
      keyPath: DEV_KEY,
      certPath: DEV_CERT,
      minVersion: 'TLSv1.3'
    });

    expect(tlsOptions.minVersion).toBe('TLSv1.3');
  });

  it('should default rejectUnauthorized to false', () => {
    const result = loadTlsCredentials({ keyPath: DEV_KEY, certPath: DEV_CERT });
    expect(result.tlsOptions.rejectUnauthorized).toBe(false);
    expect(result.rejectUnauthorized).toBe(false);
  });

  it('should resolve relative paths against cwd', () => {
    // Usamos rutas relativas desde el cwd del proyecto
    const relKey  = path.relative(process.cwd(), DEV_KEY);
    const relCert = path.relative(process.cwd(), DEV_CERT);

    const result = loadTlsCredentials({ keyPath: relKey, certPath: relCert });
    expect(result.keyPath).toBe(DEV_KEY);
    expect(result.certPath).toBe(DEV_CERT);
  });

  it('should not set ca in tlsOptions when caPath is omitted', () => {
    const { tlsOptions } = loadTlsCredentials({ keyPath: DEV_KEY, certPath: DEV_CERT });
    expect(tlsOptions.ca).toBeUndefined();
  });

  it('should set requestCert to false when no CA and no rejectUnauthorized', () => {
    const { tlsOptions } = loadTlsCredentials({ keyPath: DEV_KEY, certPath: DEV_CERT });
    expect(tlsOptions.requestCert).toBe(false);
  });

  // ── Error cases ───────────────────────────────────────────────────────
  it('should throw when keyPath is missing', () => {
    expect(() => loadTlsCredentials({ certPath: DEV_CERT })).toThrow(/Missing.*key/i);
  });

  it('should throw when certPath is missing', () => {
    expect(() => loadTlsCredentials({ keyPath: DEV_KEY })).toThrow(/Missing.*cert/i);
  });

  it('should throw when keyPath points to a non-existent file', () => {
    expect(() =>
      loadTlsCredentials({ keyPath: '/tmp/no-such-key.pem', certPath: DEV_CERT })
    ).toThrow(/Missing.*key/i);
  });

  it('should throw when certPath points to a non-existent file', () => {
    expect(() =>
      loadTlsCredentials({ keyPath: DEV_KEY, certPath: '/tmp/no-such-cert.pem' })
    ).toThrow(/Missing.*cert/i);
  });

  it('should throw when caPath is provided but file does not exist', () => {
    expect(() =>
      loadTlsCredentials({ keyPath: DEV_KEY, certPath: DEV_CERT, caPath: '/tmp/no-ca.pem' })
    ).toThrow(/Missing.*authority/i);
  });
});
