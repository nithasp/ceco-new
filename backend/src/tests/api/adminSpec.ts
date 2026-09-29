import { api, API, createAdmin, createEditor, ensureHeader, TINY_GIF, uniqueName } from '../support/api';

describe('Admin endpoints', () => {
  describe('the guard', () => {
    it('refuses a request with no token', async () => {
      const res = await api.get(`${API}/admin/headers`).expect(401);
      expect(res.body.code).toBe('no_token');
    });

    // The role is read from the database on every request, not taken from the token
    it('refuses a signed-in account that is not an admin', async () => {
      const editor = await createEditor();
      const res = await editor.get('/admin/headers').expect(403);
      expect(res.body.code).toBe('forbidden');
    });

    it('lets an admin through', async () => {
      const admin = await createAdmin();
      await admin.get('/admin/headers').expect(200);
    });
  });

  describe('carousel slides', () => {
    it('creates, edits and deletes a slide', async () => {
      const admin = await createAdmin('slidecrud');
      const headerId = await ensureHeader(admin, 'th');

      const created = await admin
        .post(`/admin/headers/${headerId}/slides`, { title: 'Before', description: 'first' })
        .expect(201);
      const slideId = created.body.data.id as number;
      expect(created.body.data.position).toEqual(jasmine.any(Number));

      const updated = await admin.patch(`/admin/header-slides/${slideId}`, { title: 'After' }).expect(200);
      expect(updated.body.data.title).toBe('After');
      expect(updated.body.data.description).toBe('first');

      await admin.delete(`/admin/header-slides/${slideId}`).expect(200);
      await admin.patch(`/admin/header-slides/${slideId}`, { title: 'Gone' }).expect(404);
    });

    it('refuses a slide with no title', async () => {
      const admin = await createAdmin('slidevalid');
      const headerId = await ensureHeader(admin, 'th');

      const res = await admin.post(`/admin/headers/${headerId}/slides`, { title: '   ' }).expect(400);
      expect(res.body.message).toBe('title is required');
    });

    it('refuses an image id that points at no file', async () => {
      const admin = await createAdmin('slideimage');
      const headerId = await ensureHeader(admin, 'th');

      const res = await admin
        .post(`/admin/headers/${headerId}/slides`, { title: 'With image', imageId: 999999 })
        .expect(404);
      expect(res.body.code).toBe('not_found');
    });

    it('reorders slides', async () => {
      const admin = await createAdmin('slideorder');
      const headerId = await ensureHeader(admin, 'en');

      const one = await admin.post(`/admin/headers/${headerId}/slides`, { title: 'one' }).expect(201);
      const two = await admin.post(`/admin/headers/${headerId}/slides`, { title: 'two' }).expect(201);

      const reordered = await admin
        .put(`/admin/headers/${headerId}/slides/order`, {
          ids: [two.body.data.id, one.body.data.id],
        })
        .expect(200);

      const ids = (reordered.body.data as { id: number }[]).map((slide) => slide.id);
      expect(ids.indexOf(two.body.data.id)).toBeLessThan(ids.indexOf(one.body.data.id));
    });

    it('rejects a reorder that repeats an id', async () => {
      const admin = await createAdmin('slidedup');
      const headerId = await ensureHeader(admin, 'en');
      const res = await admin.put(`/admin/headers/${headerId}/slides/order`, { ids: [1, 1] }).expect(400);
      expect(res.body.code).toBe('invalid_request');
    });
  });

  describe('one carousel per language', () => {
    it('refuses a second header for a locale that already has one', async () => {
      const admin = await createAdmin('dupheader');
      await ensureHeader(admin, 'th');

      const res = await admin.post('/admin/headers', { name: 'Another', locale: 'th' }).expect(409);
      expect(res.body.code).toBe('conflict');
    });
  });

  describe('media', () => {
    it('uploads a file, reads its size back and deletes it', async () => {
      const admin = await createAdmin('upload');

      const uploaded = await admin.agent
        .post(`${API}/admin/media`)
        .set('Authorization', `Bearer ${admin.token}`)
        .attach('file', TINY_GIF, { filename: 'pixel.gif', contentType: 'image/gif' })
        .field('alternativeText', 'a single pixel')
        .expect(201);

      expect(uploaded.body.data.mime).toBe('image/gif');
      expect(uploaded.body.data.ext).toBe('.gif');
      expect(uploaded.body.data.size).toBe(TINY_GIF.length);
      expect(uploaded.body.data.width).toBe(1);
      expect(uploaded.body.data.url).toContain(uploaded.body.data.key);

      await admin.delete(`/admin/media/${uploaded.body.data.id}`).expect(200);
    });

    // The extension in the key comes from the declared type, never from the filename
    it('refuses a type that is not on the allow list', async () => {
      const admin = await createAdmin('uploadbad');

      const res = await admin.agent
        .post(`${API}/admin/media`)
        .set('Authorization', `Bearer ${admin.token}`)
        .attach('file', Buffer.from('<?php echo 1; ?>'), {
          filename: 'shell.php',
          contentType: 'application/x-httpd-php',
        })
        .expect(415);

      expect(res.body.code).toBe('unsupported_media_type');
    });

    it('will not delete a file a slide still uses, unless forced', async () => {
      const admin = await createAdmin('mediaref');
      const headerId = await ensureHeader(admin, 'th');

      const uploaded = await admin.agent
        .post(`${API}/admin/media`)
        .set('Authorization', `Bearer ${admin.token}`)
        .attach('file', TINY_GIF, { filename: 'used.gif', contentType: 'image/gif' })
        .expect(201);
      const mediaId = uploaded.body.data.id as number;

      const slide = await admin
        .post(`/admin/headers/${headerId}/slides`, { title: uniqueName('uses image'), imageId: mediaId })
        .expect(201);

      const refused = await admin.delete(`/admin/media/${mediaId}`).expect(409);
      expect(refused.body.code).toBe('conflict');

      await admin.delete(`/admin/media/${mediaId}?force=true`).expect(200);

      // The slide survives and simply loses its picture
      const after = await admin.get(`/admin/headers/${headerId}`).expect(200);
      const kept = (after.body.data.slides as { id: number; imageId: number | null }[]).find(
        (item) => item.id === slide.body.data.id,
      );
      expect(kept).toBeDefined();
      expect(kept?.imageId).toBeNull();
    });
  });

  describe('previous work', () => {
    it('deletes a company together with its work rows', async () => {
      const admin = await createAdmin('expcascade');
      const created = await admin.post('/admin/experiences', { type: 'maintenance', locale: 'en' });
      const experienceId =
        created.status === 201
          ? created.body.data.id
          : (await admin.get('/admin/experiences?locale=en&type=maintenance').expect(200)).body.data[0].id;

      const company = await admin
        .post(`/admin/experiences/${experienceId}/companies`, { name: uniqueName('Co') })
        .expect(201);
      const work = await admin
        .post(`/admin/experience-companies/${company.body.data.id}/works`, { description: 'Annual check' })
        .expect(201);

      await admin.delete(`/admin/experience-companies/${company.body.data.id}`).expect(200);
      await admin.patch(`/admin/experience-works/${work.body.data.id}`, { description: 'x' }).expect(404);
    });

    it('rejects a year outside the allowed range', async () => {
      const admin = await createAdmin('expyear');
      const created = await admin.post('/admin/experiences', { type: 'commission', locale: 'en' });
      const experienceId =
        created.status === 201
          ? created.body.data.id
          : (await admin.get('/admin/experiences?locale=en&type=commission').expect(200)).body.data[0].id;

      const company = await admin
        .post(`/admin/experiences/${experienceId}/companies`, { name: uniqueName('Co') })
        .expect(201);

      const res = await admin
        .post(`/admin/experience-companies/${company.body.data.id}/works`, {
          description: 'Too early',
          year: 1500,
        })
        .expect(400);
      expect(res.body.code).toBe('invalid_request');
    });
  });

  describe('jobs', () => {
    it('creates, publishes and deletes a job', async () => {
      const admin = await createAdmin('jobcrud');
      const created = await admin
        .post('/admin/recruitments', {
          position: uniqueName('Technician'),
          description: '<p>Requirements</p>',
          amount: 2,
          locale: 'en',
        })
        .expect(201);

      expect(created.body.data.isPublished).toBe(true);
      expect(created.body.data.amount).toBe(2);

      const hidden = await admin
        .patch(`/admin/recruitments/${created.body.data.id}`, { isPublished: false })
        .expect(200);
      expect(hidden.body.data.isPublished).toBe(false);

      await admin.delete(`/admin/recruitments/${created.body.data.id}`).expect(200);
      await admin.get(`/admin/recruitments/${created.body.data.id}`).expect(404);
    });

    it('rejects an update that changes nothing', async () => {
      const admin = await createAdmin('jobnoop');
      const created = await admin
        .post('/admin/recruitments', { position: uniqueName('Role'), locale: 'en' })
        .expect(201);

      const res = await admin.patch(`/admin/recruitments/${created.body.data.id}`, {}).expect(400);
      expect(res.body.code).toBe('invalid_request');
    });
  });

  describe('audit log', () => {
    it('records a write and the account that made it', async () => {
      const admin = await createAdmin('audit');
      const title = uniqueName('Audited');
      await admin.post('/admin/recruitments', { position: title, locale: 'en' }).expect(201);

      // The log is written after the response is sent
      await new Promise((resolve) => setTimeout(resolve, 150));

      const res = await admin.get('/admin/audit-logs?limit=50').expect(200);
      const entries = res.body.data as { event: string; username: string; action: string }[];
      const found = entries.find(
        (entry) => entry.event === 'recruitment.created' && entry.username === admin.username,
      );

      expect(found).toBeDefined();
      expect(found?.action).toBe('CREATE');
    });

    it('is read-only', async () => {
      const admin = await createAdmin('auditro');
      await admin.delete('/admin/audit-logs/1').expect(404);
    });
  });
});
