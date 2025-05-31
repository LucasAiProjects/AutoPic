import express from 'express';
import { registerUser, getCurrentUser } from '../controllers/userController.js';
import { userRegistrationRateLimiter, userBasedRateLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/users/register
 * @desc 用户注册 - 完成用户信息补充
 * @access 需要 Supabase JWT token
 */
router.post('/register', userRegistrationRateLimiter, registerUser);

/**
 * @route GET /api/users/me
 * @desc 获取当前用户信息
 * @access 需要 Supabase JWT token
 */
router.get('/me', requireAuth, userBasedRateLimiter, getCurrentUser);

export default router; 