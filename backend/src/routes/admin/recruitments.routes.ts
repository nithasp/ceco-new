import { Router } from 'express';
import * as recruitments from '../../controllers/admin/recruitments.controller';

const router = Router();

router.get('/', recruitments.index);
router.post('/', recruitments.create);
router.put('/order', recruitments.reorder);
router.get('/:id', recruitments.show);
router.patch('/:id', recruitments.update);
router.delete('/:id', recruitments.destroy);

export default router;
