import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorConverter, errorHandler } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';
import { rateLimiter } from './rateLimiter.js';

/**
 * 注册全局中间件
 * @param {express.Application} app - Express应用
 */
export const registerMiddleware = (app) => {
  // 解析请求体
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 安全相关中间件
  app.use(helmet());
  app.use(cors());

  // 全局限流中间件
  app.use(rateLimiter);

  // 请求日志
  morgan.token('body', (req) => {
    const body = { ...req.body };
    // 敏感信息处理
    if (body.password) body.password = '******';
    return JSON.stringify(body);
  });

  const logFormat = ':method :url :status :response-time ms - :res[content-length] :body';
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