import axios from 'axios';
import md5 from 'md5';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/errorHandler.js';
import { StatusCodes } from 'http-status-codes';
import redisService from './redisService.js';
import { imageGenerationQueue } from '../queues/index.js';

// Redis键前缀
const IMAGE_RESULT_PREFIX = 'image_result:';
const USER_TASK_PREFIX = 'user_task:';

// 任务状态
const TASK_STATUS = {
  PENDING: 'pending',   // 等待处理
  PROCESSING: 'processing', // 处理中
  COMPLETED: 'completed',  // 完成
  FAILED: 'failed'      // 失败
};

/**
 * Together.ai图像生成服务
 */
class ImageService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: config.together.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.together.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * 创建图像生成任务
   * @param {Object} params - 生成参数
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 任务ID和缓存状态
   */
  async createImageTask(params) {
    try {
      const { userId, ...taskParams } = params;
      
      // 创建任务ID (使用用户ID和参数内容的MD5哈希，确保相同用户相同请求产生相同ID)
      const taskId = md5(JSON.stringify({ userId, ...taskParams }));
      
      logger.info(`生成图像任务ID: ${taskId}, 用户ID: ${userId}`);
      
      // 先检查是否已有结果存在（幂等性检查）
      const resultKey = `${IMAGE_RESULT_PREFIX}${taskId}`;
      const existingResult = await redisService.get(resultKey);
      
      if (existingResult) {
        logger.info(`发现已有相同参数的生成结果, 任务ID: ${taskId}, 用户ID: ${userId}`);
        return { taskId, cached: true }; // 返回taskId和缓存标志
      }
      
      // 检查任务是否已经在队列中（防止重复提交）
      const existingJob = await imageGenerationQueue.getJob(taskId);
      if (existingJob) {
        const state = await existingJob.getState();
        if (['active', 'waiting', 'delayed'].includes(state)) {
          logger.info(`该任务已在队列中, 状态: ${state}, 任务ID: ${taskId}, 用户ID: ${userId}`);
          return { taskId, cached: false, queued: true };
        }
      }
      
      logger.info(`创建新的图像生成任务: ${taskId}, 用户ID: ${userId}`);
      
      // 将任务添加到BullMQ队列
      await imageGenerationQueue.add(
        'generate-image', 
        { 
          taskId, 
          userId,
          params: taskParams,
          createdAt: new Date().toISOString()
        },
        {
          jobId: taskId, // 确保任务ID唯一
          attempts: 3,
          timeout: 120000, // 2分钟超时
          removeOnComplete: true,
          removeOnFail: false
        }
      );

      // 记录用户任务关联
      await redisService.set(
        `${USER_TASK_PREFIX}${userId}:${taskId}`,
        { taskId, createdAt: new Date().toISOString() },
        config.cache.imageExpiry
      );
      
      return { taskId, cached: false, queued: false };
    } catch (error) {
      logger.error(`创建图像生成任务失败: ${error.message}`);
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, '创建图像生成任务失败');
    }
  }
  
  /**
   * 根据任务ID获取图像结果
   * @param {string} taskId - 任务ID
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 任务状态和结果
   */
  async getImageResult(taskId, userId) {
    try {
      // 验证任务是否属于该用户
      const userTaskKey = `${USER_TASK_PREFIX}${userId}:${taskId}`;
      const userTask = await redisService.get(userTaskKey);
      
      if (!userTask) {
        return {
          status: 'not_found',
          message: '任务不存在或无权访问'
        };
      }

      // 先检查结果是否存在于Redis
      const resultKey = `${IMAGE_RESULT_PREFIX}${taskId}`;
      const result = await redisService.get(resultKey);
      
      if (result) {
        return {
          status: TASK_STATUS.COMPLETED,
          data: result.urls
        };
      }
      
      // 结果不存在，从BullMQ队列中查询任务状态
      const job = await imageGenerationQueue.getJob(taskId);
      
      if (!job) {
        return {
          status: 'not_found',
          message: '任务不存在或已过期'
        };
      }
      
      // 获取任务状态和进度
      const state = await job.getState();
      const progress = job.progress || 0;
      
      let status;
      switch (state) {
        case 'active':
          status = TASK_STATUS.PROCESSING;
          break;
        case 'completed':
          // 如果任务完成但没有结果，可能是结果尚未保存到Redis
          status = TASK_STATUS.PROCESSING;
          break;
        case 'failed':
          status = TASK_STATUS.FAILED;
          break;
        case 'waiting':
        case 'delayed':
        default:
          status = TASK_STATUS.PENDING;
      }
      
      return {
        status,
        progress: Math.round(progress),
        message: status === TASK_STATUS.FAILED 
          ? (job.failedReason || '任务处理失败') 
          : `任务${status}中 (${Math.round(progress)}%)`
      };
    } catch (error) {
      logger.error(`获取图像结果失败: ${error.message}`);
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, '获取图像结果失败');
    }
  }
}

export default new ImageService(); 