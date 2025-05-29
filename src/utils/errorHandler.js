import { StatusCodes } from 'http-status-codes';
import logger from './logger.js';

// 自定义API错误类
export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '', redirectTo = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.redirectTo = redirectTo;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// 将错误转换为API错误的中间件
export const errorConverter = (err, req, res, next) => {
  let error = err;
  
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error.message || '服务器内部错误';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  
  next(error);
};

// 处理错误并发送响应的中间件
export const errorHandler = (err, req, res, next) => {
  const { statusCode, message, isOperational, stack, redirectTo } = err;

  // 日志记录
  if (!isOperational) {
    logger.error(`[未处理的错误] ${message}`, { stack });
  } else {
    logger.error(`[API错误] ${message}`);
  }

  // 检查是否需要重定向
  if (redirectTo) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      redirectTo
    });
  }

  // 标准错误响应
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack })
  });
}; 