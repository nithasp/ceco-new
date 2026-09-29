import { Router } from 'express';
import adminRoutes from './admin';
import authRoutes from './auth.routes';
import contentRoutes from './content.routes';
import userRoutes from './users.routes';

const api = Router();

api.use('/auth', authRoutes);
api.use('/users', userRoutes);
api.use('/content', contentRoutes);
api.use('/admin', adminRoutes);

export default api;
