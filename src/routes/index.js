import express from 'express';
import imageRoutes from './imageRoutes.js';
import { healthCheck } from '../controllers/healthController.js';

const router = express.Router();

// 健康检查路由
router.get('/health', healthCheck);

// API路由
router.use('/images', imageRoutes);

export default router; 