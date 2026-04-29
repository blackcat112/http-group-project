const { createLoginValidator } = require('../../premium/tls/login_validator');

describe('login_validator', () => {
  describe('createLoginValidator', () => {
    it('should validate against provided users object', () => {
      const validator = createLoginValidator({
        users: { 'admin': 'secret123' }
      });

      // valid basic auth header: admin:secret123 -> YWRtaW46c2VjcmV0MTIz
      const req = { headers: { authorization: 'Basic YWRtaW46c2VjcmV0MTIz' } };
      const result = validator.validateLogin(req);
      
      expect(result).toEqual({ ok: true, user: 'admin' });
    });

    it('should fail with INVALID_CREDENTIALS for wrong password', () => {
      const validator = createLoginValidator({
        users: { 'admin': 'secret123' }
      });

      // admin:wrong -> YWRtaW46d3Jvbmc=
      const req = { headers: { authorization: 'Basic YWRtaW46d3Jvbmc=' } };
      const result = validator.validateLogin(req);
      
      expect(result).toEqual({ ok: false, reason: 'INVALID_CREDENTIALS' });
    });

    it('should fail with MISSING_CREDENTIALS if no auth header or body provided', () => {
      const validator = createLoginValidator();
      const req = { headers: {} };
      const result = validator.validateLogin(req);
      
      expect(result).toEqual({ ok: false, reason: 'MISSING_CREDENTIALS' });
    });

    it('should validate credentials from JSON body', () => {
      const validator = createLoginValidator({
        users: { 'user1': 'pass1' }
      });

      const req = { body: JSON.stringify({ username: 'user1', password: 'pass1' }) };
      const result = validator.validateLogin(req);
      
      expect(result).toEqual({ ok: true, user: 'user1' });
    });

    it('should use customValidator if provided', () => {
      const customValidator = jest.fn().mockReturnValue(true);
      const validator = createLoginValidator({ customValidator });
      
      const req = { headers: { authorization: 'Basic YWRtaW46c2VjcmV0MTIz' } };
      const result = validator.validateLogin(req);
      
      expect(customValidator).toHaveBeenCalledWith({ username: 'admin', password: 'secret123' });
      expect(result).toEqual({ ok: true, user: 'admin' });
    });
  });
});
