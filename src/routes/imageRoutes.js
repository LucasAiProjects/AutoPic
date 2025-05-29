import express from 'express';
import { generateImage, getImageResult } from '../controllers/imageController.js';
import { validateMethod, validateJsonBody, validateRequiredFields } from '../middleware/validateRequest.js';
import { imageRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route POST /api/images/generate
 * @desc 创建图像生成任务
 * @access Public
 */
router.post(
  '/generate',
  validateMethod(['POST']),
  validateJsonBody,
  validateRequiredFields(['prompt']),
  imageRateLimiter,
  generateImage
);

/**
 * @route GET /api/images/:taskId
 * @desc 获取图像生成结果
 * @access Public
 */
router.get(
  '/:taskId',
  validateMethod(['GET']),
  getImageResult
);

export default router; 