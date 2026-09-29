import { api, API, cookieValue, createAdmin, refreshCookie } from '../support/api';

describe('Auth endpoints', () => {
  describe('POST /auth/login', () => {
    it('returns an access token and the account', async () => {
      const admin = await createAdmin('loginok');
      const res = await api
        .post(`${API}/auth/login`)
        .send({ username: admin.username, password: admin.password })
        .expect(200);

      expect(res.body.data.user.username).toBe(admin.username);
      expect(res.body.data.user.role).toBe('admin');
      expect(typeof res.body.data.accessToken).toBe('string');
    });

    it('keeps the refresh token out of the body and in an HttpOnly cookie', async () => {
      const admin = await createAdmin('logincookie');
      const res = await api
        .post(`${API}/auth/login`)
        .send({ username: admin.username, password: admin.password })
        .expect(200);

      expect(res.body.data.refreshToken).toBeUndefined();

      const cookie = refreshCookie(res);
      expect(cookie).toBeDefined();
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Path=/api/v1/auth');
    });

    it('rejects a wrong password without saying which field was wrong', async () => {
      const admin = await createAdmin('loginbad');
      const res = await api
        .post(`${API}/auth/login`)
        .send({ username: admin.username, password: 'not-the-password' })
        .expect(401);

      expect(res.body.message).toBe('Invalid username or password');
      expect(res.body.code).toBe('invalid_credentials');
    });

    it('answers an unknown username the same way', async () => {
      const res = await api
        .post(`${API}/auth/login`)
        .send({ username: 'nobody-at-all', password: 'whatever12345' })
        .expect(401);

      expect(res.body.message).toBe('Invalid username or password');
    });

    it('rejects a body with no password', async () => {
      const res = await api.post(`${API}/auth/login`).send({ username: 'someone' }).expect(400);
      expect(res.body.code).toBe('invalid_request');
    });
  });

  // There is no public sign-up: the site has one editor account, created by the seed script
  it('has no register route', async () => {
    const res = await api
      .post(`${API}/auth/register`)
      .send({ username: 'intruder', password: 'goodpass123' })
      .expect(404);
    expect(res.body.code).toBe('not_found');
  });

  describe('POST /auth/refresh', () => {
    it('rotates the cookie and returns a new access token', async () => {
      const admin = await createAdmin('refresh');
      const first = await admin.agent
        .post(`${API}/auth/login`)
        .send({ username: admin.username, password: admin.password })
        .expect(200);
      const firstCookie = refreshCookie(first);

      const res = await admin.agent.post(`${API}/auth/refresh`).expect(200);
      const secondCookie = refreshCookie(res);

      expect(typeof res.body.data.accessToken).toBe('string');
      expect(secondCookie).toBeDefined();
      expect(cookieValue(secondCookie as string)).not.toBe(cookieValue(firstCookie as string));
    });

    it('refuses when there is no cookie', async () => {
      const res = await api.post(`${API}/auth/refresh`).expect(401);
      expect(res.body.code).toBe('token_invalid');
    });
  });

  describe('GET /auth/me', () => {
    it('returns the signed-in account', async () => {
      const admin = await createAdmin('me');
      const res = await admin.get('/auth/me').expect(200);
      expect(res.body.data.username).toBe(admin.username);
    });

    it('refuses a request with no token', async () => {
      const res = await api.get(`${API}/auth/me`).expect(401);
      expect(res.body.code).toBe('no_token');
    });

    it('refuses a token that is not a JWT', async () => {
      const res = await api.get(`${API}/auth/me`).set('Authorization', 'Bearer not-a-real-token').expect(401);
      expect(res.body.code).toBe('token_invalid');
    });

    it('refuses a scheme that is not Bearer', async () => {
      const admin = await createAdmin('scheme');
      const res = await api.get(`${API}/auth/me`).set('Authorization', `Basic ${admin.token}`).expect(401);
      expect(res.body.code).toBe('token_invalid');
    });
  });

  describe('POST /auth/logout', () => {
    it('clears the cookie and stops the session refreshing', async () => {
      const admin = await createAdmin('logout');
      await admin.agent
        .post(`${API}/auth/login`)
        .send({ username: admin.username, password: admin.password })
        .expect(200);

      await admin.agent.post(`${API}/auth/logout`).expect(200);
      await admin.agent.post(`${API}/auth/refresh`).expect(401);
    });
  });
});
