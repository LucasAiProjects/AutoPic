import winston from 'winston';
import config from '../config/index.js';

const { combine, timestamp, printf, colorize } = winston.format;

// 自定义日志格式
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// 创建logger实例
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // 生产环境可以添加文件日志
    ...(config.env === 'production' 
      ? [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })]
      : [])
  ],
});

export default logger; 