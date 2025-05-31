import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorConverter, errorHandler } from '../utils/errorHandler.js';
import { generalRateLimiter } from './rateLimiter.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * 注册全局中间件
 * @param {express.Application} app - Express应用
 */
export const registerMiddleware = (app) => {
  // 信任反向代理，获取真实客户端IP
  const trustProxy = config.proxy.trust;
  if (trustProxy === 'true' || trustProxy === true) {
    app.set('trust proxy', true);
    logger.info('Express设置为信任所有代理');
  } else if (trustProxy === 'false' || trustProxy === false) {
    app.set('trust proxy', false);
    logger.info('Express设置为不信任代理');
  } else {
    // 数字值，信任指定数量的代理
    app.set('trust proxy', parseInt(trustProxy, 10) || 1);
    logger.info(`Express设置为信任 ${trustProxy} 个代理`);
  }

  // 解析请求体
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 安全相关中间件
  app.use(helmet());
  app.use(cors());

  // 全局限流中间件
  app.use(generalRateLimiter);

  // IP地址日志中间件（用于调试）
  app.use((req, res, next) => {
    const realIp = req.ip;
    const forwardedFor = req.headers['x-forwarded-for'];
    const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // 只在开发环境或debug级别时记录详细IP信息
    // if (config.env === 'development') {
      logger.info(`请求详情 - 真实IP: ${realIp}, X-Forwarded-For: ${forwardedFor}, Remote: ${remoteAddress}, User-Agent: ${userAgent?.substring(0, 100)}`);
    // }
    
    next();
  });

  // 请求日志
  morgan.token('body', (req) => {
    const body = { ...req.body };
    // 敏感信息处理
    if (body.password) body.password = '******';
    return JSON.stringify(body);
  });

  // 自定义IP token用于Morgan日志
  morgan.token('realip', (req) => {
    return req.ip;
  });

  const logFormat = ':realip :method :url :status :response-time ms - :res[content-length] :body';
  app.use(morgan(logFormat, {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
};

/**
 * 注册错误处理中间件
 * @param {express.Application} app - Express应用
 */
export const registerErrorHandlers = (app) => {
  app.use(errorConverter);
  app.use(errorHandler);
}; 