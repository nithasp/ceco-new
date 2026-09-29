import { Router } from 'express';
import * as headers from '../../controllers/admin/headers.controller';

export const headerRoutes = Router();

headerRoutes.get('/', headers.index);
headerRoutes.post('/', headers.create);
headerRoutes.get('/:id', headers.show);
headerRoutes.patch('/:id', headers.update);
headerRoutes.delete('/:id', headers.destroy);
headerRoutes.post('/:id/slides', headers.addSlide);
headerRoutes.put('/:id/slides/order', headers.reorderSlides);

// A slide is edited by its own id, so the CMS does not have to know which header it belongs to
export const headerSlideRoutes = Router();

headerSlideRoutes.patch('/:id', headers.updateSlide);
headerSlideRoutes.delete('/:id', headers.destroySlide);
