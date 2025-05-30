import { Queue } from 'bullmq';
import Redis from 'ioredis';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// BullMQ 队列名称
export const QUEUE_NAMES = {
  IMAGE_GENERATION: 'image-generation'
};

// 创建Redis连接
const createRedisConnection = () => {
  const connection = new Redis(config.redis.url, {
    maxRetriesPerRequest: null, // BullMQ要求设置为null
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
  });

  connection.on('error', (err) => {
    logger.error(`Redis连接错误: ${err.message}`);
  });

  return connection;
};

// 队列配置选项
const queueOptions = {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,              // 重试次数
    backoff: {                // 重试策略
      type: 'exponential',
      delay: 5000             // 初始延迟5秒
    },
    removeOnComplete: true,   // 完成后移除
    removeOnFail: 100         // 保留最近100个失败的任务
  }
};

// 创建图像生成队列
export const imageGenerationQueue = new Queue(
  QUEUE_NAMES.IMAGE_GENERATION,
  queueOptions
);

// 监听队列事件
imageGenerationQueue.on('error', (err) => {
  logger.error(`图像生成队列错误: ${err.message}`);
});

imageGenerationQueue.on('failed', (job, err) => {
  logger.error(`任务${job.id}失败: ${err.message}`);
});

export default {
  imageGenerationQueue,
  QUEUE_NAMES
}; 