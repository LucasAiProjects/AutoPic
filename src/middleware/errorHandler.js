import { StatusCodes } from 'http-status-codes';
import logger from '../utils/logger.js';

/**
 * 全局错误处理中间件
 */
export const errorHandler = (err, req, res, next) => {
  logger.error(`错误: ${err.message}`);

  // 如果是 API 错误，使用其状态码和消息
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || '服务器内部错误';

  // 检查是否需要重定向
  if (err.redirectTo) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      redirectTo: err.redirectTo
    });
  }

  // 标准错误响应
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message
  });
}; 