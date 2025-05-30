import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/errorHandler.js';
import { verifySupabaseToken } from '../config/supabase.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Supabase JWT 认证中间件（需要数据库用户存在）
 */
export const requireAuth = async (req, res, next) => {
  logger.warn('[Middleware] requireAuth 被调用了');

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
    const supabaseUser = await verifySupabaseToken(token);
    
    if (!supabaseUser) {
      logger.error(`Supabase JWT token验证失败, IP: ${req.ip}, Path: ${req.path}`);
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        '无效的认证令牌',
        true,
        '',
        '/user/register'
      );
    }

    logger.info(`Supabase JWT认证成功: 用户ID: ${user.id}, Email: ${user.email}, IP: ${req.ip}, Path: ${req.path}`);
    
    // 检查用户是否存在于数据库中
    let dbUser;
    try {
      dbUser = await User.findByUserId(supabaseUser.id);
      
      if (!dbUser) {
        // 用户不存在于数据库中，返回错误要求注册
        logger.warn(`用户未在数据库中注册: ${supabaseUser.id}, Email: ${supabaseUser.email}`);
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          '用户信息不完整，请先完成注册',
          true,
          '',
          '/user/register'
        );
      }
      
      logger.info(`数据库用户验证成功: ${dbUser.user_id}, Priority: ${dbUser.priority}`);
    } catch (error) {
      // 如果是我们抛出的 ApiError，直接传递
      if (error instanceof ApiError) {
        throw error;
      }
      
      // 数据库查询错误
      logger.error(`数据库用户查询失败: ${error.message}`);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        '用户验证失败，请稍后重试',
        true,
        '',
        '/login'
      );
    }
    
    // 将用户信息添加到请求对象中
    req.user = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: supabaseUser.role || 'user',
      // 数据库信息
      dbUser: dbUser,
      priority: dbUser.priority,
      username: dbUser.username,
      // 完整的 Supabase 用户信息
      supabaseUser: supabaseUser
    };
    
    next();
  } catch (error) {
    next(error);
  }
}; 