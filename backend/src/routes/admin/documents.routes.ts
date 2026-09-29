import { Router } from 'express';
import * as documents from '../../controllers/admin/documents.controller';

const router = Router();

router.get('/', documents.index);
router.post('/', documents.create);
router.get('/:id', documents.show);
router.patch('/:id', documents.update);
router.delete('/:id', documents.destroy);

export default router;
