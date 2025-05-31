import express from 'express';
import { generateImage, getImageResult } from '../controllers/imageController.js';
import { validateMethod, validateJsonBody, validateRequiredFields } from '../middleware/validateRequest.js';
import { imageRateLimiter, userBasedRateLimiter } from '../middleware/rateLimiter.js';
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
  userBasedRateLimiter,  // 基于用户ID的通用限流
  imageRateLimiter,      // 图像生成专用限流
  validateMethod(['POST']),
  validateJsonBody,
  validateRequiredFields(['prompt']),
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
  userBasedRateLimiter,  // 基于用户ID的通用限流
  validateMethod(['GET']),
  getImageResult
);

export default router; 