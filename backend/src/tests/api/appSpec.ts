import { api, API } from '../support/api';

describe('The application', () => {
  it('answers the health check', async () => {
    const res = await api.get('/healthz').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('answers the root', async () => {
    const res = await api.get('/').expect(200);
    expect(res.body.message).toContain('CECO');
  });

  it('serves the OpenAPI document', async () => {
    const res = await api.get('/openapi.yaml').expect(200);
    expect(res.text).toContain('CECO Content API');
  });

  it('gives an unknown route a 404 in the same envelope as every other error', async () => {
    const res = await api.get(`${API}/nothing-here`).expect(404);
    expect(res.body.code).toBe('not_found');
    expect(res.body.data).toBeNull();
  });

  it('rejects a body that is not valid JSON', async () => {
    const res = await api
      .post(`${API}/auth/login`)
      .set('Content-Type', 'application/json')
      .send('{"username": ')
      .expect(400);
    expect(res.body.message).toBe('Request body must be valid JSON');
  });

  it('sets the security headers helmet provides', async () => {
    const res = await api.get('/healthz').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
  });

  it('puts a request id on the response', async () => {
    const res = await api.get('/healthz').expect(200);
    expect(res.headers['x-request-id']).toBeDefined();
  });
});
