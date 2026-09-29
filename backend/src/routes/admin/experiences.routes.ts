import { Router } from 'express';
import * as experiences from '../../controllers/admin/experiences.controller';

export const experienceRoutes = Router();

experienceRoutes.get('/', experiences.index);
experienceRoutes.post('/', experiences.create);
experienceRoutes.get('/:id', experiences.show);
experienceRoutes.patch('/:id', experiences.update);
experienceRoutes.delete('/:id', experiences.destroy);
experienceRoutes.post('/:id/companies', experiences.addCompany);
experienceRoutes.put('/:id/companies/order', experiences.reorderCompanies);

// A company and its work rows are addressed directly, the same way slides are
export const experienceCompanyRoutes = Router();

experienceCompanyRoutes.get('/:id', experiences.showCompany);
experienceCompanyRoutes.patch('/:id', experiences.updateCompany);
experienceCompanyRoutes.delete('/:id', experiences.destroyCompany);
experienceCompanyRoutes.post('/:id/works', experiences.addWork);
experienceCompanyRoutes.put('/:id/works/order', experiences.reorderWorks);

export const experienceWorkRoutes = Router();

experienceWorkRoutes.patch('/:id', experiences.updateWork);
experienceWorkRoutes.delete('/:id', experiences.destroyWork);
