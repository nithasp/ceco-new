import { Router } from 'express';
import * as media from '../../controllers/admin/media.controller';
import { uploadSingleFile } from '../../middleware/upload';

const router = Router();

router.get('/', media.index);
// multipart/form-data: the file in a 'file' field, any caption or alt text alongside it
router.post('/', uploadSingleFile, media.upload);
router.get('/:id', media.show);
router.patch('/:id', media.update);
router.delete('/:id', media.destroy);

export default router;
