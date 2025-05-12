import { StatusCodes } from 'http-status-codes';
import logger from './logger.js';

// 自定义API错误类
export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
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
  const { statusCode, message, isOperational, stack } = err;

  // 日志记录
  if (!isOperational) {
    logger.error(`[未处理的错误] ${message}`, { stack });
  }

  // 响应错误
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack }),
    }
  });
}; 