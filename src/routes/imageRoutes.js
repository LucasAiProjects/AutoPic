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
  (req, res, next) => {
    console.log('[Route] POST /api/images/generate 被访问了');
    next();
  },
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
  (req, res, next) => {
    console.log('[Route] GET /api/images/:taskId 被访问了');
    next();
  },
  requireAuth,
  validateMethod(['GET']),
  getImageResult
);

export default router; 