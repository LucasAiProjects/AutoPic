import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/errorHandler.js';
import { verifySupabaseToken } from '../config/supabase.js';
import User from '../models/User.js';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * 用户注册控制器 - 完成用户信息补充
 */
export const registerUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const { username, priority = 'normal' } = req.body;

    // 验证必填字段
    if (!username || username.trim().length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, '用户名不能为空');
    }

    if (username.trim().length > 32) {
      throw new ApiError(StatusCodes.BAD_REQUEST, '用户名长度不能超过32个字符');
    }

    // 验证优先级
    const validPriorities = ['normal', 'premium', 'vip'];
    if (!validPriorities.includes(priority)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, '无效的用户优先级');
    }

    // 验证 Supabase JWT token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, '未提供认证令牌');
    }

    const token = authHeader.split(' ')[1];
    const supabaseUser = await verifySupabaseToken(token);
    
    if (!supabaseUser) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, '无效的认证令牌');
    }

    logger.info(`开始注册用户: ${supabaseUser.id}, Email: ${supabaseUser.email}`);

    // 检查用户是否已经在数据库中存在
    const existingUser = await User.findByUserId(supabaseUser.id);
    if (existingUser) {
      throw new ApiError(StatusCodes.CONFLICT, '用户已存在，无需重复注册');
    }

    // 创建新用户
    const newUser = await User.create({
      user_id: supabaseUser.id,
      username: username.trim(),
      email: supabaseUser.email || '',
      priority: priority
    });

    logger.info(`用户注册成功: ${newUser.user_id}, Username: ${newUser.username}`);

    // 返回成功响应
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: '用户注册成功',
      data: {
        user_id: newUser.user_id,
        username: newUser.username
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (req, res, next) => {
    const user = req.user;
    
    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        user_id: user.dbUser.user_id,
        username: user.dbUser.username,
        priority: user.dbUser.priority
      }
    });
}; 