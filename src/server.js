import express from 'express';
import config from './config/index.js';
import logger from './utils/logger.js';
import { registerMiddleware, registerErrorHandlers } from './middleware/index.js';
import routes from './routes/index.js';
import { StatusCodes } from 'http-status-codes';
import './workers/imageWorker.js'; // 初始化图像生成工作进程

// 创建Express应用
const app = express();

// 注册全局中间件
registerMiddleware(app);

// 添加全局请求日志
app.use((req, res, next) => {
  console.log(`[Server] 收到请求: ${req.method} ${req.originalUrl}`);
  next();
});

// 注册API路由
app.use('/api', (req, res, next) => {
  console.log(`[Server] API路由被访问: ${req.method} ${req.url}`);
  next();
}, routes);

// 处理404路由
app.use((req, res) => {
  console.log(`[Server] 404 未找到路径: ${req.originalUrl}`);
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    error: {
      message: `找不到路径: ${req.originalUrl}`
    }
  });
});

// 注册错误处理中间件
registerErrorHandlers(app);

// 启动服务器
const server = app.listen(config.port, () => {
  logger.info(`服务启动成功，运行在端口 ${config.port}`);
  logger.info(`环境: ${config.env}`);
  logger.info(`已启动BullMQ任务队列和工作进程`);
});

// 处理未捕获的异常和拒绝
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('未处理的Promise拒绝', error);
});

// 处理进程终止
process.on('SIGTERM', () => {
  logger.info('SIGTERM信号接收，优雅关闭');
  server.close(() => {
    logger.info('进程终止');
    process.exit(0);
  });
});

export default server; 