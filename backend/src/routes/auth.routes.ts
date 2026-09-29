import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { verifyAuthToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// No /register: the one editor account is created by `npm run seed:admin`
router.post('/login', authLimiter, auth.login);
router.post('/refresh', authLimiter, auth.refresh);
router.post('/logout', auth.logout);
router.post('/logout-all', verifyAuthToken, auth.logoutAll);
router.get('/me', verifyAuthToken, auth.me);

export default router;
