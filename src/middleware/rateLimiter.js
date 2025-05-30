import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { StatusCodes } from 'http-status-codes';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/errorHandler.js';

// 为限流器创建专门的Redis连接，确保与BullMQ兼容
const createRedisClient = () => {
  return new Redis(config.redis.url, {
    maxRetriesPerRequest: null, // BullMQ要求设置为null
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
  });
};

// 创建通用限流器
const generalLimiter = new RateLimiterRedis({
  storeClient: createRedisClient(),
  keyPrefix: 'ratelimit',
  points: config.rateLimit.max,  // 最大请求数
  duration: config.rateLimit.window / 1000,  // 窗口大小（秒）
});

// 创建图像生成专用限流器（更严格限制）
const imageLimiter = new RateLimiterRedis({
  storeClient: createRedisClient(),
  keyPrefix: 'imageratelimit',
  points: config.rateLimit.imageMax,  // 更低的请求上限
  duration: config.rateLimit.window / 1000,  // 窗口大小（秒）
});

/**
 * 通用接口限流中间件
 */
export const rateLimiter = async (req, res, next) => {
  try {
    // 使用IP或用户ID作为限流键
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    
    await generalLimiter.consume(key);
    next();
  } catch (error) {
    logger.warn(`API请求限流: ${req.ip} - ${req.method} ${req.originalUrl}`);
    
    // 如果是限流错误
    if (error.remainingPoints !== undefined) {
      return next(new ApiError(
        StatusCodes.TOO_MANY_REQUESTS, 
        '请求频率过高，请稍后再试'
      ));
    }
    
    // 其他错误
    next(error);
  }
};

/**
 * 图像生成接口限流中间件（更严格）
 */
export const imageRateLimiter = async (req, res, next) => {
  try {
    // 使用IP或用户ID作为限流键
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    
    await imageLimiter.consume(key);
    next();
  } catch (error) {
    logger.warn(`图像生成请求限流: ${req.ip} - ${req.method} ${req.originalUrl}`);
    
    // 如果是限流错误
    if (error.remainingPoints !== undefined) {
      return next(new ApiError(
        StatusCodes.TOO_MANY_REQUESTS, 
        '图像生成请求频率过高，请稍后再试'
      ));
    }
    
    // 其他错误
    next(error);
  }
}; 