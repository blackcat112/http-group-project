function parseBasicAuth(headerValue) {
    if (!headerValue || typeof headerValue !== 'string') return null;

    const [scheme, encoded] = headerValue.trim().split(' ');
    if (!scheme || !encoded || scheme.toLowerCase() !== 'basic') return null;

    let decoded;
    try {
        decoded = Buffer.from(encoded, 'base64').toString('utf8');
    } catch (error) {
        return null;
    }

    const separator = decoded.indexOf(':');
    if (separator === -1) return null;

    return {
        username: decoded.substring(0, separator),
        password: decoded.substring(separator + 1)
    };
}

function parseBodyCredentials(body) {
    if (!body || typeof body !== 'string') return null;

    try {
        const parsed = JSON.parse(body);
        if (!parsed || typeof parsed !== 'object') return null;
        if (!parsed.username || !parsed.password) return null;

        return {
            username: String(parsed.username),
            password: String(parsed.password)
        };
    } catch (error) {
        return null;
    }
}

function createLoginValidator({ users = {}, customValidator } = {}) {
    function validateAgainstStore(username, password) {
        if (typeof customValidator === 'function') {
            return Boolean(customValidator({ username, password }));
        }

        if (!users || typeof users !== 'object') return false;
        return Object.prototype.hasOwnProperty.call(users, username) && users[username] === password;
    }

    function validateLogin(request = {}) {
        const headers = request.headers || {};
        const fromHeader = parseBasicAuth(headers.authorization || headers.Authorization);
        const fromBody = parseBodyCredentials(request.body);
        const credentials = fromHeader || fromBody;

        if (!credentials) {
            return { ok: false, reason: 'MISSING_CREDENTIALS' };
        }

        const ok = validateAgainstStore(credentials.username, credentials.password);

        if (!ok) {
            return { ok: false, reason: 'INVALID_CREDENTIALS' };
        }

        return { ok: true, user: credentials.username };
    }

    return { validateLogin };
}

module.exports = { createLoginValidator };
