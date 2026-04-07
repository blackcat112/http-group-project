const fs = require('fs');
const path = require('path');

function resolveCredentialPath(basePath, filePath) {
    if (!filePath) return null;
    return path.isAbsolute(filePath) ? filePath : path.join(basePath, filePath);
}

function mustExistFile(filePath, label) {
    if (!filePath || !fs.existsSync(filePath)) {
        throw new Error(`[TLS] Missing ${label}: ${filePath || 'undefined'}`);
    }
}

function loadTlsCredentials({
    keyPath,
    certPath,
    caPath,
    rejectUnauthorized = false,
    minVersion = 'TLSv1.2',
    cwd = process.cwd()
} = {}) {
    const resolvedKeyPath = resolveCredentialPath(cwd, keyPath);
    const resolvedCertPath = resolveCredentialPath(cwd, certPath);
    const resolvedCaPath = resolveCredentialPath(cwd, caPath);

    mustExistFile(resolvedKeyPath, 'private key');
    mustExistFile(resolvedCertPath, 'certificate');
    if (resolvedCaPath) {
        mustExistFile(resolvedCaPath, 'certificate authority');
    }

    const tlsOptions = {
        key: fs.readFileSync(resolvedKeyPath),
        cert: fs.readFileSync(resolvedCertPath),
        requestCert: Boolean(resolvedCaPath || rejectUnauthorized),
        rejectUnauthorized,
        minVersion
    };

    if (resolvedCaPath) {
        tlsOptions.ca = fs.readFileSync(resolvedCaPath);
    }

    return {
        tlsOptions,
        keyPath: resolvedKeyPath,
        certPath: resolvedCertPath,
        caPath: resolvedCaPath,
        rejectUnauthorized
    };
}

module.exports = { loadTlsCredentials };