import express from 'express';
import config from './config/index.js';
import logger from './utils/logger.js';
import { registerMiddleware, registerErrorHandlers } from './middleware/index.js';
import routes from './routes/index.js';
import { StatusCodes } from 'http-status-codes';
import { testConnection } from './config/database.js';
import './workers/imageWorker.js'; // 初始化图像生成工作进程

// 创建Express应用
const app = express();

// 注册全局中间件
registerMiddleware(app);

// 注册API路由
app.use('/api', routes);

// 处理404路由
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    error: {
      message: `找不到路径 : ${req.originalUrl}`
    }
  });
});

// 注册错误处理中间件
registerErrorHandlers(app);

// 启动服务器
const server = app.listen(config.port, async () => {
  logger.info(`服务启动成功，运行在端口 ${config.port}`);
  logger.info(`环境: ${config.env}`);
  logger.info(`已启动BullMQ任务队列和工作进程 `);
  
  // 测试数据库连接
  const dbConnected = await testConnection();
  if (dbConnected) {
    logger.info('数据库连接正常');
  } else {
    logger.warn('数据库连接失败，某些功能可能受到影响');
  }
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