import { Worker } from 'bullmq';
import Redis from 'ioredis';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { QUEUE_NAMES } from '../queues/index.js';
import redisService from '../services/redisService.js';

// Redis键前缀
const IMAGE_RESULT_PREFIX = 'image_result:';

// 创建Redis连接
const connection = new Redis(config.redis.url);

// 创建Together.ai API客户端
const apiClient = axios.create({
  baseURL: config.together.apiUrl,
  headers: {
    'Authorization': `Bearer ${config.together.apiKey}`,
    'Content-Type': 'application/json'
  }
});

// 图像生成工作进程
const imageWorker = new Worker(
  QUEUE_NAMES.IMAGE_GENERATION, 
  async (job) => {
    try {
      const { taskId, params } = job.data;
      
      // 先检查结果是否已存在（双重检查，避免并发情况下的重复处理）
      const resultKey = `${IMAGE_RESULT_PREFIX}${taskId}`;
      const existingResult = await redisService.get(resultKey);
      
      if (existingResult) {
        logger.info(`任务${taskId}的结果已存在，跳过处理`);
        await job.updateProgress(100);
        return { success: true, cached: true, count: existingResult.urls.length };
      }
      
      logger.info(`处理图像生成任务: ${taskId}`);
      await job.updateProgress(10); // 开始处理
      
      const { prompt, model, width, height, steps, n } = params;
      
      // 构建请求数据
      const requestData = {
        model: model || 'black-forest-labs/FLUX.1-schnell-Free',
        prompt,
        width: width || 512,
        height: height || 512,
        steps: steps || 10,
        n: parseInt(n || 1, 10)
      };
      
      await job.updateProgress(30); // API调用前
      
      // 调用Together.ai API
      const response = await apiClient.post('/v1/images/generations', requestData);
      
      await job.updateProgress(70); // API调用后
      
      // 处理API响应
      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        throw new Error('Together.ai返回无效响应格式');
      }
      
      const results = [];
      
      // 处理响应格式
      response.data.data.forEach(item => {
        if (item.url) {
          results.push({ url: item.url });
        }
      });
      
      if (results.length === 0) {
        throw new Error('未能获取任何图片URL');
      }
      
      await job.updateProgress(90); // 处理结果
      
      // 将结果存入Redis
      await redisService.set(
        `${IMAGE_RESULT_PREFIX}${taskId}`,
        { 
          urls: results, 
          timestamp: new Date().toISOString(),
          params
        },
        config.cache.imageExpiry
      );
      
      logger.info(`图像生成任务完成: ${taskId}, 生成了${results.length}张图片`);
      await job.updateProgress(100); // 完成
      
      return { success: true, count: results.length };
    } catch (error) {
      logger.error(`图像生成任务处理错误: ${error.message}`);
      
      // 如果是API调用错误，提取更多信息
      if (error.response) {
        const statusCode = error.response.status;
        const message = error.response.data?.error || '调用Together.ai API失败';
        logger.error(`API错误: 状态码=${statusCode}, 响应=${JSON.stringify(error.response.data)}`);
        throw new Error(`API错误: ${message}`);
      }
      
      throw error;
    }
  },
  { 
    connection,
    concurrency: 5, // 并发处理任务数
    limiter: {      // 限制任务处理速率
      max: 10,      // 最大处理数
      duration: 60000 // 时间窗口 (1分钟)
    }
  }
);

// 监听工作进程事件
imageWorker.on('completed', (job, result) => {
  logger.info(`任务${job.id}完成: ${JSON.stringify(result)}`);
});

imageWorker.on('failed', (job, error) => {
  logger.error(`任务${job.id}失败: ${error.message}`);
});

imageWorker.on('error', (error) => {
  logger.error(`工作进程错误: ${error.message}`);
});

logger.info('图像生成工作进程已启动');

export default imageWorker; 