import { Router } from 'express';
import * as content from '../controllers/content.controller';

const router = Router();

// Open on purpose: this is the website's own content and it is read-only here. Everything that
// changes it lives under /admin behind a token.
router.get('/header', content.header);
router.get('/recent-projects', content.recentProjects);
router.get('/experiences', content.experiences);
router.get('/experiences/:type', content.experienceByType);
router.get('/recruitments', content.recruitments);
router.get('/documents', content.documents);
router.get('/company-profile', content.companyProfile);
router.get('/logo', content.logo);

export default router;
