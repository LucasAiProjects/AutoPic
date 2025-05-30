import express from 'express';
import { registerUser, getCurrentUser } from '../controllers/userController.js';

const router = express.Router();

/**
 * @route POST /api/users/register
 * @desc 用户注册 - 完成用户信息补充
 * @access 需要 Supabase JWT token
 */
router.post('/register', registerUser);

/**
 * @route GET /api/users/me
 * @desc 获取当前用户信息
 * @access 需要 Supabase JWT token
 */
router.get('/me', getCurrentUser);

export default router; 