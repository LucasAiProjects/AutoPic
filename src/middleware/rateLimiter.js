import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * 基于IP的通用限流中间件（用于全局和公开接口）
 */
export const ipBasedRateLimiter = rateLimit({
  windowMs: config.rateLimit.window, // 时间窗口
  max: config.rateLimit.max, // 最大请求数
  message: {
    success: false,
    error: {
      message: '请求频率过高，请稍后再试',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`IP限流触发: ${req.ip} - ${req.method} ${req.originalUrl}`);
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      error: {
        message: '请求频率过高，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  }
});

/**
 * 基于用户ID的限流中间件（用于认证后的接口）
 */
export const userBasedRateLimiter = rateLimit({
  windowMs: config.rateLimit.window, // 时间窗口
  max: config.rateLimit.max * 2, // 认证用户获得更高配额（60次/分钟）
  message: {
    success: false,
    error: {
      message: '请求频率过高，请稍后再试',
      code: 'USER_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`用户限流触发: ${req.user?.id || req.ip} - ${req.method} ${req.originalUrl}`);
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      error: {
        message: '请求频率过高，请稍后再试',
        code: 'USER_RATE_LIMIT_EXCEEDED'
      }
    });
  },
  keyGenerator: (req) => {
    // 优先使用用户ID，后备使用IP
    return req.user?.id || req.ip || 'unknown';
  }
});

/**
 * 图像生成专用限流中间件（基于用户ID）
 */
export const imageRateLimiter = rateLimit({
  windowMs: config.rateLimit.window, // 时间窗口
  max: config.rateLimit.imageMax, // 更低的请求上限
  message: {
    success: false,
    error: {
      message: '图像生成请求频率过高，请稍后再试',
      code: 'IMAGE_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`图像生成限流触发: ${req.user?.id || req.ip} - ${req.method} ${req.originalUrl}`);
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      error: {
        message: '图像生成请求频率过高，请稍后再试',
        code: 'IMAGE_RATE_LIMIT_EXCEEDED'
      }
    });
  },
  keyGenerator: (req) => {
    // 基于用户ID进行限流
    return req.user?.id || req.ip || 'unknown';
  }
});

/**
 * 用户注册限流中间件（基于IP）
 */
export const userRegistrationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 3, // 每15分钟最多3次注册请求
  message: {
    success: false,
    error: {
      message: '注册请求过于频繁，请15分钟后再试',
      code: 'REGISTRATION_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`注册限流触发: ${req.ip} - ${req.method} ${req.originalUrl}`);
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      error: {
        message: '注册请求过于频繁，请15分钟后再试',
        code: 'REGISTRATION_RATE_LIMIT_EXCEEDED'
      }
    });
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  }
});

// 向后兼容，保留原来的导出名称
export const generalRateLimiter = ipBasedRateLimiter; 