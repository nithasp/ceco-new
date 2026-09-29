import { Router } from 'express';
import * as users from '../controllers/users.controller';
import { verifyAuthToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// Only the signed-in account itself: there is no /users/:id here, so one account can never read or
// change another (OWASP API1)
router.use(verifyAuthToken);

router.patch('/me', users.updateMe);
router.put('/me/password', authLimiter, users.changePassword);

export default router;
