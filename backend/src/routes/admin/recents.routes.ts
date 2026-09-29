import { Router } from 'express';
import * as recents from '../../controllers/admin/recents.controller';

const router = Router();

router.get('/', recents.index);
router.post('/', recents.create);
// Declared before /:id so the literal path is never read as an id
router.put('/order', recents.reorder);
router.get('/:id', recents.show);
router.patch('/:id', recents.update);
router.delete('/:id', recents.destroy);

export default router;
