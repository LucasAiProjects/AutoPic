import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/errorHandler.js';
import supabase from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * 验证用户是否已登录
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`认证失败: 未提供有效的认证头, IP: ${req.ip}, Path: ${req.path}`);
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        '未提供认证令牌',
        { redirectTo: '/login' }
      );
    }

    const token = authHeader.split(' ')[1];
    logger.info(`开始验证用户token, IP: ${req.ip}, Path: ${req.path}`);
    
    // 验证 Supabase JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      logger.error(`Token验证失败: ${error.message}, IP: ${req.ip}, Path: ${req.path}`);
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        '无效的认证令牌',
        { redirectTo: '/login' }
      );
    }

    if (!user) {
      logger.warn(`Token验证失败: 未找到用户信息, IP: ${req.ip}, Path: ${req.path}`);
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        '无效的认证令牌',
        { redirectTo: '/login' }
      );
    }

    logger.info(`用户认证成功: ${user.id}, Email: ${user.email}, IP: ${req.ip}, Path: ${req.path}`);
    
    // 将用户信息添加到请求对象中
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 验证用户是否为管理员
 */
export const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`管理员认证失败: 未提供有效的认证头, IP: ${req.ip}, Path: ${req.path}`);
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        '未提供认证令牌',
        { redirectTo: '/login' }
      );
    }

    const token = authHeader.split(' ')[1];
    logger.info(`开始验证管理员token, IP: ${req.ip}, Path: ${req.path}`);
    
    // 使用管理员客户端验证用户
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      logger.error(`管理员Token验证失败: ${error.message}, IP: ${req.ip}, Path: ${req.path}`);
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        '无效的认证令牌',
        { redirectTo: '/login' }
      );
    }

    if (!user) {
      logger.warn(`管理员Token验证失败: 未找到用户信息, IP: ${req.ip}, Path: ${req.path}`);
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        '无效的认证令牌',
        { redirectTo: '/login' }
      );
    }

    logger.info(`开始验证管理员权限: ${user.id}, Email: ${user.email}, IP: ${req.ip}, Path: ${req.path}`);

    // 检查用户角色
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      logger.warn(`管理员权限验证失败: ${user.id}, Email: ${user.email}, IP: ${req.ip}, Path: ${req.path}`);
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        '需要管理员权限',
        { redirectTo: '/login' }
      );
    }

    logger.info(`管理员认证成功: ${user.id}, Email: ${user.email}, IP: ${req.ip}, Path: ${req.path}`);
    
    // 将用户信息添加到请求对象中
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}; 