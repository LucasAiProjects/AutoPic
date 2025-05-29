import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/errorHandler.js';
import { verifySupabaseToken } from './supabase.js';
import logger from '../utils/logger.js';

/**
 * Supabase JWT 认证中间件
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // 检查是否提供了认证头
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`认证失败: 未提供有效的认证头, IP: ${req.ip}, Path: ${req.path}`);
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        '未提供认证令牌',
        true,
        '',
        '/login'
      );
    }

    // 提取 token
    const token = authHeader.split(' ')[1];
    logger.info(`开始验证Supabase JWT token, IP: ${req.ip}, Path: ${req.path}`);
    
    // 验证 Supabase JWT token
    const user = await verifySupabaseToken(token);
    
    if (!user) {
      logger.error(`Supabase JWT token验证失败, IP: ${req.ip}, Path: ${req.path}`);
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        '无效的认证令牌',
        true,
        '',
        '/login'
      );
    }

    logger.info(`Supabase JWT认证成功: 用户ID: ${user.id}, Email: ${user.email}, IP: ${req.ip}, Path: ${req.path}`);
    
    // 将用户信息添加到请求对象中
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      ...user
    };
    
    next();
  } catch (error) {
    next(error);
  }
}; 