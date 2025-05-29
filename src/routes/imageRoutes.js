import express from 'express';
import { generateImage, getImageResult } from '../controllers/imageController.js';
import { validateMethod, validateJsonBody, validateRequiredFields } from '../middleware/validateRequest.js';
import { imageRateLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/images/generate
 * @desc 创建图像生成任务
 * @access Private
 */
router.post(
  '/generate',
  requireAuth,
  validateMethod(['POST']),
  validateJsonBody,
  validateRequiredFields(['prompt']),
  imageRateLimiter,
  generateImage
);

/**
 * @route GET /api/images/:taskId
 * @desc 获取图像生成结果
 * @access Private
 */
router.get(
  '/:taskId',
  requireAuth,
  validateMethod(['GET']),
  getImageResult
);

export default router; 