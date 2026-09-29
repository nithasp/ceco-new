import { Router } from 'express';
import * as logs from '../../controllers/admin/logs.controller';
import { requireAdmin, verifyAuthToken } from '../../middleware/auth';
import documentRoutes from './documents.routes';
import { experienceCompanyRoutes, experienceRoutes, experienceWorkRoutes } from './experiences.routes';
import { headerRoutes, headerSlideRoutes } from './headers.routes';
import mediaRoutes from './media.routes';
import recentRoutes from './recents.routes';
import recruitmentRoutes from './recruitments.routes';

const router = Router();

// One guard chain for the whole namespace: a valid token, then the role read from the database
router.use(verifyAuthToken, requireAdmin);

router.use('/media', mediaRoutes);
router.use('/headers', headerRoutes);
router.use('/header-slides', headerSlideRoutes);
router.use('/recent-projects', recentRoutes);
router.use('/experiences', experienceRoutes);
router.use('/experience-companies', experienceCompanyRoutes);
router.use('/experience-works', experienceWorkRoutes);
router.use('/recruitments', recruitmentRoutes);
router.use('/documents', documentRoutes);

// Read-only on purpose: there is no route that edits or deletes an entry
router.get('/audit-logs', logs.auditLogs);

export default router;
