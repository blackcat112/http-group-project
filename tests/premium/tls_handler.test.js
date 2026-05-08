/**
 * tls_handler.test.js
 *
 * Mockeamos el módulo nativo 'tls' para evitar dependencias de red/crypto
 * y poder verificar el comportamiento de createTlsUpgrader en aislamiento.
 */
const { EventEmitter } = require('events');

jest.mock('tls');

describe('tls_handler.js – createTlsUpgrader', () => {
  let tls;
  let createTlsUpgrader;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // Re-requerimos después de resetModules para obtener el mock limpio
    tls = require('tls');
    ({ createTlsUpgrader } = require('../../premium/tls/tls_handler'));
  });

  it('should return an object with an upgrade function', () => {
    const upgrader = createTlsUpgrader({ tlsOptions: {} });
    expect(typeof upgrader.upgrade).toBe('function');
  });

  it('should throw TypeError when socket is null', () => {
    const upgrader = createTlsUpgrader({ tlsOptions: {} });
    expect(() => upgrader.upgrade(null, () => {})).toThrow(TypeError);
  });

  it('should throw TypeError when socket lacks on/write methods', () => {
    const upgrader = createTlsUpgrader({ tlsOptions: {} });
    expect(() => upgrader.upgrade({}, () => {})).toThrow(TypeError);
  });

  it('should throw TypeError when socket has on but not write', () => {
    const upgrader = createTlsUpgrader({ tlsOptions: {} });
    const badSocket = { on: jest.fn() }; // falta write
    expect(() => upgrader.upgrade(badSocket, () => {})).toThrow(TypeError);
  });

  it('should create a TLSSocket wrapping the raw socket with isServer:true', () => {
    const mockTlsSocket = new EventEmitter();
    mockTlsSocket.setTimeout = jest.fn();
    tls.TLSSocket = jest.fn().mockReturnValue(mockTlsSocket);

    const rawSocket = new EventEmitter();
    rawSocket.write = jest.fn();

    const upgrader = createTlsUpgrader({ tlsOptions: { minVersion: 'TLSv1.2' } });
    upgrader.upgrade(rawSocket, () => {});

    expect(tls.TLSSocket).toHaveBeenCalledWith(
      rawSocket,
      expect.objectContaining({ isServer: true, minVersion: 'TLSv1.2' })
    );
  });

  it('should return the TLSSocket instance', () => {
    const mockTlsSocket = new EventEmitter();
    mockTlsSocket.setTimeout = jest.fn();
    tls.TLSSocket = jest.fn().mockReturnValue(mockTlsSocket);

    const rawSocket = new EventEmitter();
    rawSocket.write = jest.fn();

    const upgrader = createTlsUpgrader({ tlsOptions: {} });
    const result = upgrader.upgrade(rawSocket, () => {});

    expect(result).toBe(mockTlsSocket);
  });

  it('should apply handshake timeout on the TLSSocket', () => {
    const mockTlsSocket = new EventEmitter();
    mockTlsSocket.setTimeout = jest.fn();
    tls.TLSSocket = jest.fn().mockReturnValue(mockTlsSocket);

    const rawSocket = new EventEmitter();
    rawSocket.write = jest.fn();

    const upgrader = createTlsUpgrader({ tlsOptions: {}, handshakeTimeoutMs: 5000 });
    upgrader.upgrade(rawSocket, () => {});

    expect(mockTlsSocket.setTimeout).toHaveBeenCalledWith(5000);
  });

  it('should call onSecure callback and reset timeout when secureConnect fires', (done) => {
    const mockTlsSocket = new EventEmitter();
    mockTlsSocket.setTimeout = jest.fn();
    tls.TLSSocket = jest.fn().mockReturnValue(mockTlsSocket);

    const rawSocket = new EventEmitter();
    rawSocket.write = jest.fn();

    const upgrader = createTlsUpgrader({ tlsOptions: {}, handshakeTimeoutMs: 5000 });

    upgrader.upgrade(rawSocket, (socket) => {
      expect(socket).toBe(mockTlsSocket);
      // Debe resetear el timeout a 0 tras el handshake
      expect(mockTlsSocket.setTimeout).toHaveBeenLastCalledWith(0);
      done();
    });

    // Simulamos que el handshake TLS ha terminado
    mockTlsSocket.emit('secureConnect');
  });

  it('should merge secureContext into tlsOptions if provided', () => {
    const mockTlsSocket = new EventEmitter();
    mockTlsSocket.setTimeout = jest.fn();
    tls.TLSSocket = jest.fn().mockReturnValue(mockTlsSocket);

    const rawSocket = new EventEmitter();
    rawSocket.write = jest.fn();

    const fakeContext = {};
    const upgrader = createTlsUpgrader({ tlsOptions: {}, secureContext: fakeContext });
    upgrader.upgrade(rawSocket, () => {});

    expect(tls.TLSSocket).toHaveBeenCalledWith(
      rawSocket,
      expect.objectContaining({ secureContext: fakeContext })
    );
  });
});
