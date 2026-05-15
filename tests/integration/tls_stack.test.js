/**
 * tests/integration/tls_stack.test.js
 *
 * Tests de integración de setupTlsStack usando los certificados de
 * desarrollo reales incluidos en el repo (premium/tls/certs/).
 * Verifica que los tres módulos (tls_config, tls_handler, login_validator)
 * se ensamblan correctamente a través del facade setupTlsStack.
 */
const path = require('path');
const { setupTlsStack } = require('../../premium/tls/setup');

const CERTS_DIR = path.join(__dirname, '../../premium/tls/certs');
const DEV_KEY   = path.join(CERTS_DIR, 'dev-key.pem');
const DEV_CERT  = path.join(CERTS_DIR, 'dev-cert.pem');

describe('Integration – setupTlsStack', () => {

  // ── Estructura del objeto devuelto ────────────────────────────────────
  it('should return an object with credentials, upgrade and validateLogin', () => {
    const stack = setupTlsStack({ keyPath: DEV_KEY, certPath: DEV_CERT });
    expect(stack).toHaveProperty('credentials');
    expect(typeof stack.upgrade).toBe('function');
    expect(typeof stack.validateLogin).toBe('function');
  });

  it('credentials.tlsOptions should contain key and cert as Buffers', () => {
    const { credentials } = setupTlsStack({ keyPath: DEV_KEY, certPath: DEV_CERT });
    expect(Buffer.isBuffer(credentials.tlsOptions.key)).toBe(true);
    expect(Buffer.isBuffer(credentials.tlsOptions.cert)).toBe(true);
  });

  it('should enforce TLSv1.2 as minimum version', () => {
    const { credentials } = setupTlsStack({ keyPath: DEV_KEY, certPath: DEV_CERT });
    expect(credentials.tlsOptions.minVersion).toBe('TLSv1.2');
  });

  // ── validateLogin integrado ───────────────────────────────────────────
  it('validateLogin should accept correct credentials from users map', () => {
    const stack = setupTlsStack({
      keyPath: DEV_KEY,
      certPath: DEV_CERT,
      users: { admin: 'pass123' }
    });

    // admin:pass123 en base64 → YWRtaW46cGFzczEyMw==
    const req = { headers: { authorization: 'Basic YWRtaW46cGFzczEyMw==' } };
    const result = stack.validateLogin(req);
    expect(result).toEqual({ ok: true, user: 'admin' });
  });

  it('validateLogin should reject wrong password', () => {
    const stack = setupTlsStack({
      keyPath: DEV_KEY,
      certPath: DEV_CERT,
      users: { admin: 'pass123' }
    });

    // admin:wrong → YWRtaW46d3Jvbmc=
    const req = { headers: { authorization: 'Basic YWRtaW46d3Jvbmc=' } };
    const result = stack.validateLogin(req);
    expect(result).toEqual({ ok: false, reason: 'INVALID_CREDENTIALS' });
  });

  it('validateLogin should return MISSING_CREDENTIALS when no auth provided', () => {
    const stack = setupTlsStack({ keyPath: DEV_KEY, certPath: DEV_CERT });
    const result = stack.validateLogin({ headers: {} });
    expect(result).toEqual({ ok: false, reason: 'MISSING_CREDENTIALS' });
  });

  it('validateLogin should use customValidator if provided', () => {
    const customValidator = jest.fn().mockReturnValue(true);
    const stack = setupTlsStack({
      keyPath: DEV_KEY,
      certPath: DEV_CERT,
      customValidator
    });

    // admin:secret → YWRtaW46c2VjcmV0
    const req = { headers: { authorization: 'Basic YWRtaW46c2VjcmV0' } };
    const result = stack.validateLogin(req);
    expect(customValidator).toHaveBeenCalledWith({ username: 'admin', password: 'secret' });
    expect(result.ok).toBe(true);
  });

  // ── upgrade integrado ─────────────────────────────────────────────────
  it('upgrade should throw TypeError for an invalid socket', () => {
    const stack = setupTlsStack({ keyPath: DEV_KEY, certPath: DEV_CERT });
    expect(() => stack.upgrade(null, () => {})).toThrow(TypeError);
    expect(() => stack.upgrade({}, () => {})).toThrow(TypeError);
  });

  // ── Errores de configuración ──────────────────────────────────────────
  it('should throw when key file is missing', () => {
    expect(() =>
      setupTlsStack({ keyPath: '/tmp/no-key.pem', certPath: DEV_CERT })
    ).toThrow(/Missing.*key/i);
  });

  it('should throw when cert file is missing', () => {
    expect(() =>
      setupTlsStack({ keyPath: DEV_KEY, certPath: '/tmp/no-cert.pem' })
    ).toThrow(/Missing.*cert/i);
  });
});
