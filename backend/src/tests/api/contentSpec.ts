import { api, API, createAdmin, ensureHeader, uniqueName } from '../support/api';

// The public routes are what the website itself calls: open, read-only, and published rows only
describe('Public content endpoints', () => {
  it('needs no token', async () => {
    await api.get(`${API}/content/header?locale=th`).expect(200);
    await api.get(`${API}/content/recent-projects?locale=th`).expect(200);
    await api.get(`${API}/content/experiences?locale=th`).expect(200);
    await api.get(`${API}/content/recruitments?locale=th`).expect(200);
  });

  it('rejects a locale the site does not have', async () => {
    const res = await api.get(`${API}/content/header?locale=fr`).expect(400);
    expect(res.body.code).toBe('invalid_request');
  });

  it('falls back to the default locale when none is given', async () => {
    const res = await api.get(`${API}/content/recruitments`).expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  describe('GET /content/header', () => {
    it('returns the carousel with its slides in order', async () => {
      const admin = await createAdmin('headerpub');
      const headerId = await ensureHeader(admin, 'th');

      const first = await admin
        .post(`/admin/headers/${headerId}/slides`, { title: uniqueName('first') })
        .expect(201);
      const second = await admin
        .post(`/admin/headers/${headerId}/slides`, { title: uniqueName('second') })
        .expect(201);

      const res = await api.get(`${API}/content/header?locale=th`).expect(200);
      const ids = (res.body.data.slides as { id: number }[]).map((slide) => slide.id);

      expect(ids).toContain(first.body.data.id);
      expect(ids).toContain(second.body.data.id);
      expect(ids.indexOf(first.body.data.id)).toBeLessThan(ids.indexOf(second.body.data.id));
    });

    it('leaves an unpublished slide out', async () => {
      const admin = await createAdmin('headerdraft');
      const headerId = await ensureHeader(admin, 'th');

      const draft = await admin
        .post(`/admin/headers/${headerId}/slides`, { title: uniqueName('draft'), isPublished: false })
        .expect(201);

      const res = await api.get(`${API}/content/header?locale=th`).expect(200);
      const ids = (res.body.data.slides as { id: number }[]).map((slide) => slide.id);
      expect(ids).not.toContain(draft.body.data.id);

      // ...but the CMS still sees it
      const adminView = await admin.get(`/admin/headers/${headerId}`).expect(200);
      const adminIds = (adminView.body.data.slides as { id: number }[]).map((slide) => slide.id);
      expect(adminIds).toContain(draft.body.data.id);
    });
  });

  describe('GET /content/recruitments', () => {
    it('returns published jobs for the language asked for', async () => {
      const admin = await createAdmin('jobspub');
      const title = uniqueName('Engineer');
      await admin.post('/admin/recruitments', { position: title, locale: 'en' }).expect(201);

      const english = await api.get(`${API}/content/recruitments?locale=en`).expect(200);
      expect((english.body.data as { position: string }[]).some((job) => job.position === title)).toBe(true);

      const thai = await api.get(`${API}/content/recruitments?locale=th`).expect(200);
      expect((thai.body.data as { position: string }[]).some((job) => job.position === title)).toBe(false);
    });

    it('leaves a draft out', async () => {
      const admin = await createAdmin('jobdraft');
      const title = uniqueName('Hidden');
      await admin
        .post('/admin/recruitments', { position: title, locale: 'en', isPublished: false })
        .expect(201);

      const res = await api.get(`${API}/content/recruitments?locale=en`).expect(200);
      expect((res.body.data as { position: string }[]).some((job) => job.position === title)).toBe(false);
    });
  });

  describe('GET /content/experiences/:type', () => {
    it('returns the table for one service page, with its companies and work rows', async () => {
      const admin = await createAdmin('exppub');
      const created = await admin.post('/admin/experiences', { type: 'design', locale: 'en' });
      const experienceId =
        created.status === 201
          ? created.body.data.id
          : (await admin.get('/admin/experiences?locale=en&type=design').expect(200)).body.data[0].id;

      const company = await admin
        .post(`/admin/experiences/${experienceId}/companies`, { name: uniqueName('Client') })
        .expect(201);
      await admin
        .post(`/admin/experience-companies/${company.body.data.id}/works`, {
          description: 'Substation design',
          year: 2023,
        })
        .expect(201);

      const res = await api.get(`${API}/content/experiences/design?locale=en`).expect(200);
      expect(res.body.data.type).toBe('design');

      const companies = res.body.data.companies as { id: number; works: unknown[] }[];
      const found = companies.find((item) => item.id === company.body.data.id);
      expect(found).toBeDefined();
      expect(found?.works.length).toBe(1);
    });

    it('rejects a service type that does not exist', async () => {
      const res = await api.get(`${API}/content/experiences/welding?locale=th`).expect(400);
      expect(res.body.code).toBe('invalid_request');
    });
  });

  describe('GET /content/company-profile', () => {
    it('answers even when no PDF has been attached yet', async () => {
      const res = await api.get(`${API}/content/company-profile`).expect(200);
      // null, or an entry whose fileUrl may still be null
      expect(res.body.status).toBe(200);
    });
  });
});
