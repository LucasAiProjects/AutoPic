import express from 'express';
import imageRoutes from './imageRoutes.js';
import { healthCheck } from '../controllers/healthController.js';

const router = express.Router();

// 健康检查路由
router.get('/health', healthCheck);

// API路由
router.use('/images', (req, res, next) => {
  console.log('[Main Route] /api/images 路由被访问了:', req.method, req.url);
  next();
}, imageRoutes);

export default router; 