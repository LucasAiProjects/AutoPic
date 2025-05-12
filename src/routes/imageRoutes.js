import express from 'express';
import { generateImage } from '../controllers/imageController.js';
import { validateMethod, validateJsonBody, validateRequiredFields } from '../middleware/validateRequest.js';

const router = express.Router();

/**
 * @route POST /api/images/generate
 * @desc 生成图像
 * @access Public
 */
router.post(
  '/generate',
  validateMethod(['POST']),
  validateJsonBody,
  validateRequiredFields(['prompt']),
  generateImage
);

export default router; 