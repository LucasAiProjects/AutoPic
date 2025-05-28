import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/errorHandler.js';
import supabase from '../config/supabase.js';

/**
 * 验证用户是否已登录
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        '未提供认证令牌',
        { redirectTo: '/login' }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // 验证 Supabase JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        '无效的认证令牌',
        { redirectTo: '/login' }
      );
    }

    // 将用户信息添加到请求对象中
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}; 