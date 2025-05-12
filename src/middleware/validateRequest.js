import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/errorHandler.js';

/**
 * 验证请求方法是否允许
 * @param {string[]} methods - 允许的HTTP方法
 * @returns {Function} 中间件函数
 */
export const validateMethod = (methods) => {
  return (req, res, next) => {
    if (!methods.includes(req.method)) {
      return next(
        new ApiError(
          StatusCodes.METHOD_NOT_ALLOWED,
          `${req.method}方法不允许，请使用: ${methods.join(', ')}`
        )
      );
    }
    next();
  };
};

/**
 * 验证请求体JSON格式
 */
export const validateJsonBody = (req, res, next) => {
  if (
    req.method !== 'GET' && 
    req.method !== 'DELETE' && 
    req.headers['content-type'] !== 'application/json'
  ) {
    return next(
      new ApiError(
        StatusCodes.UNSUPPORTED_MEDIA_TYPE,
        '请求必须包含Content-Type: application/json头'
      )
    );
  }
  next();
};

/**
 * 验证必填字段
 * @param {string[]} requiredFields - 必填字段列表
 * @returns {Function} 中间件函数
 */
export const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return next(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            `缺少必填字段: ${field}`
          )
        );
      }
    }
    next();
  };
}; 